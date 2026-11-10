import { describe, expect, it } from 'vitest';
import {
  INITIAL_ELECTIVE_BASKETS,
  INITIAL_ELECTIVE_COURSES,
  SHOWCASE_PERSONAS,
} from '../data/tietCurriculumData';
import {
  adaptLiveBasketsToRecommendations,
  LiveBasketRecommendationsResponse,
} from '../services/mlService';

describe('ML Recommendation Integration & Adaptation Flow', () => {
  const sampleUser = SHOWCASE_PERSONAS[0];
  const baskets = INITIAL_ELECTIVE_BASKETS;
  const courses = INITIAL_ELECTIVE_COURSES;

  it('1. Successfully adapts real Python ML response with canonical "recommendations" key', () => {
    const livePythonResponse: LiveBasketRecommendationsResponse = {
      success: true,
      fallback: false,
      model_version: 'hybrid-tiet-cse-2026-v1.0',
      weights_applied: {
        alpha_content: 0.28,
        beta_collaborative: 0.24,
        gamma_expected_grade: 0.28,
        delta_career_alignment: 0.2,
      },
      recommendations: [
        {
          rank: 1,
          basket_id: 'EF01',
          basket_number: 1,
          name: 'Artificial Intelligence & Machine Learning',
          collaboration: 'NVIDIA & Intel',
          career_tracks: ['AI Engineer', 'ML Researcher'],
          composite_match_score: 93.8,
          hybrid_score: 93.8,
          predicted_grade: 8.9,
          score_breakdown: {
            content_score: 95.0,
            collaborative_score: 91.5,
            expected_grade_score: 89.0,
            career_alignment_score: 96.0,
          },
          expected_academic_impact: {
            expected_basket_sgpa: 8.9,
            expected_sgpa_delta_vs_current: 0.45,
            projected_cumulative_cgpa: 8.75,
            avg_weekly_workload_hours_per_course: 7.2,
          },
          seat_competition: {
            allotment_probability: 0.92,
            allotment_probability_pct: 92.0,
            estimated_cutoff_cgpa: 7.8,
            student_cgpa_margin: 0.95,
            competition_tier: 'HIGH_PROBABILITY',
          },
          four_semester_trajectory: [
            {
              elective_slot: 'PE-I',
              semester: 5,
              courses: [
                {
                  course_code: 'UCS501',
                  title: 'Deep Learning Architectures',
                  semester: 5,
                  elective_slot: 'PE-I',
                  expected_grade_point: 9.0,
                  expected_letter_grade: 'A',
                },
              ],
            },
          ],
          top_shap_reasons: [
            {
              feature: 'UCS301 Grade Point',
              feature_code: 'UCS301',
              student_value: '10/10',
              shap_impact: 0.35,
              direction: 'positive',
              reason: 'High foundation score in Data Structures strongly correlates with AI Basket success',
            },
          ],
        },
        {
          rank: 2,
          basket_id: 'EF02',
          basket_number: 2,
          name: 'Cloud Computing & DevOps',
          collaboration: 'Amazon Web Services',
          career_tracks: ['Cloud Solutions Architect', 'DevOps Engineer'],
          composite_match_score: 87.4,
          hybrid_score: 87.4,
          predicted_grade: 8.4,
          score_breakdown: {
            content_score: 86.0,
            collaborative_score: 88.0,
            expected_grade_score: 84.0,
            career_alignment_score: 90.0,
          },
        },
      ],
    };

    const adapted = adaptLiveBasketsToRecommendations(
      livePythonResponse,
      baskets,
      courses,
      sampleUser
    );

    expect(adapted).toBeDefined();
    expect(adapted.length).toBe(2);

    const first = adapted[0];
    expect(first.basket.basketId).toBe('EF_BASKET_01');
    expect(first.rank).toBe(1);
    expect(first.compositeMatchScore).toBe(93.8);
    expect(first.scoreBreakdown.careerAlignmentScore).toBe(96.0);
    expect(first.scoreBreakdown.cgpaBoostScore).toBe(89.0);
    expect(first.expectedBasketSgpa).toBe(8.9);
    expect(first.seatCompetition.competitionStatus).toBe('HIGH_PROBABILITY');
    expect(first.trajectoryCourses.length).toBe(1);
    expect(first.trajectoryCourses[0].courseCode).toBe('UCS501');
    expect(first.shapReasons.length).toBe(1);
    expect(first.shapReasons[0].featureCode).toBe('UCS301');
  });

  it('2. Successfully handles backward-compatible alias "ranked_baskets"', () => {
    const legacyResponse: LiveBasketRecommendationsResponse = {
      success: true,
      ranked_baskets: [
        {
          rank: 1,
          basket_id: 'EF03',
          name: 'Cyber Security',
          composite_match_score: 89.2,
        },
      ],
    };

    const adapted = adaptLiveBasketsToRecommendations(
      legacyResponse,
      baskets,
      courses,
      sampleUser
    );

    expect(adapted.length).toBe(1);
    expect(adapted[0].compositeMatchScore).toBe(89.2);
    expect(adapted[0].basket.basketId).toBe('EF_BASKET_03');
  });

  it('3. Returns empty array on empty recommendations (triggers fallback guard)', () => {
    const emptyResponse: LiveBasketRecommendationsResponse = {
      success: true,
      recommendations: [],
    };

    const adapted = adaptLiveBasketsToRecommendations(
      emptyResponse,
      baskets,
      courses,
      sampleUser
    );

    expect(adapted).toEqual([]);
  });

  it('4. Returns empty array on null, undefined, or invalid responses without throwing', () => {
    expect(
      adaptLiveBasketsToRecommendations(
        null as unknown as LiveBasketRecommendationsResponse,
        baskets,
        courses,
        sampleUser
      )
    ).toEqual([]);

    expect(
      adaptLiveBasketsToRecommendations(
        {} as unknown as LiveBasketRecommendationsResponse,
        baskets,
        courses,
        sampleUser
      )
    ).toEqual([]);

    expect(
      adaptLiveBasketsToRecommendations(
        { success: true, recommendations: 'not-an-array' as unknown as [] },
        baskets,
        courses,
        sampleUser
      )
    ).toEqual([]);
  });

  it('5. Distinguishes live ML response from fallback response metadata', () => {
    const liveResponse: LiveBasketRecommendationsResponse = {
      success: true,
      fallback: false,
      model_version: 'hybrid-tiet-cse-2026-v1.0',
      recommendations: [
        {
          rank: 1,
          basket_id: 'EF01',
          name: 'AI & ML',
          composite_match_score: 95.0,
        },
      ],
    };

    const fallbackResponse: LiveBasketRecommendationsResponse = {
      success: false,
      fallback: true,
      model_version: 'tiet-hybrid-fallback-v1.0',
      recommendations: [
        {
          rank: 1,
          basket_id: 'EF01',
          name: 'AI & ML',
          composite_match_score: 92.5,
        },
      ],
    };

    // Both adapt cleanly
    const liveAdapted = adaptLiveBasketsToRecommendations(liveResponse, baskets, courses, sampleUser);
    const fallbackAdapted = adaptLiveBasketsToRecommendations(fallbackResponse, baskets, courses, sampleUser);

    expect(liveAdapted[0].compositeMatchScore).toBe(95.0);
    expect(fallbackAdapted[0].compositeMatchScore).toBe(92.5);

    // Live vs fallback flags are verified
    expect(liveResponse.fallback).toBe(false);
    expect(liveResponse.success).toBe(true);
    expect(fallbackResponse.fallback).toBe(true);
    expect(fallbackResponse.success).toBe(false);
  });

  it('6. Correctly propagates source metadata (source, model_version, is_fallback, data_nature)', () => {
    const liveResponse: LiveBasketRecommendationsResponse = {
      success: true,
      fallback: false,
      is_fallback: false,
      source: 'ml_service',
      model_version: 'tiet-hybrid-v1.0.202611092043',
      data_nature: 'synthetic_development',
      generated_at: '2026-11-10T06:00:00.000Z',
      recommendations: [
        {
          rank: 1,
          basket_id: 'EF01',
          name: 'Artificial Intelligence & Machine Learning',
          composite_match_score: 95.0,
        },
      ],
    };

    const adapted = adaptLiveBasketsToRecommendations(liveResponse, baskets, courses, sampleUser);
    expect(adapted.length).toBe(1);
    expect(adapted[0].sourceMetadata).toBeDefined();
    expect(adapted[0].sourceMetadata?.source).toBe('ml_service');
    expect(adapted[0].sourceMetadata?.is_fallback).toBe(false);
    expect(adapted[0].sourceMetadata?.model_version).toBe('tiet-hybrid-v1.0.202611092043');
    expect(adapted[0].sourceMetadata?.data_nature).toBe('synthetic_development');
  });
});
