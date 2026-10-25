"""Pydantic v2 Request/Response Contracts Package."""

from app.schemas.ml_schemas import (
    AdvisorChatRequest,
    ChatMessageItem,
    FusionWeightsInput,
    PeerCohortInsightsRequest,
    PredictPerformanceRequest,
    RecommendBasketsRequest,
    RecommendCoursesRequest,
    RetrainRequest,
    StudentMLProfileInput,
)

__all__ = [
    "AdvisorChatRequest",
    "ChatMessageItem",
    "FusionWeightsInput",
    "PeerCohortInsightsRequest",
    "PredictPerformanceRequest",
    "RecommendBasketsRequest",
    "RecommendCoursesRequest",
    "RetrainRequest",
    "StudentMLProfileInput",
]
