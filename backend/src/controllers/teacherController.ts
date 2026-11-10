import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares';
import { Basket, Course, TeacherProfile, User } from '../models';
import { computeTieBreakerCoreGpa, recordAuditLog } from '../services';
import { serializeUser } from './authController';

const createOrUpdateCourseSchema = z.object({
  courseCode: z.string().min(3).max(20),
  title: z.string().min(3).max(150),
  basketId: z.union([z.string(), z.number()]).default('EF_BASKET_05'),
  electiveSlot: z
    .enum(['PE-I', 'PE-II', 'PE-III', 'PE-IV', 'GE', 'GE-SEM5', 'CORE'])
    .default('PE-I'),
  semester: z.coerce.number().int().min(1).max(8).default(5),
  credits: z.coerce.number().min(1).max(6).default(3.0),
  ltp: z.string().max(15).default('2-0-2'),
  prerequisites: z.array(z.string()).default([]),
  syllabusTopics: z.array(z.string()).default([]),
  syllabusKeywords: z.array(z.string()).optional(),
  labTechStack: z.array(z.string()).optional(),
  clos: z.array(z.string()).default([]),
  industryPartner: z
    .enum(['NVIDIA', 'Xebia', 'EC-Council', 'Future First', 'TIET'])
    .default('TIET'),
  seatCapacity: z.coerce.number().int().min(10).max(1000).default(120),
  difficultyIndex: z.coerce.number().min(1.0).max(5.0).default(3.3),
  weeklySelfEffortHours: z.coerce.number().min(1).max(20).optional().default(6.5),
  assignedInstructor: z
    .object({
      name: z.string(),
      employeeId: z.string(),
      email: z.string().optional(),
    })
    .optional(),
});

const reviewStudentPreferenceSchema = z.object({
  rollNumber: z.string().min(2),
  status: z.enum(['Approved', 'Revision Recommended', 'Pending']),
  advisorNotes: z.string().max(1000).default(''),
});

function normalizeBasketId(raw: string | number): string {
  const str = String(raw).trim().toUpperCase();
  if (/^\d+$/.test(str)) {
    const num = Math.max(1, Math.min(12, parseInt(str, 10)));
    return `EF_BASKET_${String(num).padStart(2, '0')}`;
  }
  return str;
}

export class TeacherController {
  public createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = createOrUpdateCourseSchema.parse(req.body);
      const cleanCode = data.courseCode.trim().toUpperCase();
      const cleanBasketId = normalizeBasketId(data.basketId);

      const ltpParts = data.ltp.split('-').map((n) => parseInt(n, 10) || 0);
      const lectureHours = ltpParts[0] ?? 2;
      const tutorialHours = ltpParts[1] ?? 0;
      const practicalHours = ltpParts[2] ?? 2;

      const category =
        data.electiveSlot === 'GE' || data.electiveSlot === 'GE-SEM5'
          ? 'GENERIC_ELECTIVE'
          : data.electiveSlot === 'CORE'
            ? 'CORE_SEM5'
            : 'PROFESSIONAL_ELECTIVE';

      const instructor = data.assignedInstructor || {
        name: req.user?.name || 'Dr. Rajesh Kumar',
        employeeId: 'EMP_CSED_104',
        email: req.user?.email || 'rajesh.kumar@thapar.edu',
      };

      const course = await Course.findOneAndUpdate(
        { courseCode: cleanCode },
        {
          $set: {
            courseCode: cleanCode,
            title: data.title.trim(),
            category,
            basketId: cleanBasketId,
            electiveSlot: data.electiveSlot === 'GE' ? 'GE-SEM5' : data.electiveSlot,
            semester: data.semester,
            ltp: data.ltp,
            lectureHours,
            tutorialHours,
            practicalHours,
            credits: data.credits,
            seatCapacity: data.seatCapacity,
            industryPartner: data.industryPartner,
            prerequisites: data.prerequisites,
            syllabusTopics: data.syllabusTopics,
            syllabusKeywords:
              data.syllabusKeywords && data.syllabusKeywords.length > 0
                ? data.syllabusKeywords
                : data.syllabusTopics,
            labTechStack: data.labTechStack || [],
            clos: data.clos,
            difficultyIndex: data.difficultyIndex,
            weeklySelfEffortHours: data.weeklySelfEffortHours,
            assignedInstructor: instructor,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );

      if (req.user?.email) {
        await TeacherProfile.findOneAndUpdate(
          { email: req.user.email.toLowerCase() },
          {
            $setOnInsert: {
              name: req.user.name,
              email: req.user.email.toLowerCase(),
              employeeId: instructor.employeeId,
              primarySpecializationBasket: cleanBasketId,
            },
            $addToSet: { assignedCourses: cleanCode },
          },
          { upsert: true }
        );
      }

      await recordAuditLog({
        actorId: req.user?.userId || 'teacher',
        actorEmail: req.user?.email || 'faculty@thapar.edu',
        actorRole: req.user?.role || 'faculty_advisor',
        action: 'TEACHER_COURSE_CREATED_OR_UPDATED',
        req,
        metadata: {
          courseCode: cleanCode,
          title: data.title,
          basketId: cleanBasketId,
          electiveSlot: data.electiveSlot,
          seatCapacity: data.seatCapacity,
        },
      });

      res.status(201).json({
        success: true,
        message: `Course ${cleanCode} (${data.title}) saved in MongoDB Atlas catalog.`,
        course,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paramCode = String(req.params.courseCode || '')
        .trim()
        .toUpperCase();
      if (!paramCode) {
        throw new AppError('Course code URL parameter is required', 400);
      }

      const partialSchema = createOrUpdateCourseSchema.partial();
      const data = partialSchema.parse(req.body);

      const updateFields: Record<string, unknown> = {};
      if (data.title !== undefined) updateFields.title = data.title.trim();
      if (data.basketId !== undefined) updateFields.basketId = normalizeBasketId(data.basketId);
      if (data.electiveSlot !== undefined) {
        updateFields.electiveSlot = data.electiveSlot === 'GE' ? 'GE-SEM5' : data.electiveSlot;
      }
      if (data.semester !== undefined) updateFields.semester = data.semester;
      if (data.credits !== undefined) updateFields.credits = data.credits;
      if (data.ltp !== undefined) {
        updateFields.ltp = data.ltp;
        const ltpParts = data.ltp.split('-').map((n) => parseInt(n, 10) || 0);
        updateFields.lectureHours = ltpParts[0] ?? 2;
        updateFields.tutorialHours = ltpParts[1] ?? 0;
        updateFields.practicalHours = ltpParts[2] ?? 2;
      }
      if (data.prerequisites !== undefined) updateFields.prerequisites = data.prerequisites;
      if (data.syllabusTopics !== undefined) {
        updateFields.syllabusTopics = data.syllabusTopics;
        updateFields.syllabusKeywords = data.syllabusTopics;
      }
      if (data.clos !== undefined) updateFields.clos = data.clos;
      if (data.industryPartner !== undefined) updateFields.industryPartner = data.industryPartner;
      if (data.seatCapacity !== undefined) updateFields.seatCapacity = data.seatCapacity;
      if (data.difficultyIndex !== undefined) updateFields.difficultyIndex = data.difficultyIndex;
      if (data.assignedInstructor !== undefined) {
        updateFields.assignedInstructor = data.assignedInstructor;
      }

      const course = await Course.findOneAndUpdate(
        { courseCode: paramCode },
        { $set: updateFields },
        { new: true }
      );

      if (!course) {
        throw new AppError(`Course ${paramCode} not found in catalog`, 404);
      }

      await recordAuditLog({
        actorId: req.user?.userId || 'teacher',
        actorEmail: req.user?.email || 'faculty@thapar.edu',
        actorRole: req.user?.role || 'faculty_advisor',
        action: 'TEACHER_COURSE_UPDATED',
        req,
        metadata: { courseCode: paramCode, updatedFields: Object.keys(updateFields) },
      });

      res.status(200).json({
        success: true,
        message: `Course ${paramCode} updated in MongoDB Atlas.`,
        course,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMyStudents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestedBasket = req.query.basketId
        ? normalizeBasketId(String(req.query.basketId))
        : undefined;

      let teacherBasket = requestedBasket;
      if (!teacherBasket && req.user?.userId) {
        const teacherDoc = await User.findById(req.user.userId);
        if (teacherDoc?.primarySpecializationBasket) {
          teacherBasket = normalizeBasketId(teacherDoc.primarySpecializationBasket);
        }
      }

      const baskets = await Basket.find().lean();
      const basketPrereqMap = new Map<string, string[]>(
        baskets.map((b) => [b.basketId, b.keyPrerequisites || ['UCS301', 'UCS415', 'UMA021']])
      );

      const allStudents = await User.find({ role: 'student' }).sort({ cgpa: -1 });

      const enrichedStudents = allStudents
        .filter((s) => {
          if (!teacherBasket || teacherBasket === 'ALL') return true;
          const prefs = s.rankedBasketPreferences || [];
          const allocated = s.allocatedBasketId;
          const interests = (s.areasOfInterest || []).map((i) => i.toLowerCase());
          return (
            prefs.includes(teacherBasket) ||
            allocated === teacherBasket ||
            interests.some((i) => teacherBasket!.toLowerCase().includes(i)) ||
            prefs.length === 0
          );
        })
        .map((s) => {
          const serialized = serializeUser(s);
          const coreGrades = (serialized.coreGrades || {}) as Record<string, number>;
          const targetBasket =
            s.allocatedBasketId || s.rankedBasketPreferences?.[0] || teacherBasket || 'EF_BASKET_05';
          const keyPrereqs = basketPrereqMap.get(targetBasket) || ['UCS301', 'UCS415', 'UMA021'];

          const prerequisiteAlerts: string[] = [];
          for (const code of keyPrereqs) {
            const gp = coreGrades[code] ?? 8;
            if (gp < 7) {
              prerequisiteAlerts.push(`Low grade point (${gp}/10) in prerequisite ${code}`);
            }
          }
          if (s.cgpa < 7.2) {
            prerequisiteAlerts.push(`CGPA (${s.cgpa.toFixed(2)}) below historical basket cutoff`);
          }

          return {
            ...serialized,
            tieBreakerCoreGpa: computeTieBreakerCoreGpa(s),
            targetBasket,
            prerequisiteAlerts,
            prerequisiteReadinessStatus:
              prerequisiteAlerts.length === 0 ? 'READY' : 'ATTENTION_NEEDED',
          };
        });

      res.status(200).json({
        success: true,
        specializationBasket: teacherBasket || 'ALL',
        count: enrichedStudents.length,
        students: enrichedStudents,
      });
    } catch (error) {
      next(error);
    }
  };

  public reviewStudentPreference = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { rollNumber, status, advisorNotes } = reviewStudentPreferenceSchema.parse(req.body);
      const student = await User.findOne({ rollNumber: rollNumber.trim(), role: 'student' });

      if (!student) {
        throw new AppError(`Student with Roll Number ${rollNumber} not found`, 404);
      }

      student.advisorReview = {
        status,
        advisorNotes: advisorNotes.trim(),
        reviewedByEmail: req.user?.email || 'rajesh.kumar@thapar.edu',
        reviewedByName: req.user?.name || 'Dr. Rajesh Kumar',
        reviewedAt: new Date(),
      };

      await student.save();

      await recordAuditLog({
        actorId: req.user?.userId || 'teacher',
        actorEmail: req.user?.email || 'rajesh.kumar@thapar.edu',
        actorRole: req.user?.role || 'faculty_advisor',
        action: 'TEACHER_STUDENT_PREFERENCE_REVIEWED',
        req,
        metadata: {
          studentRollNumber: student.rollNumber,
          status,
          advisorNotes,
        },
      });

      res.status(200).json({
        success: true,
        message: `Marked ${student.name} (${student.rollNumber}) elective preference as ${status}.`,
        student: serializeUser(student),
      });
    } catch (error) {
      next(error);
    }
  };
}
