import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_META, RateLimitOptions } from 'src/common/decorators/rate-limit.decorator';
import { RateLimiterService } from '../services/rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private limiter: RateLimiterService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_META, context.getHandler());

    if (!options?.key) {
      throw new HttpException('Rate limit key not provided', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let identifier: string | undefined;

    switch (options.identifierType) {
      case 'email':
        identifier = req.body?.email;
        break;
      case 'ip':
        identifier = req.ip;
        break;
    }

    if (!identifier) {
      console.warn(`Rate limit check skipped: No identifier found for type ${options.identifierType}`);
      return true;
    }

    const redisKey = `${options.key}:${identifier}`;
    await this.limiter.check(redisKey);
    return true;
  }
}
