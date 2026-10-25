"""
FastAPI Production Inference & Retraining Microservice for ThaparElectiveAI (`ml-service/app/main.py`).
Exposes typed Pydantic v2 endpoints secured via `X-ML-Service-Key` header and environment-configured CORS:
  - GET  /health (and /api/v1/ml/health)
  - POST /api/ml/recommend-baskets
  - POST /api/ml/recommend-courses
  - POST /api/ml/predict-performance
  - POST /api/ml/peer-cohort-insights
  - POST /api/ml/advisor-chat
  - POST /api/ml/retrain
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, Optional

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import MLServiceSettings
from app.database import db_manager
from app.ml.hybrid_ranker import HybridElectiveRanker
from app.ml.train_pipeline import run_training_pipeline
from app.schemas.ml_schemas import (
    AdvisorChatRequest,
    PeerCohortInsightsRequest,
    PredictPerformanceRequest,
    RecommendBasketsRequest,
    RecommendCoursesRequest,
    RetrainRequest,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("thapar-ml.fastapi")

SERVICE_ROOT = Path(__file__).resolve().parent.parent


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = MLServiceSettings()
    app.state.settings = settings
    app.state.retraining_in_progress = False

    await db_manager.connect(settings)

    # Load pre-trained models from `ml-service/models/` or train on startup
    ranker = run_training_pipeline(
        sync_db=db_manager.sync_db,
        force_retrain=False,
        random_seed=settings.RANDOM_SEED,
    )
    app.state.ranker = ranker

    # Configure CORS dynamically from validated settings
    yield
    await db_manager.disconnect()


settings_boot = MLServiceSettings()

app = FastAPI(
    title="ThaparElectiveAI ML Microservice",
    description=(
        "Multi-Model Hybrid Elective Recommendation, CGPA/Workload Regression, Peer Cohort k-NN, "
        "& TreeSHAP Explainability Engine for Thapar Institute of Engineering & Technology (TIET) B.E. CSE 2026"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings_boot.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-ML-Service-Key", "X-ML-Api-Key"],
)


async def verify_ml_service_key(
    request: Request,
    x_ml_service_key: Optional[str] = Header(default=None, alias="X-ML-Service-Key"),
    x_ml_api_key: Optional[str] = Header(default=None, alias="X-ML-Api-Key"),
) -> str:
    """Validate internal microservice API key from `X-ML-Service-Key` (or `X-ML-Api-Key`)."""
    settings: MLServiceSettings = getattr(request.app.state, "settings", settings_boot)
    provided_key = (x_ml_service_key or x_ml_api_key or "").strip()
    if not provided_key or provided_key != settings.ML_SERVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-ML-Service-Key header for ThaparElectiveAI ML Microservice",
        )
    return provided_key


def get_ranker(request: Request) -> HybridElectiveRanker:
    ranker: Optional[HybridElectiveRanker] = getattr(request.app.state, "ranker", None)
    if ranker is None or not ranker.is_ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML Hybrid Ranker is still initializing",
        )
    return ranker


@app.get("/health")
@app.get("/api/ml/health")
@app.get("/api/v1/ml/health")
async def health_check(request: Request) -> Dict[str, Any]:
    """
    Verify ML model readiness, MongoDB Atlas connection ping, dataset counts,
    and validation metrics (`RMSE`, `MAE`, `Precision@3`, `NDCG@5`).
    """
    ranker: Optional[HybridElectiveRanker] = getattr(request.app.state, "ranker", None)
    atlas_ping = await db_manager.ping()
    models_ready = bool(ranker and ranker.is_ready)

    metrics = ranker.evaluation_metrics if ranker else {}
    return {
        "success": models_ready,
        "service": "thapar-elective-ai-ml-service",
        "institution": "Thapar Institute of Engineering & Technology (TIET) — B.E. CSE 2026",
        "models_ready": models_ready,
        "models_loaded": models_ready,
        "retraining_in_progress": bool(getattr(request.app.state, "retraining_in_progress", False)),
        "model_version": ranker.model_version if ranker else None,
        "trained_at": ranker.trained_at if ranker else None,
        "mongodb_atlas": atlas_ping,
        "dataset_counts": ranker.dataset_counts if ranker else {},
        "evaluation_metrics": {
            "RMSE": metrics.get("rmse"),
            "MAE": metrics.get("mae"),
            "Grade_R2": metrics.get("grade_r2"),
            "Workload_RMSE": metrics.get("workload_rmse"),
            "Workload_MAE": metrics.get("workload_mae"),
            "Precision@3": metrics.get("precision_at_3"),
            "NDCG@5": metrics.get("ndcg_at_5"),
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/ml/recommend-baskets", dependencies=[Depends(verify_ml_service_key)])
async def recommend_baskets(
    payload: RecommendBasketsRequest,
    ranker: HybridElectiveRanker = Depends(get_ranker),
) -> Dict[str, Any]:
    """
    Rank all 12 Thapar Elective Focus Baskets with composite match score,
    4-semester trajectory preview, expected SGPA impact, live seat competition probability,
    and top SHAP reasons.
    """
    profile_dict = payload.student_profile.to_ranker_dict()
    weights_dict = payload.weights.model_dump() if payload.weights else None
    result = ranker.recommend_baskets(student_profile=profile_dict, weights=weights_dict)
    return {"success": True, **result}


@app.post("/api/ml/recommend-courses", dependencies=[Depends(verify_ml_service_key)])
async def recommend_courses(
    payload: RecommendCoursesRequest,
    ranker: HybridElectiveRanker = Depends(get_ranker),
) -> Dict[str, Any]:
    """
    Rank individual Professional Electives (PE-I to PE-IV) and Generic Electives (GE-SEM5)
    with custom weight sliders, expected grades, 90% prediction intervals, and TreeSHAP attributions.
    """
    profile_dict = payload.student_profile.to_ranker_dict()
    weights_dict = payload.weights.model_dump() if payload.weights else None
    result = ranker.recommend_courses(
        student_profile=profile_dict,
        semester=payload.semester,
        elective_slot=payload.elective_slot,
        basket_id=payload.basket_id,
        category=payload.category,
        weights=weights_dict,
    )
    return {"success": True, **result}


@app.post("/api/ml/predict-performance", dependencies=[Depends(verify_ml_service_key)])
async def predict_performance(
    payload: PredictPerformanceRequest,
    ranker: HybridElectiveRanker = Depends(get_ranker),
) -> Dict[str, Any]:
    """
    Predict MST/EST/Sessional score breakdown, final grade probability distribution,
    weekly workload, and Semester Overload Risk Index for a selected combination of electives.
    """
    profile_dict = payload.student_profile.to_ranker_dict()
    result = ranker.grade_workload_engine.predict_combination_performance(
        student_profile=profile_dict,
        course_codes=payload.selected_course_codes,
    )
    return {
        "success": True,
        "model_version": ranker.model_version,
        **result,
    }


@app.post("/api/ml/peer-cohort-insights", dependencies=[Depends(verify_ml_service_key)])
async def peer_cohort_insights(
    payload: PeerCohortInsightsRequest,
    ranker: HybridElectiveRanker = Depends(get_ranker),
) -> Dict[str, Any]:
    """
    Find the top 50 closest historical Thapar CSE alumni/seniors based on Sem I–IV grades
    and return their chosen Elective Focus basket, average CGPA delta, and placement outcomes.
    """
    profile_dict = payload.student_profile.to_ranker_dict()
    insights = ranker.collab_engine.get_peer_cohort_insights(
        student_profile=profile_dict,
        top_k=payload.top_k,
    )
    return {
        "success": True,
        "model_version": ranker.model_version,
        **insights,
    }


@app.post("/api/ml/advisor-chat", dependencies=[Depends(verify_ml_service_key)])
async def advisor_chat(
    payload: AdvisorChatRequest,
    ranker: HybridElectiveRanker = Depends(get_ranker),
) -> Dict[str, Any]:
    """
    Context-aware Academic Advisor endpoint grounded in the official TIET CSE syllabus,
    prerequisite chains, and the student's live ML scores.
    """
    profile_dict = payload.student_profile.to_ranker_dict()
    history_list = (
        [item.model_dump() for item in payload.conversation_history]
        if payload.conversation_history
        else None
    )
    response = ranker.advisor_chat(
        student_profile=profile_dict,
        message=payload.message,
        conversation_history=history_list,
    )
    return {
        "success": True,
        "model_version": ranker.model_version,
        **response,
    }


def _background_retrain_task(app_instance: FastAPI, reason: str) -> None:
    try:
        app_instance.state.retraining_in_progress = True
        settings: MLServiceSettings = getattr(app_instance.state, "settings", settings_boot)
        logger.info("Background ML retraining triggered (reason: %s)...", reason)
        new_ranker = run_training_pipeline(
            sync_db=db_manager.sync_db,
            force_retrain=True,
            random_seed=settings.RANDOM_SEED,
        )
        app_instance.state.ranker = new_ranker
        logger.info("Background ML retraining completed: %s", new_ranker.model_version)
    except Exception as exc:
        logger.error("Background ML retraining failed: %s", exc)
    finally:
        app_instance.state.retraining_in_progress = False


@app.post("/api/ml/retrain", dependencies=[Depends(verify_ml_service_key)])
async def trigger_retrain(
    payload: RetrainRequest,
    background_tasks: BackgroundTasks,
    request: Request,
) -> Dict[str, Any]:
    """
    Pull latest confirmed enrollments and feedback directly from MongoDB Atlas,
    retrain all 4 models in the background, and store new model version metrics in Atlas.
    """
    if getattr(request.app.state, "retraining_in_progress", False):
        return {
            "success": True,
            "status": "ALREADY_RUNNING",
            "message": "A background retraining job is already in progress.",
        }

    background_tasks.add_task(_background_retrain_task, request.app, payload.reason or "Manual API trigger")
    return {
        "success": True,
        "status": "RETRAINING_STARTED",
        "message": "Background model retraining initiated across Content, Collaborative, GBDT Grade/Workload, and Hybrid SHAP modules.",
        "sync_from_atlas": payload.sync_from_atlas,
        "triggered_at": datetime.now(timezone.utc).isoformat(),
    }
