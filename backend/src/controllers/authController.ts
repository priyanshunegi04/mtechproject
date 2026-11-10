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
  assignedBasketId: z.coerce.number().int().min(1).max(12).optional().default(5),
  assignedBasketName: z.string().max(120).optional().default('Artificial Intelligence and Machine Learning (AIML)'),
  officeRoom: z.string().max(80).optional().default('CSED Block-B Room 304'),
  specializationArea: z.string().max(120).optional().default('Artificial Intelligence & Machine Learning'),
  batchYear: z.coerce.number().int().min(2018).max(2032).default(2024),
  currentSemester: z.coerce.number().int().min(1).max(8).default(4),
  cgpa: z.coerce.number().min(0).max(10).default(7.8),
  coreGrades: z.record(z.string(), z.coerce.number().min(0).max(10)).optional(),
  role: z.enum(['student', 'faculty_advisor', 'dean_admin']).default('student'),
  skills: z.array(z.string()).optional(),
  areasOfInterest: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  bio: z.string().max(2500).optional(),
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
    designation: user.designation || 'Associate Professor',
    primarySpecializationBasket: user.primarySpecializationBasket || 'EF_BASKET_05',
    assignedBasketId: user.assignedBasketId || 5,
    assignedBasketName:
      user.assignedBasketName || 'Artificial Intelligence and Machine Learning (AIML)',
    officeRoom: user.officeRoom || 'CSED Block-B Room 304',
    specializationArea:
      user.specializationArea || 'Artificial Intelligence & Machine Learning',
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
    areasOfInterest: user.areasOfInterest || ['Conversational AI (NVIDIA)', 'Data Science'],
    targetRoles: user.targetRoles || user.targetCareerRoles || ['Generative AI & LLM Engineer', 'Data Scientist'],
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
      const data = registerSchema.parse(req.body);
      const cleanEmail = data.email.trim().toLowerCase();

      const conflictConditions: Record<string, unknown>[] = [{ email: cleanEmail }];
      if (data.rollNumber) {
        conflictConditions.push({ rollNumber: data.rollNumber.trim() });
      }
      if (data.employeeId) {
        conflictConditions.push({ employeeId: data.employeeId.trim() });
      }

      const existingUser = await User.findOne({ $or: conflictConditions });
      if (existingUser) {
        if (existingUser.email === cleanEmail) {
          throw new AppError(`An account with email ${cleanEmail} already exists in MongoDB Atlas.`, 409);
        }
        if (data.rollNumber && existingUser.rollNumber === data.rollNumber.trim()) {
          throw new AppError(`Roll Number ${data.rollNumber.trim()} is already registered in MongoDB Atlas.`, 409);
        }
        if (data.employeeId && existingUser.employeeId === data.employeeId.trim()) {
          throw new AppError(`Employee ID ${data.employeeId.trim()} is already registered in MongoDB Atlas.`, 409);
        }
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

      const basketNumMatch = String(data.primarySpecializationBasket || 'EF_BASKET_05').match(/\d+/);
      const assignedBasketNum = data.assignedBasketId || (basketNumMatch ? parseInt(basketNumMatch[0], 10) : 5);

      const user = await User.create({
        name: data.name,
        email: cleanEmail,
        passwordHash,
        contactNumber: data.contactNumber,
        department: data.department,
        designation: data.designation,
        primarySpecializationBasket: data.primarySpecializationBasket,
        assignedBasketId: assignedBasketNum,
        assignedBasketName: data.assignedBasketName,
        officeRoom: data.officeRoom,
        specializationArea: data.specializationArea,
        role: data.role,
        rollNumber: data.rollNumber ? data.rollNumber.trim() : undefined,
        employeeId: data.employeeId ? data.employeeId.trim() : undefined,
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
      const parsed = loginSchema.parse(req.body);
      const rawIdentifier = (parsed.identifier || parsed.email || '').trim();
      if (!rawIdentifier) {
        throw new AppError('Email, Roll Number, or Employee ID is required', 400);
      }

      const lowerIdentifier = rawIdentifier.toLowerCase();
      const user = await User.findOne({
        $or: [
          { email: lowerIdentifier },
          { rollNumber: rawIdentifier },
          { employeeId: rawIdentifier },
        ],
      }).select('+passwordHash');

      if (!user) {
        throw new AppError('Invalid @thapar.edu email, roll number, or password', 401);
      }

      const validPassword = await bcrypt.compare(parsed.password, user.passwordHash);
      if (!validPassword) {
        throw new AppError('Invalid @thapar.edu email, roll number, or password', 401);
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
      const targetId = req.user?.id || req.user?.userId;
      const user = await User.findById(targetId).select('-passwordHash');
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

      const updatedUser = await User.findByIdAndUpdate(
        targetId,
        { $set: updateData },
        { new: true }
      ).select('-passwordHash');

      if (!updatedUser) {
        throw new AppError('Faculty profile not found in MongoDB Atlas', 404);
      }

      res.status(200).json({
        success: true,
        user: serializeUser(updatedUser),
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

