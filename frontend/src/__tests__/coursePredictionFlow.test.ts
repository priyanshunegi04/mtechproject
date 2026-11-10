import { describe, expect, it } from 'vitest';
import {
  INITIAL_ELECTIVE_COURSES,
  SHOWCASE_PERSONAS,
} from '../data/tietCurriculumData';
import {
  adaptLiveCoursesToRecommendations,
  LiveCourseRecommendationsResponse,
} from '../services/mlService';

describe('ML Course Prediction Integration & Adaptation Flow', () => {
  const sampleUser = SHOWCASE_PERSONAS[0];
  const courses = INITIAL_ELECTIVE_COURSES;

  it('1. Successfully adapts real Python ML response with canonical "recommendations" course items', () => {
    const liveCourseResponse: LiveCourseRecommendationsResponse = {
      success: true,
      fallback: false,
      model_version: 'gbdt-tiet-cse-grade-workload-2026',
      recommendations: [
        {
          rank: 1,
          course_code: 'UCS551',
          title: 'Conversational AI: Accelerated Data Science',
          expected_grade_point: 8.85,
          expected_letter_grade: 'A',
          expected_marks: {
            mst_out_30: 26.5,
            est_out_45: 39.8,
            sessional_out_30: 27.2,
            total_out_100: 93.5,
          },
          expected_weekly_workload_hours: 6.8,
          confidence_interval_90: [8.2, 9.5],
          estimated_cutoff_cgpa: 7.8,
          allotment_probability_pct: 94.0,
          top_shap_reasons: [
            {
              feature: 'UCS301 Grade',
              impact: 0.35,
              reason: 'UCS301 Data Structures (10/10) strongly correlates with UCS551 success',
            },
          ],
        },
        {
          rank: 2,
          course_code: 'UCS548',
          title: 'Foundation of Data Science',
          expected_grade_point: 8.1,
          expected_letter_grade: 'B',
          expected_marks: {
            mst_out_30: 23.5,
            est_out_45: 35.0,
            sessional_out_30: 24.5,
            total_out_100: 83.0,
          },
          expected_weekly_workload_hours: 7.2,
          confidence_interval_90: [7.5, 8.7],
          estimated_cutoff_cgpa: 7.4,
          allotment_probability_pct: 88.0,
        },
      ],
    };

    const adapted = adaptLiveCoursesToRecommendations(liveCourseResponse, courses, sampleUser);

    expect(adapted).toHaveLength(2);
    expect(adapted[0].course.courseCode).toBe('UCS551');
    expect(adapted[0].expectedGradePoint).toBe(8.85);
    expect(adapted[0].expectedLetterGrade).toBe('A');
    expect(adapted[0].expectedMarks.mstOut30).toBe(Math.round(26.5));
    expect(adapted[0].expectedMarks.estOut45).toBe(Math.round(39.8));
    expect(adapted[0].expectedMarks.sessionalOut30).toBe(Math.round(27.2));
    expect(adapted[0].expectedWeeklyWorkloadHours).toBe(6.8);
    expect(adapted[0].estimatedCutoffCgpa).toBe(7.8);
    expect(adapted[0].allotmentProbabilityPct).toBe(94);
    expect(adapted[0].shapReasons[0].feature).toBe('UCS301 Grade');
  });

  it('2. Backwards compatibility: adapts responses with "ranked_courses" key', () => {
    const legacyResponse = {
      success: true,
      fallback: false,
      ranked_courses: [
        {
          rank: 1,
          course_code: 'UCS551',
          expected_grade_point: 8.5,
          expected_letter_grade: 'A',
          expected_marks: {
            mst_out_30: 25.0,
            est_out_45: 38.0,
            sessional_out_30: 26.0,
            total_out_100: 89.0,
          },
          expected_weekly_workload_hours: 7.0,
          estimated_cutoff_cgpa: 7.5,
          allotment_probability_pct: 90.0,
        },
      ],
    } as unknown as LiveCourseRecommendationsResponse;

    const adapted = adaptLiveCoursesToRecommendations(legacyResponse, courses, sampleUser);

    expect(adapted).toHaveLength(1);
    expect(adapted[0].course.courseCode).toBe('UCS551');
    expect(adapted[0].expectedGradePoint).toBe(8.5);
  });

  it('3. Returns empty array on empty recommendations (triggers fallback guard)', () => {
    const emptyResponse: LiveCourseRecommendationsResponse = {
      success: true,
      recommendations: [],
    };

    const adapted = adaptLiveCoursesToRecommendations(emptyResponse, courses, sampleUser);
    expect(adapted).toEqual([]);
  });

  it('4. Returns empty array on null, undefined, or invalid responses without throwing', () => {
    expect(
      adaptLiveCoursesToRecommendations(
        null as unknown as LiveCourseRecommendationsResponse,
        courses,
        sampleUser
      )
    ).toEqual([]);

    expect(
      adaptLiveCoursesToRecommendations(
        {} as unknown as LiveCourseRecommendationsResponse,
        courses,
        sampleUser
      )
    ).toEqual([]);

    expect(
      adaptLiveCoursesToRecommendations(
        { success: true, recommendations: 'invalid' as unknown as [] },
        courses,
        sampleUser
      )
    ).toEqual([]);
  });

  it('5. Distinguishes live ML course predictions from fallback responses', () => {
    const liveResponse: LiveCourseRecommendationsResponse = {
      success: true,
      fallback: false,
      model_version: 'gbdt-tiet-v1.0',
      recommendations: [
        {
          rank: 1,
          course_code: 'UCS551',
          expected_grade_point: 9.2,
          expected_letter_grade: 'A+',
        },
      ],
    };

    const fallbackResponse: LiveCourseRecommendationsResponse = {
      success: false,
      fallback: true,
      model_version: 'tiet-course-fallback-v1.0',
      recommendations: [
        {
          rank: 1,
          course_code: 'UCS551',
          expected_grade_point: 8.0,
          expected_letter_grade: 'B',
        },
      ],
    };

    const liveAdapted = adaptLiveCoursesToRecommendations(liveResponse, courses, sampleUser);
    const fallbackAdapted = adaptLiveCoursesToRecommendations(fallbackResponse, courses, sampleUser);

    expect(liveAdapted[0].expectedGradePoint).toBe(9.2);
    expect(fallbackAdapted[0].expectedGradePoint).toBe(8.0);
    expect(liveResponse.fallback).toBe(false);
    expect(fallbackResponse.fallback).toBe(true);
  });
});
