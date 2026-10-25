#!/usr/bin/env python3
"""
Full Multi-Model ML Training & MongoDB Atlas Registry Pipeline (`ml-service/app/ml/train_all.py`).

Executes the complete training pipeline across:
  1. `content_recommender` (`ContentBasedRecommender` — TF-IDF 1-2 grams + TruncatedSVD LSA)
  2. `collaborative_recommender` (`CollaborativeRecommender` — TruncatedSVD Matrix Factorization + 50-Peer k-NN)
  3. `grade_workload_predictor` (`GradeWorkloadPredictor` — HistGradientBoostingRegressor GBDT)
  4. `hybrid_ranker` (`HybridElectiveRanker` — Multi-objective ranker + TreeSHAP explainability)

Saves serialized model artifacts to `ml-service/models/` and logs validation metrics
(`RMSE`, `MAE`, `Precision@3`, `NDCG@5`) to the `ml_model_registry` collection in MongoDB Atlas.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parent.parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.config import MLServiceSettings
from app.db.mongodb import create_pymongo_atlas_client, mask_mongo_uri
from app.ml.collaborative_recommender import CollaborativeRecommender
from app.ml.content_recommender import ContentBasedRecommender
from app.ml.grade_workload_predictor import GradeWorkloadPredictor
from app.ml.hybrid_ranker import (
    HybridElectiveRanker,
    load_training_datasets,
    log_model_registry_to_atlas,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("thapar-ml.train-all")


def execute_full_training_pipeline(
    sync_db: Optional[Any] = None,
    random_seed: int = 42,
) -> Dict[str, Any]:
    """
    Train all four ML modules (`content_recommender`, `collaborative_recommender`,
    `grade_workload_predictor`, `hybrid_ranker`), save artifacts to `ml-service/models/`,
    and log validation metrics to `ml_model_registry` in MongoDB Atlas.
    """
    processed_dir = SERVICE_ROOT / "data" / "processed"
    models_dir = SERVICE_ROOT / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    if not (processed_dir / "courses_catalog.json").exists():
        logger.info("Processed dataset artifacts missing; generating TIET 2026 curriculum dataset...")
        from data.generate_tiet_dataset import (
            build_courses_catalog,
            generate_students_and_enrollments,
            write_processed_artifacts,
        )

        cat = build_courses_catalog()
        stu, enr = generate_students_and_enrollments(cat, num_students=3500, seed=random_seed)
        write_processed_artifacts(processed_dir, cat, stu, enr)

    catalog, students_df, enrollments_df, data_source = load_training_datasets(
        processed_dir=processed_dir,
        sync_db=sync_db,
    )

    logger.info(
        "Loaded training datasets from '%s' | Courses: %d | Students: %d | Enrollments: %d",
        data_source,
        len(catalog.get("all_courses", [])),
        len(students_df),
        len(enrollments_df),
    )

    # Verify individual module classes are available and orchestrated by HybridElectiveRanker
    _ = (ContentBasedRecommender, CollaborativeRecommender, GradeWorkloadPredictor)

    ranker = HybridElectiveRanker(random_state=random_seed)
    ranker.fit(
        catalog=catalog,
        students_df=students_df,
        enrollments_df=enrollments_df,
    )
    metrics = ranker.evaluation_metrics

    artifact_paths = ranker.save_artifacts(models_dir)
    logger.info("Saved trained model artifacts to %s: %s", models_dir, artifact_paths)

    # Log to MongoDB Atlas `ml_model_registry` collection
    log_model_registry_to_atlas(
        sync_db=sync_db,
        ranker=ranker,
        data_source=data_source,
        artifact_paths=artifact_paths,
    )

    if sync_db is not None:
        try:
            registry_Summary = {
                "model_version": ranker.model_version,
                "trained_at": ranker.trained_at or datetime.now(timezone.utc).isoformat(),
                "RMSE": metrics.get("rmse"),
                "MAE": metrics.get("mae"),
                "Precision@3": metrics.get("precision_at_3"),
                "NDCG@5": metrics.get("ndcg_at_5"),
                "Grade_R2": metrics.get("grade_r2"),
                "Workload_RMSE": metrics.get("workload_rmse"),
                "Workload_MAE": metrics.get("workload_mae"),
                "dataset_counts": ranker.dataset_counts,
                "artifact_paths": artifact_paths,
                "status": "ACTIVE_PRODUCTION",
            }
            sync_db["ml_model_registry"].update_one(
                {"model_version": ranker.model_version},
                {"$set": registry_Summary},
                upsert=True,
            )
            logger.info(
                "Successfully logged RMSE=%.4f, MAE=%.4f, Precision@3=%.4f, NDCG@5=%.4f to MongoDB Atlas 'ml_model_registry'",
                float(metrics.get("rmse", 0.0)),
                float(metrics.get("mae", 0.0)),
                float(metrics.get("precision_at_3", 0.0)),
                float(metrics.get("ndcg_at_5", 0.0)),
            )
        except Exception as exc:
            logger.warning("Could not write additional summary to MongoDB Atlas ml_model_registry: %s", exc)

    return {
        "model_version": ranker.model_version,
        "trained_at": ranker.trained_at,
        "data_source": data_source,
        "metrics": {
            "RMSE": metrics.get("rmse"),
            "MAE": metrics.get("mae"),
            "Precision@3": metrics.get("precision_at_3"),
            "NDCG@5": metrics.get("ndcg_at_5"),
            "Grade_R2": metrics.get("grade_r2"),
            "Workload_RMSE": metrics.get("workload_rmse"),
            "Workload_MAE": metrics.get("workload_mae"),
        },
        "artifact_paths": artifact_paths,
    }


def main() -> None:
    load_dotenv(SERVICE_ROOT / ".env", override=True)
    load_dotenv(SERVICE_ROOT.parent / ".env", override=False)
    settings = MLServiceSettings()

    sync_db_conn = None
    client = None
    if settings.has_live_atlas_uri and settings.MONGODB_URI:
        masked = mask_mongo_uri(settings.MONGODB_URI)
        try:
            logger.info("Connecting to remote MongoDB Atlas cluster (%s)...", masked)
            client = create_pymongo_atlas_client(settings)
            client.admin.command("ping")
            sync_db_conn = client[settings.MONGODB_DB_NAME]
            logger.info("Connected to MongoDB Atlas database '%s'", settings.MONGODB_DB_NAME)
        except Exception as exc:
            logger.warning("MongoDB Atlas connection failed (%s); training with local processed dataset", exc)

    try:
        result = execute_full_training_pipeline(
            sync_db=sync_db_conn,
            random_seed=settings.RANDOM_SEED,
        )
        logger.info("Full ML Training Pipeline Summary:\n%s", json.dumps(result, indent=2))
    finally:
        if client is not None:
            client.close()


if __name__ == "__main__":
    main()
