#!/usr/bin/env python3
"""
Thapar Institute of Engineering & Technology (TIET) — B.E. CSE 2026 Curriculum
Comprehensive Dataset Generator & MongoDB Atlas Bulk-Upsert Pipeline.

Generates:
  1. ml-service/data/processed/courses_catalog.json
     - 14 Semesters I–V Core Prerequisite Courses
     - 50 Professional Electives across all 12 Official TIET Elective Focus (EF) Baskets
     - 10 Official Semester V Generic Electives (2.0 Credits)
  2. ml-service/data/processed/students_historical.csv (3,500 realistic TIET CSE students)
  3. ml-service/data/processed/enrollments_ratings.csv (17,500 student-elective records)

Supports idempotent remote MongoDB Atlas synchronization via `--sync-atlas`
using `pymongo.MongoClient(os.environ["MONGODB_URI"])` and batched `UpdateOne(..., upsert=True)`.
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import math
import os
import random
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient, UpdateOne

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("tiet-dataset-generator")

MONGO_SRV_REGEX = re.compile(r"^mongodb\+srv://(?!localhost|127\.0\.0\.1).+", re.IGNORECASE)

# Official TIET 10-Point Grading Scale
TIET_GRADE_SCALE: List[Tuple[float, str, int]] = [
    (90.0, "A+", 10),
    (82.0, "A", 10),
    (74.0, "A-", 9),
    (66.0, "B", 8),
    (58.0, "B-", 7),
    (50.0, "C", 6),
    (42.0, "C-", 5),
    (35.0, "E", 2),
    (0.0, "F", 0),
]

CORE_PREREQUISITE_CODES: List[str] = [
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
]


def marks_to_tiet_grade(score_100: float) -> Tuple[str, int]:
    """Convert a 0-100 total course score to official TIET letter grade and 10-point grade points."""
    clamped = max(0.0, min(100.0, score_100))
    for threshold, letter, points in TIET_GRADE_SCALE:
        if clamped >= threshold:
            return letter, points
    return "F", 0


def build_courses_catalog() -> Dict[str, Any]:
    """
    Build the complete TIET B.E. CSE 2026 curriculum catalog:
      - Category A: Semesters I-IV Core Prerequisite Courses (+ Sem V Core UML501)
      - Category B: 12 Official Elective Focus (EF) Baskets & their PE-I..PE-IV courses
      - Category C: 10 Official Semester V Generic Electives (2-0-0, 2.0 Cr)
    """
    default_eval = {
        "mst_weight": 28,
        "est_weight": 42,
        "sessional_weight": 30,
    }

    # -------------------------------------------------------------------------
    # A. Semesters I-IV Core Prerequisite Courses (+ Sem V Core UML501)
    # -------------------------------------------------------------------------
    core_courses: List[Dict[str, Any]] = [
        {
            "course_code": "UES103",
            "title": "Programming for Problem Solving",
            "category": "CORE_PREREQUISITE",
            "semester": 1,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 2.6,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["C", "GCC", "GDB", "Linux Shell", "Make"],
            "syllabus_keywords": [
                "C programming",
                "pointers",
                "recursion",
                "arrays",
                "structures",
                "dynamic memory allocation",
                "file handling",
            ],
            "clos": [
                "CLO1: Formulate structured algorithms for numerical and array-based problems in C.",
                "CLO2: Manipulate pointers, dynamic memory allocation, and recursive functions.",
                "CLO3: Design modular programs using structures, unions, and file streams.",
            ],
        },
        {
            "course_code": "UMA022",
            "title": "Calculus for Engineers",
            "category": "CORE_PREREQUISITE",
            "semester": 1,
            "ltp": "3-1-0",
            "lecture_hours": 3,
            "tutorial_hours": 1,
            "practical_hours": 0,
            "credits": 3.5,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 2.9,
            "weekly_self_effort_hours": 5.5,
            "lab_tech_stack": ["MATLAB", "SymPy"],
            "syllabus_keywords": [
                "infinite series",
                "partial derivatives",
                "multiple integrals",
                "vector calculus",
                "gradient divergence curl",
            ],
            "clos": [
                "CLO1: Test convergence of infinite series and power series expansions.",
                "CLO2: Apply multivariable differential calculus to optimization problems.",
                "CLO3: Evaluate multiple and vector integrals using Green, Stokes, and Gauss theorems.",
            ],
        },
        {
            "course_code": "UMA023",
            "title": "Differential Equations and Linear Algebra",
            "category": "CORE_PREREQUISITE",
            "semester": 2,
            "ltp": "3-1-0",
            "lecture_hours": 3,
            "tutorial_hours": 1,
            "practical_hours": 0,
            "credits": 3.5,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.1,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["MATLAB", "NumPy"],
            "syllabus_keywords": [
                "ordinary differential equations",
                "Laplace transforms",
                "vector spaces",
                "linear transformations",
                "eigenvalues and eigenvectors",
            ],
            "clos": [
                "CLO1: Solve higher-order ordinary differential equations and system dynamics.",
                "CLO2: Analyze vector spaces, basis, rank-nullity, and orthogonality.",
                "CLO3: Compute eigenvalues, eigenvectors, and diagonalization of linear operators.",
            ],
        },
        {
            "course_code": "UCS301",
            "title": "Data Structures",
            "category": "CORE_PREREQUISITE",
            "semester": 3,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.5,
            "weekly_self_effort_hours": 7.5,
            "lab_tech_stack": ["C++17", "STL", "Valgrind", "CMake"],
            "syllabus_keywords": [
                "trees",
                "graphs",
                "hashing",
                "complexity",
                "AVL and B-trees",
                "heaps",
                "sorting and searching",
            ],
            "clos": [
                "CLO1: Analyze asymptotic time and space complexity of linear and non-linear data structures.",
                "CLO2: Implement balanced search trees, priority queues, and collision-resilient hash tables.",
                "CLO3: Design graph traversal, shortest path, and minimum spanning tree algorithms.",
            ],
        },
        {
            "course_code": "UCS303",
            "title": "Operating System",
            "category": "CORE_PREREQUISITE",
            "semester": 3,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.4,
            "weekly_self_effort_hours": 6.5,
            "lab_tech_stack": ["POSIX Threads", "Linux Kernel Modules", "C", "Bash"],
            "syllabus_keywords": [
                "processes",
                "concurrency",
                "memory management",
                "CPU scheduling",
                "deadlocks",
                "virtual memory paging",
                "file systems",
            ],
            "clos": [
                "CLO1: Evaluate CPU scheduling, process synchronization, and deadlock handling mechanisms.",
                "CLO2: Implement concurrent programs using POSIX threads, mutexes, and semaphores.",
                "CLO3: Analyze virtual memory paging, segmentation, and disk scheduling algorithms.",
            ],
        },
        {
            "course_code": "UTA018",
            "title": "Object Oriented Programming",
            "category": "CORE_PREREQUISITE",
            "semester": 3,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 2.8,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["C++", "Java", "JUnit", "UML"],
            "syllabus_keywords": [
                "C++/Java OOP",
                "design patterns",
                "inheritance",
                "polymorphism",
                "templates and generics",
                "exception handling",
                "SOLID principles",
            ],
            "clos": [
                "CLO1: Apply encapsulation, inheritance, and polymorphism to modular software design.",
                "CLO2: Utilize generic programming, STL/Collections, and exception safety.",
                "CLO3: Implement object-oriented design patterns following SOLID engineering principles.",
            ],
        },
        {
            "course_code": "UCS405",
            "title": "Discrete Mathematical Structures",
            "category": "CORE_PREREQUISITE",
            "semester": 3,
            "ltp": "3-1-0",
            "lecture_hours": 3,
            "tutorial_hours": 1,
            "practical_hours": 0,
            "credits": 3.5,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.3,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["Python", "NetworkX", "Z3 Theorem Prover"],
            "syllabus_keywords": [
                "logic",
                "combinatorics",
                "graph theory",
                "recurrence relations",
                "groups and rings",
                "Boolean algebra",
                "lattices",
            ],
            "clos": [
                "CLO1: Construct formal mathematical proofs using propositional and predicate logic.",
                "CLO2: Solve recurrence relations and combinatorial enumeration problems.",
                "CLO3: Apply algebraic structures, lattices, and graph theory to computer science problems.",
            ],
        },
        {
            "course_code": "UMA021",
            "title": "Numerical Linear Algebra",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.6,
            "weekly_self_effort_hours": 7.0,
            "lab_tech_stack": ["Python", "NumPy", "SciPy", "MATLAB"],
            "syllabus_keywords": [
                "SVD",
                "eigenvalues",
                "matrix factorizations",
                "LU and QR decomposition",
                "least squares",
                "conditioning and stability",
            ],
            "clos": [
                "CLO1: Analyze numerical stability, conditioning, and floating-point error propagation.",
                "CLO2: Implement LU, Cholesky, QR, and Singular Value Decomposition (SVD) algorithms.",
                "CLO3: Solve large sparse linear systems and eigenvalue problems iteratively.",
            ],
        },
        {
            "course_code": "UCS415",
            "title": "Design and Analysis of Algorithms",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.9,
            "weekly_self_effort_hours": 8.0,
            "lab_tech_stack": ["C++20", "Python", "Google Benchmark"],
            "syllabus_keywords": [
                "DP",
                "greedy",
                "NP-completeness",
                "divide and conquer",
                "backtracking",
                "network flow",
                "approximation algorithms",
            ],
            "clos": [
                "CLO1: Design optimal algorithms using divide-and-conquer, greedy, and dynamic programming.",
                "CLO2: Formulate graph network flows, string matching, and branch-and-bound solutions.",
                "CLO3: Prove NP-completeness via polynomial-time reductions and design approximation schemes.",
            ],
        },
        {
            "course_code": "UCS310",
            "title": "Database Management Systems",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.0,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["PostgreSQL", "Oracle PL/SQL", "MongoDB", "Redis"],
            "syllabus_keywords": [
                "SQL",
                "normalization",
                "transactions",
                "relational algebra",
                "BCNF",
                "ACID concurrency control",
                "B+ tree indexing",
            ],
            "clos": [
                "CLO1: Model enterprise schemas using ER diagrams, relational algebra, and BCNF normalization.",
                "CLO2: Write complex analytical SQL queries, triggers, and stored procedures.",
                "CLO3: Evaluate transaction serializability, two-phase locking, and crash recovery protocols.",
            ],
        },
        {
            "course_code": "UCS414",
            "title": "Computer Networks",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.2,
            "weekly_self_effort_hours": 6.0,
            "lab_tech_stack": ["Wireshark", "Cisco Packet Tracer", "Python Sockets", "ns-3"],
            "syllabus_keywords": [
                "TCP/IP",
                "routing",
                "network security basics",
                "OSI model",
                "OSPF and BGP",
                "congestion control",
                "DNS and HTTP/3",
            ],
            "clos": [
                "CLO1: Analyze layered network protocols across Data Link, Network, and Transport layers.",
                "CLO2: Configure IPv4/IPv6 subnetting, OSPF/BGP routing, and TCP congestion control.",
                "CLO3: Implement client-server socket applications and inspect packet traces.",
            ],
        },
        {
            "course_code": "UCS321",
            "title": "AI for Engineers",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "2-0-2",
            "lecture_hours": 2,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 3.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.1,
            "weekly_self_effort_hours": 5.5,
            "lab_tech_stack": ["Python", "Scikit-Learn", "NumPy", "Pandas"],
            "syllabus_keywords": [
                "search algorithms",
                "knowledge representation",
                "ML basics",
                "A* heuristic search",
                "adversarial games",
                "Bayesian reasoning",
            ],
            "clos": [
                "CLO1: Formulate state-space search problems using uninformed and heuristic A* strategies.",
                "CLO2: Represent domain knowledge using first-order logic and probabilistic graphical models.",
                "CLO3: Build foundational supervised and unsupervised machine learning pipelines.",
            ],
        },
        {
            "course_code": "UMA401",
            "title": "Probability and Statistics",
            "category": "CORE_PREREQUISITE",
            "semester": 4,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.4,
            "weekly_self_effort_hours": 6.5,
            "lab_tech_stack": ["R", "Python SciPy", "Statsmodels"],
            "syllabus_keywords": [
                "Bayesian inference",
                "distributions",
                "hypothesis testing",
                "random variables",
                "maximum likelihood estimation",
                "regression analysis",
                "Markov chains",
            ],
            "clos": [
                "CLO1: Model stochastic phenomena using discrete and continuous probability distributions.",
                "CLO2: Perform parameter estimation, confidence interval construction, and hypothesis testing.",
                "CLO3: Apply linear regression, ANOVA, and Bayesian inference to engineering datasets.",
            ],
        },
        {
            "course_code": "UML501",
            "title": "Machine Learning",
            "category": "CORE_SEM5",
            "semester": 5,
            "ltp": "3-0-2",
            "lecture_hours": 3,
            "tutorial_hours": 0,
            "practical_hours": 2,
            "credits": 4.0,
            **default_eval,
            "seat_capacity": 120,
            "difficulty_index": 3.7,
            "weekly_self_effort_hours": 7.5,
            "lab_tech_stack": ["Python", "Scikit-Learn", "PyTorch", "XGBoost"],
            "syllabus_keywords": [
                "supervised learning",
                "support vector machines",
                "ensemble methods",
                "neural networks",
                "dimensionality reduction",
                "regularization",
            ],
            "clos": [
                "CLO1: Derive and implement parametric and non-parametric supervised learning algorithms.",
                "CLO2: Optimize ensemble trees, SVMs, and multi-layer perceptrons with cross-validation.",
                "CLO3: Apply clustering, PCA, and feature selection to high-dimensional data.",
            ],
        },
    ]

    # -------------------------------------------------------------------------
    # B. All 12 Official Thapar CSE Elective Focus (EF) Baskets & Courses
    # -------------------------------------------------------------------------
    elective_baskets: List[Dict[str, Any]] = [
        {
            "basket_id": "EF_BASKET_01",
            "basket_number": 1,
            "name": "High Performance Computing",
            "collaboration": "TIET Advanced Computing Lab",
            "career_tracks": ["Cloud & Distributed Systems Architect", "HPC & Systems Engineer", "Backend Infrastructure Engineer"],
            "key_prerequisites": ["UCS303", "UCS415", "UMA021", "UCS301"],
            "elective_sequence": {
                "PE-I": ["UCS531"],
                "PE-II": ["UCS635"],
                "PE-III": ["UCS645"],
                "PE-IV": ["UCS751"],
            },
        },
        {
            "basket_id": "EF_BASKET_02",
            "basket_number": 2,
            "name": "Computer Animation and Gaming",
            "collaboration": "TIET Visual Computing & Graphics Studio",
            "career_tracks": ["Computer Vision & Graphics Engineer", "Game Engine & AR/VR Developer", "Multimedia Systems Engineer"],
            "key_prerequisites": ["UTA018", "UCS301", "UMA021", "UES103"],
            "elective_sequence": {
                "PE-I": ["UCS532"],
                "PE-II": ["UCS636"],
                "PE-III": ["UCS646"],
                "PE-IV": ["UCS752"],
            },
        },
        {
            "basket_id": "EF_BASKET_03",
            "basket_number": 3,
            "name": "Information and Cyber Security",
            "collaboration": "TIET Information Assurance Cell",
            "career_tracks": ["Cybersecurity Architect", "Product Security Engineer", "Blockchain & Cryptography Engineer"],
            "key_prerequisites": ["UCS414", "UCS303", "UCS405", "UES103"],
            "elective_sequence": {
                "PE-I": ["UCS534"],
                "PE-II": ["UCS638"],
                "PE-III": ["UCS648"],
                "PE-IV": ["UCS754"],
            },
        },
        {
            "basket_id": "EF_BASKET_04",
            "basket_number": 4,
            "name": "Mathematics and Computing",
            "collaboration": "TIET School of Mathematics & Computing",
            "career_tracks": ["Quantitative Researcher", "Algorithm & Quantum Computing Scientist", "AI Research Engineer"],
            "key_prerequisites": ["UMA021", "UMA401", "UCS405", "UCS415"],
            "elective_sequence": {
                "PE-I": ["UMC513"],
                "PE-II": ["UMC622", "UMC632"],
                "PE-III": ["UMC633"],
                "PE-IV": ["UMC744"],
            },
        },
        {
            "basket_id": "EF_BASKET_05",
            "basket_number": 5,
            "name": "Data Science",
            "collaboration": "TIET Center of Excellence in Data Science",
            "career_tracks": ["Data Scientist", "Machine Learning Engineer", "Applied AI Scientist"],
            "key_prerequisites": ["UMA401", "UCS321", "UMA021", "UCS310"],
            "elective_sequence": {
                "PE-I": ["UCS548"],
                "PE-II": ["UCS654"],
                "PE-III": ["UCS761"],
                "PE-IV": ["UCS772"],
            },
        },
        {
            "basket_id": "EF_BASKET_06",
            "basket_number": 6,
            "name": "Financial Derivative",
            "collaboration": "Future First Collaboration",
            "career_tracks": ["Quantitative Trader & Derivatives Analyst", "FinTech Risk Modeler", "Algorithmic Trading Strategist"],
            "key_prerequisites": ["UMA401", "UMA021", "UMA022", "UCS415"],
            "elective_sequence": {
                "PE-I": ["UCS539"],
                "PE-II": ["UCS675"],
                "PE-III": ["UCS658"],
                "PE-IV": ["UMC743"],
            },
        },
        {
            "basket_id": "EF_BASKET_07",
            "basket_number": 7,
            "name": "DevOps and Continuous Delivery",
            "collaboration": "Xebia Collaboration",
            "career_tracks": ["Site Reliability Engineer (SRE)", "DevOps & Platform Engineer", "Cloud Release Architect"],
            "key_prerequisites": ["UCS303", "UCS414", "UTA018", "UCS310"],
            "elective_sequence": {
                "PE-I": ["UCS537"],
                "PE-II": ["UCS659"],
                "PE-III": ["UCS660"],
                "PE-IV": ["UCS758"],
            },
        },
        {
            "basket_id": "EF_BASKET_08",
            "basket_number": 8,
            "name": "Full Stack",
            "collaboration": "Xebia Collaboration",
            "career_tracks": ["Full-Stack Software Engineer", "Data & Database Platform Engineer", "Cloud Product Engineer"],
            "key_prerequisites": ["UTA018", "UCS310", "UCS301", "UCS414"],
            "elective_sequence": {
                "PE-I": ["UCS542"],
                "PE-II": ["UCS677", "UCS661"],
                "PE-III": ["UCS662"],
                "PE-IV": ["UCS745"],
            },
        },
        {
            "basket_id": "EF_BASKET_09",
            "basket_number": 9,
            "name": "Conversational AI",
            "collaboration": "NVIDIA Collaboration",
            "career_tracks": ["Generative AI & LLM Engineer", "NLP Research Scientist", "Speech & Multimodal AI Engineer"],
            "key_prerequisites": ["UCS321", "UMA021", "UMA401", "UCS415"],
            "elective_sequence": {
                "PE-I": ["UCS551"],
                "PE-II": ["UCS664"],
                "PE-III": ["UCS749"],
                "PE-IV": ["UCS748"],
            },
        },
        {
            "basket_id": "EF_BASKET_10",
            "basket_number": 10,
            "name": "Robotics and Edge AI",
            "collaboration": "NVIDIA Collaboration",
            "career_tracks": ["Robotics & Autonomous Systems Engineer", "Edge AI & Embedded Vision Engineer", "Reinforcement Learning Researcher"],
            "key_prerequisites": ["UCS321", "UCS303", "UMA021", "UES103"],
            "elective_sequence": {
                "PE-I": ["UCS547"],
                "PE-II": ["UCS668"],
                "PE-III": ["UCS671"],
                "PE-IV": ["UCS760"],
            },
        },
        {
            "basket_id": "EF_BASKET_11",
            "basket_number": 11,
            "name": "Cyber Forensics and Ethical Hacking",
            "collaboration": "EC-Council, USA",
            "career_tracks": ["Penetration Tester & Red Team Specialist", "Digital Forensics Investigator", "SOC & Network Defense Lead"],
            "key_prerequisites": ["UCS414", "UCS303", "UCS310", "UES103"],
            "elective_sequence": {
                "PE-I": ["UCS550"],
                "PE-II": ["UCS673"],
                "PE-III": ["UCS674"],
                "PE-IV": ["UCS750"],
            },
        },
        {
            "basket_id": "EF_BASKET_12",
            "basket_number": 12,
            "name": "Intelligent Transport Systems",
            "collaboration": "TIET Smart Mobility & V2X Group",
            "career_tracks": ["Connected Mobility & V2X Engineer", "Automotive Data Scientist", "ITS Cybersecurity Specialist"],
            "key_prerequisites": ["UCS414", "UMA401", "UCS321", "UCS303"],
            "elective_sequence": {
                "PE-I": ["UEC646"],
                "PE-II": ["UCS678"],
                "PE-III": ["UCS679"],
                "PE-IV": ["UCS780"],
            },
        },
    ]

    # Raw specification of all 50 Professional Electives across the 12 EF Baskets
    pe_raw_specs: List[Tuple[str, str, str, int, str, str, float, float, List[str], List[str], List[str]]] = [
        # Basket 1: High Performance Computing
        ("UCS531", "Cloud Computing", "EF_BASKET_01", 5, "PE-I", "2-0-2", 3.2, 5.5,
         ["Docker", "Kubernetes", "AWS EC2/S3", "OpenStack"],
         ["virtualization", "IaaS PaaS SaaS", "cloud orchestration", "microservices", "auto-scaling"],
         ["UCS303", "UCS414"]),
        ("UCS635", "GPU Computing", "EF_BASKET_01", 6, "PE-II", "2-0-2", 4.1, 7.5,
         ["NVIDIA CUDA", "Nsight", "C++", "cuBLAS"],
         ["SIMT architecture", "CUDA thread hierarchy", "shared memory optimization", "warp divergence", "GPU kernels"],
         ["UCS303", "UES103", "UMA021"]),
        ("UCS645", "Parallel & Distributed Computing", "EF_BASKET_01", 6, "PE-III", "2-0-2", 3.9, 7.0,
         ["OpenMP", "MPI", "Apache Spark", "C++"],
         ["Amdahl law", "message passing interface", "shared memory parallelism", "distributed consensus", "MapReduce"],
         ["UCS303", "UCS415", "UCS414"]),
        ("UCS751", "Simulation & Modelling", "EF_BASKET_01", 7, "PE-IV", "2-0-2", 3.4, 6.0,
         ["SimPy", "MATLAB Simulink", "Python", "AnyLogic"],
         ["discrete event simulation", "Monte Carlo methods", "queueing networks", "stochastic processes", "system dynamics"],
         ["UMA401", "UMA021", "UCS415"]),

        # Basket 2: Computer Animation and Gaming
        ("UCS532", "Computer Vision", "EF_BASKET_02", 5, "PE-I", "2-0-2", 3.6, 6.5,
         ["OpenCV", "PyTorch", "Python", "NumPy"],
         ["image filtering", "edge detection", "feature descriptors SIFT/ORB", "camera calibration", "object detection"],
         ["UMA021", "UCS321", "UCS301"]),
        ("UCS636", "3D Modelling and Animation", "EF_BASKET_02", 6, "PE-II", "2-0-2", 3.1, 6.0,
         ["Blender", "OpenGL", "Three.js", "GLSL Shaders"],
         ["polygonal meshes", "NURBS", "skeletal rigging", "keyframe kinematics", "PBR rendering"],
         ["UTA018", "UMA021"]),
        ("UCS646", "Game Design & Development", "EF_BASKET_02", 6, "PE-III", "2-0-2", 3.3, 6.5,
         ["Unity 3D", "Unreal Engine", "C#", "C++"],
         ["game physics engine", "collision detection", "navmesh pathfinding", "shader pipelines", "entity component system"],
         ["UTA018", "UCS301", "UCS321"]),
        ("UCS752", "Augmented and Virtual Reality", "EF_BASKET_02", 7, "PE-IV", "2-0-2", 3.5, 6.5,
         ["Unity XR Toolkit", "OpenXR", "ARKit/ARCore", "C#"],
         ["SLAM spatial tracking", "stereoscopic rendering", "haptic interaction", "spatial audio", "mixed reality UX"],
         ["UCS532", "UTA018", "UMA021"]),

        # Basket 3: Information and Cyber Security
        ("UCS534", "Computer & Network Security", "EF_BASKET_03", 5, "PE-I", "2-0-2", 3.4, 6.0,
         ["OpenSSL", "Wireshark", "Snort IDS", "iptables"],
         ["symmetric and public-key cryptography", "TLS/IPSec", "firewalls", "intrusion detection", "authentication protocols"],
         ["UCS414", "UCS303", "UCS405"]),
        ("UCS638", "Secure Coding", "EF_BASKET_03", 6, "PE-II", "2-0-2", 3.6, 6.5,
         ["SonarQube", "OWASP ZAP", "GDB", "AddressSanitizer"],
         ["buffer overflow mitigation", "SQL injection prevention", "XSS/CSRF defenses", "static taint analysis", "memory safety"],
         ["UES103", "UTA018", "UCS303"]),
        ("UCS648", "Cyber Forensics", "EF_BASKET_03", 6, "PE-III", "2-0-2", 3.5, 6.0,
         ["Autopsy", "Volatility", "FTK Imager", "Sleuth Kit"],
         ["disk imaging", "memory forensics", "network packet reconstruction", "file carving", "chain of custody"],
         ["UCS303", "UCS414", "UCS310"]),
        ("UCS754", "Blockchain Technology and Applications", "EF_BASKET_03", 7, "PE-IV", "2-0-2", 3.7, 6.5,
         ["Solidity", "Hardhat", "Ethereum EVM", "Hyperledger Fabric"],
         ["Merkle trees", "Byzantine fault tolerance", "smart contracts", "zero-knowledge proofs", "DeFi security"],
         ["UCS405", "UCS414", "UCS301"]),

        # Basket 4: Mathematics and Computing
        ("UMC513", "Linear Algebra for AI and ML", "EF_BASKET_04", 5, "PE-I", "2-0-2", 3.8, 7.0,
         ["Python", "NumPy", "SciPy", "JAX"],
         ["spectral decomposition", "positive definite matrices", "tensor contractions", "PCA and kernel SVD", "gradient calculus"],
         ["UMA021", "UMA023", "UCS321"]),
        ("UMC622", "Matrix Computation", "EF_BASKET_04", 6, "PE-II", "2-0-2", 4.0, 7.5,
         ["LAPACK", "SciPy Sparse", "MATLAB", "Julia"],
         ["Krylov subspace methods", "GMRES and Conjugate Gradient", "Hessenberg reduction", "QR iteration", "preconditioning"],
         ["UMA021", "UMA023", "UCS415"]),
        ("UMC632", "Financial Mathematics", "EF_BASKET_04", 6, "PE-II", "2-0-2", 3.9, 7.0,
         ["Python", "QuantLib", "NumPy", "Statsmodels"],
         ["stochastic calculus", "Ito lemma", "martingale pricing", "binomial asset pricing", "term structure models"],
         ["UMA401", "UMA022", "UMA021"]),
        ("UMC633", "Mathematics for Quantum Computing", "EF_BASKET_04", 6, "PE-III", "2-0-2", 4.4, 8.5,
         ["Qiskit", "PennyLane", "Python", "SciPy"],
         ["Hilbert spaces", "unitary operators", "quantum entanglement", "Shor and Grover algorithms", "quantum error correction"],
         ["UMA021", "UCS405", "UMA401"]),
        ("UMC744", "Cryptography and Coding Theory", "EF_BASKET_04", 7, "PE-IV", "2-0-2", 4.2, 8.0,
         ["SageMath", "Python", "OpenSSL", "PARI/GP"],
         ["finite fields Galois theory", "elliptic curve cryptography", "lattice-based post-quantum crypto", "Reed-Solomon codes", "LDPC codes"],
         ["UCS405", "UMA021", "UCS415"]),

        # Basket 5: Data Science
        ("UCS548", "Foundation of Data Science", "EF_BASKET_05", 5, "PE-I", "2-0-2", 3.2, 6.0,
         ["Python", "Pandas", "Seaborn", "Scikit-Learn"],
         ["exploratory data analysis", "feature engineering", "data wrangling", "statistical visualization", "dimensionality reduction"],
         ["UMA401", "UCS321", "UCS310"]),
        ("UCS654", "Predictive Analytics using Statistics", "EF_BASKET_05", 6, "PE-II", "2-0-2", 3.6, 6.5,
         ["R", "Statsmodels", "XGBoost", "Scikit-Learn"],
         ["generalized linear models", "ARIMA and Prophet time-series", "survival analysis", "ridge/lasso regularization", "causal inference"],
         ["UMA401", "UMA021", "UCS321"]),
        ("UCS761", "Deep Learning", "EF_BASKET_05", 6, "PE-III", "2-0-2", 4.0, 7.5,
         ["PyTorch", "TensorFlow", "CUDA", "Weights & Biases"],
         ["backpropagation", "CNNs ResNet/ViT", "RNNs and LSTMs", "attention mechanisms", "batch norm and dropout"],
         ["UCS321", "UMA021", "UMA401"]),
        ("UCS772", "Data Science: Computer Vision & NLP", "EF_BASKET_05", 7, "PE-IV", "2-0-2", 4.1, 7.5,
         ["PyTorch", "HuggingFace Transformers", "OpenCV", "spaCy"],
         ["Vision Transformers", "semantic segmentation", "transformer tokenization", "BERT/GPT fine-tuning", "multimodal representation"],
         ["UCS321", "UMA021", "UMA401"]),

        # Basket 6: Financial Derivative (Future First Collaboration)
        ("UCS539", "Finance, Accounting and Valuation", "EF_BASKET_06", 5, "PE-I", "2-0-2", 3.0, 5.5,
         ["Python", "Excel Financial Modeling", "Pandas", "yfinance"],
         ["financial statements", "discounted cash flow valuation", "time value of money", "cost of capital WACC", "fixed income basics"],
         ["UMA401", "UMA022"]),
        ("UCS675", "Financial Markets and Portfolio Theory", "EF_BASKET_06", 6, "PE-II", "2-0-2", 3.5, 6.5,
         ["Python", "PyPortfolioOpt", "NumPy", "QuantConnect"],
         ["Markowitz mean-variance optimization", "CAPM and factor models", "efficient frontier", "Value at Risk VaR", "market microstructure"],
         ["UMA401", "UMA021"]),
        ("UCS658", "Derivatives Pricing, Trading and Strategies", "EF_BASKET_06", 6, "PE-III", "2-0-2", 3.9, 7.0,
         ["Python", "QuantLib", "NumPy", "Matplotlib"],
         ["Black-Scholes-Merton PDE", "options Greeks delta-gamma hedging", "futures and swaps", "volatility smiles", "arbitrage strategies"],
         ["UMA401", "UMA022", "UMA021"]),
        ("UMC743", "Quantitative and Statistical Methods for Finance", "EF_BASKET_06", 7, "PE-IV", "2-0-2", 4.1, 7.5,
         ["Python", "ARCH/GARCH", "SciPy", "C++"],
         ["GARCH volatility modeling", "cointegration pairs trading", "Monte Carlo derivative simulation", "high-frequency order book dynamics", "backtesting"],
         ["UMA401", "UMA021", "UCS415"]),

        # Basket 7: DevOps and Continuous Delivery (Xebia Collaboration)
        ("UCS537", "Source Code Management", "EF_BASKET_07", 5, "PE-I", "2-0-2", 2.7, 5.0,
         ["Git", "GitHub Actions", "GitLab", "Bash"],
         ["Git internals DAG", "branching strategies trunk-based/GitFlow", "semantic versioning", "code review automation", "monorepo tooling"],
         ["UTA018", "UCS303"]),
        ("UCS659", "Build and Release Management", "EF_BASKET_07", 6, "PE-II", "2-0-2", 3.1, 5.5,
         ["Maven", "Gradle", "Nexus Artifact Repository", "Docker"],
         ["dependency resolution", "reproducible builds", "artifact signing SBOM", "container image layering", "release pipelines"],
         ["UTA018", "UCS303"]),
        ("UCS660", "Continuous Integration and Continuous Deployment", "EF_BASKET_07", 6, "PE-III", "2-0-2", 3.4, 6.0,
         ["Jenkins", "GitHub Actions", "ArgoCD", "Helm"],
         ["automated CI pipelines", "blue-green and canary deployments", "GitOps workflows", "pipeline security scanning DevSecOps", "DORA metrics"],
         ["UCS303", "UCS414", "UTA018"]),
        ("UCS758", "System Provisioning and Configuration Management", "EF_BASKET_07", 7, "PE-IV", "2-0-2", 3.6, 6.5,
         ["Terraform", "Ansible", "Kubernetes", "Prometheus & Grafana"],
         ["Infrastructure as Code IaC", "immutable infrastructure", "Ansible playbooks", "Kubernetes operators", "observability and SRE"],
         ["UCS303", "UCS414"]),

        # Basket 8: Full Stack (Xebia Collaboration)
        ("UCS542", "UI & UX Specialist", "EF_BASKET_08", 5, "PE-I", "2-0-2", 2.8, 5.5,
         ["React 18", "TypeScript", "Tailwind CSS", "Figma"],
         ["design systems", "component architecture", "WCAG accessibility", "state management", "responsive micro-interactions"],
         ["UTA018", "UES103"]),
        ("UCS677", "Data Engineering", "EF_BASKET_08", 6, "PE-II", "2-0-2", 3.5, 6.5,
         ["Apache Kafka", "Apache Spark", "Airflow", "Snowflake/PostgreSQL"],
         ["ETL/ELT pipelines", "event streaming", "data warehousing star schema", "lakehouse architecture", "batch vs stream processing"],
         ["UCS310", "UCS301", "UTA018"]),
        ("UCS661", "Database Engineer", "EF_BASKET_08", 6, "PE-II", "2-0-2", 3.4, 6.0,
         ["PostgreSQL", "MongoDB Atlas", "Redis", "PgBouncer"],
         ["query execution plans", "sharding and replication", "NoSQL document modeling", "MVCC internals", "database performance tuning"],
         ["UCS310", "UCS301"]),
        ("UCS662", "Test Automation", "EF_BASKET_08", 6, "PE-III", "2-0-2", 3.0, 5.5,
         ["Playwright", "Cypress", "Jest", "k6 Load Testing"],
         ["test-driven development TDD", "end-to-end UI testing", "API contract testing", "mutation testing", "performance load profiling"],
         ["UTA018", "UCS310"]),
        ("UCS745", "Cloud & DevOps", "EF_BASKET_08", 7, "PE-IV", "2-0-2", 3.5, 6.5,
         ["AWS", "Docker", "Kubernetes", "Node.js/Express"],
         ["cloud-native full-stack deployment", "serverless functions", "API gateways", "distributed tracing", "zero-downtime scaling"],
         ["UCS414", "UCS310", "UTA018"]),

        # Basket 9: Conversational AI (NVIDIA Collaboration)
        ("UCS551", "Conversational AI: Accelerated Data Science", "EF_BASKET_09", 5, "PE-I", "2-0-2", 3.6, 6.5,
         ["NVIDIA RAPIDS cuDF", "PyTorch", "CUDA", "Python"],
         ["GPU-accelerated dataframes", "vectorized preprocessing", "distributed training basics", "mixed precision FP16", "embedding pipelines"],
         ["UCS321", "UMA021", "UMA401"]),
        ("UCS664", "Conversational AI: Natural Language Processing", "EF_BASKET_09", 6, "PE-II", "2-0-2", 3.9, 7.0,
         ["HuggingFace", "PyTorch", "NVIDIA NeMo", "spaCy"],
         ["word embeddings Word2Vec/GloVe", "self-attention and Transformers", "sequence-to-sequence models", "named entity recognition", "dialogue state tracking"],
         ["UCS321", "UMA401", "UMA021"]),
        ("UCS749", "Conversational AI: Speech Processing & Synthesis", "EF_BASKET_09", 6, "PE-III", "2-0-2", 4.0, 7.5,
         ["NVIDIA NeMo ASR/TTS", "torchaudio", "Librosa", "PyTorch"],
         ["Mel-frequency cepstral coefficients", "CTC and Conformer ASR", "neural text-to-speech vocoders", "speaker diarization", "real-time streaming audio"],
         ["UCS321", "UMA021", "UMA401"]),
        ("UCS748", "Generative AI", "EF_BASKET_09", 7, "PE-IV", "2-0-2", 4.2, 8.0,
         ["PyTorch", "vLLM", "LangChain", "NVIDIA TensorRT-LLM"],
         ["autoregressive LLMs", "RLHF and DPO alignment", "Retrieval-Augmented Generation RAG", "LoRA/QLoRA parameter-efficient tuning", "diffusion models"],
         ["UCS321", "UMA021", "UMA401"]),

        # Basket 10: Robotics and Edge AI (NVIDIA Collaboration)
        ("UCS547", "Edge AI and Robotics: Accelerated Data Science", "EF_BASKET_10", 5, "PE-I", "2-0-2", 3.6, 6.5,
         ["NVIDIA Jetson", "CUDA", "Python", "TensorRT"],
         ["edge inference quantization INT8", "sensor data fusion", "GPU memory optimization", "real-time telemetry processing", "embedded Linux"],
         ["UCS321", "UCS303", "UES103"]),
        ("UCS668", "Edge AI and Robotics: Data Centre Vision", "EF_BASKET_10", 6, "PE-II", "2-0-2", 3.9, 7.0,
         ["NVIDIA DeepStream", "PyTorch", "OpenCV", "Triton Inference Server"],
         ["multi-stream video analytics", "3D object detection", "optical flow tracking", "vision model pruning", "high-throughput inference"],
         ["UCS321", "UMA021", "UCS301"]),
        ("UCS671", "Edge AI and Robotics: Embedded Vision", "EF_BASKET_10", 6, "PE-III", "2-0-2", 4.0, 7.5,
         ["ROS 2", "NVIDIA Isaac ROS", "C++", "TensorRT"],
         ["visual odometry SLAM", "depth estimation stereo vision", "edge neural accelerators", "hardware-in-the-loop perception", "low-latency control"],
         ["UCS303", "UES103", "UCS321"]),
        ("UCS760", "Edge AI and Robotics: Reinforcement Learning & Conversational AI", "EF_BASKET_10", 7, "PE-IV", "2-0-2", 4.2, 8.0,
         ["NVIDIA Isaac Gym", "PyTorch", "ROS 2", "Gymnasium"],
         ["Markov Decision Processes", "Deep Q-Networks and PPO", "sim-to-real transfer", "embodied multimodal agents", "robotic manipulation policies"],
         ["UCS321", "UMA401", "UMA021"]),

        # Basket 11: Cyber Forensics and Ethical Hacking (EC-Council, USA)
        ("UCS550", "Network Defence", "EF_BASKET_11", 5, "PE-I", "2-0-2", 3.3, 6.0,
         ["pfSense", "Zeek", "Suricata", "Splunk SIEM"],
         ["perimeter defense architecture", "zero-trust network segmentation", "VPN andbastion hardening", "SIEM log correlation", "incident containment"],
         ["UCS414", "UCS303"]),
        ("UCS673", "Ethical Hacking-1", "EF_BASKET_11", 6, "PE-II", "2-0-2", 3.6, 6.5,
         ["Kali Linux", "Nmap", "Metasploit", "Burp Suite"],
         ["reconnaissance and footprinting", "vulnerability enumeration", "system privilege escalation", "active directory attacks", "MITRE ATT&CK framework"],
         ["UCS414", "UCS303", "UES103"]),
        ("UCS674", "Ethical Hacking-II", "EF_BASKET_11", 6, "PE-III", "2-0-2", 3.8, 7.0,
         ["Burp Suite Pro", "Ghidra", "Frida", "OWASP Testing Guide"],
         ["web application penetration testing", "wireless and IoT exploitation", "reverse engineering binaries", "exploit development", "red team operations"],
         ["UCS414", "UCS303", "UES103"]),
        ("UCS750", "Computer Hacking and Forensic Investigation", "EF_BASKET_11", 7, "PE-IV", "2-0-2", 3.7, 6.5,
         ["EnCase", "Autopsy", "Volatility 3", "Wireshark"],
         ["anti-forensics detection", "malware static/dynamic triage", "cloud & mobile forensics", "dark web threat intelligence", "expert witness reporting"],
         ["UCS414", "UCS303", "UCS310"]),

        # Basket 12: Intelligent Transport Systems
        ("UEC646", "Network and Communication for Connected Vehicles", "EF_BASKET_12", 5, "PE-I", "3-0-0", 3.3, 5.5,
         ["OMNeT++", "SUMO", "VEINS", "Python"],
         ["V2V and V2X communication", "IEEE 802.11p DSRC", "Cellular-V2X 5G NR", "CAN bus automotive protocols", "vehicular ad-hoc networks VANET"],
         ["UCS414", "UCS303"]),
        ("UCS678", "Intelligent Transportation Systems", "EF_BASKET_12", 6, "PE-II", "3-0-0", 3.2, 5.5,
         ["SUMO Traffic Simulator", "Python", "GeoPandas", "PostGIS"],
         ["adaptive traffic signal control", "smart mobility architecture", "spatio-temporal trajectory modeling", "autonomous fleet routing", "digital twins"],
         ["UCS415", "UCS321", "UCS414"]),
        ("UCS679", "Data Analytics in Automobile Engineering", "EF_BASKET_12", 6, "PE-III", "3-0-0", 3.4, 6.0,
         ["Python", "Scikit-Learn", "PySpark", "InfluxDB"],
         ["predictive maintenance telemetry", "EV battery state-of-health estimation", "driver behavior profiling", "sensor time-series anomaly detection", "CAN log analytics"],
         ["UMA401", "UCS321", "UCS310"]),
        ("UCS780", "Cyber Security for Mobility Systems", "EF_BASKET_12", 7, "PE-IV", "3-0-0", 3.6, 6.0,
         ["Wireshark CAN", "Scapy", "OpenSSL", "ISO/SAE 21434 Tools"],
         ["in-vehicle network intrusion detection", "ECU firmware attestation", "V2X PKI certificate security", "GNSS spoofing resilience", "ISO/SAE 21434 compliance"],
         ["UCS414", "UCS303", "UCS405"]),
    ]

    professional_electives: List[Dict[str, Any]] = []
    for (
        code,
        title,
        basket_id,
        sem,
        slot,
        ltp,
        diff,
        effort,
        tech_stack,
        keywords,
        prereqs,
    ) in pe_raw_specs:
        l_h, t_h, p_h = [int(x) for x in ltp.split("-")]
        professional_electives.append(
            {
                "course_code": code,
                "title": title,
                "category": "PROFESSIONAL_ELECTIVE",
                "basket_id": basket_id,
                "elective_slot": slot,
                "semester": sem,
                "ltp": ltp,
                "lecture_hours": l_h,
                "tutorial_hours": t_h,
                "practical_hours": p_h,
                "credits": 3.0,
                **default_eval,
                "seat_capacity": 120,
                "difficulty_index": diff,
                "weekly_self_effort_hours": effort,
                "prerequisites": prereqs,
                "lab_tech_stack": tech_stack,
                "syllabus_keywords": keywords,
                "clos": [
                    f"CLO1: Master core theoretical principles and architectural patterns of {title}.",
                    f"CLO2: Design, implement, and benchmark production solutions using {', '.join(tech_stack[:2])}.",
                    f"CLO3: Evaluate system trade-offs, scalability, and real-world engineering constraints in {title}.",
                ],
            }
        )

    # -------------------------------------------------------------------------
    # C. All 10 Official Semester V Generic Electives (2-0-0, 2.0 Credits)
    # -------------------------------------------------------------------------
    ge_raw_specs: List[Tuple[str, str, float, float, List[str], List[str]]] = [
        ("UHU016", "Introductory Course in French", 2.1, 3.0,
         ["Language Lab Audio Suite", "CEFR A1 Modules"],
         ["French phonetics", "basic conversational grammar", "Francophone culture", "reading comprehension"]),
        ("UHU017", "Introduction to Cognitive Science", 2.5, 3.5,
         ["PsychoPy", "Cognitive Modeling Cases"],
         ["human perception", "memory and attention", "decision making heuristics", "computational mind models"]),
        ("UHU018", "Introduction to Corporate Finance", 2.7, 4.0,
         ["Excel Financial Analysis", "Bloomberg Case Studies"],
         ["capital budgeting", "financial ratios", "working capital management", "corporate governance"]),
        ("UCS002", "Introduction to Cyber Security", 2.6, 3.8,
         ["Cyber Hygiene Toolkit", "OWASP Top 10 Sandbox"],
         ["cyber threat landscape", "password and MFA hygiene", "phishing defense", "data privacy regulations"]),
        ("UPH064", "Nanoscience and Nanomaterials", 2.9, 4.2,
         ["Nanomaterial Characterization Cases", "XRD/SEM Simulation"],
         ["quantum confinement", "carbon nanotubes", "thin film synthesis", "nanoelectronics applications"]),
        ("UEN006", "Technologies for Sustainable Development", 2.3, 3.2,
         ["Life Cycle Assessment LCA Tools", "Renewable Energy Sim"],
         ["circular economy", "solar and hydrogen energy", "carbon footprint mitigation", "green engineering"]),
        ("UMA069", "Graph Theory and Applications", 3.1, 4.5,
         ["Python NetworkX", "GraphViz"],
         ["planar graphs", "Eulerian and Hamiltonian paths", "graph coloring", "matching and network flows"]),
        ("UBT510", "Biology for Engineers", 2.4, 3.4,
         ["NCBI BLAST", "BioPython Basics"],
         ["central dogma molecular biology", "biosensors", "biomimetics", "genomic sequence alignment"]),
        ("UMA070", "Advanced Numerical Methods", 3.2, 4.6,
         ["MATLAB", "Python SciPy"],
         ["finite difference PDE solvers", "Runge-Kutta boundary value problems", "spline interpolation", "numerical quadrature"]),
        ("UTD004", "Campus 2 Corporate", 2.0, 2.8,
         ["Executive Communication Studio", "Case Interview Framework"],
         ["executive communication", "agile workplace readiness", "stakeholder negotiation", "leadership ethics"]),
    ]

    generic_electives: List[Dict[str, Any]] = []
    for code, title, diff, effort, tech_stack, keywords in ge_raw_specs:
        generic_electives.append(
            {
                "course_code": code,
                "title": title,
                "category": "GENERIC_ELECTIVE",
                "basket_id": "GENERIC_SEM5",
                "elective_slot": "GE-SEM5",
                "semester": 5,
                "ltp": "2-0-0",
                "lecture_hours": 2,
                "tutorial_hours": 0,
                "practical_hours": 0,
                "credits": 2.0,
                **default_eval,
                "seat_capacity": 120,
                "difficulty_index": diff,
                "weekly_self_effort_hours": effort,
                "prerequisites": [],
                "lab_tech_stack": tech_stack,
                "syllabus_keywords": keywords,
                "clos": [
                    f"CLO1: Understand foundational interdisciplinary concepts in {title}.",
                    f"CLO2: Apply analytical frameworks from {title} to cross-functional engineering contexts.",
                ],
            }
        )

    all_courses = core_courses + professional_electives + generic_electives

    metadata = {
        "dataset_type": "synthetic_statistically_correlated",
        "curriculum": "TIET B.E. CSE 2026",
        "total_students": 3500,
        "total_enrollments": 17500,
        "disclosure": "Generated for academic benchmarking and system verification",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "evaluation_protocol": "Leave-Students-Out (80% Train / 10% Val / 10% Test)",
    }

    return {
        "institution": "Thapar Institute of Engineering & Technology (TIET)",
        "program": "B.E. Computer Science and Engineering (2026 Scheme)",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata,
        "counts": {
            "core_courses": len(core_courses),
            "elective_focus_baskets": len(elective_baskets),
            "professional_electives": len(professional_electives),
            "generic_electives": len(generic_electives),
            "total_courses": len(all_courses),
        },
        "core_courses": core_courses,
        "elective_focus_baskets": elective_baskets,
        "professional_electives": professional_electives,
        "generic_electives": generic_electives,
        "all_courses": all_courses,
    }


# Realistic student archetypes driving non-uniform elective market demand & domain specialization
# Real-world Thapar CSE preferences: High demand for AIML, Data Science, Full-Stack Cloud, and Cyber Security
STUDENT_ARCHETYPES: List[Dict[str, Any]] = [
    {
        "name": "AI_DATA_SCIENCE",
        "weight": 0.34,  # AI/ML ~18.5%, Data Science ~15.5%
        "baskets": ["EF_BASKET_05", "EF_BASKET_09"],
        "basket_weights": [0.544, 0.456],
        "career_tracks": ["Data Scientist", "Machine Learning Engineer", "Generative AI & LLM Engineer"],
        "skills_pool": ["Python", "PyTorch", "Scikit-Learn", "Pandas", "SQL", "HuggingFace", "CUDA"],
        "interests": [
            "Deep learning, transformer architectures, predictive analytics, and large language models",
            "Statistical modeling, computer vision, natural language processing, and generative AI pipelines",
        ],
        "preferred_ge": ["UMA069", "UMA070", "UHU017"],
        "core_boosts": {"UCS321": 1.4, "UMA401": 1.3, "UMA021": 1.2, "UCS415": 1.1, "UCS301": 0.9, "UCS310": 0.6},
    },
    {
        "name": "FULL_STACK_CLOUD",
        "weight": 0.24,  # Full-Stack Web ~14.5%, Cloud DevOps ~9.5%
        "baskets": ["EF_BASKET_08", "EF_BASKET_07"],
        "basket_weights": [0.604, 0.396],
        "career_tracks": ["Full-Stack Software Engineer", "Data & Database Platform Engineer", "Cloud Product Engineer", "DevOps & SRE Specialist"],
        "skills_pool": ["TypeScript", "React", "Node.js", "PostgreSQL", "MongoDB", "Redis", "Docker", "Playwright", "Kubernetes", "AWS"],
        "interests": [
            "Full-stack web engineering, scalable database design, UI/UX systems, and cloud-native microservices",
            "Cloud computing, CI/CD pipelines, distributed databases, automated testing, and enterprise SaaS architecture",
        ],
        "preferred_ge": ["UTD004", "UHU018", "UHU016", "UEN006"],
        "core_boosts": {"UTA018": 1.4, "UCS310": 1.3, "UCS301": 1.1, "UCS415": 1.0, "UCS414": 0.9, "UCS303": 0.8},
    },
    {
        "name": "CYBER_SECURITY_BLOCKCHAIN",
        "weight": 0.15,  # Cyber Security ~12.5%, Blockchain ~2.5%
        "baskets": ["EF_BASKET_03", "EF_BASKET_11"],
        "basket_weights": [0.833, 0.167],
        "career_tracks": ["Cybersecurity Architect", "Penetration Tester & Red Team Specialist", "Digital Forensics Investigator", "Blockchain Protocol Engineer"],
        "skills_pool": ["Kali Linux", "Wireshark", "Burp Suite", "Python", "C", "OpenSSL", "Solidity", "Splunk", "Rust"],
        "interests": [
            "Network security, ethical hacking, penetration testing, zero-trust defense, and digital forensics",
            "Secure coding, vulnerability research, cryptography, blockchain security, and smart contract auditing",
        ],
        "preferred_ge": ["UCS002", "UMA069", "UTD004"],
        "core_boosts": {"UCS414": 1.5, "UCS303": 1.2, "UCS415": 1.0, "UES103": 0.9, "UCS405": 0.9},
    },
    {
        "name": "QUANT_MATH_FINANCE",
        "weight": 0.11,  # FinTech ~8.0%, Math & Computing ~3.0%
        "baskets": ["EF_BASKET_06", "EF_BASKET_04"],
        "basket_weights": [0.727, 0.273],
        "career_tracks": ["Quantitative Trader & Derivatives Analyst", "Quantitative Researcher", "Algorithm & Quantum Computing Scientist"],
        "skills_pool": ["Python", "C++", "QuantLib", "NumPy", "R", "Qiskit", "MATLAB", "Stochastic Calculus"],
        "interests": [
            "Quantitative finance, derivatives pricing, stochastic calculus, portfolio optimization, and algorithmic trading",
            "Computational linear algebra, quantum computing algorithms, cryptography, and mathematical modeling",
        ],
        "preferred_ge": ["UHU018", "UMA070", "UMA069"],
        "core_boosts": {"UMA021": 1.5, "UMA401": 1.5, "UMA022": 1.3, "UMA023": 1.3, "UCS415": 1.2, "UCS405": 1.0},
    },
    {
        "name": "SYSTEMS_HPC",
        "weight": 0.05,  # HPC ~5.0%
        "baskets": ["EF_BASKET_01"],
        "basket_weights": [1.0],
        "career_tracks": ["HPC & Systems Engineer", "GPU Computing Engineer", "Distributed Systems Infrastructure Architect"],
        "skills_pool": ["C++", "C", "CUDA", "MPI", "OpenMP", "Linux Kernel", "Go", "Docker"],
        "interests": [
            "GPU parallelism, CUDA kernels, supercomputing clusters, and high-throughput low-latency systems",
            "Linux kernel internals, memory cache hierarchy, distributed consensus, and micro-benchmarking",
        ],
        "preferred_ge": ["UMA070", "UCS002", "UEN006"],
        "core_boosts": {"UCS303": 1.5, "UCS415": 1.3, "UCS301": 1.2, "UMA021": 1.1, "UES103": 1.0},
    },
    {
        "name": "VISION_GAMING_XR",
        "weight": 0.045,  # Animation & Gaming ~4.5%
        "baskets": ["EF_BASKET_02"],
        "basket_weights": [1.0],
        "career_tracks": ["Computer Vision & Graphics Engineer", "Game Engine & AR/VR Developer", "Interactive Media Engineer"],
        "skills_pool": ["C++", "C#", "Unity 3D", "Unreal Engine", "OpenCV", "OpenGL", "GLSL", "Blender"],
        "interests": [
            "Computer vision, 3D graphics rendering, game engine physics, and augmented/virtual reality experiences",
            "Interactive simulation, shader programming, spatial computing, and real-time 3D animation",
        ],
        "preferred_ge": ["UHU017", "UPH064", "UHU016"],
        "core_boosts": {"UTA018": 1.3, "UCS301": 1.1, "UMA021": 1.1, "UCS321": 1.0, "UES103": 0.9},
    },
    {
        "name": "ROBOTICS_EDGE_IOT",
        "weight": 0.065,  # Robotics ~4.5%, Edge IoT ~2.0%
        "baskets": ["EF_BASKET_10", "EF_BASKET_12"],
        "basket_weights": [0.692, 0.308],
        "career_tracks": ["Robotics & Autonomous Systems Engineer", "Edge AI & Embedded Vision Engineer", "Connected Mobility & IoT Architect"],
        "skills_pool": ["ROS 2", "C++", "Python", "NVIDIA Jetson", "OpenCV", "TensorRT", "Embedded C", "MQTT"],
        "interests": [
            "Autonomous robotics, embedded edge AI vision, reinforcement learning, and sensor fusion on NVIDIA Jetson",
            "Internet of Things sensor telemetry, connected vehicle communication, and automotive firmware engineering",
        ],
        "preferred_ge": ["UPH064", "UEN006", "UBT510"],
        "core_boosts": {"UCS321": 1.2, "UCS303": 1.2, "UCS414": 1.1, "UCS415": 1.0, "UES103": 1.0},
    },
]


def generate_students_and_enrollments(
    catalog: Dict[str, Any],
    num_students: int = 3500,
    seed: int = 42,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generate 3,500 realistic TIET CSE students and ~17,500 historical elective enrollment records
    with strong latent mathematical & prerequisite correlations.
    """
    rng = random.Random(seed)

    baskets_by_id = {b["basket_id"]: b for b in catalog["elective_focus_baskets"]}
    courses_by_code = {c["course_code"]: c for c in catalog["all_courses"]}
    ge_codes = [c["course_code"] for c in catalog["generic_electives"]]

    archetype_weights = [a["weight"] for a in STUDENT_ARCHETYPES]
    batch_years = [2020, 2021, 2022]

    students: List[Dict[str, Any]] = []
    enrollments: List[Dict[str, Any]] = []

    for idx in range(1, num_students + 1):
        batch_year = batch_years[(idx - 1) % len(batch_years)]
        # Official Thapar B.E. CSE Roll Number format: 102<Y>03<XXXX> (e.g., 1022030001)
        yy_suffix = str(batch_year)[-2:]
        roll_no = f"10{yy_suffix}03{idx:04d}"
        student_id = f"STU_{roll_no}"

        archetype = rng.choices(STUDENT_ARCHETYPES, weights=archetype_weights, k=1)[0]

        # Base academic ability ~ Truncated Normal(7.65, 0.95) in [5.5, 9.9]
        base_ability = rng.gauss(7.65, 0.95)
        base_ability = max(5.55, min(9.85, base_ability))

        # Latent domain aptitudes with covariance to foundational courses
        prog_mastery = max(5.0, min(10.0, base_ability + archetype["core_boosts"].get("UES103", 0.0) * 0.4 + rng.gauss(0.0, 0.45)))
        math_mastery = max(5.0, min(10.0, base_ability + archetype["core_boosts"].get("UMA022", 0.0) * 0.4 + rng.gauss(0.0, 0.45)))
        systems_mastery = max(5.0, min(10.0, base_ability + archetype["core_boosts"].get("UCS303", 0.0) * 0.4 + rng.gauss(0.0, 0.45)))

        # Generate Sem I-IV Core Course Grade Points (with authentic prerequisite & domain covariance)
        core_grades: Dict[str, int] = {}

        def _calc_core(code: str, latent_val: float, boost_key: str, prereq_val: Optional[float] = None) -> int:
            c_meta = courses_by_code[code]
            diff_penalty = (c_meta["difficulty_index"] - 3.2) * 3.5
            boost = archetype["core_boosts"].get(boost_key, 0.0) * 4.2
            if prereq_val is not None:
                latent_drive = 0.55 * (latent_val * 9.2) + 0.45 * (prereq_val * 9.2)
            else:
                latent_drive = latent_val * 9.2
            raw = latent_drive + boost - diff_penalty + rng.gauss(0.0, 4.0)
            _, gp = marks_to_tiet_grade(max(38.0, min(99.0, raw)))
            return gp

        # Semester 1 & 2 Foundational courses
        core_grades["UES103"] = _calc_core("UES103", prog_mastery, "UES103")
        core_grades["UMA022"] = _calc_core("UMA022", math_mastery, "UMA022")
        core_grades["UMA023"] = _calc_core("UMA023", math_mastery, "UMA023", prereq_val=core_grades["UMA022"])

        # Semester 3 Courses (covariance with Sem 1-2 foundations)
        core_grades["UCS301"] = _calc_core("UCS301", prog_mastery, "UCS301", prereq_val=core_grades["UES103"])
        core_grades["UCS303"] = _calc_core("UCS303", systems_mastery, "UCS303", prereq_val=core_grades["UES103"])
        core_grades["UTA018"] = _calc_core("UTA018", prog_mastery, "UTA018", prereq_val=core_grades["UES103"])

        # Semester 4 Courses (strong covariance with Sem 3 & Sem 1-2 math/coding foundations)
        core_grades["UCS405"] = _calc_core("UCS405", math_mastery, "UCS405", prereq_val=core_grades["UMA022"])
        core_grades["UMA021"] = _calc_core("UMA021", math_mastery, "UMA021", prereq_val=(core_grades["UMA022"] + core_grades["UMA023"]) / 2.0)
        core_grades["UCS415"] = _calc_core("UCS415", prog_mastery, "UCS415", prereq_val=(core_grades["UCS301"] * 0.6 + core_grades["UMA022"] * 0.4))
        core_grades["UCS310"] = _calc_core("UCS310", prog_mastery, "UCS310", prereq_val=core_grades["UCS301"])
        core_grades["UCS414"] = _calc_core("UCS414", systems_mastery, "UCS414", prereq_val=core_grades["UCS303"])
        core_grades["UCS321"] = _calc_core("UCS321", prog_mastery, "UCS321", prereq_val=(core_grades["UCS301"] * 0.5 + core_grades["UMA021"] * 0.5))
        core_grades["UMA401"] = _calc_core("UMA401", math_mastery, "UMA401", prereq_val=(core_grades["UMA022"] * 0.5 + core_grades["UMA021"] * 0.5))

        weighted_sum = sum(core_grades[c] * courses_by_code[c]["credits"] for c in CORE_PREREQUISITE_CODES)
        total_credits = sum(courses_by_code[c]["credits"] for c in CORE_PREREQUISITE_CODES)
        cgpa_sem4 = round(max(5.50, min(9.90, weighted_sum / total_credits)), 2)

        # Compute Coding Profile Score (0-100) and Math Aptitude Score (0-100) from core performance
        coding_core_avg = (
            core_grades["UES103"] * 0.20
            + core_grades["UCS301"] * 0.30
            + core_grades["UTA018"] * 0.20
            + core_grades["UCS415"] * 0.30
        )
        math_core_avg = (
            core_grades["UMA022"] * 0.15
            + core_grades["UMA023"] * 0.15
            + core_grades["UCS405"] * 0.20
            + core_grades["UMA021"] * 0.25
            + core_grades["UMA401"] * 0.25
        )

        coding_profile_score = round(
            max(35.0, min(99.5, coding_core_avg * 9.5 + rng.gauss(0.0, 3.5))), 1
        )
        math_aptitude_score = round(
            max(35.0, min(99.5, math_core_avg * 9.5 + rng.gauss(0.0, 3.5))), 1
        )

        # Non-uniform basket assignment reflecting real-world Thapar CSE elective demand
        basket_weights = archetype.get("basket_weights", [1.0] * len(archetype["baskets"]))
        chosen_basket_id = rng.choices(archetype["baskets"], weights=basket_weights, k=1)[0]
        # 82% choose archetype-aligned Generic Elective, 18% explore other Generic Electives
        if rng.random() < 0.82:
            chosen_ge = rng.choice(archetype["preferred_ge"])
        else:
            chosen_ge = rng.choice(ge_codes)

        preferred_career_track = rng.choice(archetype["career_tracks"])
        k_skills = rng.randint(4, min(6, len(archetype["skills_pool"])))
        technical_skills = rng.sample(archetype["skills_pool"], k=k_skills)
        interests_text = rng.choice(archetype["interests"])

        # Determine placement tier correlated with CGPA, coding score, and math aptitude
        composite_merit = cgpa_sem4 * 0.55 + (coding_profile_score / 10.0) * 0.25 + (math_aptitude_score / 10.0) * 0.20
        if composite_merit >= 8.55:
            placement_tier = "Super-Dream" if rng.random() < 0.78 else "Higher-Studies"
        elif composite_merit >= 7.55:
            placement_tier = "Dream" if rng.random() < 0.80 else "Higher-Studies"
        else:
            placement_tier = "Core" if rng.random() < 0.75 else "Dream"

        student_record: Dict[str, Any] = {
            "student_id": student_id,
            "roll_no": roll_no,
            "batch_year": batch_year,
            "cgpa_sem4": cgpa_sem4,
            **core_grades,
            "coding_profile_score": coding_profile_score,
            "math_aptitude_score": math_aptitude_score,
            "preferred_career_track": preferred_career_track,
            "technical_skills": technical_skills,
            "interests_text": interests_text,
            "chosen_basket_id": chosen_basket_id,
            "chosen_generic_elective": chosen_ge,
            "placement_tier": placement_tier,
        }
        students.append(student_record)

        # ---------------------------------------------------------------------
        # Generate 5 Elective Enrollments per Student (PE-I, PE-II, PE-III, PE-IV + GE-SEM5)
        # 3,500 * 5 = 17,500 enrollment records
        # ---------------------------------------------------------------------
        basket_obj = baskets_by_id[chosen_basket_id]
        seq = basket_obj["elective_sequence"]
        selected_pe_codes = [
            rng.choice(seq["PE-I"]),
            rng.choice(seq["PE-II"]),
            rng.choice(seq["PE-III"]),
            rng.choice(seq["PE-IV"]),
        ]

        enrolled_course_codes = selected_pe_codes + [chosen_ge]
        for c_code in enrolled_course_codes:
            c_meta = courses_by_code[c_code]
            prereqs = c_meta.get("prerequisites", [])
            if prereqs:
                prereq_avg_gp = sum(core_grades.get(p, cgpa_sem4) for p in prereqs) / len(prereqs)
            else:
                prereq_avg_gp = cgpa_sem4

            # Domain foundational pillar score driving realistic elective covariance
            c_basket = str(c_meta.get("basket_id", ""))
            if c_basket in ("EF_BASKET_05", "EF_BASKET_09") or c_code in ("UMA069", "UMA070"):
                domain_pillar = 0.35 * core_grades["UCS321"] + 0.30 * core_grades["UMA401"] + 0.20 * core_grades["UMA021"] + 0.15 * core_grades["UCS415"]
            elif c_basket in ("EF_BASKET_01", "EF_BASKET_07", "EF_BASKET_03", "EF_BASKET_12") or c_code == "UCS002":
                domain_pillar = 0.35 * core_grades["UCS303"] + 0.25 * core_grades["UCS414"] + 0.25 * core_grades["UCS415"] + 0.15 * core_grades["UCS301"]
            elif c_basket in ("EF_BASKET_08", "EF_BASKET_11"):
                domain_pillar = 0.35 * core_grades["UCS310"] + 0.30 * core_grades["UTA018"] + 0.20 * core_grades["UCS301"] + 0.15 * core_grades["UCS415"]
            elif c_basket in ("EF_BASKET_04", "EF_BASKET_06") or c_code == "UHU018":
                domain_pillar = 0.35 * core_grades["UMA021"] + 0.35 * core_grades["UMA401"] + 0.15 * core_grades["UMA022"] + 0.15 * core_grades["UCS415"]
            elif c_basket in ("EF_BASKET_02", "EF_BASKET_10"):
                domain_pillar = 0.30 * core_grades["UCS321"] + 0.25 * core_grades["UCS303"] + 0.25 * core_grades["UCS301"] + 0.20 * core_grades["UMA021"]
            else:
                domain_pillar = (core_grades["UCS301"] + core_grades["UMA022"] + core_grades["UCS415"] + core_grades["UMA021"] + core_grades["UCS321"]) / 5.0

            # Alignment bonus when student takes courses matching their archetype basket
            alignment_bonus = 3.5 if c_meta.get("basket_id") in archetype["baskets"] else 1.5
            diff_index = c_meta["difficulty_index"]

            # Expected score out of 100 driven by prerequisite covariance, domain pillar mastery, CGPA, and aptitudes
            expected_score_100 = (
                (prereq_avg_gp * 10.0) * 0.30
                + (domain_pillar * 10.0) * 0.28
                + (cgpa_sem4 * 10.0) * 0.20
                + (coding_profile_score * 0.08)
                + (math_aptitude_score * 0.08)
                + alignment_bonus
                - (diff_index - 3.0) * 4.0
                + rng.gauss(0.0, 3.2)
            )
            clamped_score_100 = max(36.0, min(98.5, expected_score_100))

            # Split into MST (out of 30), EST (out of 45), Sessional (out of 30)
            ratio = clamped_score_100 / 100.0
            mst_score = round(max(8.0, min(30.0, 30.0 * ratio + rng.gauss(0.0, 1.4))), 1)
            est_score = round(max(12.0, min(45.0, 45.0 * ratio + rng.gauss(0.0, 2.0))), 1)
            sessional_score = round(max(10.0, min(30.0, 30.0 * ratio + rng.gauss(0.0, 1.2))), 1)

            # Weighted total out of 100 using TIET evaluation weights (28% MST, 42% EST, 30% Sessional)
            weighted_total = round(
                (mst_score / 30.0) * 28.0
                + (est_score / 45.0) * 42.0
                + (sessional_score / 30.0) * 30.0,
                2,
            )
            letter_grade, final_gp = marks_to_tiet_grade(weighted_total)

            # Weekly workload hours correlated with course base self-effort + difficulty - student readiness
            base_effort = c_meta["weekly_self_effort_hours"] + c_meta["lecture_hours"] + c_meta["practical_hours"]
            readiness_offset = (prereq_avg_gp - 7.5) * -0.45
            workload_hours = round(
                max(3.5, min(18.0, base_effort + readiness_offset + rng.gauss(0.0, 0.8))),
                1,
            )

            # Satisfaction & Career relevance ratings (1.0 - 5.0)
            satisfaction = round(
                max(
                    1.5,
                    min(
                        5.0,
                        3.4
                        + (final_gp - 7.0) * 0.28
                        + (0.35 if c_meta.get("basket_id") in archetype["baskets"] else 0.0)
                        + rng.gauss(0.0, 0.25),
                    ),
                ),
                2,
            )
            career_relevance = round(
                max(
                    2.0,
                    min(
                        5.0,
                        4.15
                        if c_meta["category"] == "PROFESSIONAL_ELECTIVE"
                        else 3.45
                        + (final_gp - 7.5) * 0.15
                        + rng.gauss(0.0, 0.22),
                    ),
                ),
                2,
            )

            enrollments.append(
                {
                    "enrollment_id": f"{student_id}_{c_code}",
                    "student_id": student_id,
                    "roll_no": roll_no,
                    "course_code": c_code,
                    "course_title": c_meta["title"],
                    "category": c_meta["category"],
                    "elective_slot": c_meta.get("elective_slot", "CORE"),
                    "basket_id": c_meta.get("basket_id", "CORE"),
                    "semester": c_meta["semester"],
                    "mst_score": mst_score,
                    "est_score": est_score,
                    "sessional_score": sessional_score,
                    "total_marks": weighted_total,
                    "letter_grade": letter_grade,
                    "final_grade_point": final_gp,
                    "workload_hours_per_week": workload_hours,
                    "student_satisfaction_rating": satisfaction,
                    "career_relevance_score": career_relevance,
                }
            )

    return students, enrollments


def write_processed_artifacts(
    output_dir: Path,
    catalog: Dict[str, Any],
    students: List[Dict[str, Any]],
    enrollments: List[Dict[str, Any]],
) -> Dict[str, Path]:
    """Write courses_catalog.json, students_historical.csv, and enrollments_ratings.csv to ml-service/data/processed/."""
    output_dir.mkdir(parents=True, exist_ok=True)

    catalog_path = output_dir / "courses_catalog.json"
    students_csv_path = output_dir / "students_historical.csv"
    enrollments_csv_path = output_dir / "enrollments_ratings.csv"

    with catalog_path.open("w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    logger.info("Saved %s (%d total courses, %d EF baskets)", catalog_path, len(catalog["all_courses"]), len(catalog["elective_focus_baskets"]))

    student_fieldnames = [
        "student_id",
        "roll_no",
        "batch_year",
        "cgpa_sem4",
        *CORE_PREREQUISITE_CODES,
        "coding_profile_score",
        "math_aptitude_score",
        "preferred_career_track",
        "technical_skills",
        "interests_text",
        "chosen_basket_id",
        "chosen_generic_elective",
        "placement_tier",
    ]
    with students_csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=student_fieldnames)
        writer.writeheader()
        for s in students:
            row = dict(s)
            row["technical_skills"] = json.dumps(s["technical_skills"])
            writer.writerow(row)
    logger.info("Saved %s (%d historical TIET student profiles)", students_csv_path, len(students))

    enrollment_fieldnames = [
        "enrollment_id",
        "student_id",
        "roll_no",
        "course_code",
        "course_title",
        "category",
        "elective_slot",
        "basket_id",
        "semester",
        "mst_score",
        "est_score",
        "sessional_score",
        "total_marks",
        "letter_grade",
        "final_grade_point",
        "workload_hours_per_week",
        "student_satisfaction_rating",
        "career_relevance_score",
    ]
    with enrollments_csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=enrollment_fieldnames)
        writer.writeheader()
        writer.writerows(enrollments)
    logger.info("Saved %s (%d historical student-elective records)", enrollments_csv_path, len(enrollments))

    return {
        "catalog_json": catalog_path,
        "students_csv": students_csv_path,
        "enrollments_csv": enrollments_csv_path,
    }


def _safe_create_index(col: Any, keys: Any, **kwargs: Any) -> None:
    """Create an index ignoring key spec conflicts if index already exists with equivalent keys."""
    try:
        col.create_index(keys, **kwargs)
    except Exception as exc:
        logger.debug("Index on %s already exists or matches existing spec: %s", col.name, exc)


def _chunked_bulk_upsert(collection: Any, operations: List[UpdateOne], batch_size: int = 1000) -> Tuple[int, int]:
    """Execute idempotent bulk UpdateOne(..., upsert=True) operations in batches."""
    upserted = 0
    modified = 0
    for i in range(0, len(operations), batch_size):
        batch = operations[i : i + batch_size]
        result = collection.bulk_write(batch, ordered=False)
        upserted += result.upserted_count
        modified += result.modified_count
    return upserted, modified


def sync_to_mongodb_atlas(
    mongodb_uri: str,
    db_name: str,
    catalog: Dict[str, Any],
    students: List[Dict[str, Any]],
    enrollments: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Idempotently bulk-upsert courses, elective_focus_baskets, historical_students,
    and historical_enrollments into remote MongoDB Atlas via pymongo.MongoClient.
    Enforces strict Zero-Localhost policy (mongodb+srv://).
    """
    if not MONGO_SRV_REGEX.match(mongodb_uri.strip()):
        raise ValueError(
            "Strict Cloud Policy Violation: MONGODB_URI must use 'mongodb+srv://' pointing to a remote MongoDB Atlas cluster (localhost/127.0.0.1 is forbidden)."
        )

    logger.info("Connecting to remote MongoDB Atlas cluster (database: '%s')...", db_name)
    client: MongoClient = MongoClient(
        mongodb_uri,
        maxPoolSize=30,
        minPoolSize=5,
        serverSelectionTimeoutMS=10000,
        socketTimeoutMS=45000,
        retryWrites=True,
        w="majority",
    )

    try:
        client.admin.command("ping")
        db = client[db_name]
        synced_at = datetime.now(timezone.utc).isoformat()

        # 1. Courses collection (`courses`)
        courses_col = db["courses"]
        # Safely clean any incomplete legacy documents lacking `courseCode`
        courses_col.delete_many({"$or": [{"courseCode": None}, {"courseCode": {"$exists": False}}]})
        _safe_create_index(courses_col, [("courseCode", ASCENDING)], unique=True)
        _safe_create_index(courses_col, [("course_code", ASCENDING)])
        _safe_create_index(courses_col, [("category", ASCENDING), ("semester", ASCENDING)])

        course_ops = [
            UpdateOne(
                {"$or": [{"courseCode": c["course_code"]}, {"course_code": c["course_code"]}]},
                {
                    "$set": {
                        **c,
                        "courseCode": c["course_code"],
                        "course_code": c["course_code"],
                        "basketId": c.get("basket_id"),
                        "electiveSlot": c.get("elective_slot"),
                        "updated_at": synced_at,
                    }
                },
                upsert=True,
            )
            for c in catalog["all_courses"]
        ]
        c_upserted, c_modified = _chunked_bulk_upsert(courses_col, course_ops)
        logger.info("MongoDB Atlas `courses`: %d upserted, %d modified", c_upserted, c_modified)

        # 2. Elective Focus Baskets collections (`baskets` and `elective_baskets`)
        for col_name in ("baskets", "elective_baskets"):
            baskets_col = db[col_name]
            baskets_col.delete_many({"$or": [{"basketId": None}, {"basketId": {"$exists": False}}]})
            _safe_create_index(baskets_col, [("basketId", ASCENDING)], unique=True)
            _safe_create_index(baskets_col, [("basket_id", ASCENDING)])
            basket_ops = [
                UpdateOne(
                    {"$or": [{"basketId": b["basket_id"]}, {"basket_id": b["basket_id"]}]},
                    {
                        "$set": {
                            **b,
                            "basketId": b["basket_id"],
                            "basket_id": b["basket_id"],
                            "basketNumber": b.get("basket_number"),
                            "updated_at": synced_at,
                        }
                    },
                    upsert=True,
                )
                for b in catalog["elective_focus_baskets"]
            ]
            b_upserted, b_modified = _chunked_bulk_upsert(baskets_col, basket_ops)
            logger.info("MongoDB Atlas `%s`: %d upserted, %d modified", col_name, b_upserted, b_modified)

        # 3. Historical Students collection (`historical_students`)
        students_col = db["historical_students"]
        _safe_create_index(students_col, [("student_id", ASCENDING)], unique=True)
        _safe_create_index(students_col, [("roll_no", ASCENDING)], unique=True)
        _safe_create_index(students_col, [("chosen_basket_id", ASCENDING), ("cgpa_sem4", DESCENDING)])

        student_ops = [
            UpdateOne(
                {"student_id": s["student_id"]},
                {"$set": {**s, "updated_at": synced_at}},
                upsert=True,
            )
            for s in students
        ]
        s_upserted, s_modified = _chunked_bulk_upsert(students_col, student_ops, batch_size=1000)
        logger.info("MongoDB Atlas `historical_students`: %d upserted, %d modified", s_upserted, s_modified)

        # 4. Historical Enrollments collection (`historical_enrollments`)
        enrollments_col = db["historical_enrollments"]
        _safe_create_index(enrollments_col, [("enrollment_id", ASCENDING)], unique=True)
        _safe_create_index(enrollments_col, [("student_id", ASCENDING), ("semester", ASCENDING)])
        _safe_create_index(enrollments_col, [("course_code", ASCENDING), ("final_grade_point", DESCENDING)])

        enrollment_ops = [
            UpdateOne(
                {"enrollment_id": e["enrollment_id"]},
                {"$set": {**e, "updated_at": synced_at}},
                upsert=True,
            )
            for e in enrollments
        ]
        e_upserted, e_modified = _chunked_bulk_upsert(enrollments_col, enrollment_ops, batch_size=2000)
        logger.info("MongoDB Atlas `historical_enrollments`: %d upserted, %d modified", e_upserted, e_modified)

        # 5. Dataset Metadata collection (`dataset_metadata`)
        metadata_col = db["dataset_metadata"]
        _safe_create_index(metadata_col, [("dataset_type", ASCENDING)], unique=True)
        meta_dict = catalog.get("metadata", {
            "dataset_type": "synthetic_statistically_correlated",
            "curriculum": "TIET B.E. CSE 2026",
            "total_students": len(students),
            "total_enrollments": len(enrollments),
            "disclosure": "Generated for academic benchmarking and system verification",
            "evaluation_protocol": "Leave-Students-Out (80% Train / 10% Val / 10% Test)",
        })
        metadata_col.update_one(
            {"dataset_type": meta_dict["dataset_type"]},
            {"$set": {**meta_dict, "updated_at": synced_at}},
            upsert=True,
        )
        logger.info("MongoDB Atlas `dataset_metadata`: upserted record for '%s'", meta_dict["dataset_type"])

        return {
            "courses": {"upserted": c_upserted, "modified": c_modified, "total": len(course_ops)},
            "elective_baskets": {"upserted": b_upserted, "modified": b_modified, "total": len(basket_ops)},
            "historical_students": {"upserted": s_upserted, "modified": s_modified, "total": len(student_ops)},
            "historical_enrollments": {"upserted": e_upserted, "modified": e_modified, "total": len(enrollment_ops)},
            "dataset_metadata": {"status": "upserted", "type": meta_dict["dataset_type"]},
        }
    finally:
        client.close()


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate TIET B.E. CSE 2026 Dataset & Sync to MongoDB Atlas"
    )
    parser.add_argument(
        "--num-students",
        type=int,
        default=3500,
        help="Number of historical TIET CSE student profiles to generate (default: 3500)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Deterministic random seed (default: 42)",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(Path(__file__).resolve().parent / "processed"),
        help="Output directory for generated JSON/CSV artifacts",
    )
    parser.add_argument(
        "--sync-atlas",
        action="store_true",
        help="Bulk-upsert generated collections into remote MongoDB Atlas specified by MONGODB_URI",
    )
    parser.add_argument(
        "--db-name",
        type=str,
        default=os.environ.get("MONGODB_DB_NAME", "thapar_elective_ai"),
        help="Target MongoDB Atlas database name (default: thapar_elective_ai)",
    )
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> int:
    # Load environment variables from ml-service/.env or root .env if present
    service_root = Path(__file__).resolve().parent.parent
    repo_root = service_root.parent
    load_dotenv(service_root / ".env")
    load_dotenv(repo_root / ".env")

    args = parse_args(argv)
    output_dir = Path(args.output_dir)

    logger.info("Building official TIET B.E. CSE 2026 curriculum catalog...")
    catalog = build_courses_catalog()

    logger.info(
        "Generating %d historical TIET CSE students and %d elective enrollments (seed=%d)...",
        args.num_students,
        args.num_students * 5,
        args.seed,
    )
    students, enrollments = generate_students_and_enrollments(
        catalog=catalog,
        num_students=args.num_students,
        seed=args.seed,
    )

    write_processed_artifacts(
        output_dir=output_dir,
        catalog=catalog,
        students=students,
        enrollments=enrollments,
    )

    if args.sync_atlas:
        mongodb_uri = os.environ.get("MONGODB_URI", "").strip()
        if not mongodb_uri or "<db_username>" in mongodb_uri:
            logger.warning(
                "--sync-atlas requested, but MONGODB_URI is not set to a live Atlas credential in the environment. "
                "Processed artifacts have been generated in %s and are ready for Atlas upsert once MONGODB_URI is provided.",
                output_dir,
            )
            return 0

        summary = sync_to_mongodb_atlas(
            mongodb_uri=mongodb_uri,
            db_name=args.db_name,
            catalog=catalog,
            students=students,
            enrollments=enrollments,
        )
        logger.info("MongoDB Atlas Synchronization Complete: %s", json.dumps(summary))

    return 0


if __name__ == "__main__":
    sys.exit(main())

