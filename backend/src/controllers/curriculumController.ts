import { NextFunction, Request, Response } from 'express';
import { Basket, CounselingRound, Course } from '../models';

export class CurriculumController {
  public getBaskets = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const baskets = await Basket.find({ isActive: true }).sort({ basketNumber: 1 }).lean();
      res.status(200).json({
        success: true,
        count: baskets.length,
        baskets,
      });
    } catch (error) {
      next(error);
    }
  };

  public getCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter: Record<string, unknown> = { isActive: true };
      if (req.query.category) {
        filter.category = String(req.query.category).toUpperCase();
      }
      if (req.query.semester) {
        filter.semester = Number(req.query.semester);
      }
      if (req.query.basketId) {
        filter.basketId = String(req.query.basketId).toUpperCase();
      }
      if (req.query.electiveSlot) {
        filter.electiveSlot = String(req.query.electiveSlot).toUpperCase();
      }

      const courses = await Course.find(filter).sort({ semester: 1, courseCode: 1 }).lean();
      res.status(200).json({
        success: true,
        count: courses.length,
        courses,
      });
    } catch (error) {
      next(error);
    }
  };

  public getActiveCounselingRound = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const round = await CounselingRound.findOne().sort({ updatedAt: -1 }).lean();
      res.status(200).json({
        success: true,
        round,
      });
    } catch (error) {
      next(error);
    }
  };
}

