"""
Comprehensive Pytest Verification Suite for ThaparElectiveAI ML Microservice.
Verifies:
  1. Cloud-native configuration (`MLServiceSettings`) and MongoDB Atlas URI validation.
  2. Production PyMongo & Motor Atlas connection manager (`app/db/mongodb.py`).
  3. All FastAPI ML inference & explainability endpoints.
"""
import os
if not os.environ.get("MONGODB_URI"):
    os.environ["MONGODB_URI"] = "mongodb+srv://ci_test:ci_test@cluster0.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority"
os.environ.setdefault("MONGODB_URI", "mongodb+srv://ci_test:ci_test@cluster0.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority")

from unittest.mock import patch
from fastapi.testclient import TestClient
from app.config import MLServiceSettings, settings
from app.db.mongodb import create_pymongo_atlas_client, mask_mongo_uri
from app.main import app


def test_cloud_config_and_credential_masking() -> None:
    cfg = MLServiceSettings()
    assert cfg.MONGODB_URI.startswith("mongodb+srv://")
    assert len(cfg.allowed_origins_list) >= 1

    masked = mask_mongo_uri(
        "mongodb+srv://tiet_admin:SuperSecretPass@cluster0.mongodb.net/thapar_elective_ai"
    )
    assert "SuperSecretPass" not in masked
    assert "//***:***@" in masked

    with patch("pymongo.MongoClient") as mock_mongo:
        create_pymongo_atlas_client(cfg)
        mock_mongo.assert_called_once_with(
            cfg.MONGODB_URI,
            maxPoolSize=20,
            minPoolSize=cfg.MONGODB_MIN_POOL_SIZE,
            serverSelectionTimeoutMS=5000,
            retryWrites=True,
            w="majority",
        )


def test_fastapi_ml_endpoints() -> None:
    headers = {"X-ML-Service-Key": settings.ML_SERVICE_API_KEY}
    sample_student = {
        "student_id": "STU_1024030012",
        "roll_no": "1024030012",
        "cgpa_sem4": 9.12,
        "core_grades": {
            "UES103": 9,
            "UMA022": 9,
            "UMA023": 9,
            "UCS301": 10,
            "UCS303": 9,
            "UTA018": 9,
            "UCS405": 9,
            "UMA021": 10,
            "UCS415": 10,
            "UCS310": 9,
            "UCS414": 8,
            "UCS321": 10,
            "UMA401": 9,
        },
        "coding_profile_score": 93.5,
        "math_aptitude_score": 92.0,
        "technical_skills": ["Python", "PyTorch", "CUDA", "C++20", "SQL"],
        "preferred_career_track": "Generative AI & LLM Engineer",
        "interests_text": "Large language models, NVIDIA GPU computing, deep learning",
        "statement_of_purpose": "Passionate about NVIDIA accelerated data science and AI research.",
    }

    with TestClient(app) as client:
        # 1. Health check
        health_res = client.get("/api/v1/ml/health")
        assert health_res.status_code == 200
        health_data = health_res.json()
        assert health_data["models_ready"] is True
        assert health_data["models_loaded"] is True

        # 2. Recommend 12 Elective Focus Baskets with SHAP
        basket_res = client.post(
            "/api/ml/recommend-baskets",
            headers=headers,
            json={
                "student_profile": sample_student,
                "weights": {"alpha": 0.30, "beta": 0.22, "gamma": 0.26, "delta": 0.22},
            },
        )
        assert basket_res.status_code == 200
        basket_json = basket_res.json()
        assert basket_json["success"] is True
        assert len(basket_json["recommendations"]) == 12
        top_basket = basket_json["recommendations"][0]
        assert "composite_match_score" in top_basket
        assert len(top_basket["top_shap_reasons"]) >= 1

        # 3. Recommend Individual Courses
        course_res = client.post(
            "/api/ml/recommend-courses",
            headers=headers,
            json={"student_profile": sample_student, "semester": 5},
        )
        assert course_res.status_code == 200
        course_json = course_res.json()
        assert course_json["success"] is True
        assert len(course_json["recommendations"]) > 0

        # 4. Predict Performance & Overload Risk
        pred_res = client.post(
            "/api/ml/predict-performance",
            headers=headers,
            json={
                "student_profile": sample_student,
                "selected_course_codes": ["UCS548", "UMA069"],
            },
        )
        assert pred_res.status_code == 200
        pred_json = pred_res.json()
        assert pred_json["success"] is True
        assert len(pred_json["course_predictions"]) == 2

        # 5. Peer Cohort Insights (k-NN 50 seniors)
        peer_res = client.post(
            "/api/ml/peer-cohort-insights",
            headers=headers,
            json={"student_profile": sample_student, "top_k": 50},
        )
        assert peer_res.status_code == 200
        peer_json = peer_res.json()
        assert peer_json["success"] is True
        assert peer_json["cohort_size"] == 50

        # 6. Conversational AI Academic Advisor
        chat_res = client.post(
            "/api/ml/advisor-chat",
            headers=headers,
            json={
                "student_profile": sample_student,
                "message": "Should I pick NVIDIA Data Science or AIML?",
            },
        )
        assert chat_res.status_code == 200
        chat_json = chat_res.json()
        assert chat_json["success"] is True
        assert len(chat_json["reply"]) > 20
