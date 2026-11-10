import { Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { z } from 'zod';
import { EnvConfig } from '../config/env';
import { requireAuth, requireRole } from '../middlewares';
import { Basket, CounselingRound, Course, ICounselingRound } from '../models';
import {
  formatAllotmentRosterAsCSV,
  recordAuditLog,
  runMeritSeatAllocationEngine,
} from '../services';

const logger = pino({ name: 'allocation-routes' });

// ============================================================================
// Input Validation Schemas
// ============================================================================

const runAllocationSchema = z.object({
  roundId: z
    .string()
    .trim()
    .min(3, 'roundId must be at least 3 characters')
    .max(64, 'roundId must not exceed 64 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'roundId must contain only alphanumeric characters, underscores, and dashes')
    .default('ROUND_2026_SEM5_R1'),
  batchYear: z.coerce.number().int().min(2020).max(2035).default(2024),
  currentSemester: z.coerce.number().int().min(1).max(8).default(4),
  overrideSeatCapPerBasket: z.coerce
    .number()
    .int()
    .min(5, 'overrideSeatCapPerBasket must be at least 5 seats')
    .max(500, 'overrideSeatCapPerBasket cannot exceed 500 seats')
    .optional(),
  overrideSeatCapPerGeneric: z.coerce
    .number()
    .int()
    .min(5, 'overrideSeatCapPerGeneric must be at least 5 seats')
    .max(500, 'overrideSeatCapPerGeneric cannot exceed 500 seats')
    .optional(),
});

const roundQuerySchema = z.object({
  roundId: z
    .string()
    .trim()
    .min(3, 'roundId must be at least 3 characters')
    .max(64, 'roundId must not exceed 64 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'roundId must contain only alphanumeric characters, underscores, and dashes')
    .default('ROUND_2026_SEM5_R1'),
});

const studentParamSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, 'studentId cannot be empty')
    .max(64, 'studentId must not exceed 64 characters')
    .regex(/^[A-Za-z0-9_@.-]+$/, 'studentId contains invalid characters'),
});

const updateSeatMatrixSchema = z.object({
  targetType: z.enum(['basket', 'course'], {
    errorMap: () => ({ message: 'targetType must be either "basket" or "course"' }),
  }),
  code: z
    .string()
    .trim()
    .min(2, 'code must be at least 2 characters')
    .max(32, 'code must not exceed 32 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'code contains invalid characters'),
  seatCapacity: z.coerce
    .number()
    .int()
    .min(5, 'seatCapacity must be at least 5 seats')
    .max(1000, 'seatCapacity cannot exceed 1000 seats'),
});

export function createAllocationRouter(env: EnvConfig): Router {
  const router = Router();
  const authGuard = requireAuth(env.JWT_ACCESS_SECRET);

  // --------------------------------------------------------------------------
  // Tiered Rate Limiters for Seat Allocation Endpoints
  // --------------------------------------------------------------------------
  const allocationExecutionLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: 20, // Max 20 execution attempts per window to prevent DB starvation
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Allocation execution rate limit exceeded. Please wait before triggering another merit allocation run.',
    },
  });

  const allocationQueryLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: 120, // Max 120 queries per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Allocation query rate limit exceeded. Please try again shortly.',
    },
  });

  router.use(allocationQueryLimiter);

  // --------------------------------------------------------------------------
  // 1. Administrative Seat Allocation Engine Execution (Dean Admin ONLY)
  // --------------------------------------------------------------------------
  const handleRunAllocation = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const params = runAllocationSchema.parse(req.body || {});
      const executedByEmail = req.user?.email || 'dean.academic@thapar.edu';

      logger.info({ params, executedByEmail }, 'Triggering database-backed seat allocation engine');
      const round = await runMeritSeatAllocationEngine({
        ...params,
        executedByEmail,
      });

      const executionTimeMs = Date.now() - startTime;

      const summary = {
        total_applicants: round.summaryStats.totalEligibleStudents,
        total_allocated: round.summaryStats.totalAllocated,
        total_waitlisted: round.summaryStats.totalWaitlisted,
        baskets_full: round.basketCutoffs.filter((b) => b.enrolledCount >= b.seatCapacity).length,
        first_choice_pct: round.summaryStats.firstChoiceBasketPct,
        top_three_pct: round.summaryStats.topThreeBasketPct,
      };

      const basketStats = round.basketCutoffs.map((b) => ({
        basket_id: b.code,
        name: b.name,
        capacity: b.seatCapacity,
        allotted: b.enrolledCount,
        waitlist: b.waitlistCount,
        fill_rate: b.seatCapacity > 0 ? Math.round((b.enrolledCount / b.seatCapacity) * 100) : 0,
        opening_cgpa: b.openingCgpa,
        cutoff_cgpa: b.closingCutoffCgpa,
      }));

      const roster = round.meritAllocationResults.map((r, idx) => ({
        merit_rank: idx + 1,
        student_id: r.studentId,
        roll_no: r.rollNumber,
        student_name: r.studentName,
        email: r.email,
        cgpa: r.cgpa,
        tie_breaker_gpa: r.tieBreakerCoreGpa,
        allocated_basket: r.allocatedBasketId,
        allocated_basket_name: r.allocatedBasketName,
        preference_rank: r.basketPreferenceRank,
        allocated_generic_code: r.allocatedGenericCourseCode,
        allocated_generic_title: r.allocatedGenericTitle,
        generic_preference_rank: r.genericPreferenceRank,
        status: r.allocationStatus,
        waitlist_rank: r.waitlistRank,
      }));

      await recordAuditLog({
        actorId: req.user?.userId || 'dean_admin',
        actorEmail: executedByEmail,
        actorRole: req.user?.role || 'dean_admin',
        action: 'DATABASE_SEAT_ALLOCATION_RUN',
        req,
        metadata: {
          roundId: round.roundId,
          executionTimeMs,
          summary,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Official TIET CGPA Merit-Based Seat Allocation executed successfully.',
        execution_time_ms: executionTimeMs,
        summary,
        basket_stats: basketStats,
        roster,
        round,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
        });
        return;
      }
      logger.error({ err: error.message }, 'Seat allocation execution error');
      res.status(500).json({
        success: false,
        error: 'Seat allocation execution failed due to an internal server error.',
      });
    }
  };

  // POST /api/allocation/run and POST /api/allocation/execute (Dean Admin ONLY)
  router.post(
    '/run',
    allocationExecutionLimiter,
    authGuard,
    requireRole(['dean_admin']),
    handleRunAllocation
  );

  router.post(
    '/execute',
    allocationExecutionLimiter,
    authGuard,
    requireRole(['dean_admin']),
    handleRunAllocation
  );

  // --------------------------------------------------------------------------
  // 2. Complete Student Merit Roster & CSV Export (Admin & Faculty Advisors ONLY)
  // --------------------------------------------------------------------------

  // GET /api/allocation/roster
  router.get(
    '/roster',
    authGuard,
    requireRole(['dean_admin', 'faculty_advisor']),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { roundId } = roundQuerySchema.parse(req.query);
        let round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

        if (!round || round.meritAllocationResults.length === 0) {
          round = await runMeritSeatAllocationEngine({
            roundId,
            executedByEmail: req.user?.email || 'dean.academic@thapar.edu',
          });
        }

        res.status(200).json({
          success: true,
          roundId: round.roundId,
          title: round.title,
          executedAt: round.executedAt,
          summary: {
            total_applicants: round.summaryStats.totalEligibleStudents,
            total_allocated: round.summaryStats.totalAllocated,
            total_waitlisted: round.summaryStats.totalWaitlisted,
            baskets_full: round.basketCutoffs.filter((b) => b.enrolledCount >= b.seatCapacity).length,
          },
          basket_stats: round.basketCutoffs,
          generic_stats: round.genericCutoffs,
          roster: round.meritAllocationResults,
          round,
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            success: false,
            error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
          });
          return;
        }
        logger.error({ err: error.message }, 'Failed to retrieve allotment roster');
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve allotment roster',
        });
      }
    }
  );

  // GET /api/allocation/export-csv - Stream direct CSV export
  router.get(
    '/export-csv',
    authGuard,
    requireRole(['dean_admin', 'faculty_advisor']),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { roundId } = roundQuerySchema.parse(req.query);
        let round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

        if (!round || round.meritAllocationResults.length === 0) {
          round = await runMeritSeatAllocationEngine({
            roundId,
            executedByEmail: req.user?.email || 'dean.academic@thapar.edu',
          });
        }

        const csvString = formatAllotmentRosterAsCSV(round);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="TIET_CSE_Allotment_Roster_${roundId}.csv"`
        );
        res.status(200).send(csvString);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            success: false,
            error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
          });
          return;
        }
        logger.error({ err: error.message }, 'Failed to export allotment CSV');
        res.status(500).json({
          success: false,
          error: 'Failed to export allotment CSV',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // 3. Allocation Settings & Seat Matrix Modification (Dean Admin ONLY)
  // --------------------------------------------------------------------------
  router.put(
    '/seat-matrix',
    authGuard,
    requireRole(['dean_admin']),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { targetType, code, seatCapacity } = updateSeatMatrixSchema.parse(req.body);

        if (targetType === 'basket') {
          const basket = await Basket.findOneAndUpdate(
            { basketId: code },
            { $set: { seatCapacity } },
            { new: true }
          );
          if (!basket) {
            res.status(404).json({ success: false, error: `Basket ${code} not found in curriculum database.` });
            return;
          }
        } else {
          const course = await Course.findOneAndUpdate(
            { courseCode: code },
            { $set: { seatCapacity } },
            { new: true }
          );
          if (!course) {
            res.status(404).json({ success: false, error: `Course ${code} not found in curriculum database.` });
            return;
          }
        }

        await recordAuditLog({
          actorId: req.user?.userId || 'dean_admin',
          actorEmail: req.user?.email || 'dean.academic@thapar.edu',
          actorRole: req.user?.role || 'dean_admin',
          action: 'SEAT_MATRIX_UPDATED',
          req,
          metadata: { targetType, code, seatCapacity },
        });

        res.status(200).json({
          success: true,
          message: `Successfully updated ${targetType} ${code} seat capacity to ${seatCapacity}.`,
        });
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            success: false,
            error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
          });
          return;
        }
        logger.error({ err: error.message }, 'Failed to update seat matrix');
        res.status(500).json({
          success: false,
          error: 'Failed to update seat matrix',
        });
      }
    }
  );

  // --------------------------------------------------------------------------
  // 4. Permitted Seat Availability & Cutoffs (Authenticated Institutional Users)
  // Returns strictly aggregate statistics; ZERO student names, roll numbers, or personal rankings.
  // --------------------------------------------------------------------------
  const handleGetAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { roundId } = roundQuerySchema.parse(req.query);
      const round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

      if (!round) {
        res.status(404).json({
          success: false,
          error: `Counseling round ${roundId} not found.`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        roundId: round.roundId,
        title: round.title,
        executedAt: round.executedAt,
        summary: {
          total_applicants: round.summaryStats.totalEligibleStudents,
          total_allocated: round.summaryStats.totalAllocated,
          total_waitlisted: round.summaryStats.totalWaitlisted,
          baskets_full: round.basketCutoffs.filter((b) => b.enrolledCount >= b.seatCapacity).length,
          first_choice_pct: round.summaryStats.firstChoiceBasketPct,
          top_three_pct: round.summaryStats.topThreeBasketPct,
        },
        basket_stats: round.basketCutoffs.map((b) => ({
          basket_id: b.code,
          name: b.name,
          capacity: b.seatCapacity,
          allotted: b.enrolledCount,
          waitlist: b.waitlistCount,
          fill_rate: b.seatCapacity > 0 ? Math.round((b.enrolledCount / b.seatCapacity) * 100) : 0,
          opening_cgpa: b.openingCgpa,
          cutoff_cgpa: b.closingCutoffCgpa,
        })),
        generic_stats: round.genericCutoffs.map((g) => ({
          course_code: g.code,
          title: g.name,
          capacity: g.seatCapacity,
          allotted: g.enrolledCount,
          waitlist: g.waitlistCount,
          opening_cgpa: g.openingCgpa,
          cutoff_cgpa: g.closingCutoffCgpa,
        })),
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
        });
        return;
      }
      logger.error({ err: error.message }, 'Failed to retrieve cutoff availability');
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve seat availability information.',
      });
    }
  };

  router.get('/cutoffs', authGuard, handleGetAvailability);
  router.get('/availability', authGuard, handleGetAvailability);

  // --------------------------------------------------------------------------
  // 5. Student Self-Service Allocation Result (Owner-Only)
  // --------------------------------------------------------------------------
  router.get('/my-result', authGuard, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { roundId } = roundQuerySchema.parse(req.query);
      const round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

      if (!round || round.meritAllocationResults.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No allocation results published for this counseling round yet.',
        });
        return;
      }

      // Match student entry strictly by authenticated user token identity
      const entry = round.meritAllocationResults.find(
        (r) =>
          (user.rollNumber && r.rollNumber === user.rollNumber) ||
          r.studentId === user.userId ||
          r.email.toLowerCase() === user.email.toLowerCase()
      );

      if (!entry) {
        res.status(404).json({
          success: false,
          error: 'No allocation record found for your student profile in this round.',
        });
        return;
      }

      const meritRank =
        round.meritAllocationResults.findIndex((r) => r.rollNumber === entry.rollNumber) + 1;

      res.status(200).json({
        success: true,
        roundId: round.roundId,
        title: round.title,
        allocation: {
          merit_rank: meritRank,
          student_id: entry.studentId,
          roll_number: entry.rollNumber,
          student_name: entry.studentName,
          cgpa: entry.cgpa,
          allocated_basket_id: entry.allocatedBasketId,
          allocated_basket_name: entry.allocatedBasketName,
          basket_preference_rank: entry.basketPreferenceRank,
          allocated_generic_course_code: entry.allocatedGenericCourseCode,
          allocated_generic_title: entry.allocatedGenericTitle,
          generic_preference_rank: entry.genericPreferenceRank,
          allocation_status: entry.allocationStatus,
          waitlist_rank: entry.waitlistRank,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
        });
        return;
      }
      logger.error({ err: error.message }, 'Failed to retrieve personal allotment result');
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve allocation result.',
      });
    }
  });

  // --------------------------------------------------------------------------
  // 6. Student By ID (IDOR-Protected: Students can ONLY query themselves)
  // Admins & Faculty Advisors can query any student.
  // --------------------------------------------------------------------------
  router.get('/student/:studentId', authGuard, async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { studentId } = studentParamSchema.parse(req.params);
      const { roundId } = roundQuerySchema.parse(req.query);

      // IDOR Protection: Students are forbidden from viewing any other student's record
      if (user.role === 'student') {
        const isSelf =
          user.userId === studentId ||
          (user.rollNumber && user.rollNumber === studentId) ||
          user.email.toLowerCase() === studentId.toLowerCase();

        if (!isSelf) {
          res.status(403).json({
            success: false,
            error: 'Access denied: Students are strictly permitted to access only their own allocation record.',
          });
          return;
        }
      }

      const round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

      if (!round || round.meritAllocationResults.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No allocation results published for this counseling round yet.',
        });
        return;
      }

      const entry = round.meritAllocationResults.find(
        (r) =>
          r.studentId === studentId ||
          r.rollNumber === studentId ||
          r.email.toLowerCase() === studentId.toLowerCase()
      );

      if (!entry) {
        res.status(404).json({
          success: false,
          error: `No allocation record found for student identifier "${studentId}".`,
        });
        return;
      }

      const meritRank =
        round.meritAllocationResults.findIndex((r) => r.rollNumber === entry.rollNumber) + 1;

      res.status(200).json({
        success: true,
        roundId: round.roundId,
        allocation: {
          merit_rank: meritRank,
          student_id: entry.studentId,
          roll_number: entry.rollNumber,
          student_name: entry.studentName,
          email: entry.email,
          cgpa: entry.cgpa,
          allocated_basket_id: entry.allocatedBasketId,
          allocated_basket_name: entry.allocatedBasketName,
          basket_preference_rank: entry.basketPreferenceRank,
          allocated_generic_course_code: entry.allocatedGenericCourseCode,
          allocated_generic_title: entry.allocatedGenericTitle,
          generic_preference_rank: entry.genericPreferenceRank,
          allocation_status: entry.allocationStatus,
          waitlist_rank: entry.waitlistRank,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed: ' + error.issues.map((i) => i.message).join('; '),
        });
        return;
      }
      logger.error({ err: error.message }, 'Failed to retrieve student allotment result');
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve student allocation result.',
      });
    }
  });

  return router;
}
