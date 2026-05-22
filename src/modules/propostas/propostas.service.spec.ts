import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PropostaStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { UsersService } from '../users/users.service';
import { PropostasService } from './propostas.service';
import { PropostaCalculatorService } from './services/proposta-calculator.service';

const decimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value);

type PrismaMock = {
  proposta: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
  };
};

type UsersServiceMock = {
  findCorbanById: jest.Mock;
};

describe('PropostasService', () => {
  const now = new Date('2026-05-21T12:00:00.000Z');
  const corbanUser: AuthenticatedUser = {
    id: 'corban-id',
    email: 'corban1@neocredito.com.br',
    role: UserRole.CORBAN,
  };
  const operadorUser: AuthenticatedUser = {
    id: 'operador-id',
    email: 'operador@neocredito.com.br',
    role: UserRole.OPERADOR,
  };
  const proposta = (
    overrides: Partial<{
      id: string;
      clienteNome: string;
      clienteCpf: string;
      clienteRenda: Prisma.Decimal;
      valorSolicitado: Prisma.Decimal;
      numeroParcelas: number;
      taxaMensal: Prisma.Decimal;
      valorParcela: Prisma.Decimal;
      totalAPagar: Prisma.Decimal;
      status: PropostaStatus;
      motivoReprovacao: string | null;
      corbanId: string;
      corban: { id: string; email: string };
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: 'proposta-id',
    clienteNome: 'Maria Silva',
    clienteCpf: '11144477735',
    clienteRenda: decimal(6500),
    valorSolicitado: decimal(10000),
    numeroParcelas: 12,
    taxaMensal: decimal(1.89),
    valorParcela: decimal(939.22),
    totalAPagar: decimal(11270.64),
    status: PropostaStatus.RASCUNHO,
    motivoReprovacao: null,
    corbanId: 'corban-id',
    corban: {
      id: 'corban-id',
      email: 'corban1@neocredito.com.br',
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const prisma = {
    proposta: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  } satisfies PrismaMock;
  const usersService = {
    findCorbanById: jest.fn(),
  } satisfies UsersServiceMock;

  const service = new PropostasService(
    prisma as unknown as PrismaService,
    usersService as unknown as UsersService,
    new PropostaCalculatorService(),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.proposta.create.mockResolvedValue(proposta());
    prisma.proposta.findMany.mockResolvedValue([proposta()]);
    prisma.proposta.findUnique.mockResolvedValue(proposta());
    prisma.proposta.count.mockResolvedValue(1);
  });

  it('cria proposta para o proprio CORBAN autenticado', async () => {
    await expect(
      service.create(
        {
          clienteNome: 'Maria Silva',
          clienteCpf: '11144477735',
          clienteRenda: 6500,
          valorSolicitado: 10000,
          numeroParcelas: 12,
        },
        corbanUser,
      ),
    ).resolves.toMatchObject({
      id: 'proposta-id',
      clienteCpf: '11144477735',
      taxaJuros: 1.89,
      valorParcela: 939.22,
      totalAPagar: 11270.64,
      status: PropostaStatus.RASCUNHO,
      corbanId: 'corban-id',
    });

    expect(prisma.proposta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clienteCpf: '11144477735',
          corbanId: 'corban-id',
          taxaMensal: 1.89,
          valorParcela: 939.22,
          totalAPagar: 11270.64,
        }),
      }),
    );
  });

  it('permite OPERADOR criar proposta para um CORBAN informado', async () => {
    usersService.findCorbanById.mockResolvedValue({
      id: 'corban-id',
      email: 'corban1@neocredito.com.br',
      passwordHash: 'hash',
      role: UserRole.CORBAN,
      createdAt: now,
      updatedAt: now,
    });

    await service.create(
      {
        clienteNome: 'Maria Silva',
        clienteCpf: '11144477735',
        clienteRenda: 6500,
        valorSolicitado: 10000,
        numeroParcelas: 12,
        corbanId: 'corban-id',
      },
      operadorUser,
    );

    expect(usersService.findCorbanById).toHaveBeenCalledWith('corban-id');
    expect(prisma.proposta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ corbanId: 'corban-id' }),
      }),
    );
  });

  it('recusa CORBAN criando proposta para outro CORBAN', async () => {
    await expect(
      service.create(
        {
          clienteNome: 'Maria Silva',
          clienteCpf: '11144477735',
          clienteRenda: 6500,
          valorSolicitado: 10000,
          numeroParcelas: 12,
          corbanId: 'outro-corban-id',
        },
        corbanUser,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('exige corbanId quando OPERADOR cria proposta', async () => {
    await expect(
      service.create(
        {
          clienteNome: 'Maria Silva',
          clienteCpf: '11144477735',
          clienteRenda: 6500,
          valorSolicitado: 10000,
          numeroParcelas: 12,
        },
        operadorUser,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lista apenas propostas do CORBAN autenticado', async () => {
    await expect(service.findAll(corbanUser)).resolves.toMatchObject({
      total: 1,
      page: 1,
      limit: 20,
      data: [{ id: 'proposta-id', corbanId: 'corban-id' }],
    });

    expect(prisma.proposta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { corbanId: 'corban-id' },
        skip: 0,
        take: 20,
      }),
    );
    expect(prisma.proposta.count).toHaveBeenCalledWith({
      where: { corbanId: 'corban-id' },
    });
  });

  it('lista propostas para OPERADOR com filtros e paginacao', async () => {
    await service.findAll(operadorUser, {
      page: 2,
      limit: 5,
      status: PropostaStatus.EM_ANALISE,
      clienteCpf: '111.444.777-35',
    });

    expect(prisma.proposta.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: PropostaStatus.EM_ANALISE,
          clienteCpf: '11144477735',
        },
        skip: 5,
        take: 5,
      }),
    );
  });

  it('busca uma proposta propria por id', async () => {
    await expect(
      service.findOne('proposta-id', corbanUser),
    ).resolves.toMatchObject({
      id: 'proposta-id',
      corbanId: 'corban-id',
    });
  });

  it('recusa leitura de proposta de outro CORBAN', async () => {
    prisma.proposta.findUnique.mockResolvedValue(
      proposta({ corbanId: 'outro-corban-id' }),
    );

    await expect(
      service.findOne('proposta-id', corbanUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('retorna erro quando a proposta nao existe', async () => {
    prisma.proposta.findUnique.mockResolvedValue(null);

    await expect(
      service.findOne('proposta-id', operadorUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
