import axios from 'axios';
import request from 'supertest';
import * as database from '../config/database';
import { validateEnv } from '../config/env';
import { createExpressApp } from '../index';
import { AuthenticatedUserPayload, signAccessToken } from '../middlewares';
import { Basket, CounselingRound, Course, User } from '../models';
import * as services from '../services';

describe('ThaparElectiveAI Full Workflow End-to-End & Security Pipeline', () => {
  const env = validateEnv();
  const app = createExpressApp(env);

  // Authenticated Test Identities
  const studentA: AuthenticatedUserPayload = {
    userId: 'usr_student_e2e_01',
    email: 'e2e.student@thapar.edu',
    name: 'E2E Test Student',
    role: 'student',
    rollNumber: '1024039901',
  };

  const studentB: AuthenticatedUserPayload = {
    userId: 'usr_student_e2e_02',
    email: 'other.student@thapar.edu',
    name: 'Other Student',
    role: 'student',
    rollNumber: '1024039902',
  };

  const deanAdmin: AuthenticatedUserPayload = {
    userId: 'usr_dean_admin_e2e',
    email: 'dean.academic@thapar.edu',
    name: 'Prof. (Dr.) Dean Academic',
    role: 'dean_admin',
  };

  const studentAToken = signAccessToken(studentA, env.JWT_ACCESS_SECRET);
  const studentBToken = signAccessToken(studentB, env.JWT_ACCESS_SECRET);
  const deanAdminToken = signAccessToken(deanAdmin, env.JWT_ACCESS_SECRET);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ==========================================================================
  // 1. System Health & Curriculum Endpoints
  // ==========================================================================
  describe('1. System Health & Institutional Curriculum Verification', () => {
    it('GET /api/health/live returns 200 with ALIVE status and uptime', async () => {
      const res = await request(app).get('/api/health/live');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ALIVE');
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('GET /health returns 200 when database connectivity ping succeeds', async () => {
      jest.spyOn(database, 'pingMongoDBAtlas').mockResolvedValueOnce({
        connected: true,
        readyState: 1,
        latencyMs: 12,
        host: 'atlas.mongodb.net',
        database: 'thapar_elective_ai',
      });

      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('READY');
      expect(res.body.databaseConnected).toBe(true);
    });

    it('GET /api/curriculum/baskets returns elective baskets with catalog metadata', async () => {
      const mockBaskets = [
        {
          basketId: 'EF_BASKET_01',
          code: 'EF_BASKET_01',
          name: 'Artificial Intelligence & Machine Learning',
          description: 'Deep Learning, NLP, Computer Vision',
          seatCapacity: 120,
        },
        {
          basketId: 'EF_BASKET_02',
          code: 'EF_BASKET_02',
          name: 'Cybersecurity & Privacy',
          description: 'Network Defense, Applied Cryptography',
          seatCapacity: 100,
        },
      ];

      jest.spyOn(Basket, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockBaskets),
        }),
      } as any);

      const res = await request(app).get('/api/curriculum/baskets');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.baskets)).toBe(true);
      expect(res.body.baskets.length).toBeGreaterThan(0);
    });

    it('GET /api/curriculum/courses returns courses', async () => {
      const mockCourses = [
        { courseCode: 'UCS501', title: 'Machine Learning', credits: 4 },
        { courseCode: 'UCS502', title: 'Compiler Construction', credits: 4 },
      ];

      jest.spyOn(Course, 'find').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCourses),
        }),
      } as any);

      const res = await request(app).get('/api/curriculum/courses');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.courses)).toBe(true);
    });

    it('GET /api/counseling/active-round returns active counseling round details', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Semester V Elective Counseling 2026',
        status: 'active',
        isPreferenceSubmissionOpen: true,
      };

      jest.spyOn(CounselingRound, 'findOne').mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockRound),
        }),
      } as any);

      const res = await request(app).get('/api/counseling/active-round');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.round).toBeDefined();
      expect(res.body.round.roundId).toBe('ROUND_2026_SEM5_R1');
    });
  });

  // ==========================================================================
  // 2. Complete Student Workflow End-to-End
  // ==========================================================================
  describe('2. Complete Student Workflow End-to-End', () => {
    it('rejects unauthenticated student profile request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/students/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('fetches student profile when authenticated', async () => {
      const mockUser = {
        _id: studentA.userId,
        name: studentA.name,
        email: studentA.email,
        rollNumber: studentA.rollNumber,
        batchYear: 2024,
        currentSemester: 4,
        cgpa: 8.85,
        role: 'student',
        coreGrades: new Map([
          ['UES103', 9.0],
          ['UCS301', 9.5],
        ]),
        skills: ['Python', 'SQL'],
        preferenceWeights: { alpha: 0.28, beta: 0.24, gamma: 0.28, delta: 0.2 },
        allocationStatus: 'unallocated',
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);
      const res = await request(app)
        .get('/api/students/me')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.student).toBeDefined();
      expect(res.body.student.email).toBe(studentA.email);
      expect(res.body.allotmentDetails).toBeDefined();
    });

    it('updates student academic profile and preference weights', async () => {
      const mockUser = {
        _id: studentA.userId,
        name: studentA.name,
        email: studentA.email,
        rollNumber: studentA.rollNumber,
        role: 'student',
        skills: ['Python'],
        targetCareerRoles: ['Software Engineer'],
        statementOfPurpose: 'Interested in AI systems',
        preferenceWeights: { alpha: 0.25, beta: 0.25, gamma: 0.25, delta: 0.25 },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .put('/api/students/me/profile')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          skills: ['Python', 'PyTorch', 'Data Science'],
          targetCareerRoles: ['Machine Learning Engineer'],
          statementOfPurpose: 'Passionate about deep learning architectures',
          codingProfileScore: 88,
          mathAptitudeScore: 92,
          preferenceWeights: {
            alpha: 0.35,
            beta: 0.25,
            gamma: 0.25,
            delta: 0.15,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('executes ML basket recommendation with standardized dual keys and source provenance', async () => {
      const mockMlResponse = {
        success: true,
        model_version: 'hybrid-tiet-cse-2026-v1.0',
        weights_applied: {
          alpha_content: 0.35,
          beta_collaborative: 0.25,
          gamma_expected_grade: 0.25,
          delta_career_alignment: 0.15,
        },
        recommendations: [
          {
            rank: 1,
            basket_id: 'EF_BASKET_01',
            name: 'Artificial Intelligence & Machine Learning',
            composite_match_score: 93.8,
            hybrid_score: 93.8,
            predicted_grade: 9.1,
            top_shap_reasons: [{ feature: 'UCS301', shap_impact: 0.45, direction: 'positive' }],
          },
        ],
      };

      jest.spyOn(axios.Axios.prototype, 'request').mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: mockMlResponse,
      });

      const res = await request(app)
        .post('/api/ml/recommend-baskets')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          cgpa: 8.85,
          core_grades: { UES103: 9.0, UCS301: 9.5 },
          skills: ['Python', 'PyTorch'],
          career_interest: 'Machine Learning Engineer',
          weights: { alpha: 0.35, beta: 0.25, gamma: 0.25, delta: 0.15 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Dual contract guarantee
      expect(res.body.recommendations).toBeDefined();
      expect(res.body.ranked_baskets).toBeDefined();
      expect(res.body.ranked_baskets[0].basket_id).toBe('EF_BASKET_01');
      // Provenance metadata
      expect(res.body.source).toBe('ml_service');
      expect(res.body.is_fallback).toBe(false);
      expect(res.body.model_version).toBe('hybrid-tiet-cse-2026-v1.0');
    });

    it('executes GBDT course grade prediction with expected grades and confidence intervals', async () => {
      const mockPredictionResponse = {
        success: true,
        model_version: 'grade-gbdt-2026-v1.0',
        model_type: 'hist_gradient_boosting',
        r2_score: 0.8151,
        rmse: 0.4146,
        course_predictions: [
          {
            course_code: 'UCS501',
            course_name: 'Machine Learning',
            basket_id: 'EF_BASKET_01',
            predicted_grade: 9.05,
            confidence_interval: [8.65, 9.45],
            confidence_level: 'High',
            historical_avg_grade: 8.2,
            key_factors: ['High performance in UCS301'],
          },
        ],
      };

      jest.spyOn(axios.Axios.prototype, 'request').mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: mockPredictionResponse,
      });

      const res = await request(app)
        .post('/api/ml/predict-performance')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          cgpa: 8.85,
          core_grades: { UCS301: 9.5, UES103: 9.0 },
          courseIds: ['UCS501'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.course_predictions)).toBe(true);
      expect(res.body.course_predictions[0].course_code).toBe('UCS501');
      expect(res.body.course_predictions[0].predicted_grade).toBe(9.05);
      expect(res.body.source).toBe('ml_service');
      expect(res.body.is_fallback).toBe(false);
    });

    it('retrieves peer cohort k-NN insights with similarity metrics', async () => {
      const mockCohortResponse = {
        success: true,
        cohort_size: 15,
        avg_cgpa: 8.82,
        top_selected_baskets: [
          { basket_id: 'EF_BASKET_01', name: 'AI & ML', count: 9, percentage: 60.0 },
          { basket_id: 'EF_BASKET_02', name: 'Cybersecurity', count: 6, percentage: 40.0 },
        ],
        similar_students_summary: [
          { similarity_score: 0.94, cgpa: 8.9, primary_basket: 'EF_BASKET_01' },
        ],
      };

      jest.spyOn(axios.Axios.prototype, 'request').mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: mockCohortResponse,
      });

      const res = await request(app)
        .post('/api/ml/peer-cohort-insights')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          cgpa: 8.85,
          core_grades: { UCS301: 9.5 },
          skills: ['Python', 'PyTorch'],
          career_interest: 'Machine Learning Engineer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cohort_size).toBe(15);
      expect(res.body.source).toBe('ml_service');
    });

    it('locks student counseling preferences with timestamp', async () => {
      const mockUser = {
        _id: studentA.userId,
        name: studentA.name,
        email: studentA.email,
        rollNumber: studentA.rollNumber,
        role: 'student',
        rankedBasketPreferences: [],
        rankedGenericPreferences: [],
        preferenceLockedAt: null,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(User, 'findById').mockResolvedValue(mockUser as any);

      const res = await request(app)
        .post('/api/students/me/preferences')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          rankedBasketPreferences: ['EF_BASKET_01', 'EF_BASKET_02'],
          rankedGenericPreferences: ['UCS501', 'UMA069'],
          lockSubmission: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUser.rankedBasketPreferences).toEqual(['EF_BASKET_01', 'EF_BASKET_02']);
      expect(mockUser.preferenceLockedAt).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('fetches student allotment results via GET /api/allocation/my-result', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        meritAllocationResults: [
          {
            studentId: studentA.userId,
            rollNumber: studentA.rollNumber,
            studentName: studentA.name,
            email: studentA.email,
            cgpa: 8.85,
            allocatedBasketId: 'EF_BASKET_01',
            allocatedBasketName: 'Artificial Intelligence & Machine Learning',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UCS501',
            allocatedGenericTitle: 'Machine Learning',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      jest.spyOn(CounselingRound, 'findOne').mockResolvedValue(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/my-result')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.allocation.allocated_basket_id).toBe('EF_BASKET_01');
      expect(res.body.allocation.allocation_status).toBe('allocated');
      expect(res.body.allocation.basket_preference_rank).toBe(1);
    });
  });

  // ==========================================================================
  // 3. Complete Administrative Workflow End-to-End
  // ==========================================================================
  describe('3. Complete Administrative Workflow End-to-End', () => {
    it('allows dean_admin to view student counseling roster', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        executedAt: new Date(),
        summaryStats: {
          totalEligibleStudents: 60,
          totalAllocated: 58,
          totalWaitlisted: 2,
        },
        basketCutoffs: [
          {
            code: 'EF_BASKET_01',
            name: 'AI & ML',
            seatCapacity: 20,
            enrolledCount: 20,
            waitlistCount: 2,
            openingCgpa: 9.85,
            closingCutoffCgpa: 8.65,
          },
        ],
        genericCutoffs: [],
        meritAllocationResults: [
          {
            studentId: studentA.userId,
            rollNumber: studentA.rollNumber,
            studentName: studentA.name,
            email: studentA.email,
            cgpa: 8.85,
            tieBreakerCoreGpa: 9.25,
            allocatedBasketId: 'EF_BASKET_01',
            allocatedBasketName: 'Artificial Intelligence & Machine Learning',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UCS501',
            allocatedGenericTitle: 'Machine Learning',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      jest.spyOn(CounselingRound, 'findOne').mockResolvedValue(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/roster?roundId=ROUND_2026_SEM5_R1')
        .set('Authorization', `Bearer ${deanAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.roster)).toBe(true);
      expect(res.body.roster[0].rollNumber).toBe(studentA.rollNumber);
      expect(res.body.roster[0].allocatedBasketId).toBe('EF_BASKET_01');
    });

    it('allows dean_admin to modify seat matrix capacity', async () => {
      jest.spyOn(Basket, 'findOneAndUpdate').mockResolvedValue({
        basketId: 'EF_BASKET_01',
        seatCapacity: 140,
      } as any);

      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({
          targetType: 'basket',
          code: 'EF_BASKET_01',
          seatCapacity: 140,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/updated basket EF_BASKET_01 seat capacity to 140/i);
    });

    it('allows dean_admin to execute database-backed merit seat allocation engine', async () => {
      const mockEngineResult = {
        roundId: 'ROUND_2026_SEM5_R1',
        summaryStats: {
          totalEligibleStudents: 60,
          totalAllocated: 58,
          totalWaitlisted: 2,
          firstChoiceBasketPct: 78.5,
          topThreeBasketPct: 96.6,
        },
        basketCutoffs: [
          {
            code: 'EF_BASKET_01',
            name: 'AI & ML',
            seatCapacity: 20,
            enrolledCount: 20,
            waitlistCount: 2,
            openingCgpa: 9.85,
            closingCutoffCgpa: 8.65,
          },
        ],
        meritAllocationResults: [
          {
            studentId: studentA.userId,
            rollNumber: studentA.rollNumber,
            studentName: studentA.name,
            email: studentA.email,
            cgpa: 8.85,
            tieBreakerCoreGpa: 9.25,
            allocatedBasketId: 'EF_BASKET_01',
            allocatedBasketName: 'AI & ML',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UCS501',
            allocatedGenericTitle: 'Machine Learning',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      jest.spyOn(services, 'runMeritSeatAllocationEngine').mockResolvedValue(mockEngineResult as any);

      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({
          roundId: 'ROUND_2026_SEM5_R1',
          batchYear: 2024,
          currentSemester: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.total_applicants).toBe(60);
      expect(res.body.summary.total_allocated).toBe(58);
      expect(res.body.basket_stats[0].basket_id).toBe('EF_BASKET_01');
      expect(res.body.roster.length).toBe(1);
    });

    it('allows dean_admin to export formatted allotment CSV with institutional headers', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        summaryStats: { totalEligibleStudents: 1, totalAllocated: 1, totalWaitlisted: 0 },
        basketCutoffs: [],
        genericCutoffs: [],
        meritAllocationResults: [
          {
            studentId: studentA.userId,
            rollNumber: studentA.rollNumber,
            studentName: studentA.name,
            email: studentA.email,
            cgpa: 8.85,
            tieBreakerCoreGpa: 9.25,
            allocatedBasketId: 'EF_BASKET_01',
            allocatedBasketName: 'AI & ML',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UCS501',
            allocatedGenericTitle: 'Machine Learning',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      jest.spyOn(CounselingRound, 'findOne').mockResolvedValue(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/export-csv?roundId=ROUND_2026_SEM5_R1')
        .set('Authorization', `Bearer ${deanAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment; filename=/);
      expect(res.text).toContain('Merit_Rank,Roll_Number,Student_Name');
      expect(res.text).toContain(studentA.rollNumber);
    });
  });

  // ==========================================================================
  // 4. Edge Cases, Attack Vectors & Security Hardening
  // ==========================================================================
  describe('4. Edge Cases & Security Attack Hardening', () => {
    it('blocks student from running seat allocation engine with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ roundId: 'ROUND_2026_SEM5_R1' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient.*privileges|forbidden/i);
    });

    it('blocks student from modifying seat matrix with 403 Forbidden', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          targetType: 'basket',
          code: 'EF_BASKET_01',
          seatCapacity: 200,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient.*privileges|forbidden/i);
    });

    it('blocks student from accessing administrative allotment roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/allocation/roster?roundId=ROUND_2026_SEM5_R1')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient.*privileges|forbidden/i);
    });

    it('blocks student from exporting allotment CSV with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/allocation/export-csv?roundId=ROUND_2026_SEM5_R1')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient.*privileges|forbidden/i);
    });

    it('prevents IDOR: Student A cannot view Student B allotment record', async () => {
      const res = await request(app)
        .get(`/api/allocation/student/${studentB.rollNumber}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied.*strictly permitted.*own/i);
    });

    it('rejects invalid seat capacity outside permitted range with 400 Bad Request', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({
          targetType: 'basket',
          code: 'EF_BASKET_01',
          seatCapacity: 2, // Minimum allowed is 5
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/seatCapacity must be at least 5/i);
    });

    it('rejects preference locking when empty basket preference list is submitted', async () => {
      const res = await request(app)
        .post('/api/students/me/preferences')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          rankedBasketPreferences: [], // Invalid: min 1 required
          rankedGenericPreferences: ['UCS501'],
          lockSubmission: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('gracefully degrades with catalog heuristics fallback if ML service is unreachable', async () => {
      // Simulate ML service timeout / connection refused
      jest.spyOn(axios.Axios.prototype, 'request').mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const res = await request(app)
        .post('/api/ml/recommend-baskets')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          cgpa: 8.85,
          core_grades: { UCS301: 9.5 },
          skills: ['Python'],
          career_interest: 'Machine Learning',
        });

      expect(res.status).toBe(200);
      expect(res.body.is_fallback).toBe(true);
      expect(res.body.source).toBe('local_fallback');
      expect(res.body.ranked_baskets.length).toBeGreaterThan(0);
    });
  });
});
