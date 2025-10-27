// File: rate-limiter.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/services/redis/redis.service';

type RateLimitState = {
  timestamps: number[];
};

@Injectable()
export class RateLimiterService {
  private delays = [
    0,
    30,
    5 * 60,
    15 * 60,
    30 * 60,
    60 * 60,
    2 * 60 * 60,
    8 * 60 * 60,
    24 * 60 * 60,
  ];

  constructor(private readonly store: RedisService) {}

  async check(key: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    const raw = await this.store.get(key);
    const state: RateLimitState = raw ? JSON.parse(raw) : { timestamps: [] };

    state.timestamps = state.timestamps.filter((ts) => now - ts < 24 * 60 * 60);

    const attemptCount = state.timestamps.length;
    const delay = this.delays[Math.min(attemptCount, this.delays.length - 1)];

    const lastAttempt = state.timestamps[state.timestamps.length - 1] || 0;
    const nextAllowedTime = lastAttempt + delay;

    if (now < nextAllowedTime) {
      const waitSeconds = nextAllowedTime - now;
      throw new HttpException(
        `Please wait ${waitSeconds} seconds before retrying.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    state.timestamps.push(now);

    await this.store.set(key, JSON.stringify(state), 25 * 60 * 60);
  }
}
