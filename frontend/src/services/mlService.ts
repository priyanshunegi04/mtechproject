import { cloudApi } from '../lib/api';
import {
  ElectiveCourseCatalogItem,
  ElectiveFocusBasketItem,
  MLSourceMetadata,
  PeerCohortAnalytics,
  PeerSeniorRecord,
  PreferenceWeights,
  RadarSixMetrics,
  RecommendationSource,
  ScoredBasketRecommendation,
  ScoredCourseRecommendation,
  TrajectoryCoursePreview,
  UserProfile,
} from '../types';

export interface StudentMLPayload {
  cgpa: number;
  completed_courses: Record<string, string>; // e.g. { "UCS415": "A", "UCS310": "B" }
  skills: string[];
  career_interest: string;
  weights?: { alpha: number; beta: number; gamma: number; delta: number };
}

export interface LiveBasketTrajectorySlot {
  elective_slot?: string;
  semester?: number;
  courses?: Array<{
    course_code: string;
    title: string;
    semester: number;
    elective_slot: string;
    expected_grade_point: number;
    expected_letter_grade: string;
    prediction_interval_90?: {
      lower_gp?: number;
      upper_gp?: number;
      lowerGp?: number;
      upperGp?: number;
    };
    expected_weekly_workload_hours?: number;
  }>;
}

export interface LiveBasketShapReason {
  feature?: string;
  feature_code?: string;
  student_value?: string | number;
  shap_impact?: number;
  direction?: 'positive' | 'negative';
  reason?: string;
}

export interface LiveBasketRecommendationItem {
  rank: number;
  basket_id: string;
  basket_number?: number;
  name: string;
  collaboration?: string;
  career_tracks?: string[];
  key_prerequisites?: string[];
  student_prerequisite_summary?: string[];
  composite_match_score: number;
  hybrid_score?: number;
  predicted_grade?: number;
  score_breakdown?: {
    content_score?: number;
    collaborative_score?: number;
    expected_grade_score?: number;
    career_alignment_score?: number;
    [key: string]: any;
  };
  expected_academic_impact?: {
    expected_basket_sgpa?: number;
    expected_sgpa_delta_vs_current?: number;
    projected_cumulative_cgpa?: number;
    avg_weekly_workload_hours_per_course?: number;
    [key: string]: any;
  };
  seat_competition?: {
    allotment_probability?: number;
    allotment_probability_pct?: number;
    estimated_cutoff_cgpa?: number;
    student_cgpa_margin?: number;
    competition_tier?: string;
    [key: string]: any;
  };
  four_semester_trajectory?: LiveBasketTrajectorySlot[];
  top_shap_reasons?: LiveBasketShapReason[];
  shap_values?: LiveBasketShapReason[];
  shap_explanations?: LiveBasketShapReason[];
  [key: string]: any;
}

export interface LiveBasketRecommendationsResponse {
  success: boolean;
  fallback?: boolean;
  is_fallback?: boolean;
  source?: RecommendationSource;
  model_version?: string;
  generated_at?: string;
  data_nature?: string;
  disclaimer?: string;
  recommendations?: LiveBasketRecommendationItem[];
  ranked_baskets?: LiveBasketRecommendationItem[];
  weights_applied?: {
    alpha_content?: number;
    beta_collaborative?: number;
    gamma_expected_grade?: number;
    delta_career_alignment?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface LiveCourseRecommendationItem {
  rank?: number;
  course_code: string;
  title?: string;
  category?: string;
  basket_id?: string;
  basket_name?: string;
  collaboration?: string;
  elective_slot?: string;
  semester?: number;
  ltp?: string;
  credits?: number;
  prerequisites?: string[];
  composite_match_score?: number;
  expected_grade_point?: number;
  expected_letter_grade?: string;
  prediction_interval_90?: {
    lower_gp?: number;
    upper_gp?: number;
    lowerGp?: number;
    upperGp?: number;
    [key: string]: any;
  };
  expected_marks_breakdown?: {
    mst_score_out_of_30?: number;
    est_score_out_of_45?: number;
    sessional_score_out_of_30?: number;
    weighted_total_out_of_100?: number;
    [key: string]: any;
  };
  expected_marks?: {
    mst_out_30?: number;
    est_out_45?: number;
    sessional_out_30?: number;
    total_out_100?: number;
    [key: string]: any;
  };
  expected_weekly_workload_hours?: number;
  difficulty_index?: number;
  seat_competition?: {
    allotment_probability?: number;
    allotment_probability_pct?: number;
    estimated_cutoff_cgpa?: number;
    student_cgpa_margin?: number;
    competition_tier?: string;
  };
  top_shap_reasons?: Array<{
    feature?: string;
    feature_code?: string;
    student_value?: string | number;
    shap_impact?: number;
    impact?: number;
    direction?: 'positive' | 'negative';
    reason?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface LiveCourseRecommendationsResponse {
  success: boolean;
  fallback?: boolean;
  is_fallback?: boolean;
  source?: RecommendationSource;
  model_version?: string;
  generated_at?: string;
  data_nature?: string;
  disclaimer?: string;
  recommendations?: LiveCourseRecommendationItem[];
  ranked_courses?: LiveCourseRecommendationItem[];
  total_candidates?: number;
  [key: string]: any;
}

export interface LivePerformancePredictionResponse {
  success: boolean;
  fallback?: boolean;
  is_fallback?: boolean;
  source?: RecommendationSource;
  model_version?: string;
  generated_at?: string;
  data_nature?: string;
  disclaimer?: string;
  selected_course_codes?: string[];
  course_predictions?: Array<{
    course_code: string;
    title?: string;
    expected_grade_point: number;
    expected_letter_grade: string;
    prediction_interval_90?: { lower_gp: number; upper_gp: number };
    expected_marks_breakdown?: {
      mst_score_out_of_30?: number;
      est_score_out_of_45?: number;
      sessional_score_out_of_30?: number;
      weighted_total_out_of_100?: number;
    };
    expected_weekly_workload_hours?: number;
    difficulty_index?: number;
    feature_vector?: Record<string, number>;
    [key: string]: any;
  }>;
  summary?: {
    total_elective_credits: number;
    projected_elective_sgpa: number;
    current_cgpa: number;
    projected_cumulative_cgpa: number;
    projected_cgpa_delta: number;
    total_weekly_workload_hours: number;
    semester_overload_risk_index: number;
    overload_risk_level: string;
    overload_advisory: string;
  };
  [key: string]: any;
}

export interface LivePeerCohortResponse {
  success: boolean;
  fallback?: boolean;
  is_fallback?: boolean;
  source?: RecommendationSource;
  model_version?: string;
  generated_at?: string;
  data_nature?: string;
  disclaimer?: string;
  cohort_size?: number;
  avg_peer_similarity_pct?: number;
  avg_cohort_cgpa_sem4?: number;
  avg_cohort_elective_sgpa?: number;
  avg_cohort_cgpa_delta?: number;
  basket_distribution?: Array<Record<string, any>>;
  placement_summary?: Array<{ tier: string; count: number; percentage: number }>;
  closest_seniors?: Array<Record<string, any>>;
  [key: string]: any;
}

/**
 * Standardizes source provenance metadata across all responses.
 */
export function extractSourceMetadata(
  response: any,
  defaultSource: RecommendationSource = 'local_fallback'
): MLSourceMetadata {
  const isFallback = Boolean(response?.fallback || response?.is_fallback || !response?.success);
  return {
    source: (response?.source as RecommendationSource) || (isFallback ? defaultSource : 'ml_service'),
    model_version: response?.model_version || (isFallback ? 'tiet-hybrid-fallback-v1.0' : 'tiet-hybrid-v1.0'),
    generated_at: response?.generated_at || new Date().toISOString(),
    is_fallback: isFallback,
    data_nature: response?.data_nature || (isFallback ? 'heuristic_fallback' : 'synthetic_development'),
    disclaimer:
      response?.disclaimer ||
      (isFallback
        ? 'Generated by local catalog heuristics because remote ML service is unavailable or cold-starting.'
        : 'Generated by Python ML Hybrid Ranker evaluated on synthetic TIET development dataset for academic benchmarking. Not verified historical student records.'),
  };
}

/**
 * Converts user profile & preference weights to typed StudentMLPayload for live ML inference.
 */
export function convertUserToMLPayload(
  user: UserProfile,
  weights?: PreferenceWeights
): StudentMLPayload {
  const completed_courses: Record<string, string> = {};
  if (user.coreGrades) {
    for (const [code, gp] of Object.entries(user.coreGrades)) {
      const numGp = Number(gp);
      completed_courses[code] =
        numGp >= 10
          ? 'A+'
          : numGp >= 9
          ? 'A'
          : numGp >= 8
          ? 'B'
          : numGp >= 7
          ? 'B-'
          : numGp >= 6
          ? 'C'
          : 'C-';
    }
  }

  const w = weights || user.preferenceWeights;
  const sumWeights = Math.max(
    1,
    (w?.syllabusMatch ?? 25) +
      (w?.lowWorkload ?? 20) +
      (w?.cgpaBoost ?? 25) +
      (w?.careerAlignment ?? 30)
  );

  return {
    cgpa: user.cgpa,
    completed_courses,
    skills: user.skills && user.skills.length > 0 ? user.skills : ['Python', 'C++', 'SQL'],
    career_interest: user.targetCareerRoles?.[0] || 'Machine Learning Engineer',
    weights: {
      alpha: Number(((w?.syllabusMatch ?? 25) / sumWeights).toFixed(3)),
      beta: Number(((w?.lowWorkload ?? 20) / sumWeights).toFixed(3)),
      gamma: Number(((w?.cgpaBoost ?? 25) / sumWeights).toFixed(3)),
      delta: Number(((w?.careerAlignment ?? 30) / sumWeights).toFixed(3)),
    },
  };
}

/**
 * Fetch live hybrid basket recommendations from Python FastAPI microservice via Express proxy.
 */
export async function getLiveBasketRecommendations(
  payload: StudentMLPayload,
  signal?: AbortSignal
): Promise<LiveBasketRecommendationsResponse> {
  const response = await cloudApi.post<LiveBasketRecommendationsResponse>(
    '/ml/recommend-baskets',
    payload,
    {
      timeout: 30000, // 30s timeout to gracefully accommodate Render cold starts
      signal,
    }
  );
  return response.data;
}

/**
 * Fetch live course grade/workload predictions from Python FastAPI microservice via Express proxy.
 */
export async function getLiveCoursePredictions(
  payload: StudentMLPayload,
  courseIds: string[],
  signal?: AbortSignal
): Promise<LivePerformancePredictionResponse> {
  const response = await cloudApi.post<LivePerformancePredictionResponse>(
    '/ml/predict-performance',
    {
      ...payload,
      courseIds,
      selected_course_codes: courseIds,
    },
    {
      timeout: 30000,
      signal,
    }
  );
  return response.data;
}

/**
 * Fetch live hybrid course recommendations & GBDT grade predictions from Python FastAPI microservice via Express proxy.
 */
export async function getLiveCourseRecommendations(
  payload: StudentMLPayload,
  signal?: AbortSignal
): Promise<LiveCourseRecommendationsResponse> {
  const response = await cloudApi.post<LiveCourseRecommendationsResponse>(
    '/ml/recommend-courses',
    payload,
    {
      timeout: 30000,
      signal,
    }
  );
  return response.data;
}

/**
 * Fetch live peer cohort k-NN insights from Python FastAPI microservice via Express proxy.
 */
export async function getLivePeerCohort(
  payload: StudentMLPayload,
  signal?: AbortSignal
): Promise<LivePeerCohortResponse> {
  const response = await cloudApi.post<LivePeerCohortResponse>(
    '/ml/peer-cohort-insights',
    payload,
    {
      timeout: 30000,
      signal,
    }
  );
  return response.data;
}

/**
 * Helper to compute default 6-axis radar metrics for a basket when not directly returned by ML.
 */
function computeBasketRadarMetrics(
  basket: ElectiveFocusBasketItem,
  user: UserProfile
): RadarSixMetrics {
  const prereqVals = basket.keyPrerequisites.map((p) => user.coreGrades?.[p] ?? user.cgpa);
  const prereqReadiness =
    prereqVals.length > 0
      ? Math.min(100, (prereqVals.reduce((a, b) => a + b, 0) / prereqVals.length) * 10)
      : Math.min(100, user.cgpa * 10);

  const num = basket.basketNumber;
  const isMathHeavy = num === 4 || num === 5 || num === 9;
  const isResearchHeavy = num === 5 || num === 7 || num === 9 || num === 11;
  const isHighPlacement = num === 5 || num === 8 || num === 9 || num === 3;

  return {
    mathIntensity: isMathHeavy ? 88 : 65,
    codingLabLoad: num === 8 || num === 9 || num === 1 ? 86 : 72,
    cgpaScoringEase: Math.max(50, Math.min(95, Math.round(user.cgpa * 10 + 2))),
    placementDemand: isHighPlacement ? 94 : 76,
    researchRelevance: isResearchHeavy ? 92 : 68,
    prerequisiteReadiness: Math.round(prereqReadiness),
  };
}

/**
 * Adapts live FastAPI basket inference output into strongly typed frontend ScoredBasketRecommendation[]
 */
export function adaptLiveBasketsToRecommendations(
  liveData: LiveBasketRecommendationsResponse,
  basketsCatalog: ElectiveFocusBasketItem[],
  coursesCatalog: ElectiveCourseCatalogItem[],
  user: UserProfile
): ScoredBasketRecommendation[] {
  // Standardized response contract: prioritize canonical `recommendations`, fall back to alias `ranked_baskets`
  const rawList =
    Array.isArray(liveData?.recommendations) && liveData.recommendations.length > 0
      ? liveData.recommendations
      : Array.isArray(liveData?.ranked_baskets) && liveData.ranked_baskets.length > 0
      ? liveData.ranked_baskets
      : null;

  if (!rawList || rawList.length === 0) {
    return [];
  }

  const sourceMetadata = extractSourceMetadata(liveData, 'ml_service');

  const basketMap = new Map<string, ElectiveFocusBasketItem>();
  for (const b of basketsCatalog) {
    basketMap.set(b.basketId, b);
    basketMap.set(b.basketId.toUpperCase(), b);
    // Support aliases: EF_BASKET_01 <-> EF01 <-> EF1 <-> EF_BASKET_1
    const digits = b.basketId.replace(/[^0-9]/g, '');
    if (digits) {
      const num = parseInt(digits, 10);
      const padded = num < 10 ? `0${num}` : `${num}`;
      basketMap.set(`EF${padded}`, b);
      basketMap.set(`EF${num}`, b);
      basketMap.set(`EF_BASKET_${padded}`, b);
      basketMap.set(`EF_BASKET_${num}`, b);
      basketMap.set(String(num), b);
    }
  }
  const courseMap = new Map<string, ElectiveCourseCatalogItem>(
    coursesCatalog.map((c) => [c.courseCode, c])
  );

  return rawList
    .map((item, index) => {
      const basket = basketMap.get(item.basket_id) || basketsCatalog[index] || basketsCatalog[0];
      if (!basket) return null;

      const trajectoryCourses: TrajectoryCoursePreview[] = [];
      const traj = item.four_semester_trajectory || [];

      for (const slotItem of traj) {
        const slotLabel = slotItem.elective_slot as 'PE-I' | 'PE-II' | 'PE-III' | 'PE-IV';
        const sem = Number(slotItem.semester || 5);
        const slotCourses = slotItem.courses || [];
        for (const c of slotCourses) {
          const courseMeta = courseMap.get(c.course_code);
          const gp = Number(c.expected_grade_point || 8.5);
          const pi = c.prediction_interval_90 || { lower_gp: gp - 0.6, upper_gp: gp + 0.6 };
          const estMarksTotal = Math.round(Math.min(98, gp * 9.6));

          trajectoryCourses.push({
            courseCode: c.course_code,
            title: c.title || courseMeta?.title || c.course_code,
            semester: sem,
            electiveSlot: slotLabel,
            ltp: courseMeta?.ltp || '2-0-2',
            credits: courseMeta?.credits || 3.0,
            expectedGradePoint: gp,
            expectedLetterGrade: c.expected_letter_grade || (gp >= 9 ? 'A' : gp >= 8 ? 'B' : 'C'),
            predictionInterval90: {
              lowerGp: Number(pi.lower_gp ?? pi.lowerGp ?? gp - 0.5),
              upperGp: Number(pi.upper_gp ?? pi.upperGp ?? gp + 0.5),
            },
            expectedMarks: {
              mstOut30: Math.round(estMarksTotal * 0.28),
              estOut45: Math.round(estMarksTotal * 0.44),
              sessionalOut30: Math.round(estMarksTotal * 0.28),
              totalOut100: estMarksTotal,
            },
            expectedWeeklyWorkloadHours: Number(
              c.expected_weekly_workload_hours || courseMeta?.weeklySelfEffortHours || 6.5
            ),
          });
        }
      }

      const rawShap = item.top_shap_reasons || item.shap_values || item.shap_explanations || [];
      const shapReasons = rawShap.map((s: Record<string, any>) => ({
        feature: s.feature || 'Feature Attribution',
        featureCode: s.feature_code || s.featureCode || 'feat',
        studentValue: String(s.student_value ?? s.studentValue ?? ''),
        shapImpact: Number(s.shap_impact ?? s.shapImpact ?? 0),
        direction: (s.direction === 'positive' ? 'positive' : 'negative') as
          | 'positive'
          | 'negative',
        reason: s.reason || '',
      }));

      const seatComp = item.seat_competition || {};
      const statusRaw = seatComp.competition_tier || '';
      const compStatus: 'HIGH_PROBABILITY' | 'MODERATE_COMPETITION' | 'WAITLIST_RISK' =
        statusRaw === 'HIGH_PROBABILITY'
          ? 'HIGH_PROBABILITY'
          : statusRaw === 'MODERATE_COMPETITION'
          ? 'MODERATE_COMPETITION'
          : 'WAITLIST_RISK';

      const expAcademic = item.expected_academic_impact || {};

      const recommendation: ScoredBasketRecommendation = {
        rank: Number(item.rank || index + 1),
        basket,
        compositeMatchScore: Number(item.composite_match_score ?? item.hybrid_score ?? 85.0),
        scoreBreakdown: {
          careerAlignmentScore: Number(
            item.score_breakdown?.career_alignment_score ?? item.score_breakdown?.careerAlignmentScore ?? 85
          ),
          cgpaBoostScore: Number(
            item.score_breakdown?.expected_grade_score ?? item.score_breakdown?.cgpaBoostScore ?? 82
          ),
          syllabusMatchScore: Number(
            item.score_breakdown?.content_score ?? item.score_breakdown?.syllabusMatchScore ?? 84
          ),
          workloadBalanceScore: Number(
            item.score_breakdown?.collaborative_score ?? item.score_breakdown?.workloadBalanceScore ?? 80
          ),
        },
        expectedBasketSgpa: Number(expAcademic.expected_basket_sgpa || user.cgpa + 0.2),
        expectedCgpaDelta: Number(expAcademic.expected_sgpa_delta_vs_current || 0.2),
        projectedCumulativeCgpa: Number(expAcademic.projected_cumulative_cgpa || user.cgpa + 0.05),
        avgWeeklyWorkloadHours: Number(
          expAcademic.avg_weekly_workload_hours_per_course || 6.5
        ),
        seatCompetition: {
          filledSeats: basket.enrolledCount,
          seatCapacity: basket.seatCapacity,
          estimatedCutoffCgpa: Number(seatComp.estimated_cutoff_cgpa || basket.cutoffCgpaLastYear),
          allotmentProbabilityPct: Number(seatComp.allotment_probability_pct || 88.0),
          studentCgpaMargin: Number(
            seatComp.student_cgpa_margin || user.cgpa - (basket.cutoffCgpaLastYear || 7.5)
          ),
          competitionStatus: compStatus,
        },
        trajectoryCourses,
        shapReasons,
        radarMetrics: computeBasketRadarMetrics(basket, user),
        sourceMetadata,
      };

      return recommendation;
    })
    .filter((r): r is ScoredBasketRecommendation => r !== null);
}

/**
 * Adapts live FastAPI course recommendations & GBDT grade predictions into strongly-typed ScoredCourseRecommendation[]
 */
export function adaptLiveCoursesToRecommendations(
  liveData: LiveCourseRecommendationsResponse,
  coursesCatalog: ElectiveCourseCatalogItem[],
  user: UserProfile
): ScoredCourseRecommendation[] {
  const rawList =
    Array.isArray(liveData?.recommendations) && liveData.recommendations.length > 0
      ? liveData.recommendations
      : Array.isArray(liveData?.ranked_courses) && liveData.ranked_courses.length > 0
      ? liveData.ranked_courses
      : null;

  if (!rawList || rawList.length === 0) {
    return [];
  }

  const sourceMetadata = extractSourceMetadata(liveData, 'ml_service');

  const courseMap = new Map<string, ElectiveCourseCatalogItem>(
    coursesCatalog.map((c) => [c.courseCode, c])
  );

  return rawList
    .map((item, index) => {
      const course =
        courseMap.get(item.course_code) ||
        coursesCatalog.find((c) => c.courseCode.toUpperCase() === item.course_code.toUpperCase());
      if (!course) return null;

      const gp = Number(item.expected_grade_point ?? 8.0);
      const pi = item.prediction_interval_90 || { lower_gp: gp - 0.6, upper_gp: gp + 0.6 };
      const estMarksTotal = Math.round(Math.min(99, gp * 9.6));

      const rawMarks = item.expected_marks_breakdown || (item as any).expected_marks;
      const marks = rawMarks
        ? {
            mstOut30: Math.round(
              Number(
                rawMarks.mst_score_out_of_30 ??
                  rawMarks.mst_out_30 ??
                  rawMarks.mstOut30 ??
                  estMarksTotal * 0.28
              )
            ),
            estOut45: Math.round(
              Number(
                rawMarks.est_score_out_of_45 ??
                  rawMarks.est_out_45 ??
                  rawMarks.estOut45 ??
                  estMarksTotal * 0.44
              )
            ),
            sessionalOut30: Math.round(
              Number(
                rawMarks.sessional_score_out_of_30 ??
                  rawMarks.sessional_out_30 ??
                  rawMarks.sessionalOut30 ??
                  estMarksTotal * 0.28
              )
            ),
            totalOut100: Math.round(
              Number(
                rawMarks.weighted_total_out_of_100 ??
                  rawMarks.total_out_100 ??
                  rawMarks.totalOut100 ??
                  estMarksTotal
              )
            ),
          }
        : {
            mstOut30: Math.round(estMarksTotal * 0.28),
            estOut45: Math.round(estMarksTotal * 0.44),
            sessionalOut30: Math.round(estMarksTotal * 0.28),
            totalOut100: estMarksTotal,
          };

      const shapReasons = (item.top_shap_reasons || item.shap_values || []).map((s: any) => ({
        feature: s.feature || 'Prerequisite Mastery',
        featureCode: s.feature_code || s.featureCode || 'core',
        studentValue: String(s.student_value ?? s.studentValue ?? ''),
        shapImpact: Number(s.shap_impact ?? s.shapImpact ?? 0),
        direction: (s.direction === 'positive' ? 'positive' : 'negative') as
          | 'positive'
          | 'negative',
        reason: s.reason || '',
      }));

      const seatComp = item.seat_competition || {};
      const allotmentPct = Number(
        seatComp.allotment_probability_pct ??
          (item as any).allotment_probability_pct ??
          (seatComp.allotment_probability ? seatComp.allotment_probability * 100 : 85.0)
      );
      const cutoff = Number(
        seatComp.estimated_cutoff_cgpa ??
          (item as any).estimated_cutoff_cgpa ??
          course.cutoffCgpaLastYear ??
          7.2
      );

      const scoredCourse: ScoredCourseRecommendation = {
        rank: Number(item.rank || index + 1),
        course,
        compositeMatchScore: Number(item.composite_match_score || 85.0),
        expectedGradePoint: gp,
        expectedLetterGrade: item.expected_letter_grade || (gp >= 9 ? 'A' : gp >= 8 ? 'B' : 'C'),
        predictionInterval90: {
          lowerGp: Number((pi as any).lower_gp ?? (pi as any).lowerGp ?? gp - 0.5),
          upperGp: Number((pi as any).upper_gp ?? (pi as any).upperGp ?? gp + 0.5),
        },
        expectedMarks: marks,
        expectedWeeklyWorkloadHours: Number(
          item.expected_weekly_workload_hours || course.weeklySelfEffortHours || 6.5
        ),
        allotmentProbabilityPct: allotmentPct,
        estimatedCutoffCgpa: cutoff,
        shapReasons,
        radarMetrics: {
          mathIntensity: course.lectureHours > 2 ? 85 : 65,
          codingLabLoad: course.practicalHours > 0 ? 88 : 60,
          cgpaScoringEase: Math.max(50, Math.min(95, Math.round(user.cgpa * 10 + 2))),
          placementDemand: 82,
          researchRelevance: 75,
          prerequisiteReadiness: Math.round(Math.min(100, user.cgpa * 10)),
        },
        sourceMetadata,
      };

      return scoredCourse;
    })
    .filter((r): r is ScoredCourseRecommendation => r !== null);
}

/**
 * Adapts live FastAPI peer cohort k-NN output into typed PeerCohortAnalytics.
 * Supports both standard response schemas (matched_cohort_size, top_elective_choices, outcome_distributions, representative_peers)
 * and backward-compatible fields (cohort_size, basket_distribution, closest_seniors).
 */
export function adaptLivePeerCohortToAnalytics(
  liveData: LivePeerCohortResponse,
  fallbackCohort: PeerCohortAnalytics
): PeerCohortAnalytics {
  if (!liveData || (!liveData.success && !liveData.matched_cohort_size && !liveData.cohort_size)) {
    return fallbackCohort;
  }

  // 1. Closest Seniors / Representative Peers
  const rawPeers: Record<string, any>[] =
    (liveData.representative_peers && liveData.representative_peers.length > 0)
      ? liveData.representative_peers
      : (liveData.closest_seniors && liveData.closest_seniors.length > 0)
      ? liveData.closest_seniors
      : [];

  const closestSeniors: PeerSeniorRecord[] = rawPeers.map(
    (s: Record<string, any>, idx: number) => {
      const rawSim =
        s.similarity != null
          ? Number(s.similarity)
          : s.similarity_score != null
          ? Number(s.similarity_score) / 100
          : null;
      const simPct =
        rawSim != null
          ? Number((rawSim > 1 ? rawSim : rawSim * 100).toFixed(1))
          : Number(s.similarityScorePct ?? (94 - idx * 0.5).toFixed(1));

      const sem4 = Number(s.sem4_cgpa ?? s.cgpa_sem4 ?? s.cgpaSem4 ?? 8.0);
      const finalCgpa = Number(s.final_cgpa ?? s.avg_elective_sgpa ?? s.avgElectiveSgpa ?? sem4 + 0.3);
      const delta = Number(s.cgpa_delta ?? s.cgpaDelta ?? (finalCgpa - sem4));

      const tierRaw = String(s.placement_category || s.placement_tier || s.placementTier || 'Dream');
      const cleanTier: 'Super-Dream' | 'Dream' | 'Higher-Studies' | 'Core' =
        tierRaw.toLowerCase().includes('super')
          ? 'Super-Dream'
          : tierRaw.toLowerCase().includes('dream')
          ? 'Dream'
          : tierRaw.toLowerCase().includes('study') || tierRaw.toLowerCase().includes('higher')
          ? 'Higher-Studies'
          : 'Core';

      return {
        studentId: String(s.peer_id || s.student_id || s.studentId || `HIST-${s.batch_year || 2024}-${String(idx + 101).padStart(3, '0')}`),
        rollNo: String(s.roll_no || s.rollNo || s.peer_id || `102203${String(idx + 10).padStart(3, '0')}`),
        batchYear: Number(s.batch_year || s.batchYear || 2024),
        similarityScorePct: simPct,
        cgpaSem4: Number(sem4.toFixed(2)),
        avgElectiveSgpa: Number(finalCgpa.toFixed(2)),
        cgpaDelta: Number(delta.toFixed(2)),
        chosenBasketId: String(s.chosen_basket || s.chosen_basket_id || s.chosenBasketId || 'EF_BASKET_05'),
        chosenBasketName: String(s.chosen_basket_name || s.chosenBasketName || 'Artificial Intelligence & Machine Learning'),
        chosenGenericElective: String(s.chosen_generic || s.chosen_generic_elective || s.chosenGenericElective || 'UMA069'),
        preferredCareerTrack: String(s.career_role || s.preferred_career_track || s.preferredCareerTrack || 'Machine Learning Engineer'),
        placementTier: cleanTier,
      };
    }
  );

  // 2. Basket Distribution / Top Elective Choices
  const rawBaskets: Record<string, any>[] =
    (liveData.top_elective_choices && liveData.top_elective_choices.length > 0)
      ? liveData.top_elective_choices
      : (liveData.basket_distribution && liveData.basket_distribution.length > 0)
      ? liveData.basket_distribution
      : [];

  const basketDistribution = rawBaskets.map((b: Record<string, any>) => {
    const bId = String(b.basket_id || b.basketId || '');
    const pct = Number(b.selection_pct ?? b.percentage ?? 0);
    const peerCnt = Number(
      b.peer_count ??
        b.peerCount ??
        Math.round((pct / 100) * (liveData.matched_cohort_size || liveData.cohort_size || 50))
    );

    return {
      basketId: bId,
      basketName: String(b.basket_name || b.basketName || bId),
      peerCount: peerCnt,
      percentage: pct,
      avgPeerCgpaSem4: Number(b.avg_peer_cgpa_sem4 || b.avgPeerCgpaSem4 || liveData.avg_cohort_cgpa_sem4 || 8.0),
      avgElectiveSgpa: Number(b.avg_elective_sgpa || b.avgElectiveSgpa || liveData.avg_cohort_elective_sgpa || 8.4),
      avgCgpaDelta: Number(b.avg_cgpa_delta || b.avgCgpaDelta || 0.4),
      placementOutcomes: b.placement_outcomes || b.placementOutcomes || {},
    };
  });

  // 3. Placement Summary / Outcome Distributions
  let placementSummary = liveData.placement_summary || [];
  if ((!placementSummary || placementSummary.length === 0) && liveData.outcome_distributions?.placement_tiers) {
    const tiers = liveData.outcome_distributions.placement_tiers;
    const totalCohort = Number(liveData.matched_cohort_size || liveData.cohort_size || 50);
    placementSummary = Object.entries(tiers).map(([tier, pct]) => ({
      tier: String(tier),
      percentage: Number(pct),
      count: Math.round((Number(pct) / 100) * totalCohort),
    }));
  }

  // 4. Metrics & Averages
  const cohortSize = Number(liveData.matched_cohort_size || liveData.cohort_size || fallbackCohort.cohortSize);
  const avgPeerSimilarityPct =
    liveData.similarity_score_avg != null
      ? Number((liveData.similarity_score_avg * 100).toFixed(1))
      : Number(liveData.avg_peer_similarity_pct || fallbackCohort.avgPeerSimilarityPct);

  const deltaRaw = liveData.outcome_distributions?.avg_cgpa_delta;
  const avgCohortCgpaDelta =
    deltaRaw != null
      ? parseFloat(String(deltaRaw))
      : Number(liveData.avg_cohort_cgpa_delta || fallbackCohort.avgCohortCgpaDelta);

  const avgCohortElectiveSgpa = Number(
    liveData.outcome_distributions?.avg_elective_sgpa ||
      liveData.avg_cohort_elective_sgpa ||
      fallbackCohort.avgCohortElectiveSgpa
  );

  return {
    cohortSize,
    avgPeerSimilarityPct,
    avgCohortCgpaSem4: Number(liveData.avg_cohort_cgpa_sem4 || fallbackCohort.avgCohortCgpaSem4),
    avgCohortElectiveSgpa,
    avgCohortCgpaDelta,
    basketDistribution:
      basketDistribution.length > 0 ? basketDistribution : fallbackCohort.basketDistribution,
    placementSummary:
      placementSummary.length > 0 ? placementSummary : fallbackCohort.placementSummary,
    closestSeniors:
      closestSeniors.length > 0 ? closestSeniors : fallbackCohort.closestSeniors,
    sourceMetadata: extractSourceMetadata(liveData, 'ml_service'),
  };
}

