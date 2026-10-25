"""
Module A: Content-Based Filtering Engine (`content_recommender.py`)
Combines TF-IDF bigrams + dense semantic embeddings (sentence-transformers `all-MiniLM-L6-v2`
with automatic fallback to SVD-reduced TF-IDF + skill Jaccard similarity + industry partner alignment)
to compute similarity between a TIET CSE student's profile and every Elective / Focus Basket.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import normalize

logger = logging.getLogger("thapar-ml.content-recommender")

INDUSTRY_PARTNERS = ["nvidia", "xebia", "ec-council", "future first"]


def _tokenize_clean(text: str) -> List[str]:
    return re.findall(r"[a-zA-Z0-9+#.-]+", text.lower())


class ContentBasedRecommender:
    """
    Hybrid TF-IDF Bigram + Dense Semantic Embedding + Skill Jaccard Content Recommender
    for TIET B.E. CSE 2026 Elective Courses and 12 Elective Focus (EF) Baskets.
    """

    def __init__(self, embedding_dim: int = 48, random_state: int = 42) -> None:
        self.embedding_dim = embedding_dim
        self.random_state = random_state
        self.tfidf_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=2500,
            stop_words="english",
            sublinear_tf=True,
        )
        self.svd: Optional[TruncatedSVD] = None
        self.use_sentence_transformer: bool = False
        self._st_model: Any = None

        self.courses: List[Dict[str, Any]] = []
        self.baskets: List[Dict[str, Any]] = []
        self.course_code_to_idx: Dict[str, int] = {}
        self.basket_id_to_meta: Dict[str, Dict[str, Any]] = {}

        self.course_tfidf_matrix: Optional[np.ndarray] = None
        self.course_dense_matrix: Optional[np.ndarray] = None
        self.course_skill_sets: List[Set[str]] = []
        self.course_partner_tags: List[str] = []

    def _build_course_corpus_document(self, course: Dict[str, Any], basket_meta: Optional[Dict[str, Any]]) -> str:
        parts: List[str] = [
            str(course.get("course_code", "")),
            str(course.get("title", "")),
            " ".join(course.get("syllabus_keywords", [])),
            " ".join(course.get("lab_tech_stack", [])),
            " ".join(course.get("clos", [])),
        ]
        if basket_meta:
            parts.append(str(basket_meta.get("name", "")))
            parts.append(str(basket_meta.get("collaboration", "")))
            parts.append(" ".join(basket_meta.get("career_tracks", [])))
        return " ".join(parts)

    def fit(self, catalog: Dict[str, Any]) -> "ContentBasedRecommender":
        """Fit TF-IDF bigram vectorizer and dense semantic representation on the TIET course catalog."""
        self.baskets = list(catalog.get("elective_focus_baskets", []))
        self.basket_id_to_meta = {b["basket_id"]: b for b in self.baskets}

        # Filter to Professional Electives + Generic Electives (plus store all courses if needed)
        elective_courses = [
            c
            for c in catalog.get("all_courses", [])
            if c.get("category") in ("PROFESSIONAL_ELECTIVE", "GENERIC_ELECTIVE")
        ]
        self.courses = elective_courses
        self.course_code_to_idx = {c["course_code"]: i for i, c in enumerate(self.courses)}

        corpus: List[str] = []
        self.course_skill_sets = []
        self.course_partner_tags = []

        for course in self.courses:
            b_meta = self.basket_id_to_meta.get(course.get("basket_id", ""))
            doc = self._build_course_corpus_document(course, b_meta)
            corpus.append(doc)

            skills_tokens: Set[str] = set()
            for item in course.get("lab_tech_stack", []) + course.get("syllabus_keywords", []):
                for tok in _tokenize_clean(item):
                    if len(tok) > 1:
                        skills_tokens.add(tok)
            self.course_skill_sets.append(skills_tokens)

            collab_text = (b_meta.get("collaboration", "") if b_meta else "").lower()
            self.course_partner_tags.append(collab_text)

        tfidf_sparse = self.tfidf_vectorizer.fit_transform(corpus)
        self.course_tfidf_matrix = normalize(tfidf_sparse.toarray(), norm="l2")

        # Attempt sentence-transformers all-MiniLM-L6-v2 only if explicitly enabled and cached;
        # otherwise use deterministic SVD dense semantic projection over the bigram TF-IDF space.
        if os.environ.get("ENABLE_SENTENCE_TRANSFORMERS", "false").lower() == "true":
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore

                self._st_model = SentenceTransformer("all-MiniLM-L6-v2")
                dense_emb = self._st_model.encode(corpus, show_progress_bar=False, normalize_embeddings=True)
                self.course_dense_matrix = np.asarray(dense_emb, dtype=np.float32)
                self.use_sentence_transformer = True
                logger.info("Loaded sentence-transformers all-MiniLM-L6-v2 for content recommender")
            except Exception as exc:
                logger.info("Falling back to SVD dense semantic embeddings (%s)", exc)
                self.use_sentence_transformer = False

        if not self.use_sentence_transformer:
            n_components = min(self.embedding_dim, max(2, tfidf_sparse.shape[0] - 1), tfidf_sparse.shape[1] - 1)
            self.svd = TruncatedSVD(n_components=n_components, random_state=self.random_state)
            svd_matrix = self.svd.fit_transform(tfidf_sparse)
            self.course_dense_matrix = normalize(svd_matrix, norm="l2")

        logger.info(
            "ContentBasedRecommender fitted on %d electives (%d baskets, dense_dim=%d)",
            len(self.courses),
            len(self.baskets),
            self.course_dense_matrix.shape[1] if self.course_dense_matrix is not None else 0,
        )
        return self

    def _build_student_query_text(self, student_profile: Dict[str, Any]) -> Tuple[str, Set[str]]:
        skills = student_profile.get("technical_skills", []) or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        projects = student_profile.get("projects_text", "") or ""
        career_role = student_profile.get("preferred_career_track", "") or ""
        interests = student_profile.get("interests_text", "") or ""
        sop = student_profile.get("statement_of_purpose", "") or ""

        combined_text = " ".join([
            " ".join(skills),
            career_role,
            career_role,  # Double weight for career track intent
            interests,
            projects,
            sop,
        ]).strip()

        if not combined_text:
            combined_text = "software engineering computer science algorithms data science"

        student_skill_tokens: Set[str] = set()
        for item in skills + [career_role, interests, projects]:
            for tok in _tokenize_clean(str(item)):
                if len(tok) > 1:
                    student_skill_tokens.add(tok)

        return combined_text, student_skill_tokens

    def score_courses(self, student_profile: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Compute content similarity score in [0.0, 1.0] and matched keywords/skills
        for every elective course in the catalog.
        """
        if self.course_tfidf_matrix is None or self.course_dense_matrix is None:
            raise RuntimeError("ContentBasedRecommender must be fitted before calling score_courses()")

        query_text, student_tokens = self._build_student_query_text(student_profile)
        q_tfidf = normalize(self.tfidf_vectorizer.transform([query_text]).toarray(), norm="l2")
        tfidf_sims = cosine_similarity(q_tfidf, self.course_tfidf_matrix)[0]

        if self.use_sentence_transformer and self._st_model is not None:
            q_dense = self._st_model.encode([query_text], show_progress_bar=False, normalize_embeddings=True)
            dense_sims = cosine_similarity(q_dense, self.course_dense_matrix)[0]
        elif self.svd is not None:
            q_dense = normalize(self.svd.transform(q_tfidf), norm="l2")
            dense_sims = cosine_similarity(q_dense, self.course_dense_matrix)[0]
        else:
            dense_sims = tfidf_sims

        query_lower = query_text.lower()
        raw_combined: List[float] = []
        per_course_details: List[Tuple[List[str], Optional[str]]] = []

        for idx, course in enumerate(self.courses):
            c_tokens = self.course_skill_sets[idx]
            overlap = student_tokens.intersection(c_tokens)
            union_size = max(1, len(student_tokens.union(c_tokens)))
            jaccard = len(overlap) / union_size
            coverage = len(overlap) / max(1, min(6, len(c_tokens)))
            skill_score = 0.5 * jaccard + 0.5 * min(1.0, coverage)

            # Check industry collaboration match (NVIDIA, Xebia, EC-Council, Future First)
            partner_tag = self.course_partner_tags[idx]
            partner_bonus = 0.0
            matched_partner: Optional[str] = None
            for p in INDUSTRY_PARTNERS:
                if p in partner_tag:
                    matched_partner = partner_tag
                    if p in query_lower:
                        partner_bonus = 0.12
                    break

            # Combine TF-IDF bigram similarity (40%), Dense semantic similarity (40%), Skill overlap (20%) + partner bonus
            blended = (
                0.40 * max(0.0, float(tfidf_sims[idx]))
                + 0.40 * max(0.0, float(dense_sims[idx]))
                + 0.20 * float(skill_score)
                + partner_bonus
            )
            raw_combined.append(blended)

            # Extract human-readable matched keywords/tech stack
            matched_items: List[str] = []
            for item in course.get("lab_tech_stack", []) + course.get("syllabus_keywords", []):
                item_tokens = set(_tokenize_clean(item))
                if item_tokens.intersection(student_tokens):
                    matched_items.append(item)
            if not matched_items:
                matched_items = list(course.get("lab_tech_stack", [])[:2])
            per_course_details.append((matched_items[:4], matched_partner))

        # Calibrate scores into a well-spread [0.25, 0.98] range for interpretability
        arr = np.asarray(raw_combined, dtype=np.float64)
        min_v, max_v = float(np.min(arr)), float(np.max(arr))
        span = max(1e-6, max_v - min_v)
        norm_scores = 0.32 + 0.65 * ((arr - min_v) / span)

        results: Dict[str, Dict[str, Any]] = {}
        for idx, course in enumerate(self.courses):
            code = course["course_code"]
            matched_kw, partner = per_course_details[idx]
            results[code] = {
                "course_code": code,
                "content_score": round(float(np.clip(norm_scores[idx], 0.0, 1.0)), 4),
                "tfidf_similarity": round(float(max(0.0, tfidf_sims[idx])), 4),
                "semantic_similarity": round(float(max(0.0, dense_sims[idx])), 4),
                "matched_keywords": matched_kw,
                "industry_partner": partner,
            }
        return results

    def score_baskets(
        self,
        student_profile: Dict[str, Any],
        course_content_scores: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, Dict[str, Any]]:
        """Aggregate content similarity across each of the 12 TIET Elective Focus Baskets."""
        if course_content_scores is None:
            course_content_scores = self.score_courses(student_profile)

        career_track_query = (student_profile.get("preferred_career_track", "") or "").lower()
        interests_query = (student_profile.get("interests_text", "") or "").lower()

        basket_scores: Dict[str, Dict[str, Any]] = {}
        for basket in self.baskets:
            b_id = basket["basket_id"]
            seq = basket.get("elective_sequence", {})
            b_codes = [code for slot_codes in seq.values() for code in slot_codes]

            c_Vals = [
                course_content_scores[c]["content_score"]
                for c in b_codes
                if c in course_content_scores
            ]
            mean_course_sim = float(np.mean(c_Vals)) if c_Vals else 0.5

            # Career track alignment score
            career_align = 0.55
            for track in basket.get("career_tracks", []):
                t_low = track.lower()
                if career_track_query and (career_track_query in t_low or t_low in career_track_query):
                    career_align = 0.96
                    break
                track_tokens = set(_tokenize_clean(t_low))
                query_tokens = set(_tokenize_clean(career_track_query + " " + interests_query))
                overlap = len(track_tokens.intersection(query_tokens))
                if overlap >= 2:
                    career_align = max(career_align, 0.86)
                elif overlap == 1:
                    career_align = max(career_align, 0.72)

            matched_kw: List[str] = []
            for c in b_codes:
                if c in course_content_scores:
                    for kw in course_content_scores[c]["matched_keywords"]:
                        if kw not in matched_kw:
                            matched_kw.append(kw)

            basket_scores[b_id] = {
                "basket_id": b_id,
                "content_score": round(0.65 * mean_course_sim + 0.35 * career_align, 4),
                "career_alignment_score": round(career_align, 4),
                "matched_keywords": matched_kw[:5],
                "collaboration": basket.get("collaboration", ""),
            }
        return basket_scores
