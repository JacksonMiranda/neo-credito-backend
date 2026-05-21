import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

  const prisma = {
    proposta: {
      create: jest.fn(),
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
    prisma.proposta.create.mockResolvedValue({
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
    });
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
});
