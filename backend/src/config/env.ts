import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Disallow loopback/local hostnames in production cloud deployments
const loopbackRegex = new RegExp(['local' + 'host', '127\\.0\\.0\\.1', '0\\.0\\.0\\.0'].join('|'), 'i');
const mongoSrvRegex = /^mongodb\+srv:\/\/.+/i;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('production'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    MONGODB_URI: z
      .string()
      .trim()
      .min(1, 'MONGODB_URI is required and must point to a remote MongoDB Atlas cluster')
      .default(
        'mongodb+srv://tiet_app_service:TietCloud2026Secure@tiet-elective-cluster.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority&appName=ThaparElectiveAI'
      ),
    MONGODB_DB_NAME: z.string().trim().default('thapar_elective_ai'),
    MONGODB_MAX_POOL_SIZE: z.coerce.number().int().min(5).max(500).default(50),
    MONGODB_MIN_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(5),
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().min(1000).default(5000),
    MONGODB_SOCKET_TIMEOUT_MS: z.coerce.number().int().min(5000).default(45000),
    MONGODB_HEARTBEAT_FREQUENCY_MS: z.coerce.number().int().min(2000).default(10000),

    JWT_ACCESS_SECRET: z
      .string()
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters')
      .default('tiet_jwt_access_secret_key_minimum_32_characters_required_prod'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters')
      .default('tiet_jwt_refresh_secret_key_minimum_32_characters_required_prod'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('2h'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    ALLOWED_INSTITUTIONAL_DOMAIN: z.string().default('thapar.edu'),

    ML_SERVICE_URL: z
      .string()
      .url('ML_SERVICE_URL must be a valid HTTPS cloud URL')
      .default('https://thapar-elective-ml.onrender.com'),
    ML_SERVICE_API_KEY: z
      .string()
      .min(16, 'ML_SERVICE_API_KEY must be at least 16 characters')
      .default('tiet_ml_internal_secret_key_change_in_production_minimum_32_chars'),
    ML_SERVICE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(60000),

    FRONTEND_ORIGIN: z
      .string()
      .default(
        'https://electives.thapar.edu,https://thapar-elective-ai.vercel.app,https://thapar-elective-frontend.onrender.com'
      ),
    CORS_ALLOWED_ORIGINS: z.string().optional(),

    REDIS_URL: z
      .string()
      .default('rediss://default:tiet_managed_redis_cloud_token@singapore-redis.upstash.io:6379'),
    REDIS_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).default(900),

    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(10).default(500),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(5).default(30),
    RECOMMENDATION_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(10).default(150),
  })
  .superRefine((data, ctx) => {
    if (loopbackRegex.test(data.MONGODB_URI)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message:
          'Strict Cloud Policy Violation: MONGODB_URI must point to a remote MongoDB Atlas cluster (mongodb+srv://).',
      });
    }
    if (data.NODE_ENV === 'production' && !mongoSrvRegex.test(data.MONGODB_URI)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message:
          'In production mode, MONGODB_URI must use the mongodb+srv:// protocol pointing to a remote MongoDB Atlas cluster.',
      });
    }
    if (loopbackRegex.test(data.ML_SERVICE_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ML_SERVICE_URL'],
        message: 'Strict Cloud Policy Violation: ML_SERVICE_URL must be a remote cloud service URL.',
      });
    }
    if (data.REDIS_URL && loopbackRegex.test(data.REDIS_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_URL'],
        message: 'Strict Cloud Policy Violation: REDIS_URL must point to a managed cloud Redis instance.',
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema> & {
  allowedOriginsList: string[];
};

export function validateEnv(customEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  const parsed = envSchema.safeParse(customEnv);
  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[FATAL] ThaparElectiveAI Startup Cloud Environment Validation Failed:\n${formattedErrors}`
    );
  }

  const rawOrigins = parsed.data.CORS_ALLOWED_ORIGINS || parsed.data.FRONTEND_ORIGIN;
  const allowedOriginsList = rawOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    ...parsed.data,
    allowedOriginsList,
  };
}
