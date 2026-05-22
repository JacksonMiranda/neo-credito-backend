import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const now = Date.now();
    const limit = this.configService.get<number>(
      'AUTH_LOGIN_RATE_LIMIT_MAX',
      10,
    );
    const windowMs = this.configService.get<number>(
      'AUTH_LOGIN_RATE_LIMIT_WINDOW_MS',
      60000,
    );
    const key = this.getClientKey(request);
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (bucket.count >= limit) {
      throw new HttpException(
        {
          error: 'Muitas tentativas de login. Tente novamente mais tarde.',
          details: {
            limit,
            windowMs,
            retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private getClientKey(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;

    return (
      forwardedIp?.split(',')[0]?.trim() ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
