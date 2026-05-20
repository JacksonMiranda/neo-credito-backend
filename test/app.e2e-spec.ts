import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

const userId = '11111111-1111-4111-8111-111111111111';

class FakePrismaService {
  users: UserRecord[] = [];

  user = {
    findUnique: jest.fn(
      ({ where }: { where: { email?: string; id?: string } }) =>
        Promise.resolve(
          this.users.find(
            (user) => user.email === where.email || user.id === where.id,
          ) ?? null,
        ),
    ),
  };

  async $connect(): Promise<void> {}

  async $disconnect(): Promise<void> {}
}

describe('Autenticacao (e2e)', () => {
  let app: INestApplication;
  let prisma: FakePrismaService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    prisma = new FakePrismaService();
    const now = new Date();
    const passwordHash = await bcrypt.hash('Teste@2024', 4);

    prisma.users = [
      {
        id: userId,
        email: 'corban1@neocredito.com.br',
        passwordHash,
        role: UserRole.CORBAN,
        createdAt: now,
        updatedAt: now,
      },
    ];

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
          id: userId,
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
      sub: userId,
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

  async function login(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'corban1@neocredito.com.br',
        senha: 'Teste@2024',
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      id: userId,
      email: 'corban1@neocredito.com.br',
      role: UserRole.CORBAN,
    });

    return response.body.accessToken as string;
  }
});
