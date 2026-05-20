import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('token-gerado'),
  } as unknown as JwtService;
  const configService = {
    get: jest.fn().mockReturnValue('1h'),
  } as unknown as ConfigService;
  const usersService = {
    findByEmail: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('autentica usuario com credenciais validas', async () => {
    const passwordHash = await bcrypt.hash('Teste@2024', 4);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'corban1@neocredito.com.br',
      passwordHash,
      role: UserRole.CORBAN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      new AuthService(usersService, jwtService, configService).login(
        'corban1@neocredito.com.br',
        'Teste@2024',
      ),
    ).resolves.toEqual({
      accessToken: 'token-gerado',
      user: {
        id: 'user-id',
        email: 'corban1@neocredito.com.br',
        role: UserRole.CORBAN,
      },
    });
  });

  it('recusa email inexistente', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      new AuthService(usersService, jwtService, configService).login(
        'corban1@neocredito.com.br',
        'senha-invalida',
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('recusa senha incorreta', async () => {
    const passwordHash = await bcrypt.hash('Teste@2024', 4);

    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'corban1@neocredito.com.br',
      passwordHash,
      role: UserRole.CORBAN,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      new AuthService(usersService, jwtService, configService).login(
        'corban1@neocredito.com.br',
        'senha-invalida',
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
});
