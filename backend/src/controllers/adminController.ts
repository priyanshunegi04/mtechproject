import bcrypt from 'bcryptjs';
import { parse } from 'csv-parse/sync';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares';
import { AuditLog, Basket, CounselingRound, Course, ICounselingRound, User } from '../models';
import {
  formatAllotmentRosterAsCSV,
  MLGatewayService,
  recordAuditLog,
  runMeritSeatAllocationEngine,
} from '../services';
import { InstitutionalRole } from '../types';

const CORE_GRADE_COLUMNS = [
  'UES103',
  'UMA022',
  'UMA023',
  'UCS301',
  'UCS303',
  'UTA018',
  'UCS405',
  'UMA021',
  'UCS415',
  'UCS310',
  'UCS414',
  'UCS321',
  'UMA401',
] as const;

const updateSeatMatrixSchema = z.object({
  targetType: z.enum(['basket', 'course']),
  code: z.string().min(2),
  seatCapacity: z.coerce.number().int().min(5).max(1000),
});

const runAllocationSchema = z.object({
  roundId: z.string().default('ROUND_2026_SEM5_R1'),
  batchYear: z.coerce.number().int().default(2024),
  currentSemester: z.coerce.number().int().default(4),
  overrideSeatCapPerBasket: z.coerce.number().int().min(1).max(1000).optional(),
  overrideSeatCapPerGeneric: z.coerce.number().int().min(1).max(1000).optional(),
});

export class AdminController {
  constructor(private readonly mlGateway: MLGatewayService) {}

  /**
   * Bulk ERP / Webkiosk CSV Ingestion:
   * Allows the Academic Cell / Dean to upload a CSV of student roll numbers and Semesters I–IV
   * grades to bulk-provision accounts and update transcripts in MongoDB Atlas via `bulkWrite`.
   */
  public uploadWebkioskCsv = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rawCsvBuffer = req.file?.buffer;
      const csvText = rawCsvBuffer
        ? rawCsvBuffer.toString('utf-8')
        : typeof req.body?.csvContent === 'string'
          ? req.body.csvContent
          : '';

      if (!csvText.trim()) {
        throw new AppError(
          'Provide a valid TIET Webkiosk CSV file (multipart field `file`) or `csvContent` string in the request body.',
          400
        );
      }

      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];

      if (records.length === 0) {
        throw new AppError('Uploaded Webkiosk CSV contains 0 student rows.', 400);
      }

      const defaultPasswordHash = await bcrypt.hash('Thapar@2026', 10);
      const bulkOps = [];

      for (const row of records) {
        const rollNumber = (
          row.rollNumber ||
          row.roll_no ||
          row.Roll_Number ||
          row.RollNo ||
          ''
        ).trim();
        if (!rollNumber) continue;

        const name = (
          row.name ||
          row.student_name ||
          row.Student_Name ||
          `TIET Student ${rollNumber}`
        ).trim();

        const rawEmail = (
          row.email ||
          row.Email ||
          `student.${rollNumber.toLowerCase()}@thapar.edu`
        )
          .trim()
          .toLowerCase();
        const email = rawEmail.endsWith('@thapar.edu')
          ? rawEmail
          : `${rawEmail.split('@')[0]}@thapar.edu`;

        const cgpa = Math.min(
          10.0,
          Math.max(
            0.0,
            Number(row.cgpa || row.cgpa_sem4 || row.CGPA || 7.65)
          )
        );
        const batchYear = Number(row.batchYear || row.batch_year || 2024);
        const currentSemester = Number(row.currentSemester || row.semester || 4);

        const coreGrades: Record<string, number> = {};
        for (const cCode of CORE_GRADE_COLUMNS) {
          const val = Number(row[cCode] ?? Math.round(cgpa));
          coreGrades[cCode] = Math.min(10, Math.max(0, Number.isNaN(val) ? 8 : val));
        }

        const basketPrefsRaw = row.rankedBasketPreferences || row.chosen_basket_id || '';
        const rankedBaskets = basketPrefsRaw
          ? basketPrefsRaw
              .split(/[;|,]/)
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean)
          : undefined;

        const gePrefsRaw = row.rankedGenericPreferences || row.chosen_generic_elective || '';
        const rankedGes = gePrefsRaw
          ? gePrefsRaw
              .split(/[;|,]/)
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean)
          : undefined;

        bulkOps.push({
          updateOne: {
            filter: { rollNumber },
            update: {
              $setOnInsert: {
                passwordHash: defaultPasswordHash,
                role: 'student' as InstitutionalRole,
                allocationStatus: 'pending' as const,
              },
              $set: {
                name,
                email,
                rollNumber,
                branch: 'B.E. Computer Science & Engineering (COPC)',
                batchYear,
                currentSemester,
                cgpa,
                coreGrades,
                codingProfileScore: Number(
                  row.coding_profile_score || (cgpa * 9.5).toFixed(1)
                ),
                mathAptitudeScore: Number(
                  row.math_aptitude_score || (cgpa * 9.4).toFixed(1)
                ),
                ...(rankedBaskets && rankedBaskets.length > 0
                  ? { rankedBasketPreferences: rankedBaskets, preferenceLockedAt: new Date() }
                  : {}),
                ...(rankedGes && rankedGes.length > 0
                  ? { rankedGenericPreferences: rankedGes }
                  : {}),
              },
            },
            upsert: true,
          },
        });
      }

      if (bulkOps.length === 0) {
        throw new AppError(
          'No valid student rows with rollNumber / roll_no column found in CSV.',
          400
        );
      }

      const writeResult = await User.bulkWrite(bulkOps, { ordered: false });

      await recordAuditLog({
        actorId: req.user?.userId || 'admin',
        actorEmail: req.user?.email || 'dean.academic@thapar.edu',
        actorRole: req.user?.role || 'dean_admin',
        action: 'WEBKIOSK_CSV_BULK_INGESTION',
        req,
        metadata: {
          rowsParsed: bulkOps.length,
          upsertedCount: writeResult.upsertedCount,
          modifiedCount: writeResult.modifiedCount,
        },
      });

      res.status(200).json({
        success: true,
        message: `Successfully processed ${bulkOps.length} student records into MongoDB Atlas via bulkWrite.`,
        summary: {
          rowsParsed: bulkOps.length,
          upsertedCount: writeResult.upsertedCount,
          modifiedCount: writeResult.modifiedCount,
          matchedCount: writeResult.matchedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Execute official batch-wide CGPA & Prerequisite Merit Seat Allocation Engine
   */
  public executeSeatAllocation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params = runAllocationSchema.parse(req.body || {});
      const executedByEmail = req.user?.email || 'dean.academic@thapar.edu';

      const round = await runMeritSeatAllocationEngine({
        ...params,
        executedByEmail,
      });

      await recordAuditLog({
        actorId: req.user?.userId || 'admin',
        actorEmail: executedByEmail,
        actorRole: req.user?.role || 'dean_admin',
        action: 'MERIT_SEAT_ALLOCATION_EXECUTED',
        req,
        metadata: {
          roundId: round.roundId,
          summaryStats: round.summaryStats,
          overrideSeatCapPerBasket: params.overrideSeatCapPerBasket,
        },
      });

      const summary = {
        total_applicants: round.summaryStats.totalEligibleStudents,
        total_allocated: round.summaryStats.totalAllocated,
        total_waitlisted: round.summaryStats.totalWaitlisted,
        baskets_full: round.basketCutoffs.filter((b) => b.enrolledCount >= b.seatCapacity).length,
      };

      const basketStats = round.basketCutoffs.map((b) => ({
        basket_id: b.code,
        name: b.name,
        capacity: b.seatCapacity,
        allotted: b.enrolledCount,
        fill_rate: b.seatCapacity > 0 ? Math.round((b.enrolledCount / b.seatCapacity) * 100) : 0,
        cutoff_cgpa: b.closingCutoffCgpa,
      }));

      const roster = round.meritAllocationResults.map((r, idx) => ({
        merit_rank: idx + 1,
        student_id: r.studentId,
        roll_no: r.rollNumber,
        student_name: r.studentName,
        allocated_basket: r.allocatedBasketId,
        allocated_basket_name: r.allocatedBasketName,
        cgpa: r.cgpa,
        preference_rank: r.basketPreferenceRank,
        status: r.allocationStatus,
      }));

      res.status(200).json({
        success: true,
        message: 'Official TIET CGPA Merit-Based Seat Allocation completed successfully.',
        summary,
        basket_stats: basketStats,
        roster,
        round,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download official TIET Academic Section / Webkiosk ERP Allotment Roster (CSV or JSON)
   */
  public downloadAllotmentRoster = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const roundId = String(req.query.roundId || 'ROUND_2026_SEM5_R1');
      const format = String(req.query.format || 'json').toLowerCase();

      let round: ICounselingRound | null = await CounselingRound.findOne({ roundId });
      if (!round || round.meritAllocationResults.length === 0) {
        round = await runMeritSeatAllocationEngine({
          roundId,
          executedByEmail: req.user?.email || 'dean.academic@thapar.edu',
        });
      }

      if (format === 'csv') {
        const csvString = formatAllotmentRosterAsCSV(round);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="TIET_CSE_Allotment_Roster_${roundId}.csv"`
        );
        res.status(200).send(csvString);
        return;
      }

      res.status(200).json({
        success: true,
        roundId: round.roundId,
        title: round.title,
        executedAt: round.executedAt,
        summaryStats: round.summaryStats,
        basketCutoffs: round.basketCutoffs,
        genericCutoffs: round.genericCutoffs,
        roster: round.meritAllocationResults,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateSeatMatrix = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { targetType, code, seatCapacity } = updateSeatMatrixSchema.parse(req.body);
      const cleanCode = code.trim().toUpperCase();

      if (targetType === 'basket') {
        const updated = await Basket.findOneAndUpdate(
          { basketId: cleanCode },
          { $set: { seatCapacity } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(`Elective Focus Basket ${cleanCode} not found`, 404);
        }
      } else {
        const updated = await Course.findOneAndUpdate(
          { courseCode: cleanCode },
          { $set: { seatCapacity } },
          { new: true }
        );
        if (!updated) {
          throw new AppError(`Course ${cleanCode} not found`, 404);
        }
      }

      await recordAuditLog({
        actorId: req.user?.userId || 'admin',
        actorEmail: req.user?.email || 'dean.academic@thapar.edu',
        actorRole: req.user?.role || 'dean_admin',
        action: 'SEAT_MATRIX_CAPACITY_UPDATED',
        req,
        metadata: { targetType, code: cleanCode, newSeatCapacity: seatCapacity },
      });

      res.status(200).json({
        success: true,
        message: `Updated ${targetType.toUpperCase()} ${cleanCode} seat capacity to ${seatCapacity}.`,
        targetType,
        code: cleanCode,
        seatCapacity,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAdminAnalytics = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const [students, baskets, genericCourses, activeRound, recentAuditLogs] = await Promise.all([
        User.find({ role: 'student' }).sort({ cgpa: -1 }).lean(),
        Basket.find({ isActive: true }).sort({ basketNumber: 1 }).lean(),
        Course.find({ category: 'GENERIC_ELECTIVE', isActive: true }).sort({ courseCode: 1 }).lean(),
        CounselingRound.findOne().sort({ updatedAt: -1 }).lean(),
        AuditLog.find().sort({ timestamp: -1 }).limit(25).lean(),
      ]);

      // Compute first-choice demand per EF Basket across all student preferences
      const firstChoiceDemand: Record<string, number> = {};
      const topThreeDemand: Record<string, number> = {};
      for (const s of students) {
        const prefs = s.rankedBasketPreferences || [];
        if (prefs[0]) {
          firstChoiceDemand[prefs[0]] = (firstChoiceDemand[prefs[0]] || 0) + 1;
        }
        for (const p of prefs.slice(0, 3)) {
          topThreeDemand[p] = (topThreeDemand[p] || 0) + 1;
        }
      }

      const basketDemandTelemetry = baskets.map((b) => ({
        basketId: b.basketId,
        basketNumber: b.basketNumber,
        name: b.name,
        industryPartner: b.industryPartner,
        collaboration: b.collaboration,
        seatCapacity: b.seatCapacity,
        enrolledCount: b.enrolledCount,
        waitlistCount: b.waitlistCount,
        firstChoiceApplicants: firstChoiceDemand[b.basketId] || 0,
        topThreeApplicants: topThreeDemand[b.basketId] || 0,
        cutoffCgpaLastYear: b.cutoffCgpaLastYear,
        liveCutoffCgpa: b.liveCutoffCgpa ?? null,
      }));

      // CGPA bucket distribution
      const cgpaBuckets = [
        { range: '9.0 - 10.0', count: students.filter((s) => s.cgpa >= 9.0).length },
        { range: '8.0 - 8.99', count: students.filter((s) => s.cgpa >= 8.0 && s.cgpa < 9.0).length },
        { range: '7.0 - 7.99', count: students.filter((s) => s.cgpa >= 7.0 && s.cgpa < 8.0).length },
        { range: '< 7.0', count: students.filter((s) => s.cgpa < 7.0).length },
      ];

      const lockedCount = students.filter(
        (s) => s.rankedBasketPreferences && s.rankedBasketPreferences.length > 0
      ).length;
      const allocatedCount = students.filter((s) => s.allocationStatus === 'allocated').length;
      const waitlistedCount = students.filter((s) => s.allocationStatus === 'waitlisted').length;

      res.status(200).json({
        success: true,
        overview: {
          totalStudents: students.length,
          lockedPreferencesCount: lockedCount,
          allocatedCount,
          waitlistedCount,
          pendingCount: students.length - allocatedCount - waitlistedCount,
          averageBatchCgpa:
            students.length > 0
              ? Number(
                  (students.reduce((sum, s) => sum + s.cgpa, 0) / students.length).toFixed(2)
                )
              : 0,
        },
        cgpaDistribution: cgpaBuckets,
        basketDemandTelemetry,
        genericElectivesTelemetry: genericCourses.map((g) => ({
          courseCode: g.courseCode,
          title: g.title,
          seatCapacity: g.seatCapacity,
          enrolledCount: g.enrolledCount,
          waitlistCount: g.waitlistCount,
          liveCutoffCgpa: g.liveCutoffCgpa ?? null,
        })),
        activeCounselingRound: activeRound,
        recentAuditLogs,
      });
    } catch (error) {
      next(error);
    }
  };

  public triggerMlRetrain = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reason = String(req.body?.reason || 'Dean/Admin Portal Triggered Retraining');
      const result = await this.mlGateway.triggerRetrain(reason);

      await recordAuditLog({
        actorId: req.user?.userId || 'admin',
        actorEmail: req.user?.email || 'dean.academic@thapar.edu',
        actorRole: req.user?.role || 'dean_admin',
        action: 'ML_MODEL_RETRAIN_TRIGGERED',
        req,
        metadata: { reason, result },
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
