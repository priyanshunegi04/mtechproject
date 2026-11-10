import axios from 'axios';
import dns from 'dns';
import mongoose from 'mongoose';
import request from 'supertest';
import { validateEnv } from '../config/env';
import { createExpressApp } from '../index';
import { signAccessToken } from '../middlewares';
import { User } from '../models';
import { ensureInstitutionalSeedData } from '../services';

// Enable public DNS fallback for MongoDB Atlas SRV query resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore in sandboxed environments
}

describe('ThaparElectiveAI Backend End-to-End Integration Tests', () => {
  const env = validateEnv();
  const app = createExpressApp(env);

  let registeredEmail: string;
  let registeredRoll: string;
  let testPassword = 'Thapar@2026Test';
  let jwtAccessToken: string;
  let isDbConnected = false;

  beforeAll(async () => {
    try {
      // Connect to Atlas database if reachable
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(env.MONGODB_URI.trim(), {
          dbName: env.MONGODB_DB_NAME || 'thapar_elective_ai',
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 3000,
        });
      }
      await ensureInstitutionalSeedData();
      isDbConnected = true;
    } catch (err: any) {
      console.warn(
        `[Integration Tests] Live Atlas database unavailable (${err.message}). Live database tests will run conditionally.`
      );
      isDbConnected = false;
    }
  }, 30000);

  afterAll(async () => {
    try {
      if (isDbConnected && registeredEmail) {
        await User.deleteOne({ email: registeredEmail });
      }
    } catch {}
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch {}
  }, 20000);

  // ---------------------------------------------------------------------------
  // 1. Institutional Authentication Tests
  // ---------------------------------------------------------------------------
  describe('1. Institutional Authentication Pipeline', () => {
    const timestamp = Date.now().toString().slice(-6);
    registeredEmail = `test.student${timestamp}@thapar.edu`;
    registeredRoll = `102403${timestamp.slice(-4)}`;

    it('rejects protected routes when no authorization token is supplied', async () => {
      const res = await request(app).get('/api/students/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/authorization|token/i);
    });

    it('successfully registers a new student under the @thapar.edu institutional domain', async () => {
      if (!isDbConnected) {
        console.warn('Skipping live database test: database connection not available in this test environment');
        return;
      }
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: `Integration Test Student ${timestamp}`,
          email: registeredEmail,
          password: testPassword,
          rollNumber: registeredRoll,
          batchYear: 2024,
          currentSemester: 4,
          cgpa: 8.75,
          role: 'student',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(registeredEmail);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();
    });

    it('authenticates the student via login and issues valid JWT access & refresh tokens', async () => {
      if (!isDbConnected) {
        console.warn('Skipping live database test: database connection not available in this test environment');
        return;
      }
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: registeredEmail,
          password: testPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toBeDefined();

      jwtAccessToken = res.body.tokens.accessToken;
      expect(typeof jwtAccessToken).toBe('string');
      expect(jwtAccessToken.length).toBeGreaterThan(20);
    });

    it('grants access to protected student endpoints when authenticated with Bearer token', async () => {
      if (!isDbConnected) {
        console.warn('Skipping live database test: database connection not available in this test environment');
        return;
      }
      const res = await request(app)
        .get('/api/students/me')
        .set('Authorization', `Bearer ${jwtAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(registeredEmail);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ML Proxy Resilience & Fallback Tests
  // ---------------------------------------------------------------------------
  describe('2. ML Proxy Route Resilience', () => {
    const samplePayload = {
      cgpa: 8.5,
      core_grades: {
        UES103: 9.0,
        UMA022: 8.5,
        UCS301: 9.5,
        UCS415: 9.0,
        UMA021: 8.5,
      },
      skills: ['Python', 'PyTorch', 'Data Science'],
      career_interest: 'Data Science',
      target_workload: 22,
      weights: { alpha: 0.28, beta: 0.24, gamma: 0.28, delta: 0.2 },
    };

    it('POST /api/ml/recommend-baskets returns structured recommendation payload when ML service responds', async () => {
      const axiosRequestSpy = jest
        .spyOn(axios.Axios.prototype, 'request')
        .mockResolvedValueOnce({
          status: 200,
          data: {
            success: true,
            model_version: 'tiet-hybrid-v2026.1.0',
            recommendations: [
              {
                rank: 1,
                basket_id: 'EF_BASKET_09',
                basket_number: 9,
                name: 'Data Science & Big Data (NVIDIA)',
                collaboration: 'NVIDIA',
                composite_match_score: 94.5,
                hybrid_score: 94.5,
                predicted_grade: 8.8,
                score_breakdown: {
                  content_score: 95.0,
                  collaborative_score: 92.0,
                  expected_grade_score: 96.0,
                  career_alignment_score: 95.0,
                },
                top_shap_reasons: [
                  {
                    feature: 'Prerequisite Core Mastery',
                    shap_impact: 0.45,
                    direction: 'positive',
                    reason: 'Strong Sem I–IV foundation',
                  },
                ],
              },
            ],
          },
        });

      const res = await request(app)
        .post('/api/ml/recommend-baskets')
        .send(samplePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThanOrEqual(1);

      const topRec = res.body.recommendations[0];
      expect(topRec.basket_id).toBe('EF_BASKET_09');
      expect(topRec.composite_match_score).toBe(94.5);
      expect(topRec.hybrid_score).toBe(94.5);
      expect(topRec.predicted_grade).toBe(8.8);
      expect(Array.isArray(topRec.top_shap_reasons)).toBe(true);

      axiosRequestSpy.mockRestore();
    });

    it('gracefully handles mock 502/network timeout without crashing the Express server', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const axiosRequestSpy = jest
        .spyOn(axios.Axios.prototype, 'request')
        .mockRejectedValueOnce({
          isAxiosError: true,
          message: 'connect ETIMEDOUT 100.20.30.40:443',
          code: 'ETIMEDOUT',
          response: { status: 502, data: 'Bad Gateway' },
        });

      const res = await request(app)
        .post('/api/ml/recommend-baskets')
        .send(samplePayload);

      // Verify that Express gracefully caught the error and returned 200 with structured fallback
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThan(0);

      const fallbackTop = res.body.recommendations[0];
      expect(fallbackTop.basket_id).toBeDefined();
      expect(fallbackTop.composite_match_score).toBeDefined();

      // Verify structured error logging occurred
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ML Service proxy error:',
        expect.objectContaining({
          code: 'ETIMEDOUT',
        })
      );

      axiosRequestSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Database-Backed Seat Allocation Tests
  // ---------------------------------------------------------------------------
  describe('3. Database-Backed Seat Allocation Engine', () => {
    it('POST /api/allocation/run executes serial dictatorship merit allocation and enforces capacity constraints', async () => {
      if (!isDbConnected) {
        console.warn('Skipping live database test: database connection not available in this test environment');
        return;
      }
      const adminToken = signAccessToken(
        {
          userId: 'admin_dean',
          email: 'dean.academic@thapar.edu',
          name: 'Prof. (Dr.) Vikramaditya Singh',
          role: 'dean_admin',
        },
        env.JWT_ACCESS_SECRET
      );

      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          overrideSeatCapPerBasket: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.execution_time_ms).toBe('number');
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.total_applicants).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.basket_stats)).toBe(true);
      expect(Array.isArray(res.body.roster)).toBe(true);

      // Verify capacity constraints across all baskets
      for (const basket of res.body.basket_stats) {
        expect(basket.allotted).toBeLessThanOrEqual(basket.capacity);
        expect(basket.fill_rate).toBeLessThanOrEqual(100);
      }

      // Verify no duplicate allotments for the same student roll number
      const rollNumbersSeen = new Set<string>();
      for (const entry of res.body.roster) {
        expect(rollNumbersSeen.has(entry.roll_no)).toBe(false);
        rollNumbersSeen.add(entry.roll_no);
        expect(entry.merit_rank).toBeGreaterThanOrEqual(1);
        expect(typeof entry.cgpa).toBe('number');
      }
    }, 45000);
  });
});
