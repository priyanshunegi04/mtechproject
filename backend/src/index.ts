import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import pino from 'pino';
import {
  connectMongoDBAtlas,
  disconnectMongoDBAtlas,
  pingMongoDBAtlas,
} from './config/database';
import { EnvConfig, validateEnv } from './config/env';
import { createManagedRedisClient, disconnectManagedRedis } from './config/redis';
import { errorHandler } from './middlewares';
import { createApiRouter } from './routes';
import { ensureInstitutionalSeedData, MLGatewayService } from './services';

const logger = pino({ name: 'thapar-elective-backend' });

export function createExpressApp(env: EnvConfig): Application {
  const app = express();
  const mlGateway = new MLGatewayService(env);

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const allowedOrigins: (string | RegExp)[] = [
    'https://mtechproject.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    /\.vercel\.app$/, // Matches all Vercel preview environments
    ...env.allowedOriginsList,
  ];

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      // Allow server-to-server or curl requests with no origin
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  });

  app.use(corsMiddleware);
  // Ensure preflight OPTIONS requests are handled cleanly across all routes
  app.options('*', corsMiddleware);
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(hpp());

  const apiLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after the rate-limit window.',
    },
  });
  app.use('/api', apiLimiter);

  const livenessHandler = (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      status: 'ALIVE',
      service: 'thapar-elective-ai-backend',
      institution: 'Thapar Institute of Engineering & Technology (TIET)',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  };

  const readinessHandler = async (_req: Request, res: Response): Promise<void> => {
    const [atlasPing, mlHealth] = await Promise.all([
      pingMongoDBAtlas(),
      mlGateway.checkHealth(),
    ]);

    res.status(atlasPing.connected ? 200 : 503).json({
      success: atlasPing.connected,
      status: atlasPing.connected ? 'READY' : 'DEGRADED',
      service: 'thapar-elective-ai-backend',
      institution: 'Thapar Institute of Engineering & Technology (TIET)',
      environment: env.NODE_ENV,
      databaseConnected: atlasPing.connected,
      atlasLatencyMs: atlasPing.latencyMs,
      atlasHost: atlasPing.host,
      atlasDatabase: atlasPing.database,
      mongodbAtlas: {
        connected: atlasPing.connected,
        latencyMs: atlasPing.latencyMs,
        host: atlasPing.host,
        database: atlasPing.database,
      },
      mlService: mlHealth,
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/ready', readinessHandler);
  app.get('/health', readinessHandler);
  app.get('/health/ready', readinessHandler);
  app.get('/api/ready', readinessHandler);
  app.get('/api/health/live', livenessHandler);
  app.get('/api/v1/health/live', livenessHandler);
  app.get('/api/health/ready', readinessHandler);
  app.get('/api/v1/health/ready', readinessHandler);
  app.get('/api/v1/health', readinessHandler);

  const apiRouter = createApiRouter(env);
  app.use('/api', apiRouter);
  app.use('/api/v1', apiRouter);

  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  const env = validateEnv();
  const isTemplateUri =
    env.MONGODB_URI.includes('tiet-elective-cluster.mongodb.net') ||
    env.MONGODB_URI.includes('<');

  if (!isTemplateUri) {
    await connectMongoDBAtlas(env);
    await ensureInstitutionalSeedData();
  } else {
    logger.warn(
      'MONGODB_URI is currently set to the template Atlas cluster hostname; starting HTTP API in cloud-replica standby mode until live Atlas credentials are supplied.'
    );
  }
  createManagedRedisClient(env);

  const app = createExpressApp(env);
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, environment: env.NODE_ENV },
      'ThaparElectiveAI Cloud Backend API listening'
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, draining cloud connections...');
    server.close(async () => {
      await disconnectMongoDBAtlas();
      await disconnectManagedRedis();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  bootstrap().catch((error) => {
    logger.fatal({ err: error }, 'Fatal startup failure in ThaparElectiveAI Backend');
    process.exit(1);
  });
}
