"""
Typed Pydantic v2 Request and Response Schemas for ThaparElectiveAI FastAPI ML Microservice.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FusionWeightsInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    alpha: float = Field(default=0.28, ge=0.0, le=1.0, description="Content-based similarity weight")
    beta: float = Field(default=0.24, ge=0.0, le=1.0, description="Collaborative peer filtering weight")
    gamma: float = Field(default=0.28, ge=0.0, le=1.0, description="Expected grade point weight")
    delta: float = Field(default=0.20, ge=0.0, le=1.0, description="Career track alignment weight")


class StudentMLProfileInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    student_id: Optional[str] = Field(default="STU_1024030001")
    roll_no: Optional[str] = Field(default="1024030001")
    cgpa_sem4: float = Field(default=8.20, ge=0.0, le=10.0)
    core_grades: Dict[str, float] = Field(
        default_factory=lambda: {
            "UES103": 9.0,
            "UMA022": 8.0,
            "UMA023": 8.0,
            "UCS301": 9.0,
            "UCS303": 8.0,
            "UTA018": 9.0,
            "UCS405": 8.0,
            "UMA021": 8.0,
            "UCS415": 9.0,
            "UCS310": 8.0,
            "UCS414": 8.0,
            "UCS321": 9.0,
            "UMA401": 8.0,
        },
        description="Semesters I-IV TIET Core Course Grade Points (0-10 scale)",
    )
    coding_profile_score: Optional[float] = Field(default=82.5, ge=0.0, le=100.0)
    math_aptitude_score: Optional[float] = Field(default=80.0, ge=0.0, le=100.0)
    technical_skills: List[str] = Field(
        default_factory=lambda: ["Python", "C++", "PyTorch", "SQL", "Docker"]
    )
    preferred_career_track: str = Field(default="Machine Learning Engineer")
    interests_text: str = Field(
        default="Deep learning, natural language processing, generative AI, and scalable data science pipelines"
    )
    projects_text: Optional[str] = Field(default="")
    statement_of_purpose: Optional[str] = Field(default="")
    completed_credits: float = Field(default=82.0, ge=0.0, le=160.0)
    max_weekly_hours: float = Field(default=24.0, ge=8.0, le=50.0)

    def to_ranker_dict(self) -> Dict[str, Any]:
        data = self.model_dump()
        for code, gp in self.core_grades.items():
            data[code] = gp
        return data


class RecommendBasketsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    student_profile: StudentMLProfileInput
    weights: Optional[FusionWeightsInput] = None


class RecommendCoursesRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    student_profile: StudentMLProfileInput
    semester: Optional[int] = Field(default=None, ge=5, le=7)
    elective_slot: Optional[str] = Field(
        default=None, description="Optional slot filter: PE-I, PE-II, PE-III, PE-IV, or GE-SEM5"
    )
    basket_id: Optional[str] = Field(default=None, description="Optional EF Basket filter (e.g. EF_BASKET_05)")
    category: Optional[str] = Field(
        default=None, description="PROFESSIONAL_ELECTIVE or GENERIC_ELECTIVE"
    )
    weights: Optional[FusionWeightsInput] = None


class PredictPerformanceRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    student_profile: StudentMLProfileInput
    selected_course_codes: List[str] = Field(
        ...,
        min_length=1,
        description="List of TIET elective course codes (e.g., ['UCS548', 'UCS654', 'UMA069'])",
    )


class PeerCohortInsightsRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    student_profile: StudentMLProfileInput
    top_k: int = Field(default=50, ge=5, le=200)


class ChatMessageItem(BaseModel):
    role: str = Field(default="user")
    content: str


class AdvisorChatRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    student_profile: StudentMLProfileInput
    message: str = Field(..., min_length=2, max_length=2000)
    conversation_history: Optional[List[ChatMessageItem]] = Field(default=None)


class RetrainRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    sync_from_atlas: bool = Field(default=True)
    reason: Optional[str] = Field(default="Scheduled or Admin-triggered model retraining")

