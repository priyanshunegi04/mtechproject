import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Edit3,
  FileCheck,
  Filter,
  GraduationCap,
  PlusCircle,
  Save,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeanCommandCenter } from '../components';
import { ElectiveCourseCatalogItem, IndustryPartner } from '../types';

export const TeacherDashboard: React.FC = () => {
  const {
    activeTab,
    currentUser,
    baskets,
    courses,
    personas,
    saveOrUpdateCourse,
    reviewStudentMentee,
    grantPrerequisiteOverride,
  } = useApp();

  const [selectedBasketFilter, setSelectedBasketFilter] = useState<string>(
    currentUser.primarySpecializationBasket || 'ALL'
  );

  // Course & Syllabus Form State
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState<string>('UCS548');
  const [title, setTitle] = useState<string>('Accelerated Generative AI & LLM Engineering');
  const [basketId, setBasketId] = useState<string>(
    currentUser.primarySpecializationBasket || 'EF_BASKET_05'
  );
  const [electiveSlot, setElectiveSlot] = useState<'PE-I' | 'PE-II' | 'PE-III' | 'PE-IV' | 'GE-SEM5'>(
    'PE-I'
  );
  const [semester, setSemester] = useState<number>(5);
  const [credits, setCredits] = useState<number>(3.0);
  const [ltp, setLtp] = useState<string>('2-0-2');
  const [seatCapacity, setSeatCapacity] = useState<number>(120);
  const [difficultyIndex, setDifficultyIndex] = useState<number>(3.4);
  const [industryPartner, setIndustryPartner] = useState<IndustryPartner>('NVIDIA');
  const [prerequisitesInput, setPrerequisitesInput] = useState<string>('UCS301, UCS321, UMA021');
  const [syllabusTopicsInput, setSyllabusTopicsInput] = useState<string>(
    'Transformer Attention, LoRA Fine-Tuning, RAG Pipelines, CUDA Quantization'
  );
  const [closInput, setClosInput] = useState<string>(
    'CO1: Analyze multi-head self-attention complexity\nCO2: Implement parameter-efficient fine-tuning (PEFT/LoRA)\nCO3: Deploy quantized inference microservices'
  );
  const [courseSavedBanner, setCourseSavedBanner] = useState<string | null>(null);

  // Mentee Review Note state
  const [advisorNoteByRoll, setAdvisorNoteByRoll] = useState<Record<string, string>>({});
  const [reviewBanner, setReviewBanner] = useState<string | null>(null);

  const handleLoadCourseForEdit = (c: ElectiveCourseCatalogItem) => {
    setIsEditingExisting(true);
    setCourseCode(c.courseCode);
    setTitle(c.title);
    setBasketId(c.basketId);
    setElectiveSlot(c.electiveSlot === 'CORE' ? 'PE-I' : c.electiveSlot);
    setSemester(c.semester);
    setCredits(c.credits);
    setLtp(c.ltp);
    setSeatCapacity(c.seatCapacity);
    setDifficultyIndex(c.difficultyIndex);
    setIndustryPartner(c.industryPartner);
    setPrerequisitesInput((c.prerequisites || []).join(', '));
    setSyllabusTopicsInput((c.syllabusTopics || c.syllabusKeywords || []).join(', '));
    setClosInput((c.clos || []).join('\n'));
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prerequisites = prerequisitesInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const syllabusTopics = syllabusTopicsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const clos = closInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    await saveOrUpdateCourse(
      {
        courseCode: courseCode.trim().toUpperCase(),
        title: title.trim(),
        basketId,
        electiveSlot,
        semester,
        credits,
        ltp,
        seatCapacity,
        difficultyIndex,
        industryPartner,
        prerequisites,
        syllabusTopics,
        syllabusKeywords: syllabusTopics,
        clos,
        assignedInstructor: {
          name: currentUser.name,
          employeeId: currentUser.employeeId || 'EMP_CSED_104',
          email: currentUser.email,
        },
      },
      isEditingExisting
    );

    setCourseSavedBanner(
      `Course ${courseCode.toUpperCase()} (${title}) saved and synced with MongoDB Atlas catalog!`
    );
    setTimeout(() => setCourseSavedBanner(null), 4000);
  };

  const studentMentees = useMemo(() => {
    const students = personas.filter((p) => p.role === 'student');
    return students.filter((s) => {
      if (selectedBasketFilter === 'ALL') return true;
      return (
        s.rankedBasketPreferences.includes(selectedBasketFilter) ||
        s.allocatedBasketId === selectedBasketFilter
      );
    });
  }, [personas, selectedBasketFilter]);

  const handleMenteeDecision = async (
    rollNumber: string,
    studentName: string,
    status: 'Approved' | 'Revision Recommended'
  ) => {
    const note =
      advisorNoteByRoll[rollNumber] ||
      (status === 'Approved'
        ? 'Prerequisites and Skill Assessment verified. Approved for Merit Counseling.'
        : 'Recommend strengthening UMA021/UCS415 or selecting a balanced workload basket.');

    await reviewStudentMentee(rollNumber, status, note);
    setReviewBanner(
      `Marked ${studentName} (${rollNumber}) elective preference as "${status}".`
    );
    setTimeout(() => setReviewBanner(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Faculty Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 text-xs font-bold mb-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            Teacher &amp; Faculty Advisor Workspace • CSED TIET
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Course &amp; Syllabus Management + Student Mentee Assessment Insights
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active Instructor: <strong>{currentUser.name}</strong> ({currentUser.employeeId || 'EMP_CSED_104'}) • Primary Specialization:{' '}
            <strong>{currentUser.primarySpecializationBasket || 'EF_BASKET_05'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Filter Basket:
          </label>
          <select
            value={selectedBasketFilter}
            onChange={(e) => setSelectedBasketFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
          >
            <option value="ALL">All 12 Elective Focus Baskets</option>
            {baskets.map((b) => (
              <option key={b.basketId} value={b.basketId}>
                {b.basketId}: {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'dean_command' && currentUser.role === 'dean_admin' ? (
        <DeanCommandCenter />
      ) : (
        <>
          {/* Section 1: Course & Syllabus Management */}
          {activeTab === 'course_manager' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {isEditingExisting ? (
                <Edit3 className="w-4 h-4 text-[#8B1E24]" />
              ) : (
                <PlusCircle className="w-4 h-4 text-[#8B1E24]" />
              )}
              {isEditingExisting
                ? `Edit Elective Course (${courseCode})`
                : 'Add New Elective Course to MongoDB Atlas'}
            </h3>

            {isEditingExisting && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingExisting(false);
                  setCourseCode('UCS599');
                  setTitle('');
                }}
                className="text-xs font-semibold text-[#8B1E24] hover:underline"
              >
                + Switch to New Course Mode
              </button>
            )}
          </div>

          {courseSavedBanner && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{courseSavedBanner}</span>
            </div>
          )}

          <form onSubmit={handleCourseSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  placeholder="UCS548"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Accelerated Generative AI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Elective Focus Basket
                </label>
                <select
                  value={basketId}
                  onChange={(e) => setBasketId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  {baskets.map((b) => (
                    <option key={b.basketId} value={b.basketId}>
                      {b.basketId}: {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Elective Slot
                </label>
                <select
                  value={electiveSlot}
                  onChange={(e) => setElectiveSlot(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="PE-I">PE-I (Sem V)</option>
                  <option value="PE-II">PE-II (Sem VI)</option>
                  <option value="PE-III">PE-III (Sem VI)</option>
                  <option value="PE-IV">PE-IV (Sem VII)</option>
                  <option value="GE-SEM5">GE (Sem V)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  L-T-P &amp; Credits
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={ltp}
                    onChange={(e) => setLtp(e.target.value)}
                    className="w-16 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                  <input
                    type="number"
                    step={0.5}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value) || 3)}
                    className="w-14 px-2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Seat Capacity
                </label>
                <input
                  type="number"
                  min={15}
                  max={1000}
                  value={seatCapacity}
                  onChange={(e) => setSeatCapacity(Number(e.target.value) || 120)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Difficulty Index (1–5)
                </label>
                <input
                  type="number"
                  step={0.1}
                  min={1.0}
                  max={5.0}
                  value={difficultyIndex}
                  onChange={(e) => setDifficultyIndex(Number(e.target.value) || 3.3)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Industry Partner
                </label>
                <select
                  value={industryPartner}
                  onChange={(e) => setIndustryPartner(e.target.value as IndustryPartner)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="TIET">TIET CSED</option>
                  <option value="NVIDIA">NVIDIA</option>
                  <option value="Xebia">Xebia</option>
                  <option value="EC-Council">EC-Council</option>
                  <option value="Future First">Future First</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Prerequisites (comma-separated course codes)
              </label>
              <input
                type="text"
                value={prerequisitesInput}
                onChange={(e) => setPrerequisitesInput(e.target.value)}
                placeholder="UCS301, UCS415, UMA021"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Syllabus Topics &amp; TF-IDF Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={syllabusTopicsInput}
                onChange={(e) => setSyllabusTopicsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Course Learning Outcomes (CLOs, one per line)
              </label>
              <textarea
                rows={3}
                value={closInput}
                onChange={(e) => setClosInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              {isEditingExisting
                ? `Update ${courseCode} in Catalog`
                : 'Add New Elective Course to Catalog'}
            </button>
          </form>
        </div>

        {/* Existing Catalog Quick-Select List */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8B1E24]" />
                Active Elective Catalog ({courses.length} Courses)
              </h3>
              <span className="text-[11px] text-slate-500">Click any course to edit</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {courses
                .filter((c) =>
                  selectedBasketFilter === 'ALL' ? true : c.basketId === selectedBasketFilter
                )
                .map((c) => (
                  <div
                    key={c.courseCode}
                    onClick={() => handleLoadCourseForEdit(c)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#8B1E24] dark:hover:border-rose-500 bg-slate-50/60 dark:bg-slate-800/40 cursor-pointer transition flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-[#8B1E24] dark:text-rose-400">
                          {c.courseCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {c.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold">
                          {c.electiveSlot}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Basket: <strong>{c.basketId}</strong> • L-T-P: {c.ltp} ({c.credits} Cr) • Prereqs:{' '}
                        {(c.prerequisites || []).join(', ') || 'None'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        Cap: {c.seatCapacity}
                      </div>
                      <div className="text-[10px] text-[#8B1E24] dark:text-rose-400 font-semibold">
                        Edit Course →
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Section 2: Student Mentee & Assessment Insights Table */}
      {(activeTab === 'teacher_workspace' || activeTab !== 'course_manager') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B1E24]" />
              Student Mentee Roster &amp; Skill Assessment Readiness ({studentMentees.length} Students)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review students interested in your specialization basket, inspect their 10-question Skill Assessment scores &amp; core prerequisite grades, and approve or recommend revisions.
            </p>
          </div>
        </div>

        {reviewBanner && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0" />
            <span>{reviewBanner}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">Student &amp; Roll No</th>
                <th className="py-3 px-3">CGPA &amp; Core Grades</th>
                <th className="py-3 px-3">Skill Assessment Score</th>
                <th className="py-3 px-3">Preferred Baskets &amp; Readiness</th>
                <th className="py-3 px-3">Advisor Status &amp; Notes</th>
                <th className="py-3 px-3 text-right">1-Click Faculty Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {studentMentees.map((stu) => {
                const roll = stu.rollNumber || '102403001';
                const ucs301 = stu.coreGrades?.UCS301 ?? 8;
                const ucs415 = stu.coreGrades?.UCS415 ?? 8;
                const uma021 = stu.coreGrades?.UMA021 ?? 8;
                const lowPrereq = ucs301 < 7 || ucs415 < 7 || uma021 < 7 || stu.cgpa < 7.3;

                const quizScore =
                  stu.skillAssessment?.totalScore && stu.skillAssessment.totalScore > 0
                    ? stu.skillAssessment.totalScore
                    : Math.round((stu.codingProfileScore + stu.mathAptitudeScore) / 2);

                const skillBadge =
                  stu.skillAssessment?.evaluatedSkillLevel ||
                  (quizScore >= 85
                    ? 'Advanced'
                    : quizScore >= 70
                      ? 'Proficient'
                      : 'Intermediate');

                const reviewStatus = stu.advisorReview?.status || 'Pending';

                return (
                  <tr
                    key={stu.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{stu.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        Roll: {roll} • Sem {stu.currentSemester}
                      </div>
                      <div className="text-[10px] text-slate-400">{stu.email}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono font-extrabold text-sm text-[#8B1E24] dark:text-rose-400">
                        {stu.cgpa.toFixed(2)} CGPA
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                        UCS301: {ucs301} | UCS415: {ucs415} | UMA021: {uma021}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>{quizScore}%</span>
                        <span className="text-[10px] uppercase">({skillBadge})</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {stu.rankedBasketPreferences.slice(0, 3).map((bId, i) => (
                          <span
                            key={bId}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold"
                          >
                            #{i + 1} {bId}
                          </span>
                        ))}
                      </div>
                      {lowPrereq ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Prerequisite Alert: Check Math/Algo grade
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          All Prerequisites Verified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="mb-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            reviewStatus === 'Approved'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : reviewStatus === 'Revision Recommended'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {reviewStatus}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={
                          advisorNoteByRoll[roll] ?? stu.advisorReview?.advisorNotes ?? ''
                        }
                        onChange={(e) =>
                          setAdvisorNoteByRoll((prev) => ({
                            ...prev,
                            [roll]: e.target.value,
                          }))
                        }
                        placeholder="Add advisor note..."
                        className="w-44 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px]"
                      />
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMenteeDecision(roll, stu.name, 'Approved')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMenteeDecision(roll, stu.name, 'Revision Recommended')
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition"
                        >
                          Revision Rec.
                        </button>
                        {lowPrereq && (
                          <button
                            type="button"
                            onClick={() =>
                              grantPrerequisiteOverride(
                                roll,
                                stu.rankedBasketPreferences[0] || 'EF_BASKET_05',
                                'Faculty Advisor Waiver after Skill Assessment review'
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg border border-[#8B1E24] text-[#8B1E24] dark:text-rose-300 text-[10px] font-bold hover:bg-[#8B1E24]/10 transition inline-flex items-center gap-1"
                            title="Grant Prerequisite Waiver"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Grant Waiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
