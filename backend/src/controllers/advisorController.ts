import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares';
import { User } from '../models';
import { computeTieBreakerCoreGpa, recordAuditLog } from '../services';
import { serializeUser } from './authController';

const overridePrerequisiteSchema = z.object({
  rollNumber: z.string().min(4),
  targetCode: z.string().min(3, 'Provide Basket ID (e.g. EF_BASKET_04) or Course Code (e.g. UCS635)'),
  reason: z.string().min(5, 'Documented academic justification is required for TIET audit logs'),
});

export class AdvisorController {
  public getAdviseeStudents = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const search = String(req.query.search || '').trim().toLowerCase();
      const students = await User.find({ role: 'student' }).sort({ cgpa: -1 });

      const serialized = students
        .filter((s) => {
          if (!search) return true;
          return (
            s.name.toLowerCase().includes(search) ||
            (s.rollNumber || '').toLowerCase().includes(search) ||
            s.email.toLowerCase().includes(search)
          );
        })
        .map((s) => ({
          ...serializeUser(s),
          tieBreakerCoreGpa: computeTieBreakerCoreGpa(s),
        }));

      res.status(200).json({
        success: true,
        count: serialized.length,
        students: serialized,
      });
    } catch (error) {
      next(error);
    }
  };

  public grantPrerequisiteOverride = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { rollNumber, targetCode, reason } = overridePrerequisiteSchema.parse(req.body);
      const student = await User.findOne({ rollNumber: rollNumber.trim(), role: 'student' });

      if (!student) {
        throw new AppError(`Student with TIET Roll Number ${rollNumber} not found`, 404);
      }

      const cleanTarget = targetCode.trim().toUpperCase();
      student.prerequisiteOverrides = student.prerequisiteOverrides || [];
      student.prerequisiteOverrides.push({
        targetCode: cleanTarget,
        approvedByEmail: req.user?.email || 'rajesh.kumar@thapar.edu',
        approvedByName: req.user?.name || 'Dr. Rajesh Kumar',
        reason: reason.trim(),
        approvedAt: new Date(),
      });

      await student.save();

      await recordAuditLog({
        actorId: req.user?.userId || 'advisor',
        actorEmail: req.user?.email || 'rajesh.kumar@thapar.edu',
        actorRole: req.user?.role || 'faculty_advisor',
        action: 'FACULTY_ADVISOR_PREREQUISITE_OVERRIDE',
        req,
        metadata: {
          studentRollNumber: student.rollNumber,
          studentEmail: student.email,
          targetCode: cleanTarget,
          reason,
        },
      });

      res.status(200).json({
        success: true,
        message: `Prerequisite waiver granted for ${student.name} (${student.rollNumber}) on ${cleanTarget}.`,
        student: serializeUser(student),
      });
    } catch (error) {
      next(error);
    }
  };
}

