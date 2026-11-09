"""
Unit and API integration tests for FastAPI ML service endpoints.
Tests:
  - GET /health
  - POST /recommend-baskets
  - POST /peer-cohort-insights
"""
import pytest
from fastapi.testclient import TestClient
from app.config import settings
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    assert data.get("success") is True
    assert data.get("models_ready") is True


def test_recommend_baskets_endpoint(client: TestClient):
    headers = {"X-ML-Service-Key": settings.ML_SERVICE_API_KEY}
    mock_payload = {
        "student_profile": {
            "student_id": "STU_TEST_001",
            "roll_no": "1024039999",
            "cgpa": 8.5,
            "core_grades": {
                "UES103": 9.0,
                "UMA022": 8.5,
                "UMA023": 8.0,
                "UCS301": 9.5,
                "UCS303": 8.5,
                "UTA018": 9.0,
                "UCS405": 8.0,
                "UMA021": 8.5,
                "UCS415": 9.0,
                "UCS310": 8.5,
                "UCS414": 8.0,
                "UCS321": 9.0,
                "UMA401": 8.5,
            },
            "technical_skills": ["Python", "PyTorch", "SQL", "Pandas", "Scikit-Learn"],
            "career_interest": "Data Science",
        },
        "weights": {
            "alpha": 0.28,
            "beta": 0.24,
            "gamma": 0.28,
            "delta": 0.20,
        },
    }

    response = client.post("/recommend-baskets", headers=headers, json=mock_payload)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "recommendations" in data
    assert len(data["recommendations"]) == 12

    top_recs = data["recommendations"]
    first = top_recs[0]
    # Verify presence of hybrid_score, predicted_grade, and shap_values / shap_explanations
    assert "composite_match_score" in first or "hybrid_score" in first
    assert "hybrid_score" in first
    assert "predicted_grade" in first
    assert "top_shap_reasons" in first or "shap_values" in first
    assert "shap_values" in first
    assert isinstance(first["shap_values"], list)
    assert len(first["shap_values"]) > 0


def test_peer_cohort_insights_endpoint(client: TestClient):
    headers = {"X-ML-Service-Key": settings.ML_SERVICE_API_KEY}
    mock_payload = {
        "student_profile": {
            "student_id": "STU_TEST_002",
            "roll_no": "1024039998",
            "cgpa": 8.5,
            "core_grades": {
                "UCS301": 9.0,
                "UCS415": 9.0,
                "UMA021": 8.5,
                "UCS321": 9.0,
            },
            "career_interest": "Data Science",
        },
        "top_k": 30,
    }

    response = client.post("/peer-cohort-insights", headers=headers, json=mock_payload)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True

    # Check cohort_size > 0
    cohort_size = data.get("cohort_size") or data.get("matched_cohort_size")
    assert cohort_size is not None and cohort_size > 0

    # Check basket_distribution
    assert "basket_distribution" in data or "top_elective_choices" in data
    basket_dist = data.get("basket_distribution") or data.get("top_elective_choices")
    assert isinstance(basket_dist, list)
    assert len(basket_dist) > 0

    # Check closest_seniors array format
    assert "closest_seniors" in data or "representative_peers" in data
    seniors = data.get("closest_seniors") or data.get("representative_peers")
    assert isinstance(seniors, list)
    assert len(seniors) > 0
    first_senior = seniors[0]
    assert "roll_no" in first_senior
