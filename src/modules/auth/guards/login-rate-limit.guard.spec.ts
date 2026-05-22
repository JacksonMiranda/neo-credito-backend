import { ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginRateLimitGuard } from './login-rate-limit.guard';

describe('LoginRateLimitGuard', () => {
  const configService = {
    get: jest.fn((key: string, defaultValue: number) => {
      const values: Record<string, number> = {
        AUTH_LOGIN_RATE_LIMIT_MAX: 2,
        AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: 60000,
      };

      return values[key] ?? defaultValue;
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite tentativas dentro do limite configurado', () => {
    const guard = new LoginRateLimitGuard(configService);
    const request = { ip: '127.0.0.1', headers: {}, socket: {} };

    expect(guard.canActivate(context(request))).toBe(true);
    expect(guard.canActivate(context(request))).toBe(true);
  });

  it('bloqueia tentativas acima do limite configurado', () => {
    const guard = new LoginRateLimitGuard(configService);
    const request = { ip: '127.0.0.1', headers: {}, socket: {} };

    guard.canActivate(context(request));
    guard.canActivate(context(request));

    expect(() => guard.canActivate(context(request))).toThrow(HttpException);
  });

  it('usa o primeiro IP de x-forwarded-for quando informado', () => {
    const guard = new LoginRateLimitGuard(configService);
    const firstProxyRequest = {
      ip: '10.0.0.1',
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
      socket: {},
    };
    const sameClientRequest = {
      ip: '10.0.0.2',
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.2' },
      socket: {},
    };

    guard.canActivate(context(firstProxyRequest));
    guard.canActivate(context(sameClientRequest));

    expect(() => guard.canActivate(context(sameClientRequest))).toThrow(
      HttpException,
    );
  });

  function context(request: object): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }
});
