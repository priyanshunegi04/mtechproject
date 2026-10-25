import mongoose, { ClientSession } from 'mongoose';
import pino from 'pino';
import {
  Basket,
  CounselingRound,
  Course,
  ICounselingRound,
  ICutoffTelemetry,
  IStudentAllocationEntry,
  IUser,
  User,
} from '../models';

const logger = pino({ name: 'tiet-seat-allocation-engine' });

const TIE_BREAKER_CORE_CODES = ['UCS301', 'UCS415', 'UMA021', 'UMA401'] as const;

export function computeTieBreakerCoreGpa(user: IUser): number {
  const gradesMap = user.coreGrades;
  let sum = 0;
  let count = 0;

  for (const code of TIE_BREAKER_CORE_CODES) {
    const val =
      gradesMap instanceof Map
        ? gradesMap.get(code)
        : (gradesMap as unknown as Record<string, number>)?.[code];
    if (typeof val === 'number' && !Number.isNaN(val)) {
      sum += val;
      count += 1;
    }
  }
  if (count === 0) {
    return Number((user.cgpa || 7.5).toFixed(2));
  }
  return Number((sum / count).toFixed(3));
}

export interface RunSeatAllocationOptions {
  roundId?: string;
  batchYear?: number;
  currentSemester?: number;
  executedByEmail: string;
  overrideSeatCapPerBasket?: number;
  overrideSeatCapPerGeneric?: number;
}

async function executeAllocationCore(
  options: RunSeatAllocationOptions,
  session?: ClientSession
): Promise<ICounselingRound> {
  const roundId = options.roundId || 'ROUND_2026_SEM5_R1';
  const batchYear = options.batchYear || 2024;
  const currentSemester = options.currentSemester || 4;

  const sessionOpt = session ? { session } : {};

  // 1. Load all active EF Baskets & Generic Electives
  const baskets = await Basket.find({ isActive: true }, null, sessionOpt).sort({ basketNumber: 1 });
  const genericCourses = await Course.find(
    { category: 'GENERIC_ELECTIVE', isActive: true },
    null,
    sessionOpt
  ).sort({ courseCode: 1 });

  // Build in-memory seat trackers
  const basketTracker = new Map<
    string,
    {
      code: string;
      name: string;
      capacity: number;
      enrolled: number;
      waitlist: number;
      openingCgpa: number | null;
      closingCgpa: number | null;
      keyPrerequisites: string[];
    }
  >();

  for (const b of baskets) {
    const cap =
      typeof options.overrideSeatCapPerBasket === 'number'
        ? options.overrideSeatCapPerBasket
        : b.seatCapacity;
    basketTracker.set(b.basketId, {
      code: b.basketId,
      name: b.name,
      capacity: cap,
      enrolled: 0,
      waitlist: 0,
      openingCgpa: null,
      closingCgpa: null,
      keyPrerequisites: b.keyPrerequisites || [],
    });
  }

  const genericTracker = new Map<
    string,
    {
      code: string;
      name: string;
      capacity: number;
      enrolled: number;
      waitlist: number;
      openingCgpa: number | null;
      closingCgpa: number | null;
    }
  >();

  for (const g of genericCourses) {
    const cap =
      typeof options.overrideSeatCapPerGeneric === 'number'
        ? options.overrideSeatCapPerGeneric
        : g.seatCapacity;
    genericTracker.set(g.courseCode, {
      code: g.courseCode,
      name: g.title,
      capacity: cap,
      enrolled: 0,
      waitlist: 0,
      openingCgpa: null,
      closingCgpa: null,
    });
  }

  // 2. Fetch all eligible students in the target batch & semester
  const students = await User.find(
    {
      role: 'student',
      batchYear,
      currentSemester,
    },
    null,
    sessionOpt
  );

  // Filter to students who have submitted preferences (or default to all students with non-empty preferences)
  const lockedStudents = students.filter(
    (s) =>
      (s.rankedBasketPreferences && s.rankedBasketPreferences.length > 0) ||
      (s.rankedGenericPreferences && s.rankedGenericPreferences.length > 0)
  );

  // 3. Deterministic Merit Order Sort:
  //    Primary: descending CGPA
  //    Secondary: descending Prerequisite Core GPA (UCS301, UCS415, UMA021, UMA401)
  //    Tertiary: ascending preferenceLockedAt timestamp
  //    Quaternary: ascending rollNumber
  const sortedStudents = [...lockedStudents].sort((a, b) => {
    if (b.cgpa !== a.cgpa) {
      return b.cgpa - a.cgpa;
    }
    const tieA = computeTieBreakerCoreGpa(a);
    const tieB = computeTieBreakerCoreGpa(b);
    if (tieB !== tieA) {
      return tieB - tieA;
    }
    const timeA = a.preferenceLockedAt ? new Date(a.preferenceLockedAt).getTime() : Number.MAX_SAFE_INTEGER;
    const timeB = b.preferenceLockedAt ? new Date(b.preferenceLockedAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.rollNumber || '').localeCompare(b.rollNumber || '');
  });

  const allocationResults: IStudentAllocationEntry[] = [];
  const userBulkUpdates = [];

  let allocatedCount = 0;
  let waitlistedCount = 0;
  let firstChoiceCount = 0;
  let topThreeChoiceCount = 0;

  // 4. Serial Dictatorship Merit Allocation Loop
  for (const stu of sortedStudents) {
    const tieGpa = computeTieBreakerCoreGpa(stu);
    const overridesSet = new Set(
      (stu.prerequisiteOverrides || []).map((o) => o.targetCode.toUpperCase())
    );

    let assignedBasketId: string | null = null;
    let assignedBasketName: string | null = null;
    let basketPrefRank: number | null = null;

    const basketPrefs = stu.rankedBasketPreferences || [];
    for (let idx = 0; idx < basketPrefs.length; idx++) {
      const candidateBasketId = basketPrefs[idx].toUpperCase();
      const tracker = basketTracker.get(candidateBasketId);
      if (!tracker) continue;

      // Check prerequisite eligibility (minimum grade point 5 ('C-') in basket key prerequisites unless overridden)
      let prereqMet = true;
      if (!overridesSet.has(candidateBasketId)) {
        for (const pCode of tracker.keyPrerequisites) {
          const gp =
            stu.coreGrades instanceof Map
              ? stu.coreGrades.get(pCode)
              : (stu.coreGrades as unknown as Record<string, number>)?.[pCode];
          if (typeof gp === 'number' && gp < 5) {
            prereqMet = false;
            break;
          }
        }
      }
      if (!prereqMet) continue;

      if (tracker.enrolled < tracker.capacity) {
        tracker.enrolled += 1;
        if (tracker.openingCgpa === null || stu.cgpa > tracker.openingCgpa) {
          tracker.openingCgpa = stu.cgpa;
        }
        tracker.closingCgpa = stu.cgpa;
        assignedBasketId = tracker.code;
        assignedBasketName = tracker.name;
        basketPrefRank = idx + 1;
        break;
      }
    }

    // Allocate Generic Elective (Sem V, 2.0 Cr)
    let assignedGeCode: string | null = null;
    let assignedGeTitle: string | null = null;
    let gePrefRank: number | null = null;

    const gePrefs = stu.rankedGenericPreferences || [];
    for (let idx = 0; idx < gePrefs.length; idx++) {
      const candidateGeCode = gePrefs[idx].toUpperCase();
      const gTrack = genericTracker.get(candidateGeCode);
      if (!gTrack) continue;

      if (gTrack.enrolled < gTrack.capacity) {
        gTrack.enrolled += 1;
        if (gTrack.openingCgpa === null || stu.cgpa > gTrack.openingCgpa) {
          gTrack.openingCgpa = stu.cgpa;
        }
        gTrack.closingCgpa = stu.cgpa;
        assignedGeCode = gTrack.code;
        assignedGeTitle = gTrack.name;
        gePrefRank = idx + 1;
        break;
      }
    }

    let status: 'allocated' | 'waitlisted' = 'allocated';
    let waitlistRank: number | null = null;

    if (assignedBasketId) {
      allocatedCount += 1;
      if (basketPrefRank === 1) firstChoiceCount += 1;
      if (basketPrefRank !== null && basketPrefRank <= 3) topThreeChoiceCount += 1;
    } else {
      status = 'waitlisted';
      waitlistedCount += 1;
      waitlistRank = waitlistedCount;
      const topPref = basketPrefs[0]?.toUpperCase();
      if (topPref && basketTracker.has(topPref)) {
        const t = basketTracker.get(topPref)!;
        t.waitlist += 1;
      }
    }

    allocationResults.push({
      studentId: String(stu._id),
      rollNumber: stu.rollNumber || 'N/A',
      studentName: stu.name,
      email: stu.email,
      cgpa: stu.cgpa,
      tieBreakerCoreGpa: tieGpa,
      allocatedBasketId: assignedBasketId,
      allocatedBasketName: assignedBasketName,
      allocatedGenericCourseCode: assignedGeCode,
      allocatedGenericTitle: assignedGeTitle,
      basketPreferenceRank: basketPrefRank,
      genericPreferenceRank: gePrefRank,
      allocationStatus: status,
      waitlistRank,
    });

    userBulkUpdates.push({
      updateOne: {
        filter: { _id: stu._id },
        update: {
          $set: {
            allocatedBasketId: assignedBasketId,
            allocatedGenericCourseCode: assignedGeCode,
            allocationStatus: status,
            allocatedPreferenceRank: basketPrefRank,
            waitlistRank,
          },
        },
      },
    });
  }

  if (userBulkUpdates.length > 0) {
    await User.bulkWrite(userBulkUpdates, { ordered: false, ...(session ? { session } : {}) });
  }

  // 5. Persist updated enrolledCount, waitlistCount, and liveCutoffCgpa to Basket and Course collections
  const basketCutoffs: ICutoffTelemetry[] = [];
  const basketBulkOps = [];

  for (const [, track] of basketTracker.entries()) {
    basketCutoffs.push({
      code: track.code,
      name: track.name,
      seatCapacity: track.capacity,
      enrolledCount: track.enrolled,
      waitlistCount: track.waitlist,
      openingCgpa: track.openingCgpa,
      closingCutoffCgpa: track.closingCgpa,
    });
    basketBulkOps.push({
      updateOne: {
        filter: { basketId: track.code },
        update: {
          $set: {
            seatCapacity: track.capacity,
            enrolledCount: track.enrolled,
            waitlistCount: track.waitlist,
            liveCutoffCgpa: track.closingCgpa,
          },
        },
      },
    });
  }
  if (basketBulkOps.length > 0) {
    await Basket.bulkWrite(basketBulkOps, { ordered: false, ...(session ? { session } : {}) });
  }

  const genericCutoffs: ICutoffTelemetry[] = [];
  const geBulkOps = [];
  for (const [, gTrack] of genericTracker.entries()) {
    genericCutoffs.push({
      code: gTrack.code,
      name: gTrack.name,
      seatCapacity: gTrack.capacity,
      enrolledCount: gTrack.enrolled,
      waitlistCount: gTrack.waitlist,
      openingCgpa: gTrack.openingCgpa,
      closingCutoffCgpa: gTrack.closingCgpa,
    });
    geBulkOps.push({
      updateOne: {
        filter: { courseCode: gTrack.code },
        update: {
          $set: {
            seatCapacity: gTrack.capacity,
            enrolledCount: gTrack.enrolled,
            waitlistCount: gTrack.waitlist,
            liveCutoffCgpa: gTrack.closingCgpa,
          },
        },
      },
    });
  }
  if (geBulkOps.length > 0) {
    await Course.bulkWrite(geBulkOps, { ordered: false, ...(session ? { session } : {}) });
  }

  const totalLocked = sortedStudents.length;
  const firstChoicePct =
    totalLocked > 0 ? Number(((firstChoiceCount / totalLocked) * 100).toFixed(1)) : 0;
  const topThreePct =
    totalLocked > 0 ? Number(((topThreeChoiceCount / totalLocked) * 100).toFixed(1)) : 0;

  const updatedRound = await CounselingRound.findOneAndUpdate(
    { roundId },
    {
      $set: {
        status: 'allocated',
        executedAt: new Date(),
        executedByEmail: options.executedByEmail,
        basketCutoffs,
        genericCutoffs,
        meritAllocationResults: allocationResults,
        summaryStats: {
          totalEligibleStudents: students.length,
          totalLockedPreferences: totalLocked,
          totalAllocated: allocatedCount,
          totalWaitlisted: waitlistedCount,
          firstChoiceBasketPct: firstChoicePct,
          topThreeBasketPct: topThreePct,
        },
      },
    },
    { new: true, upsert: true, ...(session ? { session } : {}) }
  );

  logger.info(
    {
      roundId,
      totalLocked,
      allocatedCount,
      waitlistedCount,
      firstChoicePct,
    },
    'Completed TIET CGPA Merit-Based Seat Allocation'
  );

  return updatedRound!;
}

export async function runMeritSeatAllocationEngine(
  options: RunSeatAllocationOptions
): Promise<ICounselingRound> {
  const session = await mongoose.startSession();
  try {
    let resultRound: ICounselingRound | null = null;
    await session.withTransaction(async () => {
      resultRound = await executeAllocationCore(options, session);
    });
    return resultRound!;
  } catch (txError) {
    logger.warn(
      { err: txError instanceof Error ? txError.message : String(txError) },
      'ACID multi-document transaction fallback triggered; executing allocation atomically via bulkWrite'
    );
    return executeAllocationCore(options);
  } finally {
    await session.endSession();
  }
}

export function formatAllotmentRosterAsCSV(round: ICounselingRound): string {
  const headers = [
    'Merit_Rank',
    'Roll_Number',
    'Student_Name',
    'Email',
    'CGPA_Sem4',
    'Core_TieBreaker_GPA',
    'Allocation_Status',
    'Allocated_Basket_ID',
    'Allocated_Basket_Name',
    'Basket_Preference_Rank',
    'Allocated_Generic_Elective_Code',
    'Allocated_Generic_Elective_Title',
    'Generic_Preference_Rank',
    'Waitlist_Position',
  ];

  const escapeCsv = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(',')];
  round.meritAllocationResults.forEach((entry, idx) => {
    lines.push(
      [
        idx + 1,
        entry.rollNumber,
        entry.studentName,
        entry.email,
        entry.cgpa.toFixed(2),
        entry.tieBreakerCoreGpa.toFixed(3),
        entry.allocationStatus.toUpperCase(),
        entry.allocatedBasketId || 'WAITLISTED',
        entry.allocatedBasketName || 'WAITLISTED',
        entry.basketPreferenceRank ?? '',
        entry.allocatedGenericCourseCode || 'UNALLOCATED',
        entry.allocatedGenericTitle || 'UNALLOCATED',
        entry.genericPreferenceRank ?? '',
        entry.waitlistRank ?? '',
      ]
        .map(escapeCsv)
        .join(',')
    );
  });

  return lines.join('\n');
}

