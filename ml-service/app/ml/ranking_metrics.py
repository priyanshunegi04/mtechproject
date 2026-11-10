"""
Ranking Evaluation Metrics Module for Recommender Systems (`ranking_metrics.py`)
Provides mathematically sound, peer-reviewed evaluation metrics for Top-K ranking:
  - Precision@K: Proportion of recommended items in Top-K that are relevant.
                 Precision@K = |Top-K ∩ Relevant| / K
  - Recall@K: Proportion of ground-truth relevant items captured in Top-K.
              Recall@K = |Top-K ∩ Relevant| / |Relevant|
  - HitRate@K (Hit@K): Binary indicator whether at least one relevant item is in Top-K.
                       Hit@K = 1.0 if |Top-K ∩ Relevant| > 0 else 0.0
  - NDCG@K: Normalized Discounted Cumulative Gain at rank K with logarithmic discount.
            DCG@K = sum_{i=1}^K rel_i / log2(i + 1)
            IDCG@K = sum_{i=1}^{min(K, |Relevant|)} 1.0 / log2(i + 1)
            NDCG@K = DCG@K / IDCG@K

Evaluation Policy for Edge Cases:
  - When |Relevant| == 0: Recall, NDCG, and Precision cannot be meaningfully evaluated.
    Per evaluation policy, such queries are excluded from macro-averages and logged.
  - When K <= 0: Raises ValueError.
  - Single Relevant Item Special Case:
    When |Relevant| == 1 (e.g. single chosen basket per student):
      Precision@K = 1/K if Hit else 0.0 (maximum possible Precision@3 is 1/3 ~ 0.3333).
      Recall@K = 1.0 if Hit else 0.0 (identical to HitRate@K).
      NDCG@K = 1 / log2(rank + 1) if Hit at 'rank' <= K else 0.0.
"""

from __future__ import annotations

import math
from typing import Any, Collection, Dict, List, Optional, Sequence, Set, Tuple


def precision_at_k(
    recommended: Sequence[Any],
    relevant: Collection[Any],
    k: int,
) -> float:
    """
    Compute Precision@K.

    Definition:
        Precision@K = |Top-K ∩ Relevant| / K

    Parameters:
        recommended: Ordered list of recommended item identifiers.
        relevant: Collection of ground-truth relevant item identifiers.
        k: Cutoff rank (must be >= 1).

    Returns:
        Precision score in range [0.0, 1.0].
    """
    if k <= 0:
        raise ValueError(f"k must be a positive integer >= 1, got {k}")
    if not relevant:
        return 0.0

    relevant_set = set(relevant)
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant_set)
    return float(hits / k)


def recall_at_k(
    recommended: Sequence[Any],
    relevant: Collection[Any],
    k: int,
) -> float:
    """
    Compute Recall@K.

    Definition:
        Recall@K = |Top-K ∩ Relevant| / |Relevant|

    Parameters:
        recommended: Ordered list of recommended item identifiers.
        relevant: Collection of ground-truth relevant item identifiers.
        k: Cutoff rank (must be >= 1).

    Returns:
        Recall score in range [0.0, 1.0]. If relevant is empty, returns 0.0.
    """
    if k <= 0:
        raise ValueError(f"k must be a positive integer >= 1, got {k}")
    if not relevant:
        return 0.0

    relevant_set = set(relevant)
    top_k = recommended[:k]
    hits = sum(1 for item in top_k if item in relevant_set)
    return float(hits / len(relevant_set))


def hit_rate_at_k(
    recommended: Sequence[Any],
    relevant: Collection[Any],
    k: int,
) -> float:
    """
    Compute HitRate@K (Hit@K).

    Definition:
        Hit@K = 1.0 if |Top-K ∩ Relevant| > 0 else 0.0

    Parameters:
        recommended: Ordered list of recommended item identifiers.
        relevant: Collection of ground-truth relevant item identifiers.
        k: Cutoff rank (must be >= 1).

    Returns:
        1.0 if any relevant item is present in Top-K, else 0.0.
    """
    if k <= 0:
        raise ValueError(f"k must be a positive integer >= 1, got {k}")
    if not relevant:
        return 0.0

    relevant_set = set(relevant)
    top_k = recommended[:k]
    has_hit = any(item in relevant_set for item in top_k)
    return 1.0 if has_hit else 0.0


def dcg_at_k(
    recommended: Sequence[Any],
    relevant: Collection[Any],
    k: int,
) -> float:
    """
    Compute Discounted Cumulative Gain at rank K with binary relevance.

    DCG@K = sum_{i=1}^K rel_i / log2(i + 1)
    """
    if k <= 0:
        raise ValueError(f"k must be a positive integer >= 1, got {k}")
    relevant_set = set(relevant)
    dcg = 0.0
    for idx, item in enumerate(recommended[:k]):
        if item in relevant_set:
            # Rank i = idx + 1 (1-indexed); discount = log2(i + 1) = log2(idx + 2)
            dcg += 1.0 / math.log2(idx + 2.0)
    return dcg


def ndcg_at_k(
    recommended: Sequence[Any],
    relevant: Collection[Any],
    k: int,
) -> float:
    """
    Compute Normalized Discounted Cumulative Gain at rank K with binary relevance.

    Definition:
        NDCG@K = DCG@K / IDCG@K
        where IDCG@K = sum_{i=1}^{min(K, |Relevant|)} 1.0 / log2(i + 1)

    Parameters:
        recommended: Ordered list of recommended item identifiers.
        relevant: Collection of ground-truth relevant item identifiers.
        k: Cutoff rank (must be >= 1).

    Returns:
        NDCG score in range [0.0, 1.0].
    """
    if k <= 0:
        raise ValueError(f"k must be a positive integer >= 1, got {k}")
    if not relevant:
        return 0.0

    relevant_set = set(relevant)
    dcg = dcg_at_k(recommended, relevant_set, k)

    # Ideal DCG corresponds to all min(K, |Relevant|) relevant items placed at ranks 1..ideal_hits
    ideal_hits = min(k, len(relevant_set))
    if ideal_hits == 0:
        return 0.0

    idcg = sum(1.0 / math.log2(idx + 2.0) for idx in range(ideal_hits))
    return float(min(1.0, dcg / idcg))


def evaluate_student_recommendations(
    recommended: Sequence[Any],
    relevant: Collection[Any],
) -> Dict[str, float]:
    """
    Compute standard academic recommendation metrics for a single student.
    Returns:
      - precision_at_3: |Top-3 ∩ Relevant| / 3
      - recall_at_3: |Top-3 ∩ Relevant| / |Relevant|
      - hit_rate_at_3: 1.0 if any relevant in Top-3 else 0.0
      - precision_at_5: |Top-5 ∩ Relevant| / 5
      - recall_at_5: |Top-5 ∩ Relevant| / |Relevant|
      - hit_rate_at_5: 1.0 if any relevant in Top-5 else 0.0
      - ndcg_at_5: Normalized Discounted Cumulative Gain at rank 5
    """
    return {
        "precision_at_3": precision_at_k(recommended, relevant, k=3),
        "recall_at_3": recall_at_k(recommended, relevant, k=3),
        "hit_rate_at_3": hit_rate_at_k(recommended, relevant, k=3),
        "precision_at_5": precision_at_k(recommended, relevant, k=5),
        "recall_at_5": recall_at_k(recommended, relevant, k=5),
        "hit_rate_at_5": hit_rate_at_k(recommended, relevant, k=5),
        "ndcg_at_5": ndcg_at_k(recommended, relevant, k=5),
    }


def evaluate_cohort_recommendations(
    student_predictions: Sequence[Tuple[Sequence[Any], Collection[Any]]],
    k_precision: int = 3,
    k_ndcg: int = 5,
    skip_empty_relevant: bool = True,
) -> Dict[str, Any]:
    """
    Compute macro-averaged ranking evaluation metrics across a cohort of students.

    Evaluation Policy:
        Students with no ground truth relevant items (|Relevant| = 0) are excluded
        from the macro-average if `skip_empty_relevant=True`, and the count of skipped
        students is tracked and returned for full evaluation transparency.

    Parameters:
        student_predictions: List of tuples (recommended_items, relevant_items).
        k_precision: Rank cutoff for precision, recall, and hit rate.
        k_ndcg: Rank cutoff for NDCG.
        skip_empty_relevant: Whether to exclude students with empty ground truth.

    Returns:
        Dict containing evaluated student count, skipped count, and macro-averaged metrics:
        `precision_at_k`, `recall_at_k`, `hit_rate_at_k`, `ndcg_at_k`.
    """
    precisions: List[float] = []
    recalls: List[float] = []
    hit_rates: List[float] = []
    ndcgs: List[float] = []
    skipped_count: int = 0

    for recs, rels in student_predictions:
        if not rels and skip_empty_relevant:
            skipped_count += 1
            continue

        precisions.append(precision_at_k(recs, rels, k=k_precision))
        recalls.append(recall_at_k(recs, rels, k=k_precision))
        hit_rates.append(hit_rate_at_k(recs, rels, k=k_precision))
        ndcgs.append(ndcg_at_k(recs, rels, k=k_ndcg))

    mean_p = float(sum(precisions) / len(precisions)) if precisions else 0.0
    mean_r = float(sum(recalls) / len(recalls)) if recalls else 0.0
    mean_hit = float(sum(hit_rates) / len(hit_rates)) if hit_rates else 0.0
    mean_ndcg = float(sum(ndcgs) / len(ndcgs)) if ndcgs else 0.0

    return {
        "evaluated_students": len(precisions),
        "skipped_students": skipped_count,
        f"precision_at_{k_precision}": mean_p,
        f"recall_at_{k_precision}": mean_r,
        f"hit_rate_at_{k_precision}": mean_hit,
        f"ndcg_at_{k_ndcg}": mean_ndcg,
    }
