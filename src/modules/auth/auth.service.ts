import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

type LoginResult = {
  accessToken: string;
  user: AuthenticatedUser;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, senha: string): Promise<LoginResult> {
    const usuario = await this.usersService.findByEmail(email);

    if (!usuario || !(await bcrypt.compare(senha, usuario.passwordHash))) {
      throw new UnauthorizedException({
        error: 'Credenciais invalidas',
        details: {},
      });
    }

    const user = {
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
    };

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        perfil: user.role,
        ...(user.role === UserRole.CORBAN ? { corbanId: user.id } : {}),
      },
      {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '8h'),
      },
    );

    return { accessToken, user };
  }
}
