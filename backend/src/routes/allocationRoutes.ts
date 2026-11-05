import { Request, Response, Router } from 'express';
import pino from 'pino';
import { z } from 'zod';
import { EnvConfig } from '../config/env';
import { CounselingRound, ICounselingRound } from '../models';
import { formatAllotmentRosterAsCSV, recordAuditLog, runMeritSeatAllocationEngine } from '../services';

const logger = pino({ name: 'allocation-routes' });

const runAllocationSchema = z.object({
  roundId: z.string().default('ROUND_2026_SEM5_R1'),
  batchYear: z.coerce.number().int().default(2024),
  currentSemester: z.coerce.number().int().default(4),
  overrideSeatCapPerBasket: z.coerce.number().int().min(1).max(1000).optional(),
  overrideSeatCapPerGeneric: z.coerce.number().int().min(1).max(1000).optional(),
});

export function createAllocationRouter(_env: EnvConfig): Router {
  const router = Router();

  const handleRunAllocation = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const params = runAllocationSchema.parse(req.body || {});
      const executedByEmail = (req as any).user?.email || 'dean.academic@thapar.edu';

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
        actorId: (req as any).user?.userId || 'dean_admin',
        actorEmail: executedByEmail,
        actorRole: (req as any).user?.role || 'dean_admin',
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
      logger.error({ err: error.message }, 'Seat allocation execution error');
      res.status(500).json({
        success: false,
        error: error.message || 'Seat allocation execution failed',
      });
    }
  };

  // POST /api/allocation/run and POST /api/allocation/execute
  router.post('/run', handleRunAllocation);
  router.post('/execute', handleRunAllocation);

  // GET /api/allocation/roster - Get latest round results
  router.get('/roster', async (req: Request, res: Response) => {
    try {
      const roundId = String(req.query.roundId || 'ROUND_2026_SEM5_R1');
      let round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

      if (!round || round.meritAllocationResults.length === 0) {
        round = await runMeritSeatAllocationEngine({
          roundId,
          executedByEmail: (req as any).user?.email || 'dean.academic@thapar.edu',
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
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve allotment roster',
      });
    }
  });

  // GET /api/allocation/export-csv - Stream direct CSV
  router.get('/export-csv', async (req: Request, res: Response) => {
    try {
      const roundId = String(req.query.roundId || 'ROUND_2026_SEM5_R1');
      let round: ICounselingRound | null = await CounselingRound.findOne({ roundId });

      if (!round || round.meritAllocationResults.length === 0) {
        round = await runMeritSeatAllocationEngine({
          roundId,
          executedByEmail: (req as any).user?.email || 'dean.academic@thapar.edu',
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
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export allotment CSV',
      });
    }
  });

  return router;
}

