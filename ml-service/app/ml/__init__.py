"""ThaparElectiveAI Multi-Model Machine Learning Pipeline Package."""

from app.ml.collaborative_recommender import CollaborativeRecommender
from app.ml.content_recommender import ContentBasedRecommender
from app.ml.grade_workload_predictor import GradeWorkloadPredictor
from app.ml.hybrid_ranker import HybridElectiveRanker
from app.ml.ranking_metrics import (
    dcg_at_k,
    evaluate_student_recommendations,
    hit_rate_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
)

__all__ = [
    "ContentBasedRecommender",
    "CollaborativeRecommender",
    "GradeWorkloadPredictor",
    "HybridElectiveRanker",
    "precision_at_k",
    "recall_at_k",
    "hit_rate_at_k",
    "dcg_at_k",
    "ndcg_at_k",
    "evaluate_student_recommendations",
    "evaluate_cohort_recommendations",
]
