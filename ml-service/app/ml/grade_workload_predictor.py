"""
Module C: Expected Grade & Workload Regressor (`grade_workload_predictor.py`)
Trains two Gradient Boosted Decision Tree regressors (`HistGradientBoostingRegressor` / `LightGBM`):
  1. `GradePredictor`: Predicts expected grade point (0.0–10.0), letter grade (`A+`, `A`, `A-`, `B`, `B-`, `C`),
     MST/EST/Sessional score breakdown, 90% prediction intervals, and letter grade probability distribution.
  2. `WorkloadPredictor`: Predicts expected weekly hours (labs, sessional projects, MST/EST prep)
     and computes a Semester Overload Risk Index.
"""

from __future__ import annotations

import logging
import math
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

logger = logging.getLogger("thapar-ml.grade-workload-predictor")

FEATURE_NAMES: List[str] = [
    "cgpa_sem4",
    "prereq_mean_gp",
    "prereq_min_gp",
    "coding_profile_score",
    "math_aptitude_score",
    "UCS301",
    "UCS303",
    "UTA018",
    "UCS405",
    "UMA021",
    "UCS415",
    "UCS310",
    "UCS414",
    "UCS321",
    "UMA401",
    "course_difficulty_index",
    "course_weekly_self_effort",
    "course_practical_hours",
    "course_credits",
    "is_generic_elective",
]


def gp_to_tiet_letter_grade(expected_gp: float, expected_total_marks: Optional[float] = None) -> str:
    """Map continuous predicted grade point (0.0-10.0) to official TIET letter grade."""
    if expected_total_marks is not None and expected_total_marks >= 90.0:
        return "A+"
    if expected_gp >= 9.65:
        return "A+"
    if expected_gp >= 9.15:
        return "A"
    if expected_gp >= 8.35:
        return "A-"
    if expected_gp >= 7.45:
        return "B"
    if expected_gp >= 6.45:
        return "B-"
    if expected_gp >= 5.45:
        return "C"
    if expected_gp >= 4.45:
        return "C-"
    if expected_gp >= 2.0:
        return "E"
    return "F"


class GradeWorkloadPredictor:
    """
    Dual Gradient Boosted Decision Tree Regressor for predicting TIET Elective
    Grade Points, MST/EST/Sessional Marks, 90% Prediction Intervals, and Weekly Workload Hours.
    """

    def __init__(self, random_state: int = 42) -> None:
        self.random_state = random_state

        self.grade_point_model = HistGradientBoostingRegressor(
            max_iter=220,
            learning_rate=0.06,
            max_depth=6,
            min_samples_leaf=25,
            l2_regularization=1.2,
            random_state=random_state,
        )
        self.total_marks_model = HistGradientBoostingRegressor(
            max_iter=220,
            learning_rate=0.06,
            max_depth=6,
            min_samples_leaf=25,
            l2_regularization=1.2,
            random_state=random_state + 1,
        )
        self.workload_model = HistGradientBoostingRegressor(
            max_iter=200,
            learning_rate=0.06,
            max_depth=5,
            min_samples_leaf=25,
            l2_regularization=1.0,
            random_state=random_state + 2,
        )

        self.course_meta_by_code: Dict[str, Dict[str, Any]] = {}
        self.course_historical_stats: Dict[str, Dict[str, float]] = {}
        self.feature_means: Dict[str, float] = {}
        self.grade_residual_std: float = 0.58
        self.workload_residual_std: float = 0.85
        self.validation_metrics: Dict[str, float] = {}

    def _build_feature_row(
        self,
        student: Dict[str, Any],
        course: Dict[str, Any],
    ) -> List[float]:
        cgpa = float(student.get("cgpa_sem4", student.get("cgpa", 7.65)))
        core_grades = student.get("core_grades", {}) or {}

        def _get_core(code: str) -> float:
            if code in core_grades:
                return float(core_grades[code])
            if code in student:
                return float(student[code])
            return float(round(cgpa))

        prereqs = course.get("prerequisites", []) or []
        if prereqs:
            p_vals = [_get_core(p) for p in prereqs]
            prereq_mean = float(np.mean(p_vals))
            prereq_min = float(np.min(p_vals))
        else:
            prereq_mean = cgpa
            prereq_min = cgpa

        coding_score = float(student.get("coding_profile_score", cgpa * 9.5))
        math_score = float(student.get("math_aptitude_score", cgpa * 9.4))

        is_ge = 1.0 if course.get("category") == "GENERIC_ELECTIVE" else 0.0

        return [
            cgpa,
            prereq_mean,
            prereq_min,
            coding_score,
            math_score,
            _get_core("UCS301"),
            _get_core("UCS303"),
            _get_core("UTA018"),
            _get_core("UCS405"),
            _get_core("UMA021"),
            _get_core("UCS415"),
            _get_core("UCS310"),
            _get_core("UCS414"),
            _get_core("UCS321"),
            _get_core("UMA401"),
            float(course.get("difficulty_index", 3.4)),
            float(course.get("weekly_self_effort_hours", 6.0)),
            float(course.get("practical_hours", 2.0)),
            float(course.get("credits", 3.0)),
            is_ge,
        ]

    def fit(
        self,
        students_df: pd.DataFrame,
        enrollments_df: pd.DataFrame,
        catalog: Dict[str, Any],
    ) -> "GradeWorkloadPredictor":
        """Train GradePredictor and WorkloadPredictor on TIET student-elective records."""
        self.course_meta_by_code = {
            c["course_code"]: c for c in catalog.get("all_courses", [])
        }

        stu_lookup: Dict[str, Dict[str, Any]] = {}
        for row in students_df.to_dict(orient="records"):
            stu_lookup[str(row["student_id"])] = row

        X_rows: List[List[float]] = []
        y_gp: List[float] = []
        y_marks: List[float] = []
        y_workload: List[float] = []

        enr_records = enrollments_df.to_dict(orient="records")
        for rec in enr_records:
            sid = str(rec.get("student_id", ""))
            ccode = str(rec.get("course_code", ""))
            stu = stu_lookup.get(sid)
            c_meta = self.course_meta_by_code.get(ccode)
            if stu is None or c_meta is None:
                continue

            feat = self._build_feature_row(stu, c_meta)
            X_rows.append(feat)
            y_gp.append(float(rec.get("final_grade_point", 8.0)))
            y_marks.append(float(rec.get("total_marks", 72.0)))
            y_workload.append(float(rec.get("workload_hours_per_week", 9.0)))

        X_arr = np.asarray(X_rows, dtype=np.float32)
        y_gp_arr = np.asarray(y_gp, dtype=np.float32)
        y_marks_arr = np.asarray(y_marks, dtype=np.float32)
        y_work_arr = np.asarray(y_workload, dtype=np.float32)

        # Store population feature means for TreeSHAP / baseline attribution comparison
        col_means = np.mean(X_arr, axis=0)
        self.feature_means = {
            name: float(col_means[idx]) for idx, name in enumerate(FEATURE_NAMES)
        }

        # Historical stats per course
        enr_df = enrollments_df.copy()
        enr_df["final_grade_point"] = pd.to_numeric(enr_df["final_grade_point"], errors="coerce").fillna(7.8)
        enr_df["workload_hours_per_week"] = pd.to_numeric(
            enr_df["workload_hours_per_week"], errors="coerce"
        ).fillna(9.0)
        enr_df["student_satisfaction_rating"] = pd.to_numeric(
            enr_df["student_satisfaction_rating"], errors="coerce"
        ).fillna(4.0)

        for ccode, grp in enr_df.groupby("course_code"):
            self.course_historical_stats[str(ccode)] = {
                "mean_gp": round(float(grp["final_grade_point"].mean()), 2),
                "std_gp": round(float(grp["final_grade_point"].std() or 0.8), 2),
                "mean_workload": round(float(grp["workload_hours_per_week"].mean()), 1),
                "mean_satisfaction": round(float(grp["student_satisfaction_rating"].mean()), 2),
                "enrollment_count": int(len(grp)),
            }

        # Train/validation split for honest metric evaluation
        (
            X_train,
            X_val,
            y_gp_train,
            y_gp_val,
            y_m_train,
            y_m_val,
            y_w_train,
            y_w_val,
        ) = train_test_split(
            X_arr,
            y_gp_arr,
            y_marks_arr,
            y_work_arr,
            test_size=0.20,
            random_state=self.random_state,
        )

        self.grade_point_model.fit(X_train, y_gp_train)
        self.total_marks_model.fit(X_train, y_m_train)
        self.workload_model.fit(X_train, y_w_train)

        gp_preds = np.clip(self.grade_point_model.predict(X_val), 0.0, 10.0)
        work_preds = np.clip(self.workload_model.predict(X_val), 2.0, 20.0)

        gp_residuals = y_gp_val - gp_preds
        work_residuals = y_w_val - work_preds
        self.grade_residual_std = max(0.35, float(np.std(gp_residuals)))
        self.workload_residual_std = max(0.50, float(np.std(work_residuals)))

        self.validation_metrics = {
            "grade_rmse": round(float(math.sqrt(mean_squared_error(y_gp_val, gp_preds))), 4),
            "grade_mae": round(float(mean_absolute_error(y_gp_val, gp_preds)), 4),
            "grade_r2": round(float(r2_score(y_gp_val, gp_preds)), 4),
            "workload_rmse": round(float(math.sqrt(mean_squared_error(y_w_val, work_preds))), 4),
            "workload_mae": round(float(mean_absolute_error(y_w_val, work_preds)), 4),
            "workload_r2": round(float(r2_score(y_w_val, work_preds)), 4),
        }

        logger.info(
            "GradeWorkloadPredictor trained (Grade RMSE=%.4f, MAE=%.4f, R2=%.4f | Workload RMSE=%.4f)",
            self.validation_metrics["grade_rmse"],
            self.validation_metrics["grade_mae"],
            self.validation_metrics["grade_r2"],
            self.validation_metrics["workload_rmse"],
        )
        return self

    def _compute_grade_distribution(self, expected_gp: float, std_gp: float) -> Dict[str, float]:
        """Compute normalized probability distribution across TIET letter grades (`A+`, `A`, `A-`, `B`, `B-`, `C`)."""
        grade_centers = [
            ("A+", 9.85),
            ("A", 9.35),
            ("A-", 8.65),
            ("B", 7.85),
            ("B-", 6.95),
            ("C", 5.95),
        ]
        sigma = max(0.55, std_gp)
        raw_probs: List[Tuple[str, float]] = []
        for g_label, center in grade_centers:
            z = (expected_gp - center) / sigma
            density = math.exp(-0.5 * z * z)
            raw_probs.append((g_label, density))

        total_p = sum(p for _, p in raw_probs) or 1.0
        return {g_label: round(p / total_p, 4) for g_label, p in raw_probs}

    def predict_single_course(
        self,
        student_profile: Dict[str, Any],
        course_code: str,
    ) -> Dict[str, Any]:
        """Predict grade point, letter grade, 90% CI, MST/EST/Sessional breakdown, and weekly workload for one course."""
        course = self.course_meta_by_code.get(course_code)
        if course is None:
            raise ValueError(f"Unknown TIET course code: {course_code}")

        feat_row = self._build_feature_row(student_profile, course)
        X_input = np.asarray([feat_row], dtype=np.float32)

        pred_gp = float(np.clip(self.grade_point_model.predict(X_input)[0], 2.0, 10.0))
        pred_marks = float(np.clip(self.total_marks_model.predict(X_input)[0], 35.0, 99.0))
        pred_workload = float(np.clip(self.workload_model.predict(X_input)[0], 3.0, 18.0))

        # 90% Prediction Interval (z = 1.645 * residual_std)
        margin_90 = 1.645 * self.grade_residual_std
        ci_lower = round(max(0.0, pred_gp - margin_90), 2)
        ci_upper = round(min(10.0, pred_gp + margin_90), 2)

        letter = gp_to_tiet_letter_grade(pred_gp, pred_marks)
        grade_dist = self._compute_grade_distribution(pred_gp, self.grade_residual_std)

        # Predict component breakdown: MST (/30), EST (/45), Sessional (/30)
        ratio = pred_marks / 100.0
        mst_pred = round(min(30.0, max(10.0, 30.0 * ratio)), 1)
        est_pred = round(min(45.0, max(14.0, 45.0 * ratio)), 1)
        sessional_pred = round(min(30.0, max(12.0, 30.0 * (ratio * 1.03))), 1)

        contact_hours = float(
            course.get("lecture_hours", 2)
            + course.get("tutorial_hours", 0)
            + course.get("practical_hours", 2)
        )
        self_study_hours = round(max(1.5, pred_workload - contact_hours), 1)

        hist = self.course_historical_stats.get(course_code, {})

        return {
            "course_code": course_code,
            "title": course.get("title", ""),
            "category": course.get("category", "PROFESSIONAL_ELECTIVE"),
            "credits": float(course.get("credits", 3.0)),
            "expected_grade_point": round(pred_gp, 2),
            "expected_letter_grade": letter,
            "prediction_interval_90": {
                "lower_gp": ci_lower,
                "upper_gp": ci_upper,
            },
            "expected_marks_breakdown": {
                "mst_score_out_of_30": mst_pred,
                "est_score_out_of_45": est_pred,
                "sessional_score_out_of_30": sessional_pred,
                "weighted_total_out_of_100": round(pred_marks, 1),
            },
            "grade_probability_distribution": grade_dist,
            "expected_weekly_workload_hours": round(pred_workload, 1),
            "workload_breakdown": {
                "lecture_tutorial_hours": float(course.get("lecture_hours", 2) + course.get("tutorial_hours", 0)),
                "lab_practical_hours": float(course.get("practical_hours", 2)),
                "self_effort_and_project_hours": self_study_hours,
            },
            "difficulty_index": float(course.get("difficulty_index", 3.4)),
            "historical_mean_gp": hist.get("mean_gp", 7.8),
            "historical_satisfaction": hist.get("mean_satisfaction", 4.1),
            "feature_vector": dict(zip(FEATURE_NAMES, [round(v, 3) for v in feat_row])),
        }

    def predict_combination_performance(
        self,
        student_profile: Dict[str, Any],
        course_codes: List[str],
    ) -> Dict[str, Any]:
        """
        Predict MST/EST/Sessional score breakdown, final grade probability distribution,
        weekly workload, projected SGPA/CGPA delta, and Semester Overload Risk Index
        for a selected combination of electives.
        """
        per_course_predictions: List[Dict[str, Any]] = []
        total_weekly_hours = 0.0
        weighted_gp_sum = 0.0
        total_credits = 0.0
        max_difficulty = 0.0

        for ccode in course_codes:
            if ccode not in self.course_meta_by_code:
                continue
            pred = self.predict_single_course(student_profile, ccode)
            per_course_predictions.append(pred)
            total_weekly_hours += pred["expected_weekly_workload_hours"]
            cr = pred["credits"]
            weighted_gp_sum += pred["expected_grade_point"] * cr
            total_credits += cr
            max_difficulty = max(max_difficulty, pred["difficulty_index"])

        projected_elective_sgpa = (
            round(weighted_gp_sum / total_credits, 2) if total_credits > 0 else 0.0
        )
        current_cgpa = float(student_profile.get("cgpa_sem4", student_profile.get("cgpa", 7.65)))
        # Assume ~82 credits completed by Sem IV; compute projected cumulative CGPA impact
        prior_credits = float(student_profile.get("completed_credits", 82.0))
        projected_new_cgpa = round(
            (current_cgpa * prior_credits + weighted_gp_sum) / max(1.0, prior_credits + total_credits),
            2,
        )
        cgpa_delta = round(projected_new_cgpa - current_cgpa, 2)

        # Compute Semester Overload Risk Index (0-100)
        # Baseline comfortable elective load for 2-3 electives is ~16-22 hrs/week
        target_max_hours = float(student_profile.get("max_weekly_hours", 24.0))
        load_ratio = total_weekly_hours / max(10.0, target_max_hours)
        difficulty_factor = max(0.0, (max_difficulty - 3.2) * 14.0)
        cgpa_buffer = max(0.0, (8.0 - current_cgpa) * 7.5)

        overload_risk_index = round(
            float(np.clip((load_ratio * 52.0) + difficulty_factor + cgpa_buffer, 5.0, 99.0)),
            1,
        )

        if overload_risk_index < 38.0:
            risk_level = "LOW"
            risk_advisory = "Balanced elective combination with sustainable lab/sessional workload."
        elif overload_risk_index < 62.0:
            risk_level = "MODERATE"
            risk_advisory = "Manageable workload; schedule steady weekly sessional lab milestones before MST/EST."
        elif overload_risk_index < 80.0:
            risk_level = "HIGH"
            risk_advisory = "High coding/math lab concurrency; consider pairing with a lower-effort Generic Elective."
        else:
            risk_level = "CRITICAL"
            risk_advisory = "Severe semester overload risk detected; strongly advise consulting your Faculty Advisor."

        return {
            "selected_course_codes": course_codes,
            "course_predictions": per_course_predictions,
            "summary": {
                "total_elective_credits": round(total_credits, 1),
                "projected_elective_sgpa": projected_elective_sgpa,
                "current_cgpa": round(current_cgpa, 2),
                "projected_cumulative_cgpa": projected_new_cgpa,
                "projected_cgpa_delta": cgpa_delta,
                "total_weekly_workload_hours": round(total_weekly_hours, 1),
                "semester_overload_risk_index": overload_risk_index,
                "overload_risk_level": risk_level,
                "overload_advisory": risk_advisory,
            },
        }

