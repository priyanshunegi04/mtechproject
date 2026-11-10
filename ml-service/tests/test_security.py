"""
Unit tests for strict production security and credential hardening in ml-service.
"""
import os
if not os.environ.get("MONGODB_URI"):
    os.environ["MONGODB_URI"] = "mongodb+srv://ci_test:ci_test@cluster0.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority"
os.environ.setdefault("MONGODB_URI", "mongodb+srv://ci_test:ci_test@cluster0.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority")

import pytest
from pydantic import ValidationError
from app.config import MLServiceSettings


def test_production_rejects_default_ml_api_key():
    with pytest.raises(ValidationError) as excinfo:
        MLServiceSettings(
            APP_ENV="production",
            MONGODB_URI="mongodb+srv://prod_user:SecurePass2026@cluster0.prod.mongodb.net/thapar_elective_ai",
            ML_SERVICE_API_KEY="tiet_ml_internal_secret_key_change_in_production_minimum_32_chars",
        )
    assert "Security Hardening Violation" in str(excinfo.value)
    assert "ML_SERVICE_API_KEY" in str(excinfo.value)


def test_production_rejects_placeholder_mongodb_uri():
    with pytest.raises(ValidationError) as excinfo:
        MLServiceSettings(
            APP_ENV="production",
            MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.prod.mongodb.net/thapar_elective_ai",
            ML_SERVICE_API_KEY="a_strong_production_ml_key_64_bytes_random_hex_token_12345",
        )
    assert "Security Hardening Violation" in str(excinfo.value)
    assert "MONGODB_URI" in str(excinfo.value)


def test_production_accepts_valid_secure_credentials():
    settings = MLServiceSettings(
        APP_ENV="production",
        MONGODB_URI="mongodb+srv://prod_user:SecurePass2026@cluster0.prod.mongodb.net/thapar_elective_ai",
        ML_SERVICE_API_KEY="a_strong_production_ml_key_64_bytes_random_hex_token_12345",
    )
    assert settings.APP_ENV == "production"
    assert settings.ML_SERVICE_API_KEY == "a_strong_production_ml_key_64_bytes_random_hex_token_12345"


def test_development_allows_default_keys():
    settings = MLServiceSettings(
        APP_ENV="development",
        MONGODB_URI="mongodb+srv://dev_user:dev_pass@cluster0.prod.mongodb.net/thapar_elective_ai",
        ML_SERVICE_API_KEY="tiet_ml_internal_secret_key_change_in_production_minimum_32_chars",
    )
    assert settings.APP_ENV == "development"
