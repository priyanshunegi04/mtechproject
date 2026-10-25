#!/usr/bin/env python3
"""
Standalone & Programmatic ML Training Orchestrator (`train_pipeline.py`)
Trains all 4 ThaparElectiveAI ML modules:
  - Module A: ContentBasedRecommender (`content_recommender.py`)
  - Module B: CollaborativeRecommender (`collaborative_recommender.py`)
  - Module C: GradeWorkloadPredictor (`grade_workload_predictor.py`)
  - Module D: HybridElectiveRanker (`hybrid_ranker.py`)
Saves serialized artifacts to `ml-service/models/` and logs version + metrics to
MongoDB Atlas `ml_model_registry`.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parent.parent.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.config import MLServiceSettings
from app.ml.hybrid_ranker import (
    HybridElectiveRanker,
    load_training_datasets,
    log_model_registry_to_atlas,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("thapar-ml.train-pipeline")


def run_training_pipeline(
    sync_db: Optional[Any] = None,
    force_retrain: bool = True,
    random_seed: int = 42,
) -> HybridElectiveRanker:
    """Train or load the complete 4-module ML pipeline and persist artifacts to `ml-service/models/`."""
    processed_dir = SERVICE_ROOT / "data" / "processed"
    models_dir = SERVICE_ROOT / "models"

    # Ensure processed dataset exists; generate if missing
    if not (processed_dir / "courses_catalog.json").exists():
        logger.info("Processed dataset not found; invoking generate_tiet_dataset...")
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

    ranker = HybridElectiveRanker(random_state=random_seed)
    if not force_retrain and ranker.load_artifacts(models_dir, catalog):
        return ranker

    ranker.fit(catalog=catalog, students_df=students_df, enrollments_df=enrollments_df)
    artifact_paths = ranker.save_artifacts(models_dir)
    log_model_registry_to_atlas(
        sync_db=sync_db,
        ranker=ranker,
        data_source=data_source,
        artifact_paths=artifact_paths,
    )
    return ranker


if __name__ == "__main__":
    load_dotenv(SERVICE_ROOT / ".env")
    load_dotenv(SERVICE_ROOT.parent / ".env")
    settings = MLServiceSettings()

    sync_db_conn = None
    if settings.has_live_atlas_uri and settings.MONGODB_URI:
        from pymongo import MongoClient

        try:
            client: MongoClient = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
            )
            client.admin.command("ping")
            sync_db_conn = client[settings.MONGODB_DB_NAME]
        except Exception as exc:
            logger.warning("MongoDB Atlas unavailable during CLI training (%s); using local processed dataset", exc)

    trained_ranker = run_training_pipeline(sync_db=sync_db_conn, force_retrain=True, random_seed=settings.RANDOM_SEED)
    logger.info(
        "Training Complete | Version: %s | Metrics: %s",
        trained_ranker.model_version,
        json.dumps(trained_ranker.evaluation_metrics),
    )

