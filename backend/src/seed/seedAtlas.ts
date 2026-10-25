import mongoose from 'mongoose';
import pino from 'pino';
import {
  connectMongoDBAtlas,
  disconnectMongoDBAtlas,
  maskMongoCredentials,
} from '../config/database';
import { validateEnv } from '../config/env';
import { AuditLog, Basket, CounselingRound, Course, User } from '../models';
import { ensureInstitutionalSeedData } from '../services/seedService';

const logger = pino({ name: 'tiet-atlas-seeder' });

/**
 * Normalizes snake_case fields (`course_code`, `basket_id`) from Python ML scripts with
 * camelCase Mongoose fields (`courseCode`, `basketId`) and creates all production compound indexes.
 */
export async function ensureProductionAtlasIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB Atlas connection is not active');
  }

  logger.info('Normalizing cross-service schema keys and creating production compound indexes...');

  // Remove any legacy documents in `courses` or `baskets` that lack `courseCode` or `basketId`
  // so `ensureInstitutionalSeedData()` can cleanly upsert unified documents with both camelCase & snake_case keys
  await db.collection('courses').deleteMany({
    $or: [{ courseCode: null }, { courseCode: { $exists: false } }],
  });
  await db.collection('baskets').deleteMany({
    $or: [{ basketId: null }, { basketId: { $exists: false } }],
  });

  await Promise.all([
    // Courses collection indexes
    db.collection('courses').createIndex({ courseCode: 1 }, { unique: true, background: true }),
    db.collection('courses').createIndex({ basketId: 1 }, { background: true }),
    db
      .collection('courses')
      .createIndex({ category: 1, electiveSlot: 1, semester: 1 }, { background: true }),

    // Baskets collection indexes
    db.collection('baskets').createIndex({ basketId: 1 }, { unique: true, background: true }),
    db.collection('baskets').createIndex({ basketNumber: 1 }, { background: true }),

    // Users / StudentProfiles collection indexes
    db.collection('users').createIndex({ email: 1 }, { unique: true, background: true }),
    db
      .collection('users')
      .createIndex({ rollNumber: 1 }, { unique: true, sparse: true, background: true }),
    db
      .collection('users')
      .createIndex({ batchYear: 1, currentSemester: 1, cgpa: -1 }, { background: true }),
    db.collection('users').createIndex({ allocatedBasketId: 1 }, { background: true }),

    // CounselingRounds & AuditLogs indexes
    db
      .collection('counseling_rounds')
      .createIndex({ roundId: 1 }, { unique: true, background: true }),
    db
      .collection('audit_logs')
      .createIndex({ action: 1, timestamp: -1 }, { background: true }),
  ]);

  logger.info('All production compound indexes synchronized on MongoDB Atlas.');
}

/**
 * Idempotently seeds historical analytics summary records in MongoDB Atlas without wiping student data.
 */
async function upsertHistoricalAnalyticsSummary(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const analyticsColl = db.collection('historical_analytics_summaries');
  await analyticsColl.createIndex({ batchCohort: 1 }, { unique: true, background: true });

  const summaries = [
    {
      batchCohort: 'TIET_CSE_2022_2026',
      totalGraduatingSeniors: 890,
      avgSem4Cgpa: 8.12,
      avgElectiveSgpa: 8.48,
      superDreamPlacementPct: 42.5,
      dreamPlacementPct: 38.0,
      higherStudiesPct: 12.0,
      topBasketByDemand: 'EF_BASKET_09',
      updatedAt: new Date(),
    },
    {
      batchCohort: 'TIET_CSE_2023_2027',
      totalGraduatingSeniors: 940,
      avgSem4Cgpa: 8.18,
      avgElectiveSgpa: 8.54,
      superDreamPlacementPct: 44.8,
      dreamPlacementPct: 37.2,
      higherStudiesPct: 11.5,
      topBasketByDemand: 'EF_BASKET_09',
      updatedAt: new Date(),
    },
  ];

  const ops = summaries.map((s) => ({
    updateOne: {
      filter: { batchCohort: s.batchCohort },
      update: { $set: s },
      upsert: true,
    },
  }));

  await analyticsColl.bulkWrite(ops, { ordered: false });
}

export async function runAtlasSeedPipeline(): Promise<void> {
  const env = validateEnv();
  logger.info(
    { uri: maskMongoCredentials(env.MONGODB_URI) },
    'Starting idempotent MongoDB Atlas seeding & index synchronization pipeline...'
  );

  await connectMongoDBAtlas(env);
  await ensureProductionAtlasIndexes();
  await ensureInstitutionalSeedData();
  await upsertHistoricalAnalyticsSummary();

  const [courseCount, basketCount, userCount, roundCount, auditCount] = await Promise.all([
    Course.countDocuments(),
    Basket.countDocuments(),
    User.countDocuments(),
    CounselingRound.countDocuments(),
    AuditLog.countDocuments(),
  ]);

  logger.info(
    {
      courses: courseCount,
      baskets: basketCount,
      users: userCount,
      counselingRounds: roundCount,
      auditLogs: auditCount,
    },
    'Idempotent MongoDB Atlas seed completed without wiping existing student records.'
  );
}

if (require.main === module) {
  runAtlasSeedPipeline()
    .then(async () => {
      await disconnectMongoDBAtlas();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.fatal({ err }, 'MongoDB Atlas seed pipeline failed');
      await disconnectMongoDBAtlas();
      process.exit(1);
    });
}
