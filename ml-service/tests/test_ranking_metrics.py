"""
Unit tests for ThaparElectiveAI ranking evaluation metrics (`ranking_metrics.py`).
Tests mathematical correctness of Precision@K, Recall@K, HitRate@K, DCG@K, and NDCG@K.
"""

import math
import pytest

from app.ml.ranking_metrics import (
    precision_at_k,
    recall_at_k,
    hit_rate_at_k,
    dcg_at_k,
    ndcg_at_k,
    evaluate_student_recommendations,
    evaluate_cohort_recommendations,
)


class TestRankingMetricsHandCalculated:
    """Verifies metrics against hand-calculated mathematical proofs."""

    def test_precision_at_k_single_relevant_item(self):
        """
        When |G| = 1:
        If item is at rank 1, 2, or 3, Precision@3 MUST be 1/3 (approx 0.3333),
        NOT 1.0 (which was the bug in HitRate substitution).
        """
        recs = ["EF01", "EF02", "EF03", "EF04", "EF05"]

        # Item at rank 1
        p3_r1 = precision_at_k(recs, ["EF01"], k=3)
        assert p3_r1 == pytest.approx(1.0 / 3.0, rel=1e-5)

        # Item at rank 2
        p3_r2 = precision_at_k(recs, ["EF02"], k=3)
        assert p3_r2 == pytest.approx(1.0 / 3.0, rel=1e-5)

        # Item at rank 3
        p3_r3 = precision_at_k(recs, ["EF03"], k=3)
        assert p3_r3 == pytest.approx(1.0 / 3.0, rel=1e-5)

        # Item at rank 4 (outside top-3)
        p3_r4 = precision_at_k(recs, ["EF04"], k=3)
        assert p3_r4 == 0.0

        # Item at rank 4 (inside top-5)
        p5_r4 = precision_at_k(recs, ["EF04"], k=5)
        assert p5_r4 == pytest.approx(1.0 / 5.0, rel=1e-5)

    def test_recall_at_k_single_relevant_item(self):
        """
        When |G| = 1:
        Recall@3 is 1.0 if item is in top-3, and 0.0 if not.
        """
        recs = ["EF01", "EF02", "EF03", "EF04", "EF05"]

        assert recall_at_k(recs, ["EF01"], k=3) == 1.0
        assert recall_at_k(recs, ["EF02"], k=3) == 1.0
        assert recall_at_k(recs, ["EF03"], k=3) == 1.0
        assert recall_at_k(recs, ["EF04"], k=3) == 0.0
        assert recall_at_k(recs, ["EF04"], k=5) == 1.0

    def test_hit_rate_at_k(self):
        """
        HitRate@K is binary: 1.0 if at least one relevant item in top K, else 0.0.
        """
        recs = ["EF01", "EF02", "EF03", "EF04", "EF05"]

        assert hit_rate_at_k(recs, ["EF02"], k=3) == 1.0
        assert hit_rate_at_k(recs, ["EF04"], k=3) == 0.0
        assert hit_rate_at_k(recs, ["EF04"], k=4) == 1.0

    def test_precision_recall_distinction_multiple_relevant(self):
        """
        Demonstrates why Precision and Recall diverge when |G| > 1.
        Suppose student has 3 relevant baskets, and 2 are in top 3.
        Precision@3 = 2 / 3
        Recall@3 = 2 / 3
        Suppose 4 items recommended, and all 3 relevant are in top 4:
        Precision@4 = 3 / 4 = 0.75
        Recall@4 = 3 / 3 = 1.0
        """
        recs = ["EF01", "EF02", "EF03", "EF04"]
        relevant = ["EF01", "EF02", "EF09"]

        # In top 3: EF01 and EF02 hit (2 hits)
        assert precision_at_k(recs, relevant, k=3) == pytest.approx(2.0 / 3.0, rel=1e-5)
        assert recall_at_k(recs, relevant, k=3) == pytest.approx(2.0 / 3.0, rel=1e-5)

        # Relevant: EF01, EF02, EF03 (3 hits in top 4)
        relevant_all = ["EF01", "EF02", "EF03"]
        assert precision_at_k(recs, relevant_all, k=4) == pytest.approx(3.0 / 4.0, rel=1e-5)
        assert recall_at_k(recs, relevant_all, k=4) == pytest.approx(1.0, rel=1e-5)

    def test_dcg_and_ndcg_exact_values(self):
        """
        Verifies exact DCG and NDCG calculations against manual math.
        """
        recs = ["EF01", "EF02", "EF03", "EF04", "EF05"]

        # Case 1: Single item at Rank 1
        # DCG@3 = 1 / log2(2) = 1.0
        # IDCG@3 = 1 / log2(2) = 1.0
        # NDCG@3 = 1.0
        assert ndcg_at_k(recs, ["EF01"], k=3) == pytest.approx(1.0, rel=1e-5)

        # Case 2: Single item at Rank 2
        # DCG@3 = 1 / log2(3) = 1 / 1.584962500721156 = 0.6309297535714574
        # IDCG@3 = 1.0
        # NDCG@3 = 0.63092975...
        expected_ndcg_r2 = 1.0 / math.log2(3)
        assert ndcg_at_k(recs, ["EF02"], k=3) == pytest.approx(expected_ndcg_r2, rel=1e-5)

        # Case 3: Single item at Rank 3
        # DCG@3 = 1 / log2(4) = 0.5
        # IDCG@3 = 1.0
        # NDCG@3 = 0.5
        assert ndcg_at_k(recs, ["EF03"], k=3) == pytest.approx(0.5, rel=1e-5)

        # Case 4: Item at Rank 4, evaluated at k=3 -> 0.0
        assert ndcg_at_k(recs, ["EF04"], k=3) == 0.0

        # Case 5: Item at Rank 4, evaluated at k=5
        # DCG@5 = 1 / log2(5) = 1 / 2.321928094887362 = 0.43067655807339306
        # IDCG@5 = 1.0
        # NDCG@5 = 0.43067655...
        expected_ndcg_r4_k5 = 1.0 / math.log2(5)
        assert ndcg_at_k(recs, ["EF04"], k=5) == pytest.approx(expected_ndcg_r4_k5, rel=1e-5)

    def test_ndcg_multiple_relevant_items(self):
        """
        Two relevant items at ranks 1 and 3:
        DCG@3 = 1/log2(2) + 1/log2(4) = 1.0 + 0.5 = 1.5
        Ideal ordering would have them at ranks 1 and 2:
        IDCG@3 = 1/log2(2) + 1/log2(3) = 1.0 + 0.63092975 = 1.63092975
        NDCG@3 = 1.5 / 1.63092975 ≈ 0.919721
        """
        recs = ["EF01", "EF02", "EF03", "EF04"]
        relevant = ["EF01", "EF03"]

        expected_dcg = (1.0 / math.log2(2)) + (1.0 / math.log2(4))
        expected_idcg = (1.0 / math.log2(2)) + (1.0 / math.log2(3))
        expected_ndcg = expected_dcg / expected_idcg

        assert dcg_at_k(recs, relevant, k=3) == pytest.approx(expected_dcg, rel=1e-5)
        assert ndcg_at_k(recs, relevant, k=3) == pytest.approx(expected_ndcg, rel=1e-5)


class TestRankingMetricsEdgeCases:
    """Verifies edge cases and input validation."""

    def test_empty_ground_truth(self):
        """When student has no ground truth, metrics return 0.0 safely."""
        recs = ["EF01", "EF02", "EF03"]
        assert precision_at_k(recs, [], k=3) == 0.0
        assert recall_at_k(recs, [], k=3) == 0.0
        assert hit_rate_at_k(recs, [], k=3) == 0.0
        assert dcg_at_k(recs, [], k=3) == 0.0
        assert ndcg_at_k(recs, [], k=3) == 0.0

    def test_empty_recommendations(self):
        """When recommendation list is empty, metrics return 0.0 safely."""
        assert precision_at_k([], ["EF01"], k=3) == 0.0
        assert recall_at_k([], ["EF01"], k=3) == 0.0
        assert hit_rate_at_k([], ["EF01"], k=3) == 0.0
        assert dcg_at_k([], ["EF01"], k=3) == 0.0
        assert ndcg_at_k([], ["EF01"], k=3) == 0.0

    def test_invalid_k_raises_value_error(self):
        """k must be a positive integer."""
        with pytest.raises(ValueError, match="k must be a positive integer"):
            precision_at_k(["EF01"], ["EF01"], k=0)

        with pytest.raises(ValueError, match="k must be a positive integer"):
            recall_at_k(["EF01"], ["EF01"], k=-1)

        with pytest.raises(ValueError, match="k must be a positive integer"):
            hit_rate_at_k(["EF01"], ["EF01"], k=0)

        with pytest.raises(ValueError, match="k must be a positive integer"):
            ndcg_at_k(["EF01"], ["EF01"], k=-5)


class TestEvaluateStudentRecommendations:
    """Verifies single student evaluation dictionary and macro-averaging over cohorts."""

    def test_single_student_evaluation(self):
        """Verifies evaluate_student_recommendations dictionary keys and values."""
        recs = ["EF01", "EF02", "EF03", "EF04", "EF05"]
        single_metrics = evaluate_student_recommendations(recs, ["EF01"])

        assert single_metrics["precision_at_3"] == pytest.approx(1.0 / 3.0, rel=1e-5)
        assert single_metrics["recall_at_3"] == 1.0
        assert single_metrics["hit_rate_at_3"] == 1.0
        assert single_metrics["precision_at_5"] == pytest.approx(1.0 / 5.0, rel=1e-5)
        assert single_metrics["recall_at_5"] == 1.0
        assert single_metrics["hit_rate_at_5"] == 1.0
        assert single_metrics["ndcg_at_5"] == pytest.approx(1.0, rel=1e-5)

    def test_cohort_macro_averaging(self):
        """
        Cohort of 3 students:
        - Student 1: relevant at rank 1 -> P@3 = 1/3, R@3 = 1.0, Hit@3 = 1.0, NDCG@5 = 1.0
        - Student 2: relevant at rank 3 -> P@3 = 1/3, R@3 = 1.0, Hit@3 = 1.0, NDCG@5 = 0.5
        - Student 3: relevant at rank 4 -> P@3 = 0.0, R@3 = 0.0, Hit@3 = 0.0, NDCG@5 = 1/log2(5)
        - Student 4: empty ground truth -> skipped by policy!
        """
        student_predictions = [
            # Student 1
            (["EF01", "EF02", "EF03", "EF04", "EF05"], ["EF01"]),
            # Student 2
            (["EF01", "EF02", "EF03", "EF04", "EF05"], ["EF03"]),
            # Student 3
            (["EF01", "EF02", "EF03", "EF04", "EF05"], ["EF04"]),
            # Student 4 (no relevant items)
            (["EF01", "EF02", "EF03"], []),
        ]

        metrics = evaluate_cohort_recommendations(student_predictions, k_precision=3, k_ndcg=5)

        assert metrics["evaluated_students"] == 3
        assert metrics["skipped_students"] == 1

        # Hit rate: 2 out of 3 hit in top 3 = 2/3
        assert metrics["hit_rate_at_3"] == pytest.approx(2.0 / 3.0, rel=1e-5)

        # Recall: 2 out of 3 have recall 1.0, 1 has 0.0 => 2/3
        assert metrics["recall_at_3"] == pytest.approx(2.0 / 3.0, rel=1e-5)

        # Precision: (1/3 + 1/3 + 0) / 3 = (2/3) / 3 = 2/9 ≈ 0.2222
        assert metrics["precision_at_3"] == pytest.approx(2.0 / 9.0, rel=1e-5)

        # NDCG@5: (1.0 + 0.5 + 1/log2(5)) / 3
        expected_mean_ndcg = (1.0 + 0.5 + (1.0 / math.log2(5))) / 3.0
        assert metrics["ndcg_at_5"] == pytest.approx(expected_mean_ndcg, rel=1e-5)
