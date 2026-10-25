import Redis from 'ioredis';
import pino from 'pino';
import { EnvConfig } from './env';

const logger = pino({ name: 'managed-redis-connector' });

let redisClient: Redis | null = null;

export function createManagedRedisClient(env: EnvConfig): Redis | null {
  if (
    !env.REDIS_URL ||
    env.REDIS_URL.includes('<') ||
    env.REDIS_URL.includes('tiet_managed_redis_cloud_token')
  ) {
    logger.info('REDIS_URL not configured with live credentials; operating without external Redis cache');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  const useTls = env.REDIS_URL.startsWith('rediss://');
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    ...(useTls ? { tls: { rejectUnauthorized: true } } : {}),
    retryStrategy(times: number) {
      if (times > 5) {
        return null;
      }
      const delay = Math.min(times * 250, 5000);
      logger.warn({ attempt: times, delayMs: delay }, 'Reconnecting to managed cloud Redis...');
      return delay;
    },
  });

  redisClient.on('connect', () => {
    logger.info('Connected to managed cloud Redis cluster');
  });

  redisClient.on('error', (error) => {
    logger.warn({ err: error.message }, 'Managed Redis client warning');
  });

  return redisClient;
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function disconnectManagedRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Gracefully closed managed Redis connection');
  }
}
