import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares';
import { Basket, Course, User } from '../models';
import { MLGatewayService, recordAuditLog } from '../services';
import { serializeUser } from './authController';

const updateProfileSchema = z.object({
  skills: z.array(z.string()).max(25).optional(),
  targetCareerRoles: z.array(z.string()).max(10).optional(),
  statementOfPurpose: z.string().max(2500).optional(),
  codingProfileScore: z.number().min(0).max(100).optional(),
  mathAptitudeScore: z.number().min(0).max(100).optional(),
  preferenceWeights: z
    .object({
      alpha: z.number().min(0).max(1),
      beta: z.number().min(0).max(1),
      gamma: z.number().min(0).max(1),
      delta: z.number().min(0).max(1),
    })
    .optional(),
});

const lockPreferencesSchema = z.object({
  rankedBasketPreferences: z
    .array(z.string())
    .min(1, 'Select at least 1 Elective Focus Basket preference')
    .max(5, 'Maximum 5 ranked Elective Focus Basket preferences allowed'),
  rankedGenericPreferences: z
    .array(z.string())
    .min(1, 'Select at least 1 Semester V Generic Elective preference')
    .max(5, 'Maximum 5 ranked Generic Elective preferences allowed'),
  lockSubmission: z.boolean().default(true),
});

export class StudentController {
  constructor(private readonly mlGateway: MLGatewayService) {}

  public getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found in MongoDB Atlas', 404);
      }

      const allocatedBasket = user.allocatedBasketId
        ? await Basket.findOne({ basketId: user.allocatedBasketId }).lean()
        : null;
      const allocatedGeneric = user.allocatedGenericCourseCode
        ? await Course.findOne({ courseCode: user.allocatedGenericCourseCode }).lean()
        : null;

      res.status(200).json({
        success: true,
        student: serializeUser(user),
        user: serializeUser(user),
        allotmentDetails: {
          status: user.allocationStatus,
          allocatedBasket,
          allocatedGeneric,
          allocatedPreferenceRank: user.allocatedPreferenceRank ?? null,
          waitlistRank: user.waitlistRank ?? null,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateMyProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      if (data.skills !== undefined) user.skills = data.skills;
      if (data.targetCareerRoles !== undefined) user.targetCareerRoles = data.targetCareerRoles;
      if (data.statementOfPurpose !== undefined) user.statementOfPurpose = data.statementOfPurpose;
      if (data.codingProfileScore !== undefined) user.codingProfileScore = data.codingProfileScore;
      if (data.mathAptitudeScore !== undefined) user.mathAptitudeScore = data.mathAptitudeScore;
      if (data.preferenceWeights !== undefined) {
        user.preferenceWeights = {
          alpha: data.preferenceWeights.alpha ?? user.preferenceWeights?.alpha ?? 0.25,
          beta: data.preferenceWeights.beta ?? user.preferenceWeights?.beta ?? 0.25,
          gamma: data.preferenceWeights.gamma ?? user.preferenceWeights?.gamma ?? 0.25,
          delta: data.preferenceWeights.delta ?? user.preferenceWeights?.delta ?? 0.25,
        };
      }

      await user.save();

      await recordAuditLog({
        actorId: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: 'STUDENT_PROFILE_UPDATED',
        req,
        metadata: { updatedFields: Object.keys(data) },
      });

      res.status(200).json({
        success: true,
        student: serializeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  public saveAndLockPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { rankedBasketPreferences, rankedGenericPreferences, lockSubmission } =
        lockPreferencesSchema.parse(req.body);

      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      // Deduplicate while preserving rank order
      const cleanBaskets = Array.from(
        new Set(rankedBasketPreferences.map((b) => b.trim().toUpperCase()))
      );
      const cleanGenerics = Array.from(
        new Set(rankedGenericPreferences.map((g) => g.trim().toUpperCase()))
      );

      user.rankedBasketPreferences = cleanBaskets;
      user.rankedGenericPreferences = cleanGenerics;
      if (lockSubmission) {
        user.preferenceLockedAt = new Date();
      }
      await user.save();

      await recordAuditLog({
        actorId: String(user._id),
        actorEmail: user.email,
        actorRole: user.role,
        action: lockSubmission ? 'COUNSELING_PREFERENCES_LOCKED' : 'COUNSELING_PREFERENCES_SAVED',
        req,
        metadata: {
          rollNumber: user.rollNumber,
          cgpa: user.cgpa,
          rankedBasketPreferences: cleanBaskets,
          rankedGenericPreferences: cleanGenerics,
        },
      });

      res.status(200).json({
        success: true,
        message: lockSubmission
          ? 'Official TIET Elective Focus Basket & Generic Elective preferences locked for Merit Seat Allocation.'
          : 'Elective preferences saved as draft.',
        student: serializeUser(user),
      });
    } catch (error) {
      next(error);
    }
  };

  public recommendBaskets = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      const customWeights = req.body?.weights;
      const mlData = await this.mlGateway.recommendBaskets(user, customWeights);
      res.status(200).json(mlData);
    } catch (error) {
      next(error);
    }
  };

  public recommendCourses = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      const mlData = await this.mlGateway.recommendCourses(user, {
        semester: req.body?.semester ? Number(req.body.semester) : undefined,
        elective_slot: req.body?.elective_slot,
        basket_id: req.body?.basket_id,
        category: req.body?.category,
        weights: req.body?.weights,
      });
      res.status(200).json(mlData);
    } catch (error) {
      next(error);
    }
  };

  public predictPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      const selectedCourseCodes: string[] = Array.isArray(req.body?.selected_course_codes)
        ? req.body.selected_course_codes
        : Array.isArray(req.body?.selectedCourseCodes)
          ? req.body.selectedCourseCodes
          : [];

      if (selectedCourseCodes.length === 0) {
        throw new AppError('Provide at least one course code in selected_course_codes', 400);
      }

      const mlData = await this.mlGateway.predictPerformance(user, selectedCourseCodes);
      res.status(200).json(mlData);
    } catch (error) {
      next(error);
    }
  };

  public peerCohortInsights = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      const topK = req.body?.top_k ? Number(req.body.top_k) : 50;
      const mlData = await this.mlGateway.peerCohortInsights(user, topK);
      res.status(200).json(mlData);
    } catch (error) {
      next(error);
    }
  };

  public advisorChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user?.userId);
      if (!user) {
        throw new AppError('Student profile not found', 404);
      }

      const message = String(req.body?.message || '').trim();
      if (!message) {
        throw new AppError('Message is required for AI Academic Advisor chat', 400);
      }

      const mlData = await this.mlGateway.advisorChat(
        user,
        message,
        req.body?.conversation_history
      );
      res.status(200).json(mlData);
    } catch (error) {
      next(error);
    }
  };
}

