import { ConfigService } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-ioredis';

export const redisConfig = (
  configService: ConfigService,
): CacheModuleOptions => ({
  store: redisStore,
  host: configService.get<string>('REDIS_HOST', 'localhost'),
  port: configService.get<number>('REDIS_PORT', 6379),
  password: configService.get<string>('REDIS_PASSWORD'),
  ttl: configService.get<number>('REDIS_TTL', 1800), // 30 minutes default
  max: 100, // Maximum number of items in cache
  // Azure Cache for Redis requires TLS/SSL
  tls: configService.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
});
