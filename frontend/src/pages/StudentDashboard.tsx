import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Tag,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  CLIENT_DIAGNOSTIC_QUESTION_BANK,
  fetchDiagnosticQuestionsCloud,
  submitDiagnosticAssessmentCloud,
} from '../services/apiClient';
import { DiagnosticQuestionItem, DomainScoresMap, SkillAssessmentRecord } from '../types';
import {
  ElectiveRoadmapAndLocker,
  HybridRecommendationStudio,
  PeerCohortExplorer,
  SideBySideComparator,
} from '../components';

export const CORE_SUBJECT_TITLES: Record<string, string> = {
  UES103: 'Programming for Problem Solving',
  UMA022: 'Calculus for Engineers',
  UMA023: 'Linear Algebra & Differential Equations',
  UCS301: 'Data Structures',
  UCS303: 'Operating Systems',
  UTA018: 'Object Oriented Programming',
  UCS405: 'Discrete Mathematical Structures',
  UMA021: 'Numerical Linear Algebra',
  UCS415: 'Design & Analysis of Algorithms',
  UCS310: 'Database Management Systems',
  UCS414: 'Computer Networks',
  UCS321: 'Artificial Intelligence for Engineers',
  UMA401: 'Probability & Statistics',
};

export const GRADE_LETTER_OPTIONS: { label: string; points: number }[] = [
  { label: 'A+ (10)', points: 10 },
  { label: 'A (10)', points: 10 },
  { label: 'A- (9)', points: 9 },
  { label: 'B (8)', points: 8 },
  { label: 'B- (7)', points: 7 },
  { label: 'C (6)', points: 6 },
  { label: 'C- (5)', points: 5 },
  { label: 'E (2)', points: 2 },
  { label: 'F (0)', points: 0 },
];

export const AVAILABLE_INTEREST_TAGS: string[] = [
  'Data Science',
  'Conversational AI',
  'Cyber Security',
  'High Performance Computing',
  'Artificial Intelligence & ML',
  'DevOps & Cloud Automation',
  'Financial Derivative & Quant',
  'Full-Stack Web & Mobile',
  'Robotics & Embedded IoT',
  'Computer Vision & Graphics',
  'Quantum & Theoretical CS',
];

export const InteractiveSkillAssessmentTab: React.FC = () => {
  const {
    currentUser,
    updateCurrentUserProfile,
    updatePreferenceWeight,
    setActiveTab,
  } = useApp();

  const [questions, setQuestions] = useState<DiagnosticQuestionItem[]>(
    CLIENT_DIAGNOSTIC_QUESTION_BANK
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<SkillAssessmentRecord | null>(
    currentUser.skillAssessment && currentUser.skillAssessment.totalScore > 0
      ? currentUser.skillAssessment
      : null
  );
  const [detailedFeedback, setDetailedFeedback] = useState<
    {
      questionId: string;
      domain: string;
      selectedOption: number;
      correctOptionIndex: number;
      isCorrect: boolean;
      explanation: string;
    }[]
  >([]);
  const [appliedBanner, setAppliedBanner] = useState<boolean>(false);

  useEffect(() => {
    fetchDiagnosticQuestionsCloud().then((qList) => {
      if (Array.isArray(qList) && qList.length > 0) {
        setQuestions(qList);
      }
    });
  }, []);

  useEffect(() => {
    if (!quizStarted || assessmentResult) return;
    if (secondsLeft <= 0) {
      handleSubmitQuiz();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, secondsLeft, assessmentResult]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleStartQuiz = () => {
    setSelectedAnswers({});
    setAssessmentResult(null);
    setDetailedFeedback([]);
    setAppliedBanner(false);
    setSecondsLeft(600);
    setQuizStarted(true);
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const answersArray = questions.map((q) => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] ?? -1,
    }));

    const result = await submitDiagnosticAssessmentCloud(answersArray);
    setIsSubmitting(false);
    setQuizStarted(false);

    if (result?.skillAssessment) {
      setAssessmentResult(result.skillAssessment);
      if (result.detailedFeedback) {
        setDetailedFeedback(result.detailedFeedback);
      }
      await updateCurrentUserProfile({
        skillAssessment: result.skillAssessment,
        codingProfileScore: result.calibratedCodingScore ?? currentUser.codingProfileScore,
        mathAptitudeScore: result.calibratedMathScore ?? currentUser.mathAptitudeScore,
      });
    }
  };

  const handleApplyScoresToAI = async () => {
    if (!assessmentResult) return;
    const ds = assessmentResult.domainScores;
    const aiMath = ((ds['AI & Machine Learning'] || 0) + (ds['Math & Linear Algebra'] || 0)) / 2;
    const dsaSys =
      ((ds['Data Structures & Algorithms'] || 0) + (ds['Systems & OS/Networks'] || 0)) / 2;

    const newSyllabusMatch = Math.min(45, Math.max(20, Math.round(22 + assessmentResult.totalScore * 0.18)));
    const newCareerAlignment = Math.min(45, Math.max(20, Math.round(25 + aiMath * 0.15)));
    const newCgpaBoost = Math.min(35, Math.max(15, Math.round(25 + (100 - dsaSys) * 0.08)));
    const newLowWorkload = Math.max(10, 100 - (newSyllabusMatch + newCareerAlignment + newCgpaBoost));

    updatePreferenceWeight('syllabusMatch', newSyllabusMatch);
    updatePreferenceWeight('careerAlignment', newCareerAlignment);
    updatePreferenceWeight('cgpaBoost', newCgpaBoost);
    updatePreferenceWeight('lowWorkload', newLowWorkload);

    setAppliedBanner(true);
    setTimeout(() => {
      setActiveTab('studio');
    }, 900);
  };

  const radarChartData = useMemo(() => {
    const scores: DomainScoresMap = assessmentResult?.domainScores || {
      'Data Structures & Algorithms': 75,
      'Math & Linear Algebra': 70,
      'Systems & OS/Networks': 70,
      'AI & Machine Learning': 80,
      'Web & Databases': 75,
    };
    return [
      { domain: 'DSA & Complexity', score: scores['Data Structures & Algorithms'] ?? 0, fullMark: 100 },
      { domain: 'Math & Linear Alg', score: scores['Math & Linear Algebra'] ?? 0, fullMark: 100 },
      { domain: 'Systems & Networks', score: scores['Systems & OS/Networks'] ?? 0, fullMark: 100 },
      { domain: 'AI & Machine Learning', score: scores['AI & Machine Learning'] ?? 0, fullMark: 100 },
      { domain: 'Web & Databases', score: scores['Web & Databases'] ?? 0, fullMark: 100 },
    ];
  }, [assessmentResult]);

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 text-xs font-bold mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Adaptive 10-Question Diagnostic Skill Assessment
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            TIET CSED Core Competency &amp; Elective Readiness Diagnostic
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluates your mastery across 5 core domains (`UCS301`, `UCS415`, `UMA021`, `UCS303`, `UCS321`, `UCS310`) and directly calibrates your Hybrid AI Recommendation weights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {quizStarted && !assessmentResult && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 font-mono text-sm font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>Time Remaining: {formatTimer(secondsLeft)}</span>
            </div>
          )}

          {!quizStarted && (
            <button
              onClick={handleStartQuiz}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
              {assessmentResult ? 'Retake 10-Question Assessment' : 'Start 10-Question Timed Test'}
            </button>
          )}
        </div>
      </div>

      {/* Results & Domain Radar View */}
      {assessmentResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Diagnostic Result
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Badge: {assessmentResult.evaluatedSkillLevel}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-[#8B1E24] dark:text-rose-400 font-mono">
                  {assessmentResult.totalScore}%
                </span>
                <span className="text-xs text-slate-500">
                  Overall Competency Score across 5 CSED Domains
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {Object.entries(assessmentResult.domainScores).map(([domainName, pct]) => (
                  <div key={domainName}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700 dark:text-slate-200">{domainName}</span>
                      <span className="font-mono font-bold text-[#8B1E24] dark:text-rose-400">
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8B1E24] to-amber-500 transition-all duration-500"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              {appliedBanner && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Domain scores applied to Hybrid Recommender weights! Redirecting to Studio...
                  </span>
                </div>
              )}

              <button
                onClick={handleApplyScoresToAI}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#8B1E24] to-[#6B151A] hover:from-[#7A191F] hover:to-[#561014] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                Apply Scores to AI Recommendations
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              5-Domain Competency Radar Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Visualizes verified strengths fed into the TF-IDF + HistGradientBoosting + TreeSHAP recommender
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} outerRadius="75%">
                  <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                  <PolarAngleAxis
                    dataKey="domain"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Domain Score (%)"
                    dataKey="score"
                    stroke="#8B1E24"
                    fill="#8B1E24"
                    fillOpacity={0.45}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Active 10-Question Quiz Interface */}
      {(quizStarted || !assessmentResult) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Progress: {answeredCount} / {questions.length} Questions Answered
            </div>
            {!quizStarted && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                Click &quot;Start 10-Question Timed Test&quot; above or answer directly below
              </span>
            )}
          </div>

          <div className="space-y-5">
            {questions.map((q, idx) => {
              const selected = selectedAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B1E24] dark:text-rose-400">
                      Question {idx + 1} • {q.domain}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-semibold">
                        Ref: {q.courseRef}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.difficulty === 'Hard'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = selected === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => {
                            if (!quizStarted) setQuizStarted(true);
                            handleSelectOption(q.id, optIdx);
                          }}
                          className={`p-3 rounded-xl border text-left text-xs transition flex items-start gap-2.5 ${
                            isChosen
                              ? 'border-[#8B1E24] bg-[#8B1E24]/10 dark:bg-rose-950/40 text-slate-900 dark:text-white font-semibold'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isChosen
                                ? 'bg-[#8B1E24] text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {answeredCount} of {questions.length} questions selected
            </span>
            <button
              type="button"
              disabled={isSubmitting || answeredCount === 0}
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Evaluating Diagnostic Responses...' : 'Submit Skill Assessment & Compute Radar'}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Answer Explanations after submission */}
      {detailedFeedback.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Question-by-Question Diagnostic Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {detailedFeedback.map((fb, idx) => (
              <div
                key={fb.questionId}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  fb.isCorrect
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-rose-200 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {fb.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    Q{idx + 1}: {fb.domain}
                  </span>
                  <span className={fb.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}>
                    {fb.isCorrect ? '+10% Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {fb.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StudentProfileAndGradesEditorTab: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useApp();

  const [name, setName] = useState<string>(currentUser.name);
  const [contactNumber, setContactNumber] = useState<string>(
    currentUser.contactNumber || '+91-9876543210'
  );
  const [currentSemester, setCurrentSemester] = useState<number>(currentUser.currentSemester || 4);
  const [batchYear, setBatchYear] = useState<number>(currentUser.batchYear || 2024);
  const [cgpa, setCgpa] = useState<number>(currentUser.cgpa);
  const [coreGrades, setCoreGrades] = useState<Record<string, number>>({
    ...currentUser.coreGrades,
  });
  const [skills, setSkills] = useState<string[]>(currentUser.skills || []);
  const [newSkillInput, setNewSkillInput] = useState<string>('');
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>(
    currentUser.areasOfInterest || ['Data Science', 'Artificial Intelligence & ML']
  );

  // Custom subject entry
  const [customSubjectCode, setCustomSubjectCode] = useState<string>('');
  const [customSubjectGrade, setCustomSubjectGrade] = useState<number>(9);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    setName(currentUser.name);
    setContactNumber(currentUser.contactNumber || '+91-9876543210');
    setCurrentSemester(currentUser.currentSemester || 4);
    setBatchYear(currentUser.batchYear || 2024);
    setCgpa(currentUser.cgpa);
    setCoreGrades({ ...currentUser.coreGrades });
    setSkills(currentUser.skills || []);
    setAreasOfInterest(
      currentUser.areasOfInterest || ['Data Science', 'Artificial Intelligence & ML']
    );
  }, [currentUser]);

  const handleGradeChange = (code: string, gp: number) => {
    setCoreGrades((prev) => ({
      ...prev,
      [code]: gp,
    }));
  };

  const handleAddCustomSubject = () => {
    const clean = customSubjectCode.trim().toUpperCase();
    if (!clean) return;
    setCoreGrades((prev) => ({
      ...prev,
      [clean]: customSubjectGrade,
    }));
    setCustomSubjectCode('');
  };

  const handleRemoveSubject = (code: string) => {
    setCoreGrades((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });
  };

  const handleAddSkill = () => {
    const clean = newSkillInput.trim();
    if (!clean || skills.includes(clean)) return;
    setSkills((prev) => [...prev, clean]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const toggleInterest = (tag: string) => {
    setAreasOfInterest((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUserProfile({
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      currentSemester,
      batchYear,
      cgpa,
      coreGrades,
      skills,
      areasOfInterest,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 text-xs font-bold mb-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            Dynamic Student Profile &amp; Transcript Grades Manager
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            My Academic Profile, Core Prerequisite Grades &amp; Skills
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Updating your Semesters I–IV subject grades or technical skills automatically invalidates cached ML payloads and recalculates your live Elective Basket rankings.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md transition shrink-0"
        >
          <Save className="w-4 h-4" />
          Save Profile &amp; Recalculate AI Recommendations
        </button>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Profile, semester subject grades, and skills saved to MongoDB Atlas! Hybrid ML recommendations have been automatically refreshed.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Personal Info & Skills Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Personal &amp; Enrollment Telemetry
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Current Semester (1–8)
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Cumulative CGPA (0.00–10.00)
                </label>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={10}
                  value={cgpa}
                  onChange={(e) => setCgpa(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-[#8B1E24] dark:text-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Technical Skills Tag Input */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#8B1E24]" />
              2. Technical Skills &amp; Tooling
            </h3>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. PyTorch, Docker, Rust, React)..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Areas of Interest Multi-Select */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Areas of Interest &amp; Elective Focus Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTEREST_TAGS.map((tag) => {
                const active = areasOfInterest.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      active
                        ? 'bg-[#8B1E24] text-white border-[#8B1E24]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#8B1E24]'
                    }`}
                  >
                    {active ? `✓ ${tag}` : tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Core & Custom Subject Grades Column */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8B1E24]" />
                4. Semesters I–IV Core &amp; Custom Subject Grades Map
              </h3>
              <p className="text-[11px] text-slate-500">
                Grade Scale: A+/A = 10, A- = 9, B = 8, B- = 7, C = 6, C- = 5, E = 2, F = 0
              </p>
            </div>

            {/* Add Custom Subject Row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customSubjectCode}
                onChange={(e) => setCustomSubjectCode(e.target.value)}
                placeholder="Course Code (e.g. UCS503)"
                className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono uppercase"
              />
              <select
                value={customSubjectGrade}
                onChange={(e) => setCustomSubjectGrade(Number(e.target.value))}
                className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {GRADE_LETTER_OPTIONS.map((g) => (
                  <option key={g.label} value={g.points}>
                    {g.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCustomSubject}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8B1E24] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
            {Object.entries(coreGrades).map(([code, gp]) => {
              const isDefaultCore = Boolean(CORE_SUBJECT_TITLES[code]);
              return (
                <div
                  key={code}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-extrabold text-[#8B1E24] dark:text-rose-400">
                        {code}
                      </span>
                      {!isDefaultCore && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {CORE_SUBJECT_TITLES[code] || 'Custom Semester Subject'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={gp}
                      onChange={(e) => handleGradeChange(code, Number(e.target.value))}
                      className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                    >
                      {[10, 9, 8, 7, 6, 5, 2, 0].map((pts) => (
                        <option key={pts} value={pts}>
                          {pts === 10
                            ? 'A / A+ (10)'
                            : pts === 9
                              ? 'A- (9)'
                              : pts === 8
                                ? 'B (8)'
                                : pts === 7
                                  ? 'B- (7)'
                                  : pts === 6
                                    ? 'C (6)'
                                    : pts === 5
                                      ? 'C- (5)'
                                      : pts === 2
                                        ? 'E (2)'
                                        : 'F (0)'}
                        </option>
                      ))}
                    </select>
                    {!isDefaultCore && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(code)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Remove custom subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
};

export const StudentDashboard: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="space-y-6">
      {activeTab === 'studio' && <HybridRecommendationStudio />}
      {activeTab === 'roadmap' && <ElectiveRoadmapAndLocker />}
      {activeTab === 'comparator' && <SideBySideComparator />}
      {activeTab === 'peers' && <PeerCohortExplorer />}
      {activeTab === 'skill_assessment' && <InteractiveSkillAssessmentTab />}
      {activeTab === 'profile_editor' && <StudentProfileAndGradesEditorTab />}
    </div>
  );
};

export default StudentDashboard;
