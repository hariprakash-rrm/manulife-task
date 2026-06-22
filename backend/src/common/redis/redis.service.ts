import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor() {
    if (process.env.REDIS_HOST) {
      this.client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        lazyConnect: true,
      });
      this.client.connect().catch(() => {
        this.logger.warn('Redis unavailable — caching disabled');
        this.client = null;
      });
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const val = await this.client.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch { /* no-op */ }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try { await this.client.del(key); } catch { /* no-op */ }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
    } catch { /* no-op */ }
  }

  onModuleDestroy() {
    this.client?.quit().catch(() => {});
  }
}
