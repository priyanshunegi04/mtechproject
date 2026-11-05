import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { EnvConfig } from '../config/env';
import {
  AdminController,
  AdvisorController,
  AuthController,
  CurriculumController,
  StudentController,
} from '../controllers';
import { requireAuth, requireRole } from '../middlewares';
import { MLGatewayService } from '../services';
import { createMlRouter } from './mlRoutes';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export function createApiRouter(env: EnvConfig): Router {
  const router = Router();
  const mlGateway = new MLGatewayService(env);

  const authController = new AuthController(env);
  const studentController = new StudentController(mlGateway);
  const curriculumController = new CurriculumController();
  const adminController = new AdminController(mlGateway);
  const advisorController = new AdvisorController();

  const authGuard = requireAuth(env.JWT_ACCESS_SECRET);

  // Tiered Rate Limiters
  const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Strict authentication rate limit exceeded. Please try again later.',
    },
  });

  const recommendationLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RECOMMENDATION_RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Recommendation inference rate limit exceeded. Please try again shortly.',
    },
  });

  // ---------------------------------------------------------------------------
  // 1. Institutional Authentication & Showcase Persona Switcher Routes
  // ---------------------------------------------------------------------------
  router.use('/auth', authLimiter);
  router.post('/auth/register', authController.register);
  router.post('/auth/login', authController.login);
  router.post('/auth/refresh', authController.refresh);
  router.post('/auth/logout', authGuard, authController.logout);
  router.get('/auth/me', authGuard, authController.getMe);
  router.get('/auth/showcase-personas', authController.getShowcasePersonas);
  router.post('/auth/showcase-switch', authController.showcaseSwitch);

  // ---------------------------------------------------------------------------
  // 2. Official TIET B.E. CSE 2026 Curriculum & Counseling Round Routes
  // ---------------------------------------------------------------------------
  router.get('/curriculum/baskets', curriculumController.getBaskets);
  router.get('/curriculum/courses', curriculumController.getCourses);
  router.get('/counseling/active-round', curriculumController.getActiveCounselingRound);

  // ---------------------------------------------------------------------------
  // 3. Student Portal & Hybrid ML Recommendation Routes
  // ---------------------------------------------------------------------------
  router.get('/students/me', authGuard, studentController.getMyProfile);
  router.put('/students/me/profile', authGuard, studentController.updateMyProfile);
  router.post('/students/me/preferences', authGuard, studentController.saveAndLockPreferences);
  router.put('/students/me/preferences', authGuard, studentController.saveAndLockPreferences);

  router.post(
    '/students/me/recommend-baskets',
    recommendationLimiter,
    authGuard,
    studentController.recommendBaskets
  );
  router.post(
    '/students/me/recommend-courses',
    recommendationLimiter,
    authGuard,
    studentController.recommendCourses
  );
  router.post(
    '/students/me/predict-performance',
    recommendationLimiter,
    authGuard,
    studentController.predictPerformance
  );
  router.post(
    '/students/me/peer-cohort-insights',
    recommendationLimiter,
    authGuard,
    studentController.peerCohortInsights
  );
  router.post('/students/me/advisor-chat', authGuard, studentController.advisorChat);

  // Direct `/recommendations/*` enterprise endpoints with tiered rate limiting
  router.use('/recommendations', recommendationLimiter);
  router.post('/recommendations/baskets', authGuard, studentController.recommendBaskets);
  router.post('/recommendations/courses', authGuard, studentController.recommendCourses);
  router.post('/recommendations/predict', authGuard, studentController.predictPerformance);
  router.post('/recommendations/peer-cohort', authGuard, studentController.peerCohortInsights);

  // Direct `/ml/*` Proxy Routes for Live Python ML Inference
  router.use('/ml', recommendationLimiter, createMlRouter(env));

  // ---------------------------------------------------------------------------
  // 4. Faculty Advisor Routes (Advisee Roster & Documented Prerequisite Waivers)
  // ---------------------------------------------------------------------------
  router.get(
    '/advisor/students',
    authGuard,
    requireRole(['faculty_advisor', 'dean_admin']),
    advisorController.getAdviseeStudents
  );
  router.post(
    '/advisor/override-prerequisite',
    authGuard,
    requireRole(['faculty_advisor', 'dean_admin']),
    advisorController.grantPrerequisiteOverride
  );
  router.post(
    '/admin/students/prerequisite-override',
    authGuard,
    requireRole(['faculty_advisor', 'dean_admin']),
    advisorController.grantPrerequisiteOverride
  );

  // ---------------------------------------------------------------------------
  // 5. Dean of Academic Affairs / CSED HOD Admin Routes
  // ---------------------------------------------------------------------------
  router.post(
    '/admin/import-students-csv',
    authGuard,
    requireRole(['dean_admin']),
    upload.single('file'),
    adminController.uploadWebkioskCsv
  );
  router.post(
    '/admin/webkiosk/upload-csv',
    authGuard,
    requireRole(['dean_admin']),
    upload.single('file'),
    adminController.uploadWebkioskCsv
  );
  router.post(
    '/admin/allocate-seats',
    authGuard,
    requireRole(['dean_admin']),
    adminController.executeSeatAllocation
  );
  router.post(
    '/admin/counseling/allocate',
    authGuard,
    requireRole(['dean_admin']),
    adminController.executeSeatAllocation
  );
  router.get(
    '/admin/counseling/roster',
    authGuard,
    requireRole(['dean_admin', 'faculty_advisor']),
    adminController.downloadAllotmentRoster
  );
  router.put(
    '/admin/seat-matrix',
    authGuard,
    requireRole(['dean_admin']),
    adminController.updateSeatMatrix
  );
  router.get(
    '/admin/analytics',
    authGuard,
    requireRole(['dean_admin', 'faculty_advisor']),
    adminController.getAdminAnalytics
  );
  router.post(
    '/admin/ml/retrain',
    authGuard,
    requireRole(['dean_admin']),
    adminController.triggerMlRetrain
  );

  return router;
}
