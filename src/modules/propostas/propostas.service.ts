import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  Proposta,
  PropostaStatus,
  User,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UsersService } from '../users/users.service';
import { CreatePropostaDto } from './dto/create-proposta.dto';
import { ListPropostasDto } from './dto/list-propostas.dto';
import { PropostaResponseDto } from './dto/proposta-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PropostaCalculatorService } from './services/proposta-calculator.service';
import { StatusTransitionService } from './services/status-transition.service';

type PropostaWithCorban = Proposta & {
  motivoReprovacao?: string | null;
  corban: Pick<User, 'id' | 'email'>;
};

type PropostaReader = Pick<Prisma.TransactionClient, 'proposta'>;

@Injectable()
export class PropostasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly calculator: PropostaCalculatorService,
    private readonly statusTransition: StatusTransitionService,
  ) {}

  async create(
    dto: CreatePropostaDto,
    user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    const corbanId = await this.resolveCorbanId(dto, user);
    const calculation = this.calculator.calculate(
      dto.valorSolicitado,
      dto.numeroParcelas,
    );

    const proposta = await this.prisma.proposta.create({
      data: {
        clienteNome: dto.clienteNome,
        clienteCpf: dto.clienteCpf,
        clienteRenda: dto.clienteRenda,
        valorSolicitado: dto.valorSolicitado,
        numeroParcelas: dto.numeroParcelas,
        taxaMensal: calculation.taxaMensal,
        valorParcela: calculation.valorParcela,
        totalAPagar: calculation.totalAPagar,
        corbanId,
      },
      include: this.includeCorban(),
    });

    return this.toResponse(proposta);
  }

  async findAll(
    user: AuthenticatedUser,
    query: ListPropostasDto = {},
  ): Promise<{
    data: PropostaResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PropostaWhereInput = {};
    if (user.role === UserRole.CORBAN) {
      where.corbanId = user.id;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.clienteCpf) {
      where.clienteCpf = query.clienteCpf.replace(/\D/g, '');
    }

    const whereClause = Object.keys(where).length > 0 ? where : undefined;
    const [propostas, total] = await Promise.all([
      this.prisma.proposta.findMany({
        where: whereClause,
        include: this.includeCorban(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.proposta.count({ where: whereClause }),
    ]);

    return {
      data: propostas.map((proposta) => this.toResponse(proposta)),
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    const proposta = await this.findExisting(id);
    this.assertCanRead(proposta, user);

    return this.toResponse(proposta);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const proposta = await this.findExisting(id, tx);
      this.statusTransition.assertCanTransition(proposta.status, dto.status);

      const motivo =
        dto.status === PropostaStatus.REPROVADA
          ? (dto.motivoReprovacao ?? null)
          : null;

      const updatedProposta = await tx.proposta.update({
        where: { id },
        data: {
          status: dto.status,
          motivoReprovacao: motivo,
        },
        include: this.includeCorban(),
      });

      await tx.historicoStatusProposta.create({
        data: {
          propostaId: id,
          statusAnterior: proposta.status,
          statusNovo: dto.status,
          usuarioId: user.id,
          perfilUsuario: user.role,
          motivo,
        },
      });

      return this.toResponse(updatedProposta);
    });
  }

  private async resolveCorbanId(
    dto: CreatePropostaDto,
    user: AuthenticatedUser,
  ): Promise<string> {
    if (user.role === UserRole.CORBAN) {
      if (dto.corbanId && dto.corbanId !== user.id) {
        throw new ForbiddenException({
          error: 'CORBAN so pode criar propostas para seus proprios clientes',
          details: {},
        });
      }

      return user.id;
    }

    if (!dto.corbanId) {
      throw new BadRequestException({
        error: 'corbanId e obrigatorio para OPERADOR',
        details: {},
      });
    }

    const corban = await this.usersService.findCorbanById(dto.corbanId);

    if (!corban) {
      throw new BadRequestException({
        error: 'corbanId deve pertencer a um usuario CORBAN',
        details: { corbanId: dto.corbanId },
      });
    }

    return corban.id;
  }

  private async findExisting(
    id: string,
    client: PropostaReader = this.prisma,
  ): Promise<PropostaWithCorban> {
    const proposta = await client.proposta.findUnique({
      where: { id },
      include: this.includeCorban(),
    });

    if (!proposta) {
      throw new NotFoundException({
        error: 'Proposta nao encontrada',
        details: { id },
      });
    }

    return proposta;
  }

  private assertCanRead(
    proposta: PropostaWithCorban,
    user: AuthenticatedUser,
  ): void {
    if (user.role === UserRole.OPERADOR) {
      return;
    }

    this.assertOwnProposta(proposta, user);
  }

  private assertOwnProposta(
    proposta: Pick<Proposta, 'corbanId'>,
    user: AuthenticatedUser,
  ): void {
    if (proposta.corbanId !== user.id) {
      throw new ForbiddenException({
        error: 'Acesso negado para esta proposta',
        details: {},
      });
    }
  }

  private includeCorban(): Prisma.PropostaInclude {
    return {
      corban: {
        select: {
          id: true,
          email: true,
        },
      },
    };
  }

  private toResponse(proposta: PropostaWithCorban): PropostaResponseDto {
    return {
      id: proposta.id,
      clienteNome: proposta.clienteNome,
      clienteCpf: proposta.clienteCpf,
      clienteRenda: proposta.clienteRenda.toNumber(),
      valorSolicitado: proposta.valorSolicitado.toNumber(),
      numeroParcelas: proposta.numeroParcelas,
      taxaJuros: proposta.taxaMensal.toNumber(),
      valorParcela: proposta.valorParcela.toNumber(),
      totalAPagar: proposta.totalAPagar.toNumber(),
      status: proposta.status,
      motivoReprovacao: proposta.motivoReprovacao ?? null,
      corbanId: proposta.corbanId,
      corban: proposta.corban,
      criadoEm: proposta.createdAt,
      atualizadoEm: proposta.updatedAt,
    };
  }
}
