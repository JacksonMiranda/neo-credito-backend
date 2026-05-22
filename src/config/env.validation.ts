export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const jwtSecret = normalizeRequiredString(config.JWT_SECRET, 'JWT_SECRET');

  return {
    ...config,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: normalizeOptionalString(config.JWT_EXPIRES_IN, '8h'),
    AUTH_LOGIN_RATE_LIMIT_MAX: normalizePositiveInteger(
      config.AUTH_LOGIN_RATE_LIMIT_MAX,
      'AUTH_LOGIN_RATE_LIMIT_MAX',
      10,
    ),
    AUTH_LOGIN_RATE_LIMIT_WINDOW_MS: normalizePositiveInteger(
      config.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS,
      'AUTH_LOGIN_RATE_LIMIT_WINDOW_MS',
      60000,
    ),
    PORT: normalizePort(config.PORT),
  };
}

function normalizeRequiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function normalizeOptionalString(value: unknown, defaultValue: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : defaultValue;
}

function normalizePort(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  return port;
}

function normalizePositiveInteger(
  value: unknown,
  name: string,
  defaultValue: number,
): number {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return numberValue;
}
