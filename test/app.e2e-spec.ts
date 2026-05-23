import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma, PropostaStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type PropostaRecord = {
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
  createdAt: Date;
  updatedAt: Date;
};

type HistoricoStatusPropostaRecord = {
  id: string;
  propostaId: string;
  statusAnterior: PropostaStatus;
  statusNovo: PropostaStatus;
  usuarioId: string;
  perfilUsuario: UserRole;
  motivo: string | null;
  criadoEm: Date;
};

const ids = {
  corban1: '11111111-1111-4111-8111-111111111111',
  corban2: '22222222-2222-4222-8222-222222222222',
  operador: '33333333-3333-4333-8333-333333333333',
};

const decimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value);

class FakePrismaService {
  users: UserRecord[] = [];
  propostas: PropostaRecord[] = [];
  historicoStatus: HistoricoStatusPropostaRecord[] = [];

  user = {
    findUnique: jest.fn(
      ({ where }: { where: { email?: string; id?: string } }) =>
        Promise.resolve(
          this.users.find(
            (user) => user.email === where.email || user.id === where.id,
          ) ?? null,
        ),
    ),
    findFirst: jest.fn(({ where }: { where: { id: string; role: UserRole } }) =>
      Promise.resolve(
        this.users.find(
          (user) => user.id === where.id && user.role === where.role,
        ) ?? null,
      ),
    ),
  };

  proposta = {
    create: jest.fn(({ data }: { data: Partial<PropostaRecord> }) => {
      const now = new Date();
      const record: PropostaRecord = {
        id: '44444444-4444-4444-8444-444444444444',
        clienteNome: String(data.clienteNome),
        clienteCpf: String(data.clienteCpf),
        clienteRenda: decimal(Number(data.clienteRenda)),
        valorSolicitado: decimal(Number(data.valorSolicitado)),
        numeroParcelas: Number(data.numeroParcelas),
        taxaMensal: decimal(Number(data.taxaMensal)),
        valorParcela: decimal(Number(data.valorParcela)),
        totalAPagar: decimal(Number(data.totalAPagar)),
        status: PropostaStatus.RASCUNHO,
        motivoReprovacao: null,
        corbanId: String(data.corbanId),
        createdAt: now,
        updatedAt: now,
      };

      this.propostas.push(record);
      return Promise.resolve(this.withCorban(record));
    }),
    findMany: jest.fn(
      ({
        where,
        skip,
        take,
      }: {
        where?: {
          corbanId?: string;
          status?: PropostaStatus;
          clienteCpf?: string;
        };
        skip?: number;
        take?: number;
      } = {}) => {
        let records = [...this.propostas];

        if (where?.corbanId) {
          records = records.filter(
            (proposta) => proposta.corbanId === where.corbanId,
          );
        }
        if (where?.status) {
          records = records.filter(
            (proposta) => proposta.status === where.status,
          );
        }
        if (where?.clienteCpf) {
          records = records.filter(
            (proposta) => proposta.clienteCpf === where.clienteCpf,
          );
        }

        records = records.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (skip !== undefined) {
          records = records.slice(skip);
        }
        if (take !== undefined) {
          records = records.slice(0, take);
        }

        return Promise.resolve(
          records.map((record) => this.withCorban(record)),
        );
      },
    ),
    findUnique: jest.fn(({ where }: { where: { id: string } }) =>
      Promise.resolve(
        this.withCorban(
          this.propostas.find((proposta) => proposta.id === where.id) ?? null,
        ),
      ),
    ),
    update: jest.fn(
      ({
        where,
        data,
      }: {
        where: { id: string };
        data: {
          status: PropostaStatus;
          motivoReprovacao?: string | null;
        };
      }) => {
        const record = this.propostas.find(
          (proposta) => proposta.id === where.id,
        );

        if (!record) {
          return Promise.resolve(null);
        }

        record.status = data.status;
        record.motivoReprovacao = data.motivoReprovacao ?? null;
        record.updatedAt = new Date();

        return Promise.resolve(this.withCorban(record));
      },
    ),
    count: jest.fn(
      ({
        where,
      }: {
        where?: {
          corbanId?: string;
          status?: PropostaStatus;
          clienteCpf?: string;
        };
      } = {}) => {
        let records = this.propostas;

        if (where?.corbanId) {
          records = records.filter(
            (proposta) => proposta.corbanId === where.corbanId,
          );
        }
        if (where?.status) {
          records = records.filter(
            (proposta) => proposta.status === where.status,
          );
        }
        if (where?.clienteCpf) {
          records = records.filter(
            (proposta) => proposta.clienteCpf === where.clienteCpf,
          );
        }

        return Promise.resolve(records.length);
      },
    ),
  };

  historicoStatusProposta = {
    create: jest.fn(
      ({
        data,
      }: {
        data: {
          propostaId: string;
          statusAnterior: PropostaStatus;
          statusNovo: PropostaStatus;
          usuarioId: string;
          perfilUsuario: UserRole;
          motivo?: string | null;
        };
      }) => {
        const record: HistoricoStatusPropostaRecord = {
          id: `historico-${this.historicoStatus.length + 1}`,
          propostaId: data.propostaId,
          statusAnterior: data.statusAnterior,
          statusNovo: data.statusNovo,
          usuarioId: data.usuarioId,
          perfilUsuario: data.perfilUsuario,
          motivo: data.motivo ?? null,
          criadoEm: new Date(),
        };

        this.historicoStatus.push(record);

        return Promise.resolve(record);
      },
    ),
  };

  async $connect(): Promise<void> {}

  async $disconnect(): Promise<void> {}

  async $transaction<T>(
    callback: (client: FakePrismaService) => Promise<T>,
  ): Promise<T> {
    const propostasSnapshot = this.propostas.map((proposta) => ({
      ...proposta,
    }));
    const historicoSnapshot = this.historicoStatus.map((historico) => ({
      ...historico,
    }));

    try {
      return await callback(this);
    } catch (error) {
      this.propostas = propostasSnapshot;
      this.historicoStatus = historicoSnapshot;
      throw error;
    }
  }

  private withCorban(record: PropostaRecord | null) {
    if (!record) {
      return null;
    }

    const corban = this.users.find((user) => user.id === record.corbanId);

    return {
      ...record,
      corban: {
        id: corban?.id ?? record.corbanId,
        email: corban?.email ?? '',
      },
    };
  }
}

describe('Autenticacao (e2e)', () => {
  let app: INestApplication;
  let prisma: FakePrismaService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.AUTH_LOGIN_RATE_LIMIT_MAX = '10';
    process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS = '60000';

    prisma = new FakePrismaService();
    const now = new Date();
    const passwordHash = await bcrypt.hash('Teste@2024', 4);

    prisma.users = [
      {
        id: ids.corban1,
        email: 'corban1@neocredito.com.br',
        passwordHash,
        role: UserRole.CORBAN,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.corban2,
        email: 'corban2@neocredito.com.br',
        passwordHash,
        role: UserRole.CORBAN,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ids.operador,
        email: 'operador@neocredito.com.br',
        passwordHash,
        role: UserRole.OPERADOR,
        createdAt: now,
        updatedAt: now,
      },
    ];
    prisma.propostas = [
      proposal(
        '55555555-5555-4555-8555-555555555555',
        ids.corban1,
        PropostaStatus.RASCUNHO,
        '11144477735',
      ),
      proposal(
        '66666666-6666-4666-8666-666666666666',
        ids.corban2,
        PropostaStatus.EM_ANALISE,
        '12345678909',
      ),
    ];

    const { AppModule } = await import('../src/app.module');
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('realiza login e retorna o usuario autenticado', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: ids.corban1,
          email: 'corban1@neocredito.com.br',
          role: UserRole.CORBAN,
        });
      });
  });

  it('recusa login com senha incorreta', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'corban1@neocredito.com.br',
        senha: 'senha-invalida',
      })
      .expect(401)
      .expect(({ body }) => {
        expect(body.error).toBe('Credenciais invalidas');
      });
  });

  it('valida dados obrigatorios do login', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'corban1@neocredito.com.br' })
      .expect(400);
  });

  it('bloqueia acesso sem token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('informa quando o token esta expirado', async () => {
    const jwtService = app.get(JwtService);
    const expiredToken = jwtService.sign({
      sub: ids.corban1,
      email: 'corban1@neocredito.com.br',
      perfil: UserRole.CORBAN,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
      .expect(({ body }) => {
        expect(body.error).toBe('Token expirado');
      });
  });

  it('cria proposta para o CORBAN autenticado', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteNome: 'Maria Silva',
        clienteCpf: '111.444.777-35',
        clienteRenda: 6500,
        valorSolicitado: 10000,
        numeroParcelas: 12,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          clienteNome: 'Maria Silva',
          clienteCpf: '11144477735',
          clienteRenda: 6500,
          valorSolicitado: 10000,
          numeroParcelas: 12,
          taxaJuros: 1.89,
          valorParcela: 939.22,
          totalAPagar: 11270.64,
          status: PropostaStatus.RASCUNHO,
          corbanId: ids.corban1,
        });
        expect(body.corban).toMatchObject({
          id: ids.corban1,
          email: 'corban1@neocredito.com.br',
        });
      });
  });

  it('permite OPERADOR criar proposta para um CORBAN informado', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteNome: 'Cliente do Operador',
        clienteCpf: '12345678909',
        clienteRenda: 7200,
        valorSolicitado: 12000,
        numeroParcelas: 18,
        corbanId: ids.corban2,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.corbanId).toBe(ids.corban2);
        expect(body.status).toBe(PropostaStatus.RASCUNHO);
      });
  });

  it('recusa cadastro de proposta sem token', async () => {
    await request(app.getHttpServer())
      .post('/propostas')
      .send({
        clienteNome: 'Maria Silva',
        clienteCpf: '11144477735',
        clienteRenda: 6500,
        valorSolicitado: 10000,
        numeroParcelas: 12,
      })
      .expect(401);
  });

  it('recusa CPF com digitos verificadores invalidos', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteNome: 'Maria Silva',
        clienteCpf: '12345678901',
        clienteRenda: 6500,
        valorSolicitado: 10000,
        numeroParcelas: 12,
      })
      .expect(400);
  });

  it('exige corbanId quando OPERADOR cria proposta', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .post('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clienteNome: 'Cliente do Operador',
        clienteCpf: '12345678909',
        clienteRenda: 7200,
        valorSolicitado: 12000,
        numeroParcelas: 18,
      })
      .expect(400)
      .expect(({ body }) => {
        expect(body.error).toBe('corbanId e obrigatorio para OPERADOR');
      });
  });

  it('lista apenas propostas do CORBAN autenticado', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .get('/propostas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1);
        expect(body.page).toBe(1);
        expect(body.limit).toBe(20);
        expect(
          body.data.every(
            (proposta: { corbanId: string }) =>
              proposta.corbanId === ids.corban1,
          ),
        ).toBe(true);
      });
  });

  it('lista propostas para OPERADOR com filtro de status e CPF', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .get('/propostas?status=EM_ANALISE&clienteCpf=123.456.789-09')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.total).toBe(1);
        expect(body.data[0]).toMatchObject({
          corbanId: ids.corban2,
          clienteCpf: '12345678909',
          status: PropostaStatus.EM_ANALISE,
        });
      });
  });

  it('busca uma proposta propria por id', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .get('/propostas/55555555-5555-4555-8555-555555555555')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: '55555555-5555-4555-8555-555555555555',
          corbanId: ids.corban1,
        });
      });
  });

  it('bloqueia CORBAN tentando consultar proposta de outro CORBAN', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .get('/propostas/66666666-6666-4666-8666-666666666666')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('retorna 404 ao buscar proposta inexistente', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .get('/propostas/77777777-7777-4777-8777-777777777777')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('bloqueia CORBAN tentando alterar status de proposta', async () => {
    const token = await login();

    await request(app.getHttpServer())
      .patch('/propostas/55555555-5555-4555-8555-555555555555/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: PropostaStatus.EM_ANALISE })
      .expect(403);
  });

  it('permite OPERADOR enviar proposta em rascunho para analise', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .patch('/propostas/55555555-5555-4555-8555-555555555555/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: PropostaStatus.EM_ANALISE })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: '55555555-5555-4555-8555-555555555555',
          status: PropostaStatus.EM_ANALISE,
          motivoReprovacao: null,
        });
        expect(prisma.historicoStatus).toContainEqual(
          expect.objectContaining({
            propostaId: '55555555-5555-4555-8555-555555555555',
            statusAnterior: PropostaStatus.RASCUNHO,
            statusNovo: PropostaStatus.EM_ANALISE,
            usuarioId: ids.operador,
            perfilUsuario: UserRole.OPERADOR,
            motivo: null,
          }),
        );
      });
  });

  it('recusa transicao de rascunho direto para aprovada', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .patch('/propostas/55555555-5555-4555-8555-555555555555/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: PropostaStatus.APROVADA })
      .expect(422);
  });

  it('exige motivo para reprovar proposta', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .patch('/propostas/66666666-6666-4666-8666-666666666666/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: PropostaStatus.REPROVADA })
      .expect(400);
  });

  it('permite OPERADOR reprovar proposta em analise com motivo', async () => {
    const token = await login('operador@neocredito.com.br');

    await request(app.getHttpServer())
      .patch('/propostas/66666666-6666-4666-8666-666666666666/status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: PropostaStatus.REPROVADA,
        motivoReprovacao: 'Score insuficiente',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: '66666666-6666-4666-8666-666666666666',
          status: PropostaStatus.REPROVADA,
          motivoReprovacao: 'Score insuficiente',
        });
        expect(prisma.historicoStatus).toContainEqual(
          expect.objectContaining({
            propostaId: '66666666-6666-4666-8666-666666666666',
            statusAnterior: PropostaStatus.EM_ANALISE,
            statusNovo: PropostaStatus.REPROVADA,
            usuarioId: ids.operador,
            perfilUsuario: UserRole.OPERADOR,
            motivo: 'Score insuficiente',
          }),
        );
      });
  });

  async function login(email = 'corban1@neocredito.com.br'): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        senha: 'Teste@2024',
      })
      .expect(200);

    return response.body.accessToken as string;
  }
});

function proposal(
  id: string,
  corbanId: string,
  status: PropostaStatus,
  clienteCpf: string,
): PropostaRecord {
  const now = new Date();

  return {
    id,
    clienteNome: 'Cliente Teste',
    clienteCpf,
    clienteRenda: decimal(6500),
    valorSolicitado: decimal(10000),
    numeroParcelas: 12,
    taxaMensal: decimal(1.89),
    valorParcela: decimal(939.22),
    totalAPagar: decimal(11270.64),
    status,
    motivoReprovacao: null,
    corbanId,
    createdAt: now,
    updatedAt: now,
  };
}
