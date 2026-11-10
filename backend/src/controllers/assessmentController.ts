import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../middlewares';
import { IDomainScores, IQuizResponseItem, SkillLevelType, User } from '../models';
import { MLGatewayService, recordAuditLog } from '../services';
import { serializeUser } from './authController';

export interface DiagnosticQuestion {
  id: string;
  domain: string;
  domainLabel: string;
  difficulty: 'Medium' | 'Hard';
  courseRef: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export const DIAGNOSTIC_QUESTION_BANK: DiagnosticQuestion[] = [
  {
    id: 'Q1_DSA_GRAPH',
    domain: 'Data Structures & Algorithms',
    domainLabel: 'Algorithms & Complexity (Big-O, DP, Graphs)',
    difficulty: 'Medium',
    courseRef: 'UCS301 / UCS415',
    question:
      'What is the tightest asymptotic time complexity of Dijkstra’s shortest-path algorithm on a sparse directed graph G=(V, E) with non-negative edge weights when implemented using a binary min-heap?',
    options: [
      'O(V²)',
      'O((V + E) log V)',
      'O(V · E)',
      'O(E log E + V²)',
    ],
    correctOptionIndex: 1,
    explanation:
      'With a binary min-heap priority queue, each of the V extract-min operations takes O(log V) and each of the E edge relaxations (decrease-key) takes O(log V), yielding O((V + E) log V).',
  },
  {
    id: 'Q2_DSA_DP',
    domain: 'Data Structures & Algorithms',
    domainLabel: 'Algorithms & Complexity (Big-O, DP, Graphs)',
    difficulty: 'Hard',
    courseRef: 'UCS415',
    question:
      'In the 0/1 Knapsack problem with N items and integer capacity W, why is the standard bottom-up dynamic programming algorithm O(N · W) classified as pseudo-polynomial time?',
    options: [
      'Because W is an input value whose bit-length is log₂(W), making O(N · W) exponential in the size of the encoded input.',
      'Because it uses randomized hashing for state transitions.',
      'Because it only approximates the optimal solution within a factor of (1 - ε).',
      'Because the space complexity cannot be reduced below O(N²).',
    ],
    correctOptionIndex: 0,
    explanation:
      'Polynomial time is measured relative to the bit-length of the input. Since representing integer W requires B = log₂(W) bits, N · W = N · 2^B, which is exponential in B.',
  },
  {
    id: 'Q3_MATH_EIGEN',
    domain: 'Math & Linear Algebra',
    domainLabel: 'Mathematics & Linear Algebra (Matrices, Eigenvalues, SVD, Probability)',
    difficulty: 'Medium',
    courseRef: 'UMA021 / UMA023',
    question:
      'If a real symmetric matrix A ∈ ℝ^(n×n) has eigenvalues λ₁ = 4, λ₂ = 2, and λ₃ = 0, which of the following statements about A and its Singular Value Decomposition (SVD) is guaranteed to be true?',
    options: [
      'A is positive definite and invertible with determinant 8.',
      'A is positive semi-definite with rank 2, and its non-zero singular values are σ₁ = 4 and σ₂ = 2.',
      'A has full column rank 3 and trace equal to 8.',
      'The eigenvectors corresponding to λ₁ = 4 and λ₂ = 2 are linearly dependent.',
    ],
    correctOptionIndex: 1,
    explanation:
      'All eigenvalues of symmetric matrix A are ≥ 0 with one zero eigenvalue, so A is positive semi-definite of rank 2, and for PSD matrices the singular values equal the eigenvalues (4, 2, 0).',
  },
  {
    id: 'Q4_MATH_PROB',
    domain: 'Math & Linear Algebra',
    domainLabel: 'Mathematics & Linear Algebra (Matrices, Eigenvalues, SVD, Probability)',
    difficulty: 'Hard',
    courseRef: 'UMA401',
    question:
      'In Bayesian inference for diagnostic anomaly detection, a rare defect occurs in 1% of packets (P(D)=0.01). A classifier has 99% sensitivity P(+|D)=0.99 and a 1% false-positive rate P(+|¬D)=0.01. Given a positive flag (+), what is the posterior probability P(D|+)?',
    options: [
      '99.0%',
      '98.0%',
      '50.0%',
      '19.8%',
    ],
    correctOptionIndex: 2,
    explanation:
      'By Bayes’ Theorem: P(D|+) = (0.99 × 0.01) / (0.99 × 0.01 + 0.01 × 0.99) = 0.0099 / 0.0198 = 0.50 (50.0%).',
  },
  {
    id: 'Q5_SYS_OS',
    domain: 'Systems & OS/Networks',
    domainLabel: 'Systems & Networks (Processes, Concurrency, TCP/IP, Memory)',
    difficulty: 'Medium',
    courseRef: 'UCS303',
    question:
      'Which of the चार Coffman conditions for deadlock is directly broken when an operating system enforces a strict global numbering of all lock types and requires threads to acquire locks only in strictly increasing order?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'No Preemption',
      'Circular Wait',
    ],
    correctOptionIndex: 3,
    explanation:
      'Imposing a total ordering on resource types and requiring acquisition in strictly ascending order makes a cycle in the resource-allocation graph mathematically impossible, breaking Circular Wait.',
  },
  {
    id: 'Q6_SYS_NET',
    domain: 'Systems & OS/Networks',
    domainLabel: 'Systems & Networks (Processes, Concurrency, TCP/IP, Memory)',
    difficulty: 'Medium',
    courseRef: 'UCS414',
    question:
      'During TCP congestion control (TCP Reno), how does the sender distinguish between mild network congestion and severe packet loss, and how does it adjust the congestion window (cwnd) upon receiving 3 duplicate ACKs?',
    options: [
      'It resets cwnd to 1 MSS and enters Slow Start immediately.',
      'It halves cwnd (ssthresh = cwnd/2, cwnd = ssthresh + 3 MSS) and performs Fast Retransmit / Fast Recovery without resetting cwnd to 1.',
      'It doubles cwnd exponentially to flush buffered segments.',
      'It closes the TCP socket and initiates a new 3-way SYN handshake.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Three duplicate ACKs indicate that segments are still arriving out-of-order, triggering Fast Retransmit & Fast Recovery (multiplicative decrease by half) rather than a full timeout reset to 1 MSS.',
  },
  {
    id: 'Q7_AI_GRAD',
    domain: 'AI & Machine Learning',
    domainLabel: 'AI & Machine Learning Basics (Gradient Descent, Loss Functions, Supervised vs. Unsupervised)',
    difficulty: 'Medium',
    courseRef: 'UCS321 / UML501',
    question:
      'When training a binary logistic regression classifier with sigmoid output p̂ = σ(wᵀx + b), why is Binary Cross-Entropy (Log-Loss) preferred over Mean Squared Error (MSE)?',
    options: [
      'MSE combined with a sigmoid activation creates a non-convex loss surface with flat saturation regions (vanishing gradients), whereas Cross-Entropy yields a strictly convex loss with gradient proportional to (p̂ - y).',
      'Binary Cross-Entropy requires zero matrix multiplications during backpropagation.',
      'MSE can only be used for unsupervised k-Means clustering.',
      'Cross-Entropy automatically removes all multicollinearity without regularization.',
    ],
    correctOptionIndex: 0,
    explanation:
      'Log-Loss with sigmoid activation is convex and cancels the sigmoid derivative saturation term, producing the clean gradient ∂L/∂z = (p̂ - y).',
  },
  {
    id: 'Q8_AI_GEN',
    domain: 'AI & Machine Learning',
    domainLabel: 'AI & Machine Learning Basics (Gradient Descent, Loss Functions, Supervised vs. Unsupervised)',
    difficulty: 'Hard',
    courseRef: 'UCS321 / UCS541',
    question:
      'A gradient-boosted tree model achieves R² = 0.96 on the training split but R² = 0.41 on the held-out validation split. Which combination of hyperparameter changes most directly mitigates this high-variance overfitting?',
    options: [
      'Increase max_depth from 6 to 20 and set L2 regularization (l2_regularization) to 0.',
      'Decrease max_depth, increase min_samples_leaf, apply L2 regularization, and lower the learning_rate with early stopping.',
      'Remove all validation data and train for 5,000 additional boosting iterations.',
      'Replace feature scaling with random label permutation.',
    ],
    correctOptionIndex: 1,
    explanation:
      'Constraining tree depth, requiring more samples per leaf, adding L2 shrinkage, and using early stopping directly reduce model variance and prevent memorization of training noise.',
  },
  {
    id: 'Q9_DB_NORM',
    domain: 'Web & Databases',
    domainLabel: 'Databases & Backend (SQL Normalization, Indexing, REST/ACID)',
    difficulty: 'Medium',
    courseRef: 'UCS310',
    question:
      'A relational table R(StudentID, CourseCode, InstructorID, InstructorOffice) is in 2NF, and the functional dependencies are { (StudentID, CourseCode) → InstructorID, InstructorID → InstructorOffice }. Why does R violate Third Normal Form (3NF)?',
    options: [
      'Because StudentID is a multi-valued attribute violating 1NF.',
      'Because there is a transitive dependency (StudentID, CourseCode) → InstructorID → InstructorOffice where non-prime attribute InstructorOffice depends on another non-prime attribute InstructorID.',
      'Because composite primary keys are forbidden in 3NF.',
      'Because B+ Tree indexes cannot be created on VARCHAR columns.',
    ],
    correctOptionIndex: 1,
    explanation:
      'In 3NF, no non-prime attribute may be transitively dependent on the primary key through another non-prime attribute (InstructorID → InstructorOffice).',
  },
  {
    id: 'Q10_DB_INDEX',
    domain: 'Web & Databases',
    domainLabel: 'Databases & Backend (SQL Normalization, Indexing, REST/ACID)',
    difficulty: 'Hard',
    courseRef: 'UCS310',
    question:
      'In a relational database or MongoDB wiredTiger storage engine, why are B+ Trees universally favored over balanced binary search trees (AVL/Red-Black) for disk-backed range queries such as `WHERE cgpa BETWEEN 8.20 AND 9.50`?',
    options: [
      'B+ Trees have high fan-out (hundreds of keys per page-sized node) minimizing disk I/O seeks, and all leaf nodes are linked sequentially for fast linear range scans.',
      'B+ Trees store all records exclusively in CPU L1 cache.',
      'AVL trees do not support equality lookups.',
      'B+ Trees never require node splits during insertions.',
    ],
    correctOptionIndex: 0,
    explanation:
      'High branching factor aligns with OS/disk page sizes (4KB–16KB) keeping tree height to 3–4 levels, and doubly-linked leaf pages allow sequential range scans without re-traversing internal nodes.',
  },
];

const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedOption: z.number().int().min(0).max(3),
      })
    )
    .min(1, 'At least one answer is required'),
});

export class AssessmentController {
  constructor(private readonly mlGateway: MLGatewayService) {}

  public getQuestions = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sanitizedQuestions = DIAGNOSTIC_QUESTION_BANK.map((q, index) => ({
        index: index + 1,
        id: q.id,
        domain: q.domain,
        domainLabel: q.domainLabel,
        difficulty: q.difficulty,
        courseRef: q.courseRef,
        question: q.question,
        options: q.options,
      }));

      res.status(200).json({
        success: true,
        totalQuestions: sanitizedQuestions.length,
        timeLimitSeconds: 600,
        domains: [
          'Data Structures & Algorithms',
          'Math & Linear Algebra',
          'Systems & OS/Networks',
          'AI & Machine Learning',
          'Web & Databases',
        ],
        questions: sanitizedQuestions,
      });
    } catch (error) {
      next(error);
    }
  };

  public submitAssessment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { answers } = submitAssessmentSchema.parse(req.body);
      const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));

      const domainTotals: Record<string, { correct: number; total: number }> = {
        'Data Structures & Algorithms': { correct: 0, total: 0 },
        'Math & Linear Algebra': { correct: 0, total: 0 },
        'Systems & OS/Networks': { correct: 0, total: 0 },
        'AI & Machine Learning': { correct: 0, total: 0 },
        'Web & Databases': { correct: 0, total: 0 },
      };

      const quizResponses: IQuizResponseItem[] = [];
      const detailedFeedback: {
        questionId: string;
        domain: string;
        selectedOption: number;
        correctOptionIndex: number;
        isCorrect: boolean;
        explanation: string;
      }[] = [];

      let totalCorrect = 0;

      for (const q of DIAGNOSTIC_QUESTION_BANK) {
        const selected = answerMap.has(q.id) ? answerMap.get(q.id)! : -1;
        const isCorrect = selected === q.correctOptionIndex;
        if (isCorrect) {
          totalCorrect += 1;
        }
        if (!domainTotals[q.domain]) {
          domainTotals[q.domain] = { correct: 0, total: 0 };
        }
        domainTotals[q.domain].total += 1;
        if (isCorrect) {
          domainTotals[q.domain].correct += 1;
        }

        quizResponses.push({
          questionId: q.id,
          selectedOption: selected,
          isCorrect,
          domain: q.domain,
        });

        detailedFeedback.push({
          questionId: q.id,
          domain: q.domain,
          selectedOption: selected,
          correctOptionIndex: q.correctOptionIndex,
          isCorrect,
          explanation: q.explanation,
        });
      }

      const totalScore = Math.round((totalCorrect / DIAGNOSTIC_QUESTION_BANK.length) * 100);
      const domainScores: IDomainScores = {
        'Data Structures & Algorithms': Math.round(
          (domainTotals['Data Structures & Algorithms'].correct /
            Math.max(1, domainTotals['Data Structures & Algorithms'].total)) *
            100
        ),
        'Math & Linear Algebra': Math.round(
          (domainTotals['Math & Linear Algebra'].correct /
            Math.max(1, domainTotals['Math & Linear Algebra'].total)) *
            100
        ),
        'Systems & OS/Networks': Math.round(
          (domainTotals['Systems & OS/Networks'].correct /
            Math.max(1, domainTotals['Systems & OS/Networks'].total)) *
            100
        ),
        'AI & Machine Learning': Math.round(
          (domainTotals['AI & Machine Learning'].correct /
            Math.max(1, domainTotals['AI & Machine Learning'].total)) *
            100
        ),
        'Web & Databases': Math.round(
          (domainTotals['Web & Databases'].correct /
            Math.max(1, domainTotals['Web & Databases'].total)) *
            100
        ),
      };

      const evaluatedSkillLevel: SkillLevelType =
        totalScore >= 85
          ? 'Advanced'
          : totalScore >= 70
            ? 'Proficient'
            : totalScore >= 50
              ? 'Intermediate'
              : 'Novice';

      // Compute calibrated ML recommendation weights and aptitude scores from domain strengths
      const dsaScore = domainScores['Data Structures & Algorithms'];
      const mathScore = domainScores['Math & Linear Algebra'];
      const sysScore = domainScores['Systems & OS/Networks'];
      const aiScore = domainScores['AI & Machine Learning'];
      const webScore = domainScores['Web & Databases'];

      const calibratedCodingScore = Math.min(
        100,
        Math.max(45, Math.round(dsaScore * 0.45 + sysScore * 0.25 + webScore * 0.30))
      );
      const calibratedMathScore = Math.min(
        100,
        Math.max(45, Math.round(mathScore * 0.60 + aiScore * 0.40))
      );

      // Calibrate alpha (syllabus/skill match), beta (peer collaborative), gamma (grade boost), delta (career alignment)
      const rawAlpha = 0.24 + (totalScore / 100) * 0.14;
      const rawDelta = 0.24 + ((aiScore + webScore) / 200) * 0.12;
      const rawGamma = 0.26;
      const rawBeta = Math.max(0.12, 1 - (rawAlpha + rawDelta + rawGamma));
      const sumW = rawAlpha + rawBeta + rawGamma + rawDelta;

      const calibratedWeights = {
        alpha: Number((rawAlpha / sumW).toFixed(2)),
        beta: Number((rawBeta / sumW).toFixed(2)),
        gamma: Number((rawGamma / sumW).toFixed(2)),
        delta: Number((rawDelta / sumW).toFixed(2)),
      };

      const recommendedFocusBaskets: string[] = [];
      if (aiScore >= 50 || mathScore >= 50) {
        recommendedFocusBaskets.push('EF_BASKET_09', 'EF_BASKET_05');
      }
      if (webScore >= 50 || dsaScore >= 50) {
        recommendedFocusBaskets.push('EF_BASKET_08');
      }
      if (sysScore >= 50) {
        recommendedFocusBaskets.push('EF_BASKET_06', 'EF_BASKET_02');
      }
      if (recommendedFocusBaskets.length === 0) {
        recommendedFocusBaskets.push('EF_BASKET_08', 'EF_BASKET_05');
      }

      let serializedStudent: Record<string, unknown> | null = null;
      if (req.user?.userId) {
        const user = await User.findById(req.user.userId);
        if (user) {
          user.skillAssessment = {
            lastTakenAt: new Date(),
            totalScore,
            domainScores,
            evaluatedSkillLevel,
            quizResponses,
          };
          user.codingProfileScore = calibratedCodingScore;
          user.mathAptitudeScore = calibratedMathScore;
          user.preferenceWeights = calibratedWeights;

          // Add verified domain badges to skills
          const nextSkills = new Set(user.skills || []);
          if (dsaScore >= 50) nextSkills.add('Algorithms & Data Structures');
          if (mathScore >= 50) nextSkills.add('Linear Algebra & Probability');
          if (aiScore >= 50) nextSkills.add('Machine Learning');
          if (webScore >= 50) nextSkills.add('SQL & Backend Architecture');
          if (sysScore >= 50) nextSkills.add('Operating Systems & Networks');
          user.skills = Array.from(nextSkills);

          await user.save();
          await this.mlGateway.invalidateStudentCache(user);
          serializedStudent = serializeUser(user);

          await recordAuditLog({
            actorId: String(user._id),
            actorEmail: user.email,
            actorRole: user.role,
            action: 'SKILL_ASSESSMENT_COMPLETED',
            req,
            metadata: {
              totalScore,
              evaluatedSkillLevel,
              domainScores,
              calibratedWeights,
            },
          });
        }
      }

      res.status(200).json({
        success: true,
        skillAssessment: {
          lastTakenAt: new Date().toISOString(),
          totalScore,
          domainScores,
          evaluatedSkillLevel,
          quizResponses,
        },
        calibratedCodingScore,
        calibratedMathScore,
        calibratedWeights,
        recommendedFocusBaskets: Array.from(new Set(recommendedFocusBaskets)),
        detailedFeedback,
        student: serializedStudent,
      });
    } catch (error) {
      next(error);
    }
  };
}
