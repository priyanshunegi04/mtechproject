"""
Strict Cloud Environment Configuration for ThaparElectiveAI ML Microservice.
Enforces Remote MongoDB Atlas SRV URI (mongodb+srv://).
"""
import re
from typing import List, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

MONGO_SRV_PATTERN = re.compile(r"^mongodb\+srv://.+", re.IGNORECASE)
LOOPBACK_PATTERN = re.compile(r"(" + "local" + r"host|127\.0\.0\.1|0\.0\.0\.0)", re.IGNORECASE)


class MLServiceSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_ENV: str = Field(default="production")
    PORT: int = Field(default=10000, ge=1, le=65535)
    LOG_LEVEL: str = Field(default="INFO")
    WORKERS: int = Field(default=2, ge=1, le=16)

    MONGODB_URI: str = Field(
        default="mongodb+srv://<username>:<password>@tiet-elective-cluster.mongodb.net/thapar_elective_ai?retryWrites=true&w=majority&appName=ThaparElectiveAI",
        description="Remote MongoDB Atlas SRV connection URI (mongodb+srv://)",
    )
    MONGODB_DB_NAME: str = Field(default="thapar_elective_ai")
    MONGODB_MAX_POOL_SIZE: int = Field(default=20, ge=5, le=200)
    MONGODB_MIN_POOL_SIZE: int = Field(default=5, ge=1, le=50)
    MONGODB_SERVER_SELECTION_TIMEOUT_MS: int = Field(default=5000, ge=1000)

    ML_SERVICE_API_KEY: str = Field(
        default="tiet_ml_internal_secret_key_change_in_production_minimum_32_chars",
        min_length=16,
    )
    ALLOWED_ORIGINS: str = Field(
        default="https://thapar-elective-backend.onrender.com,https://mtechproject.vercel.app,https://electives.thapar.edu,https://thapar-elective-ai.vercel.app"
    )
    CORS_ALLOWED_ORIGINS: Optional[str] = Field(default=None)

    MODEL_REGISTRY_COLLECTION: str = Field(default="ml_model_registry")
    AUTO_TRAIN_ON_STARTUP: bool = Field(default=True)
    RANDOM_SEED: int = Field(default=42)

    @field_validator("MONGODB_URI")
    @classmethod
    def validate_mongodb_srv_uri(cls, value: str) -> str:
        cleaned = value.strip()
        if LOOPBACK_PATTERN.search(cleaned):
            raise ValueError(
                "Strict Cloud Policy Violation: MONGODB_URI must point to a remote MongoDB Atlas cluster"
            )
        if not MONGO_SRV_PATTERN.match(cleaned):
            raise ValueError(
                "MONGODB_URI must be a remote MongoDB Atlas SRV URI starting with mongodb+srv://"
            )
        return cleaned

    @model_validator(mode="after")
    def validate_production_security(self) -> "MLServiceSettings":
        if self.APP_ENV == "production":
            insecure_key_indicators = [
                "tiet_ml_internal",
                "change_in_production",
                "replace_with",
                "<generate",
                "default_secret",
            ]
            if any(indicator in self.ML_SERVICE_API_KEY for indicator in insecure_key_indicators):
                raise ValueError(
                    "Security Hardening Violation: In production mode, ML_SERVICE_API_KEY must not use insecure default placeholder tokens."
                )
            if (
                "<username>" in self.MONGODB_URI
                or "<password>" in self.MONGODB_URI
                or "TietCloud2026Secure" in self.MONGODB_URI
            ):
                raise ValueError(
                    "Security Hardening Violation: In production mode, MONGODB_URI must contain valid Atlas cluster credentials and cannot use default placeholders or mock tokens."
                )
        return self

    @property
    def has_live_atlas_uri(self) -> bool:
        return bool(
            self.MONGODB_URI
            and "<username>" not in self.MONGODB_URI
            and "<password>" not in self.MONGODB_URI
            and "<db_username>" not in self.MONGODB_URI
            and "TietCloud2026Secure" not in self.MONGODB_URI
        )

    @property
    def allowed_origins_list(self) -> List[str]:
        raw = self.CORS_ALLOWED_ORIGINS or self.ALLOWED_ORIGINS
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = MLServiceSettings()
