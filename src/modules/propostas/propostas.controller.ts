import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { PropostaStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ERROR_RESPONSE_EXAMPLES } from '../../shared/dto/error-response.dto';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreatePropostaDto } from './dto/create-proposta.dto';
import { ListPropostasDto } from './dto/list-propostas.dto';
import { PropostaResponseDto } from './dto/proposta-response.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { PropostasService } from './propostas.service';

@ApiTags('Propostas')
@ApiBearerAuth()
@Controller('propostas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CORBAN, UserRole.OPERADOR)
export class PropostasController {
  constructor(private readonly propostasService: PropostasService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar proposta de credito',
    description:
      'CORBAN cria proposta para si mesmo. OPERADOR pode informar corbanId para criar em nome de um CORBAN.',
  })
  @ApiBody({
    type: CreatePropostaDto,
    examples: {
      corban: {
        summary: 'Criacao por CORBAN',
        value: {
          clienteNome: 'Maria da Silva',
          clienteCpf: '111.444.777-35',
          clienteRenda: 6500,
          valorSolicitado: 10000,
          numeroParcelas: 12,
        },
      },
      operador: {
        summary: 'Criacao por OPERADOR',
        value: {
          clienteNome: 'Joao Pereira',
          clienteCpf: '123.456.789-09',
          clienteRenda: 7200,
          valorSolicitado: 12000,
          numeroParcelas: 18,
          corbanId: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Proposta criada com status inicial RASCUNHO.',
    type: PropostaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados invalidos ou corbanId obrigatorio para OPERADOR.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.validation },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  @ApiForbiddenResponse({
    description: 'CORBAN tentando criar proposta para outro CORBAN.',
    schema: {
      example: {
        error: 'CORBAN so pode criar propostas para seus proprios clientes',
        details: {},
      },
    },
  })
  create(
    @Body() dto: CreatePropostaDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar propostas',
    description:
      'CORBAN lista apenas as proprias propostas. OPERADOR lista todas. Suporta paginacao e filtros por status e CPF.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Pagina da listagem.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Quantidade de itens por pagina.',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PropostaStatus,
    description: 'Filtra propostas por status.',
  })
  @ApiQuery({
    name: 'clienteCpf',
    required: false,
    type: String,
    example: '111.444.777-35',
    description: 'CPF do cliente com ou sem mascara.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de propostas.',
    schema: {
      example: {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListPropostasDto,
  ): Promise<{
    data: PropostaResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.propostasService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar proposta por ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID da proposta.',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Proposta encontrada.',
    type: PropostaResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  @ApiForbiddenResponse({
    description: 'CORBAN tentando acessar proposta de outro CORBAN.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.proposalForbidden },
  })
  @ApiNotFoundResponse({
    description: 'Proposta nao encontrada.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.notFound },
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Atualizar status da proposta',
    description:
      'Exclusivo para OPERADOR. Transicoes permitidas: RASCUNHO -> EM_ANALISE, RASCUNHO -> CANCELADA e EM_ANALISE -> APROVADA, REPROVADA ou CANCELADA.',
  })
  @ApiBody({
    type: UpdateStatusDto,
    examples: {
      analise: {
        summary: 'Enviar para analise',
        value: { status: PropostaStatus.EM_ANALISE },
      },
      reprovacao: {
        summary: 'Reprovar proposta',
        value: {
          status: PropostaStatus.REPROVADA,
          motivoReprovacao: 'Score insuficiente',
        },
      },
    },
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da proposta.',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Status atualizado com sucesso.',
    type: PropostaResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Dados invalidos ou motivo ausente para REPROVADA.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.validation },
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  @ApiForbiddenResponse({
    description: 'Usuario autenticado sem permissao para atualizar status.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.forbidden },
  })
  @ApiNotFoundResponse({
    description: 'Proposta nao encontrada.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.notFound },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Transicao de status invalida.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unprocessable },
  })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Cancelar proposta',
    description:
      'Cancela logicamente a proposta alterando o status para CANCELADA, sem remover o registro.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da proposta.',
    schema: { type: 'string', format: 'uuid' },
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiOkResponse({
    description: 'Proposta cancelada com sucesso.',
    type: PropostaResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, invalido ou expirado.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unauthorized },
  })
  @ApiForbiddenResponse({
    description: 'Usuario autenticado sem permissao para cancelar a proposta.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.proposalForbidden },
  })
  @ApiNotFoundResponse({
    description: 'Proposta nao encontrada.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.notFound },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Status nao permite cancelamento.',
    schema: { example: ERROR_RESPONSE_EXAMPLES.unprocessable },
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PropostaResponseDto> {
    return this.propostasService.cancel(id, user);
  }
}
