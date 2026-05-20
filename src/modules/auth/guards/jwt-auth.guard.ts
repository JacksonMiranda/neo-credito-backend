import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: { name?: string } | null,
    _context: ExecutionContext,
  ): TUser {
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException({
        error: 'Token expirado',
        details: {},
      });
    }

    if (err || !user) {
      throw new UnauthorizedException({
        error: 'Autenticacao obrigatoria',
        details: {},
      });
    }

    return user;
  }
}
