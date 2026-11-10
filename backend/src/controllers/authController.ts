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
import { IUser, User } from '../models';
import { recordAuditLog, SHOWCASE_PERSONAS } from '../services';

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z
    .string()
    .email()
    .regex(/^[a-zA-Z0-9._%+-]+@thapar\.edu$/i, 'Email must belong to the @thapar.edu domain'),
  password: z.string().min(8).max(100),
  contactNumber: z.string().max(30).optional().default('+91-9876543210'),
  rollNumber: z.string().min(3).max(30).optional(),
  employeeId: z.string().min(2).max(30).optional(),
  department: z.string().max(80).optional().default('CSED'),
  designation: z.string().max(80).optional().default('Associate Professor'),
  primarySpecializationBasket: z.string().max(40).optional().default('EF_BASKET_05'),
  batchYear: z.coerce.number().int().min(2018).max(2032).default(2024),
  currentSemester: z.coerce.number().int().min(1).max(8).default(4),
  cgpa: z.coerce.number().min(0).max(10).default(7.8),
  coreGrades: z.record(z.string(), z.coerce.number().min(0).max(10)).optional(),
  role: z.enum(['student', 'faculty_advisor', 'dean_admin']).default('student'),
  skills: z.array(z.string()).optional(),
  areasOfInterest: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
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
    designation: user.designation || 'Associate Professor',
    primarySpecializationBasket: user.primarySpecializationBasket || 'EF_BASKET_05',
    role: user.role,
    rollNumber: user.rollNumber || null,
    employeeId: user.employeeId || null,
    personaKey: user.personaKey || null,
    branch: user.branch,
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
      rollNumber: user.rollNumber || undefined,
      employeeId: user.employeeId || undefined,
      department: user.department || 'CSED',
    },
    academicData: {
      cgpa: user.cgpa,
      coreGrades: coreGradesObj,
    },
    codingProfileScore: user.codingProfileScore,
    mathAptitudeScore: user.mathAptitudeScore,
    skills: user.skills || [],
    areasOfInterest: user.areasOfInterest || ['Data Science', 'Artificial Intelligence'],
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

export class AuthController {
  constructor(private readonly env: EnvConfig) {}

  private issueTokensAndSetCookie(res: Response, user: IUser): { accessToken: string; refreshToken: string } {
    const payload: AuthenticatedUserPayload = {
      id: String(user._id),
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      rollNumber: user.rollNumber,
      personaKey: user.personaKey,
    };

    const accessToken = signAccessToken(
      payload,
      this.env.JWT_ACCESS_SECRET,
      this.env.JWT_ACCESS_EXPIRES_IN
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
      const data = registerSchema.parse(req.body);
      const passwordHash = await bcrypt.hash(data.password, 12);

      const defaultCoreGrades = new Map<string, number>([
        ['UES103', 8],
        ['UMA022', 8],
        ['UMA023', 8],
        ['UCS301', 8],
        ['UCS303', 8],
        ['UTA018', 8],
        ['UCS405', 8],
        ['UMA021', 8],
        ['UCS415', 8],
        ['UCS310', 8],
        ['UCS414', 8],
        ['UCS321', 8],
        ['UMA401', 8],
      ]);
      if (data.coreGrades && typeof data.coreGrades === 'object') {
        for (const [k, v] of Object.entries(data.coreGrades)) {
          defaultCoreGrades.set(k.trim().toUpperCase(), Math.max(0, Math.min(10, Number(v))));
        }
      }

      const user = await User.create({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        contactNumber: data.contactNumber,
        department: data.department,
        designation: data.designation,
        primarySpecializationBasket: data.primarySpecializationBasket,
        role: data.role,
        rollNumber: data.rollNumber,
        employeeId: data.employeeId,
        batchYear: data.batchYear,
        currentSemester: data.currentSemester,
        cgpa: data.cgpa,
        coreGrades: defaultCoreGrades,
        skills: data.skills || ['Python', 'C++', 'Data Structures', 'SQL'],
        areasOfInterest: data.areasOfInterest || ['Data Science', 'Artificial Intelligence'],
      });

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, user);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await user.save();

      await recordAuditLog({
        actorId: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_REGISTERED',
        req,
        metadata: { rollNumber: user.rollNumber, role: user.role },
      });

      res.status(201).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

      if (!user) {
        throw new AppError('Invalid @thapar.edu email or password', 401);
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid @thapar.edu email or password', 401);
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, user);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await user.save();

      await recordAuditLog({
        actorId: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'USER_LOGIN',
        req,
      });

      res.status(200).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeUser(user),
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
      const user = await User.findById(decoded.userId);
      if (!user) {
        throw new AppError('User account no longer active', 401);
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, user);
      res.status(200).json({
        success: true,
        accessToken,
        tokens: { accessToken, refreshToken },
        user: serializeUser(user),
      });
    } catch (_error) {
      next(new AppError('Invalid or expired refresh token', 401));
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.userId) {
        await User.findByIdAndUpdate(req.user.userId, { $set: { refreshTokenHash: null } });
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
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Authenticated user profile not found', 404);
      }
      res.status(200).json({
        success: true,
        user: serializeUser(user),
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

      let user = await User.findOne({ email: seedMeta.email });
      if (!user) {
        const passwordHash = await bcrypt.hash('Thapar@2026', 10);
        user = await User.create({
          ...seedMeta,
          passwordHash,
          branch: 'B.E. Computer Science & Engineering (COPC)',
          preferenceLockedAt: seedMeta.role === 'student' ? new Date() : null,
        });
      }

      const { accessToken, refreshToken } = this.issueTokensAndSetCookie(res, user);
      user.refreshTokenHash = await bcrypt.hash(refreshToken, 8);
      await user.save();

      await recordAuditLog({
        actorId: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'SHOWCASE_PERSONA_SWITCH',
        req,
        metadata: { personaKey: seedMeta.personaKey, role: user.role, cgpa: user.cgpa },
      });

      res.status(200).json({
        success: true,
        personaKey: seedMeta.personaKey,
        label: seedMeta.label,
        subtitle: seedMeta.subtitle,
        accessToken,
        user: serializeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };
}

