import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('exige JWT_SECRET', () => {
    expect(() => validateEnvironment({})).toThrow('JWT_SECRET is required');
  });

  it('normaliza valores informados por ambiente', () => {
    expect(
      validateEnvironment({
        JWT_SECRET: '  secret  ',
        JWT_EXPIRES_IN: '  8h  ',
        AUTH_LOGIN_RATE_LIMIT_MAX: '5',
        AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: '30000',
        PORT: '3001',
      }),
    ).toMatchObject({
      JWT_SECRET: 'secret',
      JWT_EXPIRES_IN: '8h',
      AUTH_LOGIN_RATE_LIMIT_MAX: 5,
      AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: 30000,
      PORT: 3001,
    });
  });

  it('aplica valores padrao para configuracoes opcionais', () => {
    expect(validateEnvironment({ JWT_SECRET: 'secret' })).toMatchObject({
      JWT_EXPIRES_IN: '8h',
      AUTH_LOGIN_RATE_LIMIT_MAX: 10,
      AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: 60000,
      PORT: 3000,
    });
  });

  it('recusa limites de login invalidos', () => {
    expect(() =>
      validateEnvironment({
        JWT_SECRET: 'secret',
        AUTH_LOGIN_RATE_LIMIT_MAX: '0',
      }),
    ).toThrow('AUTH_LOGIN_RATE_LIMIT_MAX must be a positive integer');

    expect(() =>
      validateEnvironment({
        JWT_SECRET: 'secret',
        AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: 'abc',
      }),
    ).toThrow('AUTH_LOGIN_RATE_LIMIT_WINDOW_MS must be a positive integer');
  });
});
