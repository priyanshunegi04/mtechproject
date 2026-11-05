import axios, { AxiosError } from 'axios';
import { Request, Response, Router } from 'express';
import pino from 'pino';
import { EnvConfig } from '../config/env';

const logger = pino({ name: 'thapar-ml-routes' });

function gradeToPoint(val: string | number): number {
  if (typeof val === 'number') {
    return Math.max(0, Math.min(10, val));
  }
  const v = String(val).trim().toUpperCase();
  const map: Record<string, number> = {
    'A+': 10,
    'A': 10,
    'A-': 9,
    'B': 8,
    'B-': 7,
    'C': 6,
    'C-': 5,
    'E': 2,
    'F': 0,
  };
  if (v in map) {
    return map[v];
  }
  const parsed = parseFloat(v);
  return !isNaN(parsed) ? Math.max(0, Math.min(10, parsed)) : 8.0;
}

function parseStudentProfile(body: Record<string, any>): Record<string, any> {
  const coreGrades: Record<string, number> = {
    UES103: 9.0,
    UMA022: 8.0,
    UMA023: 8.0,
    UCS301: 9.0,
    UCS303: 8.0,
    UTA018: 9.0,
    UCS405: 8.0,
    UMA021: 8.0,
    UCS415: 9.0,
    UCS310: 8.0,
    UCS414: 8.0,
    UCS321: 9.0,
    UMA401: 8.0,
  };

  const incomingGrades = body.completed_courses || body.core_grades || body.coreGrades;
  if (incomingGrades && typeof incomingGrades === 'object') {
    for (const [k, v] of Object.entries(incomingGrades)) {
      coreGrades[k] = gradeToPoint(v as string | number);
    }
  }

  const cgpa = Number(body.cgpa ?? body.cgpa_sem4 ?? 8.2);

  const profile = {
    student_id: body.student_id || `STU_${body.roll_no || body.rollNumber || '1024030001'}`,
    roll_no: body.roll_no || body.rollNumber || '1024030001',
    cgpa_sem4: cgpa,
    core_grades: coreGrades,
    coding_profile_score: Number(body.coding_profile_score ?? Number((cgpa * 9.5).toFixed(1))),
    math_aptitude_score: Number(body.math_aptitude_score ?? Number((cgpa * 9.4).toFixed(1))),
    technical_skills: Array.isArray(body.skills)
      ? body.skills
      : Array.isArray(body.technical_skills)
      ? body.technical_skills
      : ['Python', 'C++', 'SQL'],
    preferred_career_track:
      body.career_interest || body.preferred_career_track || 'Machine Learning Engineer',
    interests_text:
      body.interests_text ||
      body.statementOfPurpose ||
      body.career_interest ||
      'Machine Learning, Artificial Intelligence, and Software Engineering',
    projects_text: body.projects_text || '',
    statement_of_purpose: body.statementOfPurpose || body.statement_of_purpose || '',
    completed_credits: Number(body.completed_credits ?? 82.0),
    max_weekly_hours: Number(body.target_workload ?? body.max_weekly_hours ?? 24.0),
  };

  if (body.student_profile && typeof body.student_profile === 'object') {
    return { ...profile, ...body.student_profile };
  }
  return profile;
}

export function createMlRouter(env: EnvConfig): Router {
  const router = Router();
  const mlServiceUrl = (process.env.ML_SERVICE_URL || env.ML_SERVICE_URL).replace(/\/+$/, '');
  const apiKey = env.ML_SERVICE_API_KEY;

  const client = axios.create({
    baseURL: mlServiceUrl,
    timeout: 30000, // 30-second timeout to handle Render cold-starts gracefully
    headers: {
      'Content-Type': 'application/json',
      'X-ML-Service-Key': apiKey,
      'X-ML-Api-Key': apiKey,
    },
  });

  // POST /api/ml/recommend-baskets
  router.post('/recommend-baskets', async (req: Request, res: Response) => {
    try {
      const studentProfile = parseStudentProfile(req.body);
      const weights = req.body.weights || undefined;

      const response = await client.post('/api/ml/recommend-baskets', {
        student_profile: studentProfile,
        weights,
      });

      return res.status(200).json(response.data);
    } catch (err: unknown) {
      const error = err as AxiosError;
      logger.warn(
        { err: error.message, code: error.code },
        'FastAPI ml-service unreachable or cold-starting during recommend-baskets'
      );
      return res.status(502).json({
        success: false,
        error: 'ML Microservice unavailable or cold-starting',
        details: error.response?.data || error.message,
      });
    }
  });

  // POST /api/ml/predict-performance
  router.post('/predict-performance', async (req: Request, res: Response) => {
    try {
      const studentProfile = parseStudentProfile(req.body);
      const selectedCourseCodes =
        req.body.courseIds || req.body.selected_course_codes || req.body.courses || [];

      const response = await client.post('/api/ml/predict-performance', {
        student_profile: studentProfile,
        selected_course_codes: selectedCourseCodes,
      });

      return res.status(200).json(response.data);
    } catch (err: unknown) {
      const error = err as AxiosError;
      logger.warn(
        { err: error.message, code: error.code },
        'FastAPI ml-service unreachable or cold-starting during predict-performance'
      );
      return res.status(502).json({
        success: false,
        error: 'ML Microservice unavailable or cold-starting',
        details: error.response?.data || error.message,
      });
    }
  });

  // POST /api/ml/peer-cohort-insights
  router.post('/peer-cohort-insights', async (req: Request, res: Response) => {
    try {
      const studentProfile = parseStudentProfile(req.body);
      const topK = Number(req.body.top_k || req.body.topK || 50);

      const response = await client.post('/api/ml/peer-cohort-insights', {
        student_profile: studentProfile,
        top_k: topK,
      });

      return res.status(200).json(response.data);
    } catch (err: unknown) {
      const error = err as AxiosError;
      logger.warn(
        { err: error.message, code: error.code },
        'FastAPI ml-service unreachable or cold-starting during peer-cohort-insights'
      );
      return res.status(502).json({
        success: false,
        error: 'ML Microservice unavailable or cold-starting',
        details: error.response?.data || error.message,
      });
    }
  });

  return router;
}

