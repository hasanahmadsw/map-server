import { Module } from '@nestjs/common';
import { RedisModule } from 'src/services/redis/redis.module';
import { RateLimiterService } from '../services/rate-limiter.service';

@Module({
  imports: [RedisModule],
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimitModule {}
