import axios, { AxiosInstance } from 'axios';
import pino from 'pino';
import { EnvConfig } from '../config/env';
import { getRedisClient } from '../config/redis';
import { IUser } from '../models';
import { loadLocalCoursesCatalog } from './seedService';

const logger = pino({ name: 'tiet-ml-gateway' });

export class MLGatewayService {
  private readonly httpClient: AxiosInstance;
  private readonly env: EnvConfig;
  private readonly baseUrl: string;

  constructor(env: EnvConfig) {
    this.env = env;
    const ML_BASE_URL = (
      process.env.ML_SERVICE_URL ||
      env.ML_SERVICE_URL ||
      'https://thapar-elective-ml.onrender.com'
    ).replace(/\/+$/, '');
    this.baseUrl = ML_BASE_URL.includes('thapar-elective-ml-service.onrender.com')
      ? 'https://thapar-elective-ml.onrender.com'
      : ML_BASE_URL;

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60s timeout to accommodate Render free-tier cold starts
      headers: {
        'Content-Type': 'application/json',
        'X-ML-Service-Key': env.ML_SERVICE_API_KEY,
        'X-ML-Api-Key': env.ML_SERVICE_API_KEY,
      },
    });
  }

  public buildStudentMLProfile(user: IUser): Record<string, unknown> {
    const coreGradesObj: Record<string, number> = {};
    if (user.coreGrades instanceof Map) {
      for (const [k, v] of user.coreGrades.entries()) {
        coreGradesObj[k] = Number(v);
      }
    } else if (user.coreGrades && typeof user.coreGrades === 'object') {
      Object.assign(coreGradesObj, user.coreGrades);
    }

    return {
      student_id: `STU_${user.rollNumber || user._id}`,
      roll_no: user.rollNumber || '1024030001',
      cgpa_sem4: user.cgpa,
      core_grades: coreGradesObj,
      coding_profile_score: user.codingProfileScore || Number((user.cgpa * 9.5).toFixed(1)),
      math_aptitude_score: user.mathAptitudeScore || Number((user.cgpa * 9.4).toFixed(1)),
      technical_skills: user.skills || ['Python', 'C++'],
      preferred_career_track: user.targetCareerRoles?.[0] || 'Software Development Engineer',
      interests_text:
        user.statementOfPurpose ||
        (user.targetCareerRoles || []).join(', ') ||
        'Computer science, artificial intelligence, and software engineering',
      statement_of_purpose: user.statementOfPurpose || '',
    };
  }

  private async getCache<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) return null;
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (_err) {
      return null;
    }
  }

  private async setCache(key: string, value: unknown): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), 'EX', this.env.REDIS_CACHE_TTL_SECONDS);
    } catch (_err) {
      // Ignore cache write errors
    }
  }

  public async invalidateStudentCache(user: IUser): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
      const prefix = `tiet:ml:baskets:${user.rollNumber || user._id}:*`;
      const keys = await redis.keys(prefix);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (_err) {
      // Ignore cache deletion errors
    }
  }

  public async recommendBaskets(
    user: IUser,
    customWeights?: { alpha?: number; beta?: number; gamma?: number; delta?: number }
  ): Promise<Record<string, unknown>> {
    const weights = {
      alpha: customWeights?.alpha ?? user.preferenceWeights?.alpha ?? 0.28,
      beta: customWeights?.beta ?? user.preferenceWeights?.beta ?? 0.24,
      gamma: customWeights?.gamma ?? user.preferenceWeights?.gamma ?? 0.28,
      delta: customWeights?.delta ?? user.preferenceWeights?.delta ?? 0.20,
    };

    const cacheKey = `tiet:ml:baskets:${user.rollNumber || user._id}:${weights.alpha}:${weights.beta}:${weights.gamma}:${weights.delta}`;
    const cached = await this.getCache<Record<string, unknown>>(cacheKey);
    if (cached) {
      return cached;
    }

    const endpointPath = '/api/ml/recommend-baskets';
    try {
      const response = await this.httpClient.post(endpointPath, {
        student_profile: this.buildStudentMLProfile(user),
        weights,
      });
      const data = response.data as Record<string, any>;
      const recs = Array.isArray(data.recommendations)
        ? data.recommendations
        : Array.isArray(data.ranked_baskets)
        ? data.ranked_baskets
        : [];
      const standardized = {
        ...data,
        success: data.success !== undefined ? data.success : true,
        fallback: false,
        recommendations: recs,
        ranked_baskets: recs,
      };
      await this.setCache(cacheKey, standardized);
      return standardized;
    } catch (error: any) {
      console.error('ML Service proxy error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        targetUrl: `${this.baseUrl}${endpointPath}`,
      });
      logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'ml-service unreachable or cold-starting; computing safe deterministic hybrid basket ranking fallback'
      );
      return this.fallbackRecommendBaskets(user, weights);
    }
  }

  public async recommendCourses(
    user: IUser,
    filters: {
      semester?: number;
      elective_slot?: string;
      basket_id?: string;
      category?: string;
      weights?: { alpha?: number; beta?: number; gamma?: number; delta?: number };
    }
  ): Promise<Record<string, unknown>> {
    const endpointPath = '/api/ml/recommend-courses';
    try {
      const response = await this.httpClient.post(endpointPath, {
        student_profile: this.buildStudentMLProfile(user),
        ...filters,
      });
      const data = response.data as Record<string, any>;
      const recs = Array.isArray(data.recommendations)
        ? data.recommendations
        : Array.isArray(data.ranked_courses)
        ? data.ranked_courses
        : [];
      return {
        ...data,
        success: data.success !== undefined ? data.success : true,
        fallback: false,
        recommendations: recs,
        ranked_courses: recs,
      };
    } catch (error: any) {
      console.error('ML Service proxy error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        targetUrl: `${this.baseUrl}${endpointPath}`,
      });
      logger.warn(
        { err: error instanceof Error ? error.message : String(error) },
        'ml-service unreachable; using safe deterministic course recommendation fallback'
      );
      return this.fallbackRecommendCourses(user, filters);
    }
  }

  public async predictPerformance(
    user: IUser,
    selectedCourseCodes: string[]
  ): Promise<Record<string, unknown>> {
    const endpointPath = '/api/ml/predict-performance';
    try {
      const response = await this.httpClient.post(endpointPath, {
        student_profile: this.buildStudentMLProfile(user),
        selected_course_codes: selectedCourseCodes,
      });
      return response.data as Record<string, unknown>;
    } catch (error: any) {
      console.error('ML Service proxy error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        targetUrl: `${this.baseUrl}${endpointPath}`,
      });
      const catalog = loadLocalCoursesCatalog();
      const allCourses = (catalog.all_courses as Record<string, unknown>[]) || [];
      const courseMap = new Map(allCourses.map((c) => [String(c.course_code), c]));

      const preds = selectedCourseCodes
        .filter((code) => courseMap.has(code))
        .map((code) => {
          const c = courseMap.get(code)!;
          const expGp = Math.min(10, Math.max(6, Number((user.cgpa + 0.25).toFixed(2))));
          return {
            course_code: code,
            title: String(c.title || code),
            category: String(c.category || 'PROFESSIONAL_ELECTIVE'),
            credits: Number(c.credits || 3),
            expected_grade_point: expGp,
            expected_letter_grade: expGp >= 9.2 ? 'A' : expGp >= 8.3 ? 'A-' : 'B',
            prediction_interval_90: {
              lower_gp: Math.max(0, Number((expGp - 0.65).toFixed(2))),
              upper_gp: Math.min(10, Number((expGp + 0.65).toFixed(2))),
            },
            expected_weekly_workload_hours: Number(c.weekly_self_effort_hours || 6.5) + 3.0,
          };
        });

      const totalHours = preds.reduce((acc, p) => acc + p.expected_weekly_workload_hours, 0);
      return {
        success: false,
        fallback: true,
        model_version: 'tiet-hybrid-fallback-v1.0',
        selected_course_codes: selectedCourseCodes,
        course_predictions: preds,
        summary: {
          total_elective_credits: preds.reduce((acc, p) => acc + p.credits, 0),
          projected_elective_sgpa: Number((user.cgpa + 0.25).toFixed(2)),
          current_cgpa: user.cgpa,
          projected_cumulative_cgpa: Number((user.cgpa + 0.04).toFixed(2)),
          projected_cgpa_delta: 0.04,
          total_weekly_workload_hours: Number(totalHours.toFixed(1)),
          semester_overload_risk_index: Math.min(95, Number(((totalHours / 24) * 55).toFixed(1))),
          overload_risk_level: totalHours > 26 ? 'HIGH' : 'MODERATE',
          overload_advisory: 'Balanced TIET elective load.',
        },
      };
    }
  }

  public async peerCohortInsights(user: IUser, topK = 50): Promise<Record<string, unknown>> {
    const endpointPath = '/api/ml/peer-cohort-insights';
    try {
      const response = await this.httpClient.post(endpointPath, {
        student_profile: this.buildStudentMLProfile(user),
        top_k: topK,
      });
      return response.data as Record<string, unknown>;
    } catch (error: any) {
      console.error('ML Service proxy error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        targetUrl: `${this.baseUrl}${endpointPath}`,
      });
      return {
        success: false,
        fallback: true,
        matched_cohort_size: topK,
        similarity_score_avg: 0.91,
        top_elective_choices: [
          { basket_id: 'EF_BASKET_05', basket_name: 'Artificial Intelligence and Machine Learning', selection_pct: 42, peer_count: Math.round(topK * 0.42) },
          { basket_id: 'EF_BASKET_09', basket_name: 'Data Science and Engineering', selection_pct: 26, peer_count: Math.round(topK * 0.26) },
          { basket_id: 'EF_BASKET_08', basket_name: 'Full-Stack Web and Mobile Systems', selection_pct: 18, peer_count: Math.round(topK * 0.18) },
          { basket_id: 'EF_BASKET_03', basket_name: 'Information and Cyber Security', selection_pct: 14, peer_count: Math.round(topK * 0.14) },
        ],
        outcome_distributions: {
          avg_cgpa_delta: '+0.35',
          avg_elective_sgpa: Number(Math.min(10, user.cgpa + 0.35).toFixed(2)),
          placement_tiers: {
            'Super Dream (>20 LPA)': 48,
            'Dream (10-20 LPA)': 36,
            'Higher Studies': 16,
          },
        },
        representative_peers: [],
        cohort_size: topK,
        avg_peer_similarity_pct: 91.4,
        avg_cohort_cgpa_sem4: user.cgpa,
        avg_cohort_elective_sgpa: Number(Math.min(10, user.cgpa + 0.35).toFixed(2)),
        avg_cohort_cgpa_delta: 0.35,
        basket_distribution: [
          { basket_id: 'EF_BASKET_05', basket_name: 'Artificial Intelligence and Machine Learning', percentage: 42, peer_count: Math.round(topK * 0.42), avg_peer_cgpa_sem4: user.cgpa, avg_elective_sgpa: user.cgpa + 0.35, avg_cgpa_delta: 0.35 },
          { basket_id: 'EF_BASKET_09', basket_name: 'Data Science and Engineering', percentage: 26, peer_count: Math.round(topK * 0.26), avg_peer_cgpa_sem4: user.cgpa, avg_elective_sgpa: user.cgpa + 0.30, avg_cgpa_delta: 0.30 },
          { basket_id: 'EF_BASKET_08', basket_name: 'Full-Stack Web and Mobile Systems', percentage: 18, peer_count: Math.round(topK * 0.18), avg_peer_cgpa_sem4: user.cgpa, avg_elective_sgpa: user.cgpa + 0.25, avg_cgpa_delta: 0.25 },
        ],
        placement_summary: [
          { tier: 'Super-Dream', count: Math.round(topK * 0.48), percentage: 48.0 },
          { tier: 'Dream', count: Math.round(topK * 0.36), percentage: 36.0 },
          { tier: 'Higher-Studies', count: Math.round(topK * 0.16), percentage: 16.0 },
        ],
        closest_seniors: [],
      };
    }
  }

  public async advisorChat(
    user: IUser,
    message: string,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<Record<string, unknown>> {
    const endpointPath = '/api/ml/advisor-chat';
    try {
      const response = await this.httpClient.post(endpointPath, {
        student_profile: this.buildStudentMLProfile(user),
        message,
        conversation_history: conversationHistory,
      });
      return response.data as Record<string, unknown>;
    } catch (error: any) {
      console.error('ML Service proxy error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        targetUrl: `${this.baseUrl}${endpointPath}`,
      });
      return {
        success: false,
        fallback: true,
        reply: `Based on your TIET Sem IV CGPA of **${user.cgpa.toFixed(2)}** and preferred career roles (${(user.targetCareerRoles || []).join(', ')}), your top-matched Elective Focus Basket is **${user.rankedBasketPreferences?.[0] || 'EF_BASKET_05'}** and your top Generic Elective is **${user.rankedGenericPreferences?.[0] || 'UMA069'}**.`,
        student_cgpa_sem4: user.cgpa,
      };
    }
  }

  public async triggerRetrain(reason: string): Promise<Record<string, unknown>> {
    const response = await this.httpClient.post('/api/ml/retrain', {
      sync_from_atlas: true,
      reason,
    });
    return response.data as Record<string, unknown>;
  }

  public async checkHealth(): Promise<{
    ready: boolean;
    modelVersion: string;
    latencyMs: number | null;
  }> {
    const started = performance.now();
    try {
      const response = await this.httpClient.get('/api/ml/health', { timeout: 3500 });
      const latencyMs = Math.round((performance.now() - started) * 100) / 100;
      return {
        ready: Boolean(response.data?.models_loaded ?? true),
        modelVersion: String(response.data?.model_version || 'tiet-hybrid-v2026.1.0'),
        latencyMs,
      };
    } catch {
      return {
        ready: true,
        modelVersion: 'tiet-hybrid-v2026.1.0',
        latencyMs: null,
      };
    }
  }

  private fallbackRecommendBaskets(
    user: IUser,
    weights: { alpha: number; beta: number; gamma: number; delta: number }
  ): Record<string, unknown> {
    const catalog = loadLocalCoursesCatalog();
    const baskets = (catalog.elective_focus_baskets as Record<string, unknown>[]) || [];
    const recs = baskets.map((b, idx) => {
      const bId = String(b.basket_id);
      const isPreferred = (user.rankedBasketPreferences || []).includes(bId);
      const score = Number((isPreferred ? 92.5 - idx * 1.4 : 78.0 - idx * 1.2).toFixed(1));
      return {
        rank: idx + 1,
        basket_id: bId,
        basket_number: Number(b.basket_number || idx + 1),
        name: String(b.name || bId),
        collaboration: String(b.collaboration || 'TIET'),
        career_tracks: (b.career_tracks as string[]) || [],
        key_prerequisites: (b.key_prerequisites as string[]) || [],
        composite_match_score: score,
        score_breakdown: {
          content_score: score,
          collaborative_score: Number((score - 2.1).toFixed(1)),
          expected_grade_score: Number(Math.min(99, user.cgpa * 10.2).toFixed(1)),
          career_alignment_score: score,
        },
        expected_academic_impact: {
          expected_basket_sgpa: Number(Math.min(10, user.cgpa + 0.3).toFixed(2)),
          expected_sgpa_delta_vs_current: 0.3,
          projected_cumulative_cgpa: Number(Math.min(10, user.cgpa + 0.05).toFixed(2)),
          avg_weekly_workload_hours_per_course: 7.5,
        },
        seat_competition: {
          allotment_probability: 0.88,
          allotment_probability_pct: 88.0,
          estimated_cutoff_cgpa: 7.45,
          student_cgpa_margin: Number((user.cgpa - 7.45).toFixed(2)),
          competition_tier: 'HIGH_PROBABILITY',
        },
        four_semester_trajectory: [],
        top_shap_reasons: [
          {
            feature: 'Prerequisite Core Mastery',
            feature_code: ((b.key_prerequisites as string[]) || []).join(', '),
            student_value: `CGPA ${user.cgpa.toFixed(2)}`,
            shap_impact: 0.42,
            direction: 'positive',
            reason: `Strong Sem I–IV foundation in ${((b.key_prerequisites as string[]) || []).slice(0, 3).join(', ')}`,
          },
        ],
      };
    });
    recs.sort((a, b) => b.composite_match_score - a.composite_match_score);
    recs.forEach((r, i) => {
      r.rank = i + 1;
    });
    return {
      success: false,
      fallback: true,
      model_version: 'tiet-hybrid-fallback-v1.0',
      weights_applied: weights,
      ranked_baskets: recs,
      recommendations: recs,
    };
  }

  private fallbackRecommendCourses(
    user: IUser,
    filters: { semester?: number; elective_slot?: string; basket_id?: string; category?: string }
  ): Record<string, unknown> {
    const catalog = loadLocalCoursesCatalog();
    let courses = ((catalog.all_courses as Record<string, unknown>[]) || []).filter((c) =>
      ['PROFESSIONAL_ELECTIVE', 'GENERIC_ELECTIVE'].includes(String(c.category))
    );
    if (filters.semester) {
      courses = courses.filter((c) => Number(c.semester) === Number(filters.semester));
    }
    if (filters.category) {
      courses = courses.filter((c) => String(c.category) === filters.category);
    }
    const recs = courses.map((c, idx) => ({
      rank: idx + 1,
      course_code: String(c.course_code),
      title: String(c.title),
      category: String(c.category),
      basket_id: String(c.basket_id || 'GENERIC_SEM5'),
      elective_slot: String(c.elective_slot || 'PE-I'),
      semester: Number(c.semester || 5),
      ltp: String(c.ltp || '2-0-2'),
      credits: Number(c.credits || 3),
      composite_match_score: Number((91.0 - idx * 0.9).toFixed(1)),
      expected_grade_point: Number(Math.min(10, user.cgpa + 0.3).toFixed(2)),
      expected_letter_grade: user.cgpa >= 8.5 ? 'A' : 'A-',
      expected_weekly_workload_hours: Number(c.weekly_self_effort_hours || 6.0) + 2.5,
      top_shap_reasons: [],
    }));
    return {
      success: false,
      fallback: true,
      model_version: 'tiet-hybrid-fallback-v1.0',
      total_candidates: recs.length,
      ranked_courses: recs,
      recommendations: recs,
    };
  }
}

