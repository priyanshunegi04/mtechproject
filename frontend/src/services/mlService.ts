import { cloudApi } from '../lib/api';
import {
  ElectiveCourseCatalogItem,
  ElectiveFocusBasketItem,
  PeerCohortAnalytics,
  PeerSeniorRecord,
  PreferenceWeights,
  RadarSixMetrics,
  ScoredBasketRecommendation,
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

export interface LiveBasketRecommendationsResponse {
  success: boolean;
  model_version?: string;
  ranked_baskets?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface LivePerformancePredictionResponse {
  success: boolean;
  model_version?: string;
  selected_course_codes?: string[];
  course_predictions?: Array<Record<string, any>>;
  summary?: Record<string, any>;
  [key: string]: any;
}

export interface LivePeerCohortResponse {
  success: boolean;
  model_version?: string;
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
  if (!liveData?.ranked_baskets || !Array.isArray(liveData.ranked_baskets)) {
    return [];
  }

  const basketMap = new Map<string, ElectiveFocusBasketItem>(
    basketsCatalog.map((b) => [b.basketId, b])
  );
  const courseMap = new Map<string, ElectiveCourseCatalogItem>(
    coursesCatalog.map((c) => [c.courseCode, c])
  );

  return liveData.ranked_baskets
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

      const shapReasons = (item.top_shap_reasons || []).map((s: Record<string, any>) => ({
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
        compositeMatchScore: Number(item.composite_match_score || 85.0),
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
      };

      return recommendation;
    })
    .filter((r): r is ScoredBasketRecommendation => r !== null);
}

/**
 * Adapts live FastAPI peer cohort k-NN output into typed PeerCohortAnalytics
 */
export function adaptLivePeerCohortToAnalytics(
  liveData: LivePeerCohortResponse,
  fallbackCohort: PeerCohortAnalytics
): PeerCohortAnalytics {
  if (!liveData || !liveData.success) {
    return fallbackCohort;
  }

  const closestSeniors: PeerSeniorRecord[] = (liveData.closest_seniors || []).map(
    (s: Record<string, any>, idx: number) => ({
      studentId: String(s.student_id || `SR_${idx + 1}`),
      rollNo: String(s.roll_no || `102203${String(idx + 10).padStart(3, '0')}`),
      batchYear: Number(s.batch_year || 2022),
      similarityScorePct: Number(
        s.similarity ? (s.similarity * 100).toFixed(1) : (92 - idx * 0.4).toFixed(1)
      ),
      cgpaSem4: Number(s.cgpa_sem4 || 8.0),
      avgElectiveSgpa: Number(s.avg_elective_sgpa || 8.4),
      cgpaDelta: Number(s.cgpa_delta || 0.4),
      chosenBasketId: String(s.chosen_basket_id || 'EF_BASKET_09'),
      chosenBasketName: String(s.chosen_basket_name || 'Data Science'),
      chosenGenericElective: String(s.chosen_generic_elective || 'UMA069'),
      preferredCareerTrack: String(s.preferred_career_track || 'Software Development Engineer'),
      placementTier: (s.placement_tier || 'Dream') as
        | 'Super-Dream'
        | 'Dream'
        | 'Higher-Studies'
        | 'Core',
    })
  );

  const basketDistribution = (liveData.basket_distribution || []).map((b: Record<string, any>) => ({
    basketId: String(b.basket_id || ''),
    basketName: String(b.basket_name || b.basket_id || ''),
    peerCount: Number(b.peer_count || 0),
    percentage: Number(b.percentage || 0),
    avgPeerCgpaSem4: Number(b.avg_peer_cgpa_sem4 || 8.0),
    avgElectiveSgpa: Number(b.avg_elective_sgpa || 8.4),
    avgCgpaDelta: Number(b.avg_cgpa_delta || 0.4),
    placementOutcomes: b.placement_outcomes || {},
  }));

  return {
    cohortSize: Number(liveData.cohort_size || fallbackCohort.cohortSize),
    avgPeerSimilarityPct: Number(
      liveData.avg_peer_similarity_pct || fallbackCohort.avgPeerSimilarityPct
    ),
    avgCohortCgpaSem4: Number(liveData.avg_cohort_cgpa_sem4 || fallbackCohort.avgCohortCgpaSem4),
    avgCohortElectiveSgpa: Number(
      liveData.avg_cohort_elective_sgpa || fallbackCohort.avgCohortElectiveSgpa
    ),
    avgCohortCgpaDelta: Number(
      liveData.avg_cohort_cgpa_delta || fallbackCohort.avgCohortCgpaDelta
    ),
    basketDistribution:
      basketDistribution.length > 0 ? basketDistribution : fallbackCohort.basketDistribution,
    placementSummary: liveData.placement_summary || fallbackCohort.placementSummary,
    closestSeniors: closestSeniors.length > 0 ? closestSeniors : fallbackCohort.closestSeniors,
  };
}

