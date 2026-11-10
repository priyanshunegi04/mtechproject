import axios from 'axios';
import request from 'supertest';
import { validateEnv } from '../config/env';
import { createExpressApp } from '../index';

describe('ML Recommendation API Response Contract & Resilience Tests', () => {
  const env = validateEnv();
  const app = createExpressApp(env);

  const sampleStudentPayload = {
    cgpa: 8.75,
    core_grades: {
      UES103: 9.0,
      UMA022: 8.5,
      UCS301: 9.5,
      UCS415: 9.0,
    },
    skills: ['Python', 'PyTorch', 'SQL'],
    career_interest: 'Machine Learning Engineer',
    weights: {
      alpha: 0.28,
      beta: 0.24,
      gamma: 0.28,
      delta: 0.2,
    },
  };

  it('1. Standardizes successful ML response guaranteeing both "recommendations" and "ranked_baskets"', async () => {
    const mockMlResponseData = {
      success: true,
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
          basket_id: 'EF_BASKET_01',
          name: 'Artificial Intelligence & Machine Learning',
          composite_match_score: 94.2,
          hybrid_score: 94.2,
          predicted_grade: 8.95,
          top_shap_reasons: [
            {
              feature: 'UCS301 Data Structures',
              shap_impact: 0.42,
              direction: 'positive',
            },
          ],
        },
      ],
    };

    const axiosSpy = jest
      .spyOn(axios.Axios.prototype, 'request')
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: mockMlResponseData,
      });

    const res = await request(app)
      .post('/api/ml/recommend-baskets')
      .send(sampleStudentPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fallback).toBe(false);
    expect(res.body.is_fallback).toBe(false);
    expect(res.body.source).toBe('ml_service');
    expect(res.body.model_version).toBe('hybrid-tiet-cse-2026-v1.0');
    expect(res.body.data_nature).toBe('synthetic_development');
    expect(typeof res.body.generated_at).toBe('string');

    // Verify canonical `recommendations` and alias `ranked_baskets` are BOTH populated
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(Array.isArray(res.body.ranked_baskets)).toBe(true);
    expect(res.body.recommendations.length).toBe(1);
    expect(res.body.ranked_baskets.length).toBe(1);
    expect(res.body.recommendations[0].basket_id).toBe('EF_BASKET_01');
    expect(res.body.ranked_baskets[0].basket_id).toBe('EF_BASKET_01');

    axiosSpy.mockRestore();
  });

  it('2. Correctly passes through empty recommendations without crashing', async () => {
    const mockEmptyData = {
      success: true,
      model_version: 'hybrid-tiet-cse-2026-v1.0',
      recommendations: [],
    };

    const axiosSpy = jest
      .spyOn(axios.Axios.prototype, 'request')
      .mockResolvedValueOnce({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
        data: mockEmptyData,
      });

    const res = await request(app)
      .post('/api/ml/recommend-baskets')
      .send(sampleStudentPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fallback).toBe(false);
    expect(res.body.is_fallback).toBe(false);
    expect(res.body.source).toBe('ml_service');
    expect(res.body.model_version).toBe('hybrid-tiet-cse-2026-v1.0');
    expect(res.body.data_nature).toBe('synthetic_development');
    expect(typeof res.body.generated_at).toBe('string');
    expect(res.body.recommendations).toEqual([]);
    expect(res.body.ranked_baskets).toEqual([]);

    axiosSpy.mockRestore();
  });

  it('3. Gracefully returns fallback response when ML service throws a network timeout / 502 Bad Gateway', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const axiosSpy = jest
      .spyOn(axios.Axios.prototype, 'request')
      .mockRejectedValueOnce({
        isAxiosError: true,
        message: 'connect ECONNREFUSED 127.0.0.1:10000',
        code: 'ECONNREFUSED',
        response: { status: 502, data: { detail: 'Bad Gateway' } },
      });

    const res = await request(app)
      .post('/api/ml/recommend-baskets')
      .send(sampleStudentPayload);

    expect(res.status).toBe(200);
    // Explicit fallback indicators
    expect(res.body.success).toBe(false);
    expect(res.body.fallback).toBe(true);
    expect(res.body.is_fallback).toBe(true);
    expect(res.body.source).toBe('local_fallback');
    expect(res.body.model_version).toBe('tiet-hybrid-fallback-v1.0');
    expect(res.body.data_nature).toBe('heuristic_fallback');
    expect(typeof res.body.generated_at).toBe('string');

    // Both keys available in fallback
    expect(Array.isArray(res.body.recommendations)).toBe(true);
    expect(Array.isArray(res.body.ranked_baskets)).toBe(true);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.ranked_baskets.length).toBeGreaterThan(0);

    // Verify structured logging without leaking credentials
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ML Service proxy error:',
      expect.objectContaining({
        code: 'ECONNREFUSED',
      })
    );

    axiosSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('4. Fallback recommendations provide 12 ranked baskets sorted by composite match score', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const axiosSpy = jest
      .spyOn(axios.Axios.prototype, 'request')
      .mockRejectedValueOnce(new Error('ML Service Cold Start Timeout'));

    const res = await request(app)
      .post('/api/ml/recommend-baskets')
      .send(sampleStudentPayload);

    expect(res.status).toBe(200);
    expect(res.body.fallback).toBe(true);

    const recs = res.body.recommendations;
    expect(recs.length).toBe(12);

    // Check ranks 1 to 12
    recs.forEach((item: any, idx: number) => {
      expect(item.rank).toBe(idx + 1);
      expect(typeof item.composite_match_score).toBe('number');
      expect(item.basket_id).toBeDefined();
    });

    // Check descending score order
    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].composite_match_score).toBeGreaterThanOrEqual(recs[i + 1].composite_match_score);
    }

    axiosSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Course-level Recommendations & Performance Prediction Contract', () => {
    it('5. Standardizes successful /api/ml/recommend-courses response guaranteeing both "recommendations" and "ranked_courses"', async () => {
      const mockCourseResponseData = {
        success: true,
        model_version: 'gbdt-tiet-cse-grade-workload-2026',
        recommendations: [
          {
            rank: 1,
            course_code: 'UCS549',
            title: 'Deep Learning Architectures',
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
          },
        ],
      };

      const axiosSpy = jest
        .spyOn(axios.Axios.prototype, 'request')
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
          data: mockCourseResponseData,
        });

      const res = await request(app)
        .post('/api/ml/recommend-courses')
        .send(sampleStudentPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(false);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(Array.isArray(res.body.ranked_courses)).toBe(true);
      expect(res.body.recommendations[0].course_code).toBe('UCS549');
      expect(res.body.ranked_courses[0].course_code).toBe('UCS549');

      axiosSpy.mockRestore();
    });

    it('6. Gracefully returns fallback course recommendations when ML service fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const axiosSpy = jest
        .spyOn(axios.Axios.prototype, 'request')
        .mockRejectedValueOnce(new Error('ML Service 502 Bad Gateway'));

      const res = await request(app)
        .post('/api/ml/recommend-courses')
        .send(sampleStudentPayload);

      expect(res.status).toBe(200);
      expect(res.body.fallback).toBe(true);
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(Array.isArray(res.body.ranked_courses)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
      expect(res.body.recommendations[0].expected_grade_point).toBeDefined();

      axiosSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('7. Returns standardized response for /api/ml/predict-performance', async () => {
      const mockPerfData = {
        success: true,
        projected_sgpa: 8.65,
        total_weekly_workload_hours: 24.5,
        overload_risk_index: 0.32,
        overload_risk_category: 'LOW',
        course_predictions: [
          {
            course_code: 'UCS549',
            expected_grade_point: 8.8,
            expected_letter_grade: 'A',
            expected_marks: {
              mst_out_30: 26.0,
              est_out_45: 39.0,
              sessional_out_30: 27.0,
              total_out_100: 92.0,
            },
            expected_weekly_workload_hours: 6.5,
          },
        ],
      };

      const axiosSpy = jest
        .spyOn(axios.Axios.prototype, 'request')
        .mockResolvedValueOnce({
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
          data: mockPerfData,
        });

      const res = await request(app)
        .post('/api/ml/predict-performance')
        .send({
          student_profile: sampleStudentPayload,
          course_codes: ['UCS549'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.fallback).toBe(false);
      expect(res.body.projected_sgpa).toBe(8.65);
      expect(res.body.course_predictions[0].course_code).toBe('UCS549');

      axiosSpy.mockRestore();
    });
  });
});
