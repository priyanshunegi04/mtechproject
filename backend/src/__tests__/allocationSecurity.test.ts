import request from 'supertest';
import { validateEnv } from '../config/env';
import { createExpressApp } from '../index';
import { signAccessToken } from '../middlewares';
import { Basket, CounselingRound, Course } from '../models';
import * as services from '../services';

describe('Seat Allocation API Security, RBAC & IDOR Audit Tests', () => {
  const env = validateEnv();
  const app = createExpressApp(env);

  // Reusable token helpers utilizing the application's actual JWT verification secret
  const studentAToken = signAccessToken(
    {
      userId: 'usr_aarav_01',
      email: 'aarav.sharma@thapar.edu',
      name: 'Aarav Sharma',
      role: 'student',
      rollNumber: '1024030012',
    },
    env.JWT_ACCESS_SECRET
  );

  const studentBToken = signAccessToken(
    {
      userId: 'usr_meera_02',
      email: 'meera.kaur@thapar.edu',
      name: 'Meera Kaur',
      role: 'student',
      rollNumber: '1024030045',
    },
    env.JWT_ACCESS_SECRET
  );

  const facultyAdvisorToken = signAccessToken(
    {
      userId: 'usr_advisor_01',
      email: 'rajesh.kumar@thapar.edu',
      name: 'Dr. Rajesh Kumar',
      role: 'faculty_advisor',
    },
    env.JWT_ACCESS_SECRET
  );

  const deanAdminToken = signAccessToken(
    {
      userId: 'usr_dean_01',
      email: 'dean.academic@thapar.edu',
      name: 'Prof. (Dr.) Vikramaditya Singh',
      role: 'dean_admin',
    },
    env.JWT_ACCESS_SECRET
  );

  // --------------------------------------------------------------------------
  // 1. Unauthenticated Requests (Must Return 401 Unauthorized)
  // --------------------------------------------------------------------------
  describe('1. Unauthenticated Access Protection', () => {
    it('POST /api/allocation/run rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .send({ overrideSeatCapPerBasket: 120 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it('POST /api/allocation/execute rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/allocation/execute').send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/allocation/roster rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/allocation/roster');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/allocation/export-csv rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/allocation/export-csv');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PUT /api/allocation/seat-matrix rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .send({ targetType: 'basket', code: 'EF_BASKET_01', seatCapacity: 120 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/allocation/my-result rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/allocation/my-result');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/allocation/student/:studentId rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/allocation/student/1024030012');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/allocation/cutoffs rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/allocation/cutoffs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Role-Based Access Control (RBAC): Student attempting Admin Operations
  // --------------------------------------------------------------------------
  describe('2. Student Role Authorization & Privilege Escalation Defense', () => {
    it('rejects student attempting to execute seat allocation (POST /api/allocation/run) with 403', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ overrideSeatCapPerBasket: 100 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient institutional privileges/i);
      expect(res.body.error).toMatch(/dean_admin/i);
    });

    it('rejects student attempting to view complete student roster (GET /api/allocation/roster) with 403', async () => {
      const res = await request(app)
        .get('/api/allocation/roster')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient institutional privileges/i);
    });

    it('rejects student attempting to export student allocation CSV (GET /api/allocation/export-csv) with 403', async () => {
      const res = await request(app)
        .get('/api/allocation/export-csv')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient institutional privileges/i);
    });

    it('rejects student attempting to modify seat matrix capacities (PUT /api/allocation/seat-matrix) with 403', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ targetType: 'basket', code: 'EF_BASKET_01', seatCapacity: 150 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient institutional privileges/i);
    });
  });

  // --------------------------------------------------------------------------
  // 3. Faculty Advisor Role Scope Enforcement
  // --------------------------------------------------------------------------
  describe('3. Faculty Advisor Role Boundary Tests', () => {
    it('prevents faculty advisor from triggering seat allocation (POST /api/allocation/run) with 403', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${facultyAdvisorToken}`)
        .send({ overrideSeatCapPerBasket: 100 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/insufficient institutional privileges/i);
    });

    it('prevents faculty advisor from altering seat matrix (PUT /api/allocation/seat-matrix) with 403', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${facultyAdvisorToken}`)
        .send({ targetType: 'basket', code: 'EF_BASKET_01', seatCapacity: 120 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('grants faculty advisor access to view full student allotment roster (GET /api/allocation/roster)', async () => {
      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce({
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE 2026 Semester V Counseling Round 1',
        executedAt: new Date(),
        summaryStats: {
          totalEligibleStudents: 60,
          totalAllocated: 60,
          totalWaitlisted: 0,
        },
        basketCutoffs: [],
        genericCutoffs: [],
        meritAllocationResults: [
          {
            studentId: 'STU_1024030012',
            rollNumber: '1024030012',
            studentName: 'Aarav Sharma',
            email: 'aarav.sharma@thapar.edu',
            cgpa: 9.12,
            tieBreakerCoreGpa: 9.2,
            allocatedBasketId: 'EF_BASKET_09',
            allocatedBasketName: 'Conversational AI',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UMA069',
            allocatedGenericTitle: 'Graph Theory',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      } as any);

      const res = await request(app)
        .get('/api/allocation/roster')
        .set('Authorization', `Bearer ${facultyAdvisorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roundId).toBe('ROUND_2026_SEM5_R1');
      expect(Array.isArray(res.body.roster)).toBe(true);

      findOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Authorized Dean Admin Operations & Allocation Execution
  // --------------------------------------------------------------------------
  describe('4. Authorized Dean Admin Operations', () => {
    it('executes successful seat allocation when requested by authorized Dean Admin (POST /api/allocation/run)', async () => {
      const mockExecutedRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE 2026 Semester V Counseling Round 1',
        executedAt: new Date(),
        executedByEmail: 'dean.academic@thapar.edu',
        summaryStats: {
          totalEligibleStudents: 60,
          totalLockedPreferences: 60,
          totalAllocated: 60,
          totalWaitlisted: 0,
          firstChoiceBasketPct: 92,
          topThreeBasketPct: 100,
        },
        basketCutoffs: [
          {
            code: 'EF_BASKET_09',
            name: 'Conversational AI',
            seatCapacity: 120,
            enrolledCount: 60,
            waitlistCount: 0,
            openingCgpa: 9.45,
            closingCutoffCgpa: 8.38,
          },
        ],
        genericCutoffs: [],
        meritAllocationResults: [
          {
            studentId: 'usr_aarav_01',
            rollNumber: '1024030012',
            studentName: 'Aarav Sharma',
            email: 'aarav.sharma@thapar.edu',
            cgpa: 9.12,
            tieBreakerCoreGpa: 9.2,
            allocatedBasketId: 'EF_BASKET_09',
            allocatedBasketName: 'Conversational AI',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UMA069',
            allocatedGenericTitle: 'Graph Theory',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      const runEngineSpy = jest
        .spyOn(services, 'runMeritSeatAllocationEngine')
        .mockResolvedValueOnce(mockExecutedRound as any);

      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({
          overrideSeatCapPerBasket: 120,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.summary.total_allocated).toBe(60);
      expect(Array.isArray(res.body.basket_stats)).toBe(true);
      expect(Array.isArray(res.body.roster)).toBe(true);
      expect(res.body.roster[0].roll_no).toBe('1024030012');

      runEngineSpy.mockRestore();
    });

    it('allows Dean Admin to export allotment roster CSV (GET /api/allocation/export-csv)', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        executedAt: new Date(),
        summaryStats: {
          totalEligibleStudents: 1,
          totalAllocated: 1,
          totalWaitlisted: 0,
        },
        meritAllocationResults: [
          {
            meritRank: 1,
            studentId: 'usr_aarav_01',
            rollNumber: '1024030012',
            studentName: 'Aarav Sharma',
            email: 'aarav.sharma@thapar.edu',
            cgpa: 9.12,
            tieBreakerCoreGpa: 9.2,
            allocatedBasketId: 'EF_BASKET_09',
            allocatedBasketName: 'Conversational AI',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UMA069',
            allocatedGenericTitle: 'Graph Theory',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/export-csv')
        .set('Authorization', `Bearer ${deanAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.text).toMatch(/Roll_Number/i);
      expect(res.text).toMatch(/1024030012/);

      findOneSpy.mockRestore();
    });

    it('allows Dean Admin to modify seat matrix capacity (PUT /api/allocation/seat-matrix)', async () => {
      const updateBasketSpy = jest.spyOn(Basket, 'findOneAndUpdate').mockResolvedValueOnce({
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
      expect(res.body.message).toMatch(/successfully updated basket EF_BASKET_01 seat capacity to 140/i);

      updateBasketSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Insecure Direct Object Reference (IDOR) & Student Privacy Isolation
  // --------------------------------------------------------------------------
  describe('5. Insecure Direct Object Reference (IDOR) Prevention', () => {
    it('blocks Student A from accessing Student B allocation record via rollNumber tampering with 403', async () => {
      const res = await request(app)
        .get('/api/allocation/student/1024030045') // Student B roll number
        .set('Authorization', `Bearer ${studentAToken}`); // Student A token

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied.*strictly permitted.*own/i);
    });

    it('blocks Student A from accessing Student B allocation record via studentId tampering with 403', async () => {
      const res = await request(app)
        .get('/api/allocation/student/usr_meera_02') // Student B userId
        .set('Authorization', `Bearer ${studentAToken}`); // Student A token

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/access denied.*strictly permitted.*own/i);
    });

    it('permits Student A to access their own allocation record via GET /api/allocation/student/:studentId', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        meritAllocationResults: [
          {
            studentId: 'usr_aarav_01',
            rollNumber: '1024030012',
            studentName: 'Aarav Sharma',
            email: 'aarav.sharma@thapar.edu',
            cgpa: 9.12,
            allocatedBasketId: 'EF_BASKET_09',
            allocatedBasketName: 'Conversational AI',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UMA069',
            allocatedGenericTitle: 'Graph Theory',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/student/1024030012')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.allocation.roll_number).toBe('1024030012');
      expect(res.body.allocation.allocated_basket_id).toBe('EF_BASKET_09');

      findOneSpy.mockRestore();
    });

    it('permits Student A to access their own allocation record via GET /api/allocation/my-result', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        meritAllocationResults: [
          {
            studentId: 'usr_aarav_01',
            rollNumber: '1024030012',
            studentName: 'Aarav Sharma',
            email: 'aarav.sharma@thapar.edu',
            cgpa: 9.12,
            allocatedBasketId: 'EF_BASKET_09',
            allocatedBasketName: 'Conversational AI',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UMA069',
            allocatedGenericTitle: 'Graph Theory',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/my-result')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.allocation.roll_number).toBe('1024030012');
      expect(res.body.allocation.allocated_basket_id).toBe('EF_BASKET_09');

      findOneSpy.mockRestore();
    });

    it('permits Dean Admin to look up any student record without IDOR restrictions', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        meritAllocationResults: [
          {
            studentId: 'usr_meera_02',
            rollNumber: '1024030045',
            studentName: 'Meera Kaur',
            email: 'meera.kaur@thapar.edu',
            cgpa: 8.45,
            allocatedBasketId: 'EF_BASKET_07',
            allocatedBasketName: 'DevOps & Cloud',
            basketPreferenceRank: 1,
            allocatedGenericCourseCode: 'UHU018',
            allocatedGenericTitle: 'Corporate Finance',
            genericPreferenceRank: 1,
            allocationStatus: 'allocated',
            waitlistRank: null,
          },
        ],
      };

      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/student/1024030045')
        .set('Authorization', `Bearer ${deanAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.allocation.roll_number).toBe('1024030045');

      findOneSpy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // 6. Input Validation & Parameter Sanitization
  // --------------------------------------------------------------------------
  describe('6. Input Validation & Strict Schema Checks', () => {
    it('rejects POST /api/allocation/run with invalid overrideSeatCapPerBasket (out of bounds) with 400', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({ overrideSeatCapPerBasket: -10 }); // min is 5

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('rejects POST /api/allocation/run with malformed roundId containing special characters with 400', async () => {
      const res = await request(app)
        .post('/api/allocation/run')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({ roundId: 'ROUND;DROP TABLE;' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('rejects PUT /api/allocation/seat-matrix with invalid targetType with 400', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({ targetType: 'department', code: 'EF_BASKET_01', seatCapacity: 120 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('rejects PUT /api/allocation/seat-matrix with seatCapacity below minimum with 400', async () => {
      const res = await request(app)
        .put('/api/allocation/seat-matrix')
        .set('Authorization', `Bearer ${deanAdminToken}`)
        .send({ targetType: 'basket', code: 'EF_BASKET_01', seatCapacity: 2 }); // min is 5

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });

    it('rejects GET /api/allocation/student/:studentId with malformed identifier with 400', async () => {
      const res = await request(app)
        .get('/api/allocation/student/bad student id with spaces!')
        .set('Authorization', `Bearer ${deanAdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/validation failed/i);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Permitted Seat Availability & Cutoffs (No PII Leakage)
  // --------------------------------------------------------------------------
  describe('7. Public Seat Availability & PII Protection', () => {
    it('returns aggregate basket cutoffs to authenticated student without leaking student roster or PII', async () => {
      const mockRound = {
        roundId: 'ROUND_2026_SEM5_R1',
        title: 'B.E. CSE Counseling Round 1',
        executedAt: new Date(),
        summaryStats: {
          totalEligibleStudents: 60,
          totalAllocated: 60,
          totalWaitlisted: 0,
          firstChoiceBasketPct: 92,
          topThreeBasketPct: 100,
        },
        basketCutoffs: [
          {
            code: 'EF_BASKET_09',
            name: 'Conversational AI',
            seatCapacity: 120,
            enrolledCount: 96,
            waitlistCount: 0,
            openingCgpa: 9.45,
            closingCutoffCgpa: 8.38,
          },
        ],
        genericCutoffs: [],
        meritAllocationResults: [
          {
            studentId: 'SECRET_ID_1',
            studentName: 'Private Student Name',
            email: 'private@thapar.edu',
            cgpa: 9.8,
          },
        ],
      };

      const findOneSpy = jest.spyOn(CounselingRound, 'findOne').mockResolvedValueOnce(mockRound as any);

      const res = await request(app)
        .get('/api/allocation/cutoffs')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roundId).toBe('ROUND_2026_SEM5_R1');
      expect(Array.isArray(res.body.basket_stats)).toBe(true);
      expect(res.body.basket_stats[0].basket_id).toBe('EF_BASKET_09');

      // CRITICAL SECURITY ASSERTION: No personal student roster or student identities in public cutoffs
      expect(res.body.roster).toBeUndefined();
      expect(res.body.meritAllocationResults).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/Private Student Name/);
      expect(JSON.stringify(res.body)).not.toMatch(/private@thapar\.edu/);

      findOneSpy.mockRestore();
    });
  });
});
