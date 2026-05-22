import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const handler = jest.fn();
  const controller = jest.fn();
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as jest.Mocked<Reflector>;
  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('libera rota sem perfil exigido', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(context())).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      handler,
      controller,
    ]);
  });

  it('libera usuario com perfil permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CORBAN]);

    expect(guard.canActivate(context(UserRole.CORBAN))).toBe(true);
  });

  it('bloqueia usuario sem perfil permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OPERADOR]);

    expect(guard.canActivate(context(UserRole.CORBAN))).toBe(false);
  });

  it('bloqueia request sem usuario autenticado', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.OPERADOR]);

    expect(guard.canActivate(context())).toBe(false);
  });

  function context(role?: UserRole): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => ({
          user: role
            ? {
                id: 'user-id',
                email: 'user@neocredito.com.br',
                role,
              }
            : undefined,
        }),
      }),
    } as unknown as ExecutionContext;
  }
});
