"""
Module B: Collaborative Filtering Engine (`collaborative_recommender.py`)
Trains:
  1. Matrix Factorization model (TruncatedSVD regularized latent factor model) on the
     TIET student-elective interaction matrix combining normalized `final_grade_point` (60%)
     and `student_satisfaction_rating` (40%).
  2. K-Nearest Neighbor (k-NN) peer-cohort matcher based on Semesters I–IV core grade vectors
     (`UCS301`, `UCS415`, `UMA021`, `UMA401`, `UCS321`, `UCS310`, `UCS414`, etc.).
Projects cold-start Semester IV students into the peer latent space to predict ratings across
all Professional Electives and Generic Electives, and extracts top-50 peer cohort insights.
"""

from __future__ import annotations

import logging
import math
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger("thapar-ml.collaborative-recommender")

PEER_CORE_FEATURE_COLS: List[str] = [
    "cgpa_sem4",
    "UES103",
    "UMA022",
    "UMA023",
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
    "coding_profile_score",
    "math_aptitude_score",
]


class CollaborativeRecommender:
    """
    Matrix Factorization (TruncatedSVD) + k-NN Peer-Cohort Collaborative Filtering Engine
    for Thapar B.E. CSE 2026 Electives and Elective Focus Baskets.
    """

    def __init__(self, n_factors: int = 18, n_neighbors: int = 50, random_state: int = 42) -> None:
        self.n_factors = n_factors
        self.n_neighbors = n_neighbors
        self.random_state = random_state

        self.scaler = StandardScaler()
        self.knn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine", algorithm="brute")
        self.svd: Optional[TruncatedSVD] = None

        self.student_ids: List[str] = []
        self.course_codes: List[str] = []
        self.course_code_to_col: Dict[str, int] = {}

        # Historical student metadata arrays for fast peer-cohort lookup
        self.students_df: Optional[pd.DataFrame] = None
        self.student_feature_matrix_scaled: Optional[np.ndarray] = None
        self.user_latent_factors: Optional[np.ndarray] = None
        self.item_latent_factors: Optional[np.ndarray] = None
        self.reconstructed_utility_matrix: Optional[np.ndarray] = None
        self.course_global_mean_utility: Dict[str, float] = {}
        self.student_avg_elective_gp: Dict[str, float] = {}
        self.basket_id_to_name: Dict[str, str] = {}

    @staticmethod
    def compute_composite_utility(final_grade_point: float, satisfaction_rating: float) -> float:
        """
        Combine normalized `final_grade_point` (0-10 -> 0-1, 60% weight) and
        `student_satisfaction_rating` (1-5 -> 0-1, 40% weight) into a composite utility score in [0, 1].
        """
        gp_norm = np.clip(float(final_grade_point) / 10.0, 0.0, 1.0)
        sat_norm = np.clip((float(satisfaction_rating) - 1.0) / 4.0, 0.0, 1.0)
        return float(0.60 * gp_norm + 0.40 * sat_norm)

    def fit(
        self,
        students_df: pd.DataFrame,
        enrollments_df: pd.DataFrame,
        catalog: Dict[str, Any],
    ) -> "CollaborativeRecommender":
        """Fit Matrix Factorization and k-NN peer cohort matcher on historical TIET CSE records."""
        self.basket_id_to_name = {
            b["basket_id"]: b["name"] for b in catalog.get("elective_focus_baskets", [])
        }
        all_elective_codes = [
            c["course_code"]
            for c in catalog.get("all_courses", [])
            if c.get("category") in ("PROFESSIONAL_ELECTIVE", "GENERIC_ELECTIVE")
        ]

        df_stu = students_df.copy().reset_index(drop=True)
        for col in PEER_CORE_FEATURE_COLS:
            if col not in df_stu.columns:
                df_stu[col] = 7.5 if col != "coding_profile_score" and col != "math_aptitude_score" else 75.0
            df_stu[col] = pd.to_numeric(df_stu[col], errors="coerce").fillna(7.5)

        self.students_df = df_stu
        self.student_ids = df_stu["student_id"].astype(str).tolist()
        student_id_to_row = {sid: idx for idx, sid in enumerate(self.student_ids)}

        # Compute each historical student's average elective grade point for CGPA delta calculation
        enr = enrollments_df.copy()
        enr["final_grade_point"] = pd.to_numeric(enr["final_grade_point"], errors="coerce").fillna(7.5)
        enr["student_satisfaction_rating"] = pd.to_numeric(
            enr["student_satisfaction_rating"], errors="coerce"
        ).fillna(3.8)
        enr["utility"] = (
            0.60 * (enr["final_grade_point"].clip(0.0, 10.0) / 10.0)
            + 0.40 * ((enr["student_satisfaction_rating"].clip(1.0, 5.0) - 1.0) / 4.0)
        )

        gp_by_student = enr.groupby("student_id")["final_grade_point"].mean().to_dict()
        self.student_avg_elective_gp = {str(k): float(v) for k, v in gp_by_student.items()}

        # Build User-Course interaction matrix
        self.course_codes = sorted(list(set(all_elective_codes).union(set(enr["course_code"].astype(str)))))
        self.course_code_to_col = {c: i for i, c in enumerate(self.course_codes)}

        n_users = len(self.student_ids)
        n_items = len(self.course_codes)

        # Global mean utility per course (prior for unobserved entries before SVD centering)
        course_means = enr.groupby("course_code")["utility"].mean().to_dict()
        self.course_global_mean_utility = {
            c: float(course_means.get(c, 0.72)) for c in self.course_codes
        }

        interaction_matrix = np.zeros((n_users, n_items), dtype=np.float32)
        observed_mask = np.zeros((n_users, n_items), dtype=bool)

        for row in enr.itertuples(index=False):
            sid = str(getattr(row, "student_id"))
            ccode = str(getattr(row, "course_code"))
            u_idx = student_id_to_row.get(sid)
            i_idx = self.course_code_to_col.get(ccode)
            if u_idx is not None and i_idx is not None:
                interaction_matrix[u_idx, i_idx] = float(getattr(row, "utility"))
                observed_mask[u_idx, i_idx] = True

        # Mean-fill unobserved entries with course baseline + small user CGPA offset for smooth SVD factorization
        user_cgpa_offset = ((df_stu["cgpa_sem4"].to_numpy(dtype=np.float32) - 7.65) / 10.0) * 0.18
        filled_matrix = np.zeros_like(interaction_matrix)
        for j, ccode in enumerate(self.course_codes):
            base_u = self.course_global_mean_utility[ccode]
            filled_matrix[:, j] = np.clip(base_u + user_cgpa_offset, 0.25, 0.98)

        filled_matrix[observed_mask] = interaction_matrix[observed_mask]

        # Fit TruncatedSVD Matrix Factorization
        k_factors = min(self.n_factors, n_items - 1, n_users - 1)
        self.svd = TruncatedSVD(n_components=k_factors, random_state=self.random_state)
        self.user_latent_factors = self.svd.fit_transform(filled_matrix)
        self.item_latent_factors = self.svd.components_  # shape (k_factors, n_items)
        self.reconstructed_utility_matrix = np.clip(
            np.dot(self.user_latent_factors, self.item_latent_factors), 0.15, 0.99
        )

        # Fit k-NN peer cohort matcher on Sem I-IV core grade vectors
        raw_features = df_stu[PEER_CORE_FEATURE_COLS].to_numpy(dtype=np.float32)
        self.student_feature_matrix_scaled = self.scaler.fit_transform(raw_features)
        self.knn.fit(self.student_feature_matrix_scaled)

        logger.info(
            "CollaborativeRecommender fitted on %d students x %d electives (latent_factors=%d, kNN=%d)",
            n_users,
            n_items,
            k_factors,
            self.n_neighbors,
        )
        return self

    def _extract_student_core_vector(self, student_profile: Dict[str, Any]) -> np.ndarray:
        core_grades = student_profile.get("core_grades", {}) or {}
        cgpa = float(student_profile.get("cgpa_sem4", student_profile.get("cgpa", 7.65)))

        vec: List[float] = []
        for col in PEER_CORE_FEATURE_COLS:
            if col == "cgpa_sem4":
                vec.append(cgpa)
            elif col == "coding_profile_score":
                val = student_profile.get("coding_profile_score")
                vec.append(float(val) if val is not None else float(cgpa * 9.5))
            elif col == "math_aptitude_score":
                val = student_profile.get("math_aptitude_score")
                vec.append(float(val) if val is not None else float(cgpa * 9.4))
            else:
                # Look in core_grades dict or top-level student_profile
                gp = core_grades.get(col, student_profile.get(col, round(cgpa)))
                vec.append(float(gp))
        return np.asarray([vec], dtype=np.float32)

    def predict_cold_start_scores(
        self, student_profile: Dict[str, Any], top_k_peers: int = 50
    ) -> Tuple[Dict[str, float], Dict[str, float]]:
        """
        Project a cold-start Semester IV student into the peer latent space via distance-weighted
        k-NN over Semesters I–IV core grade vectors, and predict collaborative utility scores
        for all electives and all 12 EF Baskets.
        """
        if (
            self.student_feature_matrix_scaled is None
            or self.user_latent_factors is None
            or self.item_latent_factors is None
            or self.students_df is None
        ):
            raise RuntimeError("CollaborativeRecommender must be fitted before calling predict_cold_start_scores()")

        query_vec = self._extract_student_core_vector(student_profile)
        query_scaled = self.scaler.transform(query_vec)

        k = min(top_k_peers, len(self.student_ids))
        distances, indices = self.knn.kneighbors(query_scaled, n_neighbors=k)
        peer_indices = indices[0]
        peer_dists = distances[0]

        # Cosine similarity weights (higher weight for closer academic peers)
        similarities = np.clip(1.0 - peer_dists, 0.05, 1.0)
        weights = similarities / np.sum(similarities)

        # Project cold-start student into the SVD user latent factor space
        projected_user_latent = np.dot(weights, self.user_latent_factors[peer_indices])  # (k_factors,)
        svd_predicted_utilities = np.dot(projected_user_latent, self.item_latent_factors)  # (n_items,)

        # Also compute peer enrollment frequency per basket and course
        peer_rows = self.students_df.iloc[peer_indices]
        basket_counts = Counter(peer_rows["chosen_basket_id"].astype(str).tolist())

        course_collab_scores: Dict[str, float] = {}
        for idx, ccode in enumerate(self.course_codes):
            raw_u = float(svd_predicted_utilities[idx])
            course_collab_scores[ccode] = round(float(np.clip(raw_u, 0.20, 0.98)), 4)

        basket_collab_scores: Dict[str, float] = {}
        for b_id in self.basket_id_to_name:
            freq_ratio = basket_counts.get(b_id, 0) / float(k)
            # Smooth peer adoption rate into [0.35, 0.96] collaborative affinity score
            affinity = min(0.96, 0.42 + math.sqrt(freq_ratio) * 1.15)
            basket_collab_scores[b_id] = round(float(affinity), 4)

        return course_collab_scores, basket_collab_scores

    def get_peer_cohort_insights(
        self, student_profile: Dict[str, Any], top_k: int = 50
    ) -> Dict[str, Any]:
        """
        Find the top 50 closest historical Thapar CSE alumni/seniors based on Sem I–IV grades
        and return their chosen Elective Focus basket breakdown, average CGPA delta, and placement outcomes.
        """
        if self.students_df is None or self.student_feature_matrix_scaled is None:
            raise RuntimeError("CollaborativeRecommender must be fitted before calling get_peer_cohort_insights()")

        query_vec = self._extract_student_core_vector(student_profile)
        query_scaled = self.scaler.transform(query_vec)

        k = min(top_k, len(self.student_ids))
        distances, indices = self.knn.kneighbors(query_scaled, n_neighbors=k)
        peer_indices = indices[0]
        peer_similarities = np.clip(1.0 - distances[0], 0.0, 1.0)

        peers_df = self.students_df.iloc[peer_indices].copy()
        peers_df["similarity"] = np.round(peer_similarities, 4)

        # Compute each peer's CGPA delta from Sem IV to Sem VII electives
        elective_gps = [
            self.student_avg_elective_gp.get(str(sid), float(cgpa))
            for sid, cgpa in zip(peers_df["student_id"], peers_df["cgpa_sem4"])
        ]
        peers_df["avg_elective_sgpa"] = np.round(elective_gps, 2)
        peers_df["cgpa_delta"] = np.round(peers_df["avg_elective_sgpa"] - peers_df["cgpa_sem4"], 2)

        # Aggregate basket distribution among top-50 peers
        basket_distribution: List[Dict[str, Any]] = []
        for b_id, group in peers_df.groupby("chosen_basket_id"):
            count = len(group)
            b_str = str(b_id)
            tier_counts = Counter(group["placement_tier"].astype(str).tolist())
            basket_distribution.append(
                {
                    "basket_id": b_str,
                    "basket_name": self.basket_id_to_name.get(b_str, b_str),
                    "peer_count": int(count),
                    "percentage": round((count / float(k)) * 100.0, 1),
                    "avg_peer_cgpa_sem4": round(float(group["cgpa_sem4"].mean()), 2),
                    "avg_elective_sgpa": round(float(group["avg_elective_sgpa"].mean()), 2),
                    "avg_cgpa_delta": round(float(group["cgpa_delta"].mean()), 2),
                    "placement_outcomes": dict(tier_counts),
                }
            )
        basket_distribution.sort(key=lambda x: x["peer_count"], reverse=True)

        top_elective_choices = [
            {
                "basket_id": b["basket_id"],
                "basket_name": b["basket_name"],
                "selection_pct": b["percentage"],
                "peer_count": b["peer_count"],
            }
            for b in basket_distribution
        ]

        # Overall placement tier breakdown across the 50 peers
        overall_placements = Counter(peers_df["placement_tier"].astype(str).tolist())
        placement_summary = [
            {
                "tier": tier,
                "count": int(cnt),
                "percentage": round((cnt / float(k)) * 100.0, 1),
            }
            for tier, cnt in overall_placements.most_common()
        ]

        avg_delta = float(peers_df["cgpa_delta"].mean())
        delta_str = f"+{avg_delta:.2f}" if avg_delta >= 0 else f"{avg_delta:.2f}"

        placement_tiers_formatted: Dict[str, float] = {}
        for item in placement_summary:
            t_name = item["tier"]
            if t_name in ("Super-Dream", "Super Dream"):
                label = "Super Dream (>20 LPA)"
            elif t_name == "Dream":
                label = "Dream (10-20 LPA)"
            elif t_name in ("Higher-Studies", "Higher Studies"):
                label = "Higher Studies"
            else:
                label = "Standard / Core"
            placement_tiers_formatted[label] = item["percentage"]

        outcome_distributions = {
            "avg_cgpa_delta": delta_str,
            "avg_elective_sgpa": round(float(peers_df["avg_elective_sgpa"].mean()), 2),
            "placement_tiers": placement_tiers_formatted,
        }

        # Top closest individual alumni records
        closest_seniors: List[Dict[str, Any]] = []
        representative_peers: List[Dict[str, Any]] = []
        for row in peers_df.head(15).itertuples(index=False):
            b_code = str(getattr(row, "chosen_basket_id"))
            b_name = self.basket_id_to_name.get(b_code, b_code)
            sim_score = round(float(getattr(row, "similarity")) * 100.0, 1)

            closest_seniors.append(
                {
                    "student_id": str(getattr(row, "student_id")),
                    "roll_no": str(getattr(row, "roll_no")),
                    "batch_year": int(getattr(row, "batch_year")),
                    "similarity_score": sim_score,
                    "cgpa_sem4": float(getattr(row, "cgpa_sem4")),
                    "avg_elective_sgpa": float(getattr(row, "avg_elective_sgpa")),
                    "cgpa_delta": float(getattr(row, "cgpa_delta")),
                    "chosen_basket_id": b_code,
                    "chosen_basket_name": b_name,
                    "chosen_generic_elective": str(getattr(row, "chosen_generic_elective")),
                    "preferred_career_track": str(getattr(row, "preferred_career_track")),
                    "placement_tier": str(getattr(row, "placement_tier")),
                }
            )

            representative_peers.append(
                {
                    "peer_id": str(getattr(row, "student_id")),
                    "roll_no": str(getattr(row, "roll_no")),
                    "batch_year": int(getattr(row, "batch_year")),
                    "similarity": round(float(getattr(row, "similarity")), 2),
                    "sem4_cgpa": float(getattr(row, "cgpa_sem4")),
                    "final_cgpa": float(getattr(row, "avg_elective_sgpa")),
                    "cgpa_delta": float(getattr(row, "cgpa_delta")),
                    "chosen_basket": b_code,
                    "chosen_basket_name": b_name,
                    "placement_category": str(getattr(row, "placement_tier")),
                    "career_role": str(getattr(row, "preferred_career_track")),
                    "chosen_generic": str(getattr(row, "chosen_generic_elective")),
                }
            )

        return {
            "matched_cohort_size": int(k),
            "similarity_score_avg": round(float(np.mean(peer_similarities)), 2),
            "top_elective_choices": top_elective_choices,
            "outcome_distributions": outcome_distributions,
            "representative_peers": representative_peers,
            # Backward-compatible fields
            "cohort_size": int(k),
            "avg_peer_similarity_pct": round(float(np.mean(peer_similarities)) * 100.0, 1),
            "avg_cohort_cgpa_sem4": round(float(peers_df["cgpa_sem4"].mean()), 2),
            "avg_cohort_elective_sgpa": round(float(peers_df["avg_elective_sgpa"].mean()), 2),
            "avg_cohort_cgpa_delta": round(float(peers_df["cgpa_delta"].mean()), 2),
            "basket_distribution": basket_distribution,
            "placement_summary": placement_summary,
            "closest_seniors": closest_seniors,
        }
