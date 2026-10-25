import mongoose from 'mongoose';
import pino from 'pino';
import { EnvConfig } from './env';
import { disconnectManagedRedis } from './redis';

const logger = pino({ name: 'mongodb-atlas-singleton' });

/**
 * Masks database credentials in MongoDB Atlas SRV/standard URIs before structured JSON logging.
 */
export function maskMongoCredentials(uri: string): string {
  return uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//***:***@');
}

export interface AtlasPingResult {
  connected: boolean;
  readyState: number;
  latencyMs: number | null;
  host: string | null;
  database: string | null;
  error?: string;
}

/**
 * Singleton Production MongoDB Atlas Connection Manager
 */
export class MongoDBAtlasConnectionManager {
  private static instance: MongoDBAtlasConnectionManager | null = null;
  private connectionListenersAttached = false;
  private shutdownHandlersRegistered = false;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): MongoDBAtlasConnectionManager {
    if (!MongoDBAtlasConnectionManager.instance) {
      MongoDBAtlasConnectionManager.instance = new MongoDBAtlasConnectionManager();
    }
    return MongoDBAtlasConnectionManager.instance;
  }

  private attachConnectionMonitors(maskedUri: string): void {
    if (this.connectionListenersAttached) {
      return;
    }
    this.connectionListenersAttached = true;

    mongoose.connection.on('connected', () => {
      logger.info(
        {
          uri: maskedUri,
          host: mongoose.connection.host,
          dbName: mongoose.connection.name,
        },
        'Mongoose event: connected to remote MongoDB Atlas cluster'
      );
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ err, uri: maskedUri }, 'Mongoose event: connection error on MongoDB Atlas');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn({ uri: maskedUri }, 'Mongoose event: disconnected from MongoDB Atlas');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info({ uri: maskedUri }, 'Mongoose event: reconnected to MongoDB Atlas');
    });
  }

  public registerGracefulShutdownHandlers(): void {
    if (this.shutdownHandlersRegistered) {
      return;
    }
    this.shutdownHandlersRegistered = true;

    const handleTermination = async (signal: string, error?: unknown) => {
      if (error) {
        logger.fatal({ signal, err: error }, 'Uncaught exception detected; draining cloud pools');
      } else {
        logger.info({ signal }, 'Termination signal received; draining MongoDB Atlas & Redis pools');
      }
      try {
        await this.disconnect();
        await disconnectManagedRedis();
      } catch (closeErr) {
        logger.error({ err: closeErr }, 'Error during graceful cloud connection drain');
      } finally {
        process.exit(error ? 1 : 0);
      }
    };

    process.once('SIGTERM', () => void handleTermination('SIGTERM'));
    process.once('SIGINT', () => void handleTermination('SIGINT'));
    process.once('uncaughtException', (err) => void handleTermination('uncaughtException', err));
  }

  public async connect(env: EnvConfig): Promise<typeof mongoose> {
    if (mongoose.connection.readyState === 1) {
      return mongoose;
    }

    mongoose.set('strictQuery', true);
    const maskedUri = maskMongoCredentials(env.MONGODB_URI);
    this.attachConnectionMonitors(maskedUri);
    this.registerGracefulShutdownHandlers();

    const maxRetries = 5;
    let attempt = 0;
    this.isConnecting = true;

    try {
      while (attempt < maxRetries) {
        try {
          attempt += 1;
          logger.info(
            {
              attempt,
              maxRetries,
              uri: maskedUri,
              maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
              minPoolSize: env.MONGODB_MIN_POOL_SIZE,
              serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
              socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS,
              heartbeatFrequencyMS: env.MONGODB_HEARTBEAT_FREQUENCY_MS,
            },
            'Connecting to remote MongoDB Atlas cluster...'
          );

          const conn = await mongoose.connect(env.MONGODB_URI, {
            dbName: env.MONGODB_DB_NAME || 'thapar_elective_ai',
            maxPoolSize: env.MONGODB_MAX_POOL_SIZE ?? 50,
            minPoolSize: env.MONGODB_MIN_POOL_SIZE ?? 5,
            serverSelectionTimeoutMS: env.MONGODB_SERVER_SELECTION_TIMEOUT_MS ?? 5000,
            socketTimeoutMS: env.MONGODB_SOCKET_TIMEOUT_MS ?? 45000,
            heartbeatFrequencyMS: env.MONGODB_HEARTBEAT_FREQUENCY_MS ?? 10000,
            family: 4,
            autoIndex: env.NODE_ENV !== 'production',
            retryWrites: true,
            w: 'majority',
          });

          return conn;
        } catch (error) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
          logger.error(
            {
              err: error instanceof Error ? error.message : String(error),
              uri: maskedUri,
              attempt,
              nextRetryMs: backoffMs,
            },
            'MongoDB Atlas connection attempt failed'
          );

          if (attempt >= maxRetries) {
            throw new Error(
              `Exhausted all ${maxRetries} retries connecting to MongoDB Atlas (${maskedUri})`
            );
          }

          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
      throw new Error('Failed to establish MongoDB Atlas connection');
    } finally {
      this.isConnecting = false;
    }
  }

  public async ping(): Promise<AtlasPingResult> {
    const readyState = mongoose.connection.readyState;
    if (readyState !== 1 || !mongoose.connection.db) {
      return {
        connected: false,
        readyState,
        latencyMs: null,
        host: null,
        database: null,
        error: 'MongoDB Atlas connection is not in ready state (1)',
      };
    }

    const start = performance.now();
    try {
      await mongoose.connection.db.admin().ping();
      const latencyMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        connected: true,
        readyState,
        latencyMs,
        host: mongoose.connection.host || null,
        database: mongoose.connection.name || null,
      };
    } catch (error) {
      return {
        connected: false,
        readyState,
        latencyMs: null,
        host: mongoose.connection.host || null,
        database: mongoose.connection.name || null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (mongoose.connection.readyState !== 0 && !this.isConnecting) {
      await mongoose.connection.close(false);
      logger.info('Gracefully drained and closed MongoDB Atlas connection pool');
    }
  }
}

export async function connectMongoDBAtlas(env: EnvConfig): Promise<typeof mongoose> {
  return MongoDBAtlasConnectionManager.getInstance().connect(env);
}

export async function pingMongoDBAtlas(): Promise<AtlasPingResult> {
  return MongoDBAtlasConnectionManager.getInstance().ping();
}

export async function disconnectMongoDBAtlas(): Promise<void> {
  return MongoDBAtlasConnectionManager.getInstance().disconnect();
}
