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

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'user-id',
        email: 'corban1@neocredito.com.br',
        perfil: UserRole.CORBAN,
        corbanId: 'user-id',
      },
      { expiresIn: '1h' },
    );
  });

  it('usa 8h como expiracao padrao do JWT', async () => {
    const passwordHash = await bcrypt.hash('Teste@2024', 4);
    const localJwtService = {
      signAsync: jest.fn().mockResolvedValue('token-gerado'),
    } as unknown as JwtService;
    const defaultConfigService = {
      get: jest.fn((_key: string, defaultValue: string) => defaultValue),
    } as unknown as ConfigService;

    usersService.findByEmail.mockResolvedValue({
      id: 'operador-id',
      email: 'operador@neocredito.com.br',
      passwordHash,
      role: UserRole.OPERADOR,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await new AuthService(
      usersService,
      localJwtService,
      defaultConfigService,
    ).login('operador@neocredito.com.br', 'Teste@2024');

    expect(localJwtService.signAsync).toHaveBeenCalledWith(
      {
        sub: 'operador-id',
        email: 'operador@neocredito.com.br',
        perfil: UserRole.OPERADOR,
      },
      { expiresIn: '8h' },
    );
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
