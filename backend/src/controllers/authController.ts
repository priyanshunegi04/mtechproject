import bcrypt from 'bcryptjs';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { EnvConfig } from '../config/env';
import {
  AppError,
  AuthenticatedUserPayload,
  signAccessToken,
  signRefreshToken,
} from '../middlewares';
import { ITeacherProfile, IUser, TeacherProfile, User } from '../models';
import { recordAuditLog, SHOWCASE_PERSONAS } from '../services';

const studentRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z
    .string()
    .email()
    .regex(/^[a-zA-Z0-9._%+-]+@thapar\.edu$/i, 'Email must belong to the @thapar.edu domain'),
  password: z.string().min(8).max(100),
  role: z.literal('student').default('student'),
  contactNumber: z.string().max(30).optional().default('+91-9876543210'),
  rollNumber: z.string().min(3, 'Roll Number is required for student registration').max(30),
  department: z.string().max(80).optional().default('CSED'),
  branch: z
    .string()
    .max(120)
    .optional()
    .default('B.E. Computer Science & Engineering (COPC)'),
  batchYear: z.coerce.number().int().min(2018).max(2032).default(2024),
  currentSemester: z.coerce.number().int().min(1).max(8).default(4),
  cgpa: z.coerce.number().min(0).max(10).default(7.8),
  coreGrades: z.record(z.string(), z.coerce.number().min(0).max(10)).optional(),
  skills: z.array(z.string()).optional(),
  areasOfInterest: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  bio: z.string().max(2500).optional(),
});

const teacherRegisterSchema = z.object({
  name: z.string().min(2).max(120),
  email: z
    .string()
    .email()
    .regex(/^[a-zA-Z0-9._%+-]+@thapar\.edu$/i, 'Email must belong to the @thapar.edu domain'),
  password: z.string().min(8).max(100),
  role: z.enum(['faculty_advisor', 'dean_admin']).default('faculty_advisor'),
  contactNumber: z.string().max(30).optional().default('+91-9876543210'),
  employeeId: z.string().min(2, 'Employee ID is required for faculty registration').max(30),
  designation: z.string().min(2).max(80).default('Associate Professor'),
  department: z.string().max(80).optional().default('CSED'),
  officeRoom: z.string().max(80).optional().default('CSED Block-B Room 304'),
  primarySpecializationBasket: z.string().max(40).optional().default('EF_BASKET_05'),
  assignedBasketId: z.coerce.number().int().min(1).max(12).optional().default(5),
  assignedBasketName: z
    .string()
    .max(120)
    .optional()
    .default('Artificial Intelligence and Machine Learning (AIML)'),
  specializationArea: z
    .string()
    .max(120)
    .optional()
    .default('Artificial Intelligence & Machine Learning'),
});

const loginSchema = z.object({
  email: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
  password: z.string().min(1),
});

const showcaseSwitchSchema = z.object({
  personaKey: z.string().min(1, 'personaKey is required (e.g. student_aarav, faculty_rajesh, admin_dean)'),
});

export function serializeUser(user: IUser): Record<string, unknown> {
  const coreGradesObj: Record<string, number> = {};
  if (user.coreGrades instanceof Map) {
    for (const [k, v] of user.coreGrades.entries()) {
      coreGradesObj[k] = Number(v);
    }
  } else if (user.coreGrades && typeof user.coreGrades === 'object') {
    Object.assign(coreGradesObj, user.coreGrades);
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    contactNumber: user.contactNumber || '+91-9876543210',
    department: user.department || 'CSED',
    designation: 'Student',
    role: 'student',
    rollNumber: user.rollNumber,
    personaKey: user.personaKey || null,
    branch: user.branch || 'B.E. Computer Science & Engineering (COPC)',
    batchYear: user.batchYear,
    currentSemester: user.currentSemester,
    cgpa: user.cgpa,
    sgpaHistory: user.sgpaHistory || [],
    coreGrades: coreGradesObj,
    personalInfo: {
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber || '+91-9876543210',
      batchYear: user.batchYear,
      currentSemester: user.currentSemester,
      rollNumber: user.rollNumber,
      department: user.department || 'CSED',
    },
    academicData: {
      cgpa: user.cgpa,
      coreGrades: coreGradesObj,
    },
    codingProfileScore: user.codingProfileScore,
    mathAptitudeScore: user.mathAptitudeScore,
    skills: user.skills || [],
    areasOfInterest: user.areasOfInterest || ['Conversational AI (NVIDIA)', 'Data Science'],
    targetRoles:
      user.targetRoles ||
      user.targetCareerRoles || ['Generative AI & LLM Engineer', 'Data Scientist'],
    bio:
      user.bio ||
      user.statementOfPurpose ||
      'B.E. Computer Science & Engineering student at Thapar Institute of Engineering & Technology (TIET) specializing in data-driven elective planning.',
    skillAssessment: user.skillAssessment || {
      lastTakenAt: null,
      totalScore: 0,
      domainScores: {
        'Data Structures & Algorithms': 0,
        'Math & Linear Algebra': 0,
        'Systems & OS/Networks': 0,
        'AI & Machine Learning': 0,
        'Web & Databases': 0,
      },
      evaluatedSkillLevel: 'Novice',
      quizResponses: [],
    },
    advisorReview: user.advisorReview || {
      status: 'Pending',
      advisorNotes: '',
      reviewedByEmail: '',
      reviewedByName: '',
      reviewedAt: null,
    },
    targetCareerRoles: user.targetCareerRoles || [],
    statementOfPurpose: user.statementOfPurpose || '',
    preferenceWeights: user.preferenceWeights || {
      alpha: 0.28,
      beta: 0.24,
      gamma: 0.28,
      delta: 0.20,
    },
    rankedBasketPreferences: user.rankedBasketPreferences || [],
    rankedGenericPreferences: user.rankedGenericPreferences || [],
    preferenceLockedAt: user.preferenceLockedAt || null,
    allocatedBasketId: user.allocatedBasketId || null,
    allocatedGenericCourseCode: user.allocatedGenericCourseCode || null,
    allocationStatus: user.allocationStatus || 'pending',
    allocatedPreferenceRank: user.allocatedPreferenceRank ?? null,
    waitlistRank: user.waitlistRank ?? null,
    prerequisiteOverrides: user.prerequisiteOverrides || [],
  };
}

export function serializeTeacher(teacher: ITeacherProfile): Record<string, unknown> {
  return {
    id: String(teacher._id),
    name: teacher.name,
    email: teacher.email,
    role: teacher.role || 'faculty_advisor',
    contactNumber: teacher.contactNumber || '+91-9876543210',
    employeeId: teacher.employeeId,
    designation: teacher.designation || 'Associate Professor',
    department: teacher.department || 'CSED',
    officeRoom: teacher.officeRoom || 'CSED Block-B Room 304',
    primarySpecializationBasket: teacher.primarySpecializationBasket || 'EF_BASKET_05',
    assignedBasketId: teacher.assignedBasketId || 5,
    assignedBasketName:
      teacher.assignedBasketName || 'Artificial Intelligence and Machine Learning (AIML)',
    specializationArea:
      teacher.specializationArea || 'Artificial Intelligence & Machine Learning',
    assignedCourses: teacher.assignedCourses || [],
    assignedMentees: (teacher.assignedMentees || []).map((id) => String(id)),
    personaKey: teacher.personaKey || null,
  };
}

export class AuthController {
  constructor(private readonly env: EnvConfig) {}

  private issueTokensAndSetCookie(
    res: Response,
    account: {
      _id: unknown;
      email: string;
      name: string;
      role: 'student' | 'faculty_advisor' | 'dean_admin';
      rollNumber?: string;
      personaKey?: string;
    }
  ): { accessToken: string; refreshToken: string } {
    const payload: AuthenticatedUserPayload = {
      id: String(account._id),
      userId: String(account._id),
      email: account.email,
      name: account.name,
      role: account.role,
      rollNumber: account.rollNumber,
      personaKey: account.personaKey,
    };

    const accessToken = signAccessToken(
      payload,
      this.env.JWT_ACCESS_SECRET,
      this.env.JWT_ACCESS_EXPIRES_IN || '7d'
    );
    const refreshToken = signRefreshToken(
      payload,
      this.env.JWT_REFRESH_SECRET,
      this.env.JWT_REFRESH_EXPIRES_IN
    );

    res.cookie('tiet_refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return { accessToken, refreshToken };
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requestedRole = req.body?.role || 'student';

      if (requestedRole === 'faculty_advisor' || requestedRole === 'dean_admin') {
        const data = teacherRegisterSchema.parse({
          ...req.body,
          role: requestedRole,
        });
        const cleanEmail = data.email.trim().toLowerCase();
        const cleanEmployeeId = data.employeeId.trim();

        const [existingTeacher, existingStudentEmail] = await Promise.all([
          TeacherProfile.findOne({
            $or: [{ email: cleanEmail }, { employeeId: cleanEmployeeId }],
          }),
          User.findOne({ email: cleanEmail }),
        ]);

        if (existingTeacher?.email === cleanEmail || existingStudentEmail) {
          throw new AppError(
            `An account with email ${cleanEmail} already exists in MongoDB Atlas.`,
            409
          );
        }
        if (existingTeacher?.employeeId === cleanEmployeeId) {
          throw new AppError(
            `Employee ID ${cleanEmployeeId} is already registered in MongoDB Atlas.`,
            409
          );
        }

        const passwordHash = await bcrypt.hash(data.password, 12);
        const basketNumMatch = String(
          data.primarySpecializationBasket || 'EF_BASKET_05'
        ).match(/\d+/);
        const assignedBasketNum =
          data.assignedBasketId || (basketNumMatch ? parseInt(basketNumMatch[0], 10) : 5);
        const normalizedBasketCode =
          data.primarySpecializationBasket ||
          `EF_BASKET_${String(assignedBasketNum).padStart(2, '0')}`;

        const teacher = await TeacherProfile.create({
          name: data.name.trim(),
          email: cleanEmail,
          passwordHash,
          role: data.role,
          contactNumber: data.contactNumber,
          employeeId: cleanEmployeeId,
          designation: data.designation.trim(),
          department: data.department,
          officeRoom: data.officeRoom,
          primarySpecializationBasket: normalizedBasketCode,
          assignedBasketId: assignedBasketNum,
          assignedBasketName: data.assignedBasketName,
          specializationArea: data.specializationArea,
          assignedCourses: [],
          assignedMentees: [],
        });

        const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, teacher);
        teacher.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
        await teacher.save();

        await recordAuditLog({
          actorId: String(teacher._id),
          actorEmail: teacher.email,
          actorRole: teacher.role,
          action: 'TEACHER_REGISTERED',
          req,
          metadata: { employeeId: teacher.employeeId, role: teacher.role },
        });

        res.status(201).json({
          success: true,
          accessToken,
          tokens: { accessToken, refreshToken },
          user: serializeTeacher(teacher),
        });
        return;
      }

      // Otherwise role === 'student'
      const data = studentRegisterSchema.parse({
        ...req.body,
        role: 'student',
      });
      const cleanEmail = data.email.trim().toLowerCase();
      const cleanRollNumber = data.rollNumber.trim();

      const [existingStudent, existingTeacherEmail] = await Promise.all([
        User.findOne({
          $or: [{ email: cleanEmail }, { rollNumber: cleanRollNumber }],
        }),
        TeacherProfile.findOne({ email: cleanEmail }),
      ]);

      if (existingStudent?.email === cleanEmail || existingTeacherEmail) {
        throw new AppError(
          `An account with email ${cleanEmail} already exists in MongoDB Atlas.`,
          409
        );
      }
      if (existingStudent?.rollNumber === cleanRollNumber) {
        throw new AppError(
          `Roll Number ${cleanRollNumber} is already registered in MongoDB Atlas.`,
          409
        );
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const defaultCoreGrades = new Map<string, number>([
        ['UES103', 9],
        ['UMA022', 9],
        ['UMA023', 9],
        ['UCS301', 10],
        ['UCS303', 9],
        ['UTA018', 9],
        ['UCS405', 9],
        ['UMA021', 10],
        ['UCS415', 10],
        ['UCS310', 9],
        ['UCS414', 8],
        ['UCS321', 10],
        ['UMA401', 9],
      ]);
      if (data.coreGrades && typeof data.coreGrades === 'object') {
        for (const [k, v] of Object.entries(data.coreGrades)) {
          defaultCoreGrades.set(k.trim().toUpperCase(), Math.max(0, Math.min(10, Number(v))));
        }
      }

      const student = await User.create({
        name: data.name.trim(),
        email: cleanEmail,
        passwordHash,
        role: 'student',
        designation: 'Student',
        contactNumber: data.contactNumber,
        rollNumber: cleanRollNumber,
        department: data.department,
        branch: data.branch,
        batchYear: data.batchYear,
        currentSemester: data.currentSemester,
        cgpa: data.cgpa,
        coreGrades: defaultCoreGrades,
        skills: data.skills || ['Python', 'Machine Learning', 'Data Structures'],
        areasOfInterest: data.areasOfInterest || ['Conversational AI (NVIDIA)', 'Data Science'],
        targetRoles: data.targetRoles || ['Generative AI & LLM Engineer', 'Data Scientist'],
        targetCareerRoles: data.targetRoles || ['Generative AI & LLM Engineer', 'Data Scientist'],
        bio:
          data.bio ||
          'B.E. Computer Science & Engineering student at Thapar Institute of Engineering & Technology (TIET) specializing in data-driven elective planning.',
        statementOfPurpose:
          data.bio ||
          'B.E. Computer Science & Engineering student at Thapar Institute of Engineering & Technology (TIET) specializing in data-driven elective planning.',
      });

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, student);
      student.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await student.save();

      await recordAuditLog({
        actorId: String(student._id),
        actorEmail: student.email,
        actorRole: student.role,
        action: 'USER_REGISTERED',
        req,
        metadata: { rollNumber: student.rollNumber, role: student.role },
      });

      res.status(201).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeUser(student),
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.parse(req.body);
      const rawIdentifier = (parsed.identifier || parsed.email || '').trim();
      if (!rawIdentifier) {
        throw new AppError('Email, Roll Number, or Employee ID is required', 400);
      }

      const lowerIdentifier = rawIdentifier.toLowerCase();

      // 1. Check Student collection (`users`) first
      const student = await User.findOne({
        $or: [{ email: lowerIdentifier }, { rollNumber: rawIdentifier }],
      }).select('+passwordHash');

      if (student && student.role === 'student') {
        const validPassword = await bcrypt.compare(parsed.password, student.passwordHash);
        if (!validPassword) {
          throw new AppError('Invalid @thapar.edu email, roll number, or password', 401);
        }

        const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, student);
        student.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
        await student.save();

        await recordAuditLog({
          actorId: String(student._id),
          actorEmail: student.email,
          actorRole: student.role,
          action: 'USER_LOGIN',
          req,
        });

        res.status(200).json({
          success: true,
          accessToken,
          tokens: { accessToken, refreshToken },
          user: serializeUser(student),
        });
        return;
      }

      // 2. Check TeacherProfile collection (`teacher_profiles`)
      const teacher = await TeacherProfile.findOne({
        $or: [{ email: lowerIdentifier }, { employeeId: rawIdentifier }],
      }).select('+passwordHash');

      if (!teacher) {
        throw new AppError('Invalid @thapar.edu email, roll number, employee ID, or password', 401);
      }

      const validPassword = await bcrypt.compare(parsed.password, teacher.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid @thapar.edu email, roll number, employee ID, or password', 401);
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, teacher);
      teacher.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await teacher.save();

      await recordAuditLog({
        actorId: String(teacher._id),
        actorEmail: teacher.email,
        actorRole: teacher.role,
        action: 'TEACHER_LOGIN',
        req,
      });

      res.status(200).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeTeacher(teacher),
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token =
        (req.cookies?.tiet_refresh_token as string | undefined) ||
        (req.body?.refreshToken as string | undefined);
      if (!token) {
        throw new AppError('Missing refresh token', 401);
      }

      const decoded = jwt.verify(token, this.env.JWT_REFRESH_SECRET) as AuthenticatedUserPayload;
      const targetId = decoded.id || decoded.userId;

      if (decoded.role === 'faculty_advisor' || decoded.role === 'dean_admin') {
        const teacher = await TeacherProfile.findById(targetId);
        if (!teacher) {
          throw new AppError('Faculty account no longer active', 401);
        }
        const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, teacher);
        res.status(200).json({
          success: true,
          accessToken,
          tokens: { accessToken, refreshToken },
          user: serializeTeacher(teacher),
        });
        return;
      }

      const student = await User.findById(targetId);
      if (!student) {
        throw new AppError('Student account no longer active', 401);
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, student);
      res.status(200).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeUser(student),
      });
    } catch (_error) {
      next(new AppError('Invalid or expired refresh token', 401));
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.user?.id || req.user?.userId;
      if (targetId) {
        if (req.user?.role === 'faculty_advisor' || req.user?.role === 'dean_admin') {
          await TeacherProfile.findByIdAndUpdate(targetId, { $set: { refreshTokenHash: null } });
        } else {
          await User.findByIdAndUpdate(targetId, { $set: { refreshTokenHash: null } });
        }
      }
      res.clearCookie('tiet_refresh_token');
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.user?.id || req.user?.userId;

      if (req.user?.role === 'faculty_advisor' || req.user?.role === 'dean_admin') {
        const teacher = await TeacherProfile.findById(targetId).select('-passwordHash');
        if (!teacher) {
          throw new AppError('Authenticated faculty profile not found in teacher_profiles', 404);
        }
        res.status(200).json({
          success: true,
          user: serializeTeacher(teacher),
        });
        return;
      }

      const student = await User.findById(targetId).select('-passwordHash');
      if (!student) {
        throw new AppError('Authenticated student profile not found in users', 404);
      }
      res.status(200).json({
        success: true,
        user: serializeUser(student),
      });
    } catch (error) {
      next(error);
    }
  };

  public updateFacultyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const targetId = req.user?.id || req.user?.userId;
      const updateData: Record<string, unknown> = {};

      if (req.body.name !== undefined) updateData.name = String(req.body.name).trim();
      if (req.body.contactNumber !== undefined) {
        updateData.contactNumber = String(req.body.contactNumber).trim();
      }
      if (req.body.department !== undefined) {
        updateData.department = String(req.body.department).trim();
      }
      if (req.body.designation !== undefined) {
        updateData.designation = String(req.body.designation).trim();
      }
      if (req.body.officeRoom !== undefined) {
        updateData.officeRoom = String(req.body.officeRoom).trim();
      }
      if (req.body.specializationArea !== undefined) {
        updateData.specializationArea = String(req.body.specializationArea).trim();
      }
      if (req.body.primarySpecializationBasket !== undefined) {
        updateData.primarySpecializationBasket = String(req.body.primarySpecializationBasket).trim();
      }
      if (req.body.assignedBasketId !== undefined) {
        updateData.assignedBasketId = Number(req.body.assignedBasketId);
      }
      if (req.body.assignedBasketName !== undefined) {
        updateData.assignedBasketName = String(req.body.assignedBasketName).trim();
      }

      const updatedTeacher = await TeacherProfile.findByIdAndUpdate(
        targetId,
        { $set: updateData },
        { new: true }
      ).select('-passwordHash');

      if (!updatedTeacher) {
        throw new AppError('Faculty profile not found in teacher_profiles collection', 404);
      }

      res.status(200).json({
        success: true,
        user: serializeTeacher(updatedTeacher),
      });
    } catch (error) {
      next(error);
    }
  };

  public getShowcasePersonas = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const personas = SHOWCASE_PERSONAS.map((p) => ({
        personaKey: p.personaKey,
        label: p.label,
        subtitle: p.subtitle,
        name: p.name,
        email: p.email,
        role: p.role,
        rollNumber: p.rollNumber || null,
        employeeId: p.employeeId || null,
        cgpa: p.cgpa,
        targetCareerRoles: p.targetCareerRoles,
        rankedBasketPreferences: p.rankedBasketPreferences,
      }));

      res.status(200).json({
        success: true,
        institution: 'Thapar Institute of Engineering & Technology (TIET)',
        personas,
      });
    } catch (error) {
      next(error);
    }
  };

  public showcaseSwitch = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { personaKey } = showcaseSwitchSchema.parse(req.body);
      const seedMeta = SHOWCASE_PERSONAS.find((p) => p.personaKey === personaKey);
      if (!seedMeta) {
        throw new AppError(`Unknown TIET Showcase Persona key: ${personaKey}`, 404);
      }

      if (seedMeta.role === 'faculty_advisor' || seedMeta.role === 'dean_admin') {
        let teacher = await TeacherProfile.findOne({ email: seedMeta.email });
        if (!teacher) {
          const passwordHash = await bcrypt.hash('Thapar@2026', 10);
          teacher = await TeacherProfile.create({
            name: seedMeta.name,
            email: seedMeta.email,
            passwordHash,
            role: seedMeta.role,
            employeeId: seedMeta.employeeId || 'TIET-CSED-FA01',
            designation:
              seedMeta.role === 'dean_admin'
                ? 'Professor & Dean of Academic Affairs'
                : 'Associate Professor',
            department: 'CSED',
            officeRoom: 'CSED Block-B Room 304',
            primarySpecializationBasket: 'EF_BASKET_05',
            assignedBasketId: 5,
            assignedBasketName: 'Artificial Intelligence and Machine Learning (AIML)',
            specializationArea: 'Artificial Intelligence & Machine Learning',
            personaKey: seedMeta.personaKey,
          });
        }

        const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, teacher);
        teacher.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
        await teacher.save();

        res.status(200).json({
          success: true,
          personaKey: seedMeta.personaKey,
          label: seedMeta.label,
          subtitle: seedMeta.subtitle,
          accessToken,
          user: serializeTeacher(teacher),
        });
        return;
      }

      let student = await User.findOne({ email: seedMeta.email });
      if (!student) {
        const passwordHash = await bcrypt.hash('Thapar@2026', 10);
        student = await User.create({
          name: seedMeta.name,
          email: seedMeta.email,
          passwordHash,
          role: 'student',
          designation: 'Student',
          rollNumber: seedMeta.rollNumber || '1024030012',
          branch: 'B.E. Computer Science & Engineering (COPC)',
          batchYear: seedMeta.batchYear,
          currentSemester: seedMeta.currentSemester,
          cgpa: seedMeta.cgpa,
          sgpaHistory: seedMeta.sgpaHistory,
          coreGrades: seedMeta.coreGrades,
          codingProfileScore: seedMeta.codingProfileScore,
          mathAptitudeScore: seedMeta.mathAptitudeScore,
          skills: seedMeta.skills,
          targetCareerRoles: seedMeta.targetCareerRoles,
          statementOfPurpose: seedMeta.statementOfPurpose,
          preferenceWeights: seedMeta.preferenceWeights,
          rankedBasketPreferences: seedMeta.rankedBasketPreferences,
          rankedGenericPreferences: seedMeta.rankedGenericPreferences,
          preferenceLockedAt: new Date(),
          personaKey: seedMeta.personaKey,
        });
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, student);
      student.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await student.save();

      await recordAuditLog({
        actorId: String(student._id),
        actorEmail: student.email,
        actorRole: student.role,
        action: 'SHOWCASE_PERSONA_SWITCH',
        req,
        metadata: { personaKey: seedMeta.personaKey, role: student.role, cgpa: student.cgpa },
      });

      res.status(200).json({
        success: true,
        personaKey: seedMeta.personaKey,
        label: seedMeta.label,
        subtitle: seedMeta.subtitle,
        accessToken,
        user: serializeUser(student),
      });
    } catch (error) {
      next(error);
    }
  };
}

