import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Layers,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  Unlock,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { SEM5_CORE_COURSES } from '../data/tietCurriculumData';

export const ElectiveRoadmapAndLocker: React.FC = () => {
  const {
    currentUser,
    baskets,
    courses,
    rankedBaskets,
    rankedCourses,
    selectedBasketPrefs,
    setSelectedBasketPrefs,
    selectedGenericPrefs,
    setSelectedGenericPrefs,
    lockOfficialPreferences,
    unlockPreferencesForEdit,
  } = useApp();

  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [basketToAdd, setBasketToAdd] = useState<string>('EF_BASKET_01');
  const [genericToAdd, setGenericToAdd] = useState<string>('UHU026');

  const isLocked = Boolean(currentUser.preferenceLockedAt);

  const basketMap = new Map(baskets.map((b) => [b.basketId, b]));
  const scoredBasketMap = new Map(rankedBaskets.map((rb) => [rb.basket.basketId, rb]));
  const scoredCourseMap = new Map(rankedCourses.map((rc) => [rc.course.courseCode, rc]));

  const genericCourses = courses.filter((c) => c.category === 'GENERIC_ELECTIVE');

  const moveItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    direction: 'up' | 'down'
  ) => {
    if (isLocked) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const copy = [...list];
    const [item] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, item);
    setList(copy);
  };

  const removeItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    if (isLocked || list.length <= 1) return;
    setList(list.filter((_, idx) => idx !== index));
  };

  const handleLock = async () => {
    setIsLocking(true);
    await lockOfficialPreferences();
    setIsLocking(false);
  };

  // Primary Choice #1 Basket & Generic Elective for Roadmap Preview
  const primaryBasketId = selectedBasketPrefs[0] || rankedBaskets[0]?.basket.basketId || 'EF_BASKET_09';
  const primaryScoredBasket = scoredBasketMap.get(primaryBasketId) || rankedBaskets[0];
  const primaryGenericCode = selectedGenericPrefs[0] || 'UMA069';
  const primaryScoredGeneric = scoredCourseMap.get(primaryGenericCode);

  // Build Sem I - VII CGPA Trajectory Data for Recharts AreaChart
  const sem1to4 = currentUser.sgpaHistory.map((h) => ({
    semester: `Sem ${h.semester}`,
    actualOrProjectedSgpa: h.sgpa,
    cumulativeCgpa: h.sgpa,
    baselineTrack: h.sgpa,
    stage: 'Completed (Webkiosk Verified)',
  }));

  const pe1Gp = primaryScoredBasket?.trajectoryCourses[0]?.expectedGradePoint ?? currentUser.cgpa + 0.3;
  const pe2Gp = primaryScoredBasket?.trajectoryCourses[1]?.expectedGradePoint ?? currentUser.cgpa + 0.35;
  const pe3Gp = primaryScoredBasket?.trajectoryCourses[2]?.expectedGradePoint ?? currentUser.cgpa + 0.38;
  const pe4Gp = primaryScoredBasket?.trajectoryCourses[3]?.expectedGradePoint ?? currentUser.cgpa + 0.42;
  const geGp = primaryScoredGeneric?.expectedGradePoint ?? 9.1;

  const sem5Sgpa = Number(((currentUser.cgpa * 14.5 + pe1Gp * 3.0 + geGp * 2.0) / 19.5).toFixed(2));
  const sem6Sgpa = Number(((currentUser.cgpa * 12.0 + pe2Gp * 3.0 + pe3Gp * 3.0) / 18.0).toFixed(2));
  const sem7Sgpa = Number(((currentUser.cgpa * 9.0 + pe4Gp * 3.0) / 12.0).toFixed(2));

  const cumSem5 = Number(((currentUser.cgpa * 82 + sem5Sgpa * 19.5) / 101.5).toFixed(2));
  const cumSem6 = Number(((cumSem5 * 101.5 + sem6Sgpa * 18.0) / 119.5).toFixed(2));
  const cumSem7 = Number(((cumSem6 * 119.5 + sem7Sgpa * 12.0) / 131.5).toFixed(2));

  const trajectoryChartData = [
    ...sem1to4,
    {
      semester: 'Sem 5 (Proj)',
      actualOrProjectedSgpa: sem5Sgpa,
      cumulativeCgpa: cumSem5,
      baselineTrack: Number((currentUser.cgpa - 0.05).toFixed(2)),
      stage: 'Projected (PE-I + GE)',
    },
    {
      semester: 'Sem 6 (Proj)',
      actualOrProjectedSgpa: sem6Sgpa,
      cumulativeCgpa: cumSem6,
      baselineTrack: Number((currentUser.cgpa - 0.08).toFixed(2)),
      stage: 'Projected (PE-II + PE-III)',
    },
    {
      semester: 'Sem 7 (Proj)',
      actualOrProjectedSgpa: sem7Sgpa,
      cumulativeCgpa: cumSem7,
      baselineTrack: Number((currentUser.cgpa - 0.06).toFixed(2)),
      stage: 'Projected (PE-IV + Capstone)',
    },
  ];

  const totalWeeklyElectiveHours =
    (primaryScoredBasket?.avgWeeklyWorkloadHours ?? 8.2) +
    (primaryScoredGeneric?.expectedWeeklyWorkloadHours ?? 3.5) * 0.4;

  const overloadRiskStatus =
    totalWeeklyElectiveHours <= 10.2
      ? 'OPTIMAL LOAD'
      : totalWeeklyElectiveHours <= 11.8
        ? 'MODERATE LAB INTENSITY'
        : 'HIGH OVERLOAD RISK';

  return (
    <div className="space-y-8">
      {/* Top Banner: Official Counseling Preference Locker Status & Cryptographic Receipt */}
      <section
        className={`rounded-2xl p-6 border shadow-sm transition ${
          isLocked
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white border-emerald-500/40'
            : 'bg-gradient-to-r from-[#8B1E24] via-[#5E1318] to-[#0F172A] text-white border-[#8B1E24]/40'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
              {isLocked ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>OFFICIAL PREFERENCES LOCKED IN MONGODB ATLAS</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>COUNSELING ROUND 1 OPEN • ORDER TOP 5 CHOICES BELOW</span>
                </>
              )}
            </div>
            <h2 className="text-2xl font-extrabold">
              Semester V–VII Elective Roadmap & Official Counseling Locker
            </h2>
            <p className="text-xs sm:text-sm text-white/85 max-w-3xl">
              Select and rank your Top 5 Elective Focus Baskets and Top 5 Semester V Generic Electives. During automated merit counseling, the engine allocates seats strictly by CGPA merit down your ranked choices.
            </p>

            {isLocked && currentUser.preferenceReceiptHash && (
              <div className="mt-3 p-3 rounded-xl bg-black/35 border border-emerald-400/30 flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <FileCheck2 className="w-4 h-4" />
                  Cryptographic Receipt: {currentUser.preferenceReceiptHash}
                </span>
                <span className="text-slate-300">
                  Timestamp: {new Date(currentUser.preferenceLockedAt!).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isLocked ? (
              <button
                onClick={handleLock}
                disabled={isLocking}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isLocking
                    ? 'Syncing to MongoDB Atlas...'
                    : 'Lock Official Preferences to MongoDB Atlas'}
                </span>
              </button>
            ) : (
              <button
                onClick={unlockPreferencesForEdit}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Preferences (Demo Mode Re-Edit)</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Dual Column Preference Ranker: Top 5 EF Baskets + Top 5 Generic Electives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top 5 Elective Focus Basket Preferences */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
                <span>Ranked Top 5 Elective Focus Baskets (PE-I to PE-IV)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choice #1 is evaluated first by the CGPA merit seat allocator.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300">
              {selectedBasketPrefs.length}/5 Ranked
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedBasketPrefs.map((bId, index) => {
              const b = basketMap.get(bId);
              const sb = scoredBasketMap.get(bId);
              if (!b) return null;

              return (
                <div
                  key={bId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    index === 0
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-[#8B1E24]/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-[#8B1E24] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#8B1E24] dark:text-rose-400">
                          {b.basketId}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {b.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[10px] font-bold">
                          {b.industryPartner}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>
                          Est. Cutoff: <strong>{(b.liveCutoffCgpa ?? b.cutoffCgpaLastYear).toFixed(2)} CGPA</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Odds: <strong>{sb?.seatCompetition.allotmentProbabilityPct ?? 82}%</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Pred. SGPA: <strong>{sb?.expectedBasketSgpa ?? 8.9}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reorder / Remove controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(selectedBasketPrefs, setSelectedBasketPrefs, index, 'up')}
                      disabled={isLocked || index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        moveItem(selectedBasketPrefs, setSelectedBasketPrefs, index, 'down')
                      }
                      disabled={isLocked || index === selectedBasketPrefs.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(selectedBasketPrefs, setSelectedBasketPrefs, index)}
                      disabled={isLocked || selectedBasketPrefs.length <= 1}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 disabled:opacity-35"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add another basket dropdown */}
          {!isLocked && selectedBasketPrefs.length < 5 && (
            <div className="flex items-center gap-2 pt-2">
              <select
                value={basketToAdd}
                onChange={(e) => setBasketToAdd(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {baskets
                  .filter((b) => !selectedBasketPrefs.includes(b.basketId))
                  .map((b) => (
                    <option key={b.basketId} value={b.basketId}>
                      {b.basketId} — {b.name} ({b.industryPartner})
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedBasketPrefs.includes(basketToAdd)) {
                    setSelectedBasketPrefs([...selectedBasketPrefs, basketToAdd]);
                  }
                }}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#8B1E24] text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Choice
              </button>
            </div>
          )}
        </div>

        {/* Right: Top 5 Semester V Generic Elective Preferences */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
                <span>Ranked Top 5 Generic Electives (Sem V • 2.0 Credits)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interdisciplinary Humanities, Science & Management electives (`UHU`/`UMA`/`UCS`/`UTD`).
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300">
              {selectedGenericPrefs.length}/5 Ranked
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedGenericPrefs.map((code, index) => {
              const sc = scoredCourseMap.get(code);
              if (!sc) return null;
              const { course } = sc;

              return (
                <div
                  key={code}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                    index === 0
                      ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-500/40'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        index === 0
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-400">
                          {course.courseCode}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {course.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-[10px] font-mono">
                          {course.ltp} ({course.credits} Cr)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>
                          Pred. Grade: <strong>{sc.expectedLetterGrade} ({sc.expectedGradePoint})</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Effort: <strong>{sc.expectedWeeklyWorkloadHours} hrs/wk</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Cutoff: <strong>{sc.estimatedCutoffCgpa.toFixed(2)} CGPA</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        moveItem(selectedGenericPrefs, setSelectedGenericPrefs, index, 'up')
                      }
                      disabled={isLocked || index === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        moveItem(selectedGenericPrefs, setSelectedGenericPrefs, index, 'down')
                      }
                      disabled={isLocked || index === selectedGenericPrefs.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        removeItem(selectedGenericPrefs, setSelectedGenericPrefs, index)
                      }
                      disabled={isLocked || selectedGenericPrefs.length <= 1}
                      className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 disabled:opacity-35"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {!isLocked && selectedGenericPrefs.length < 5 && (
            <div className="flex items-center gap-2 pt-2">
              <select
                value={genericToAdd}
                onChange={(e) => setGenericToAdd(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              >
                {genericCourses
                  .filter((c) => !selectedGenericPrefs.includes(c.courseCode))
                  .map((c) => (
                    <option key={c.courseCode} value={c.courseCode}>
                      {c.courseCode} — {c.title} ({c.credits} Cr)
                    </option>
                  ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedGenericPrefs.includes(genericToAdd)) {
                    setSelectedGenericPrefs([...selectedGenericPrefs, genericToAdd]);
                  }
                }}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add GE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recharts AreaChart: Cumulative CGPA Trajectory (Sem I–VII) + MST/EST/Sessional Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recharts AreaChart (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                  <span>Semesters I–VII Cumulative CGPA & SGPA Trajectory</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulating Choice #1: <strong>{primaryScoredBasket?.basket.name}</strong> + Generic{' '}
                  <strong>{primaryGenericCode}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold font-mono">
                  Proj. Sem VII CGPA: {cumSem7.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trajectoryChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="crimsonGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B1E24" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#8B1E24" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                  <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
                  <YAxis domain={[6.5, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actualOrProjectedSgpa"
                    name="Semester SGPA (Actual / ML Projected)"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="url(#emeraldGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeCgpa"
                    name="Projected Cumulative CGPA"
                    stroke="#8B1E24"
                    strokeWidth={3}
                    fill="url(#crimsonGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workload & Overload Risk Footer */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
              <span className="text-slate-600 dark:text-slate-300">
                Sem V Mandatory Core Courses: <strong>{SEM5_CORE_COURSES.map((c) => c.courseCode).join(', ')}</strong> (14.5 Cr)
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                overloadRiskStatus === 'OPTIMAL LOAD'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }`}
            >
              {overloadRiskStatus === 'OPTIMAL LOAD' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {overloadRiskStatus} ({totalWeeklyElectiveHours.toFixed(1)} hrs/wk elective load)
            </span>
          </div>
        </div>

        {/* Right: Predicted MST / EST / Sessional Marks Breakdown (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Predicted MST / EST / Sessional Evaluation Breakdown</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Official TIET Weightage: MST (28% / 30M) • EST (42% / 45M) • Lab Sessional (30% / 30M)
            </p>
          </div>

          <div className="space-y-3">
            {primaryScoredBasket?.trajectoryCourses.map((tc) => (
              <div
                key={tc.courseCode}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-[#8B1E24]/15 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 font-mono text-[10px] font-bold">
                      Sem {tc.semester} • {tc.electiveSlot}
                    </span>
                    <span className="ml-2 font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      {tc.courseCode}
                    </span>
                    <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {tc.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-extrabold">
                    {tc.expectedLetterGrade} ({tc.expectedGradePoint})
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">MST (30)</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {tc.expectedMarks.mstOut30}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">EST (45)</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {tc.expectedMarks.estOut45}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700">
                    <div className="text-[10px] text-slate-400">Sess (30)</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {tc.expectedMarks.sessionalOut30}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/50">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300">Total %</div>
                    <div className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      {tc.expectedMarks.totalOut100}%
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Generic Elective Card */}
            {primaryScoredGeneric && (
              <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/25 border border-sky-300/60 dark:border-sky-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono text-[10px] font-bold">
                      Sem 5 • Generic Elective
                    </span>
                    <span className="ml-2 font-mono text-xs font-extrabold text-slate-900 dark:text-white">
                      {primaryScoredGeneric.course.courseCode}
                    </span>
                    <span className="ml-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      {primaryScoredGeneric.course.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-300 font-mono text-xs font-extrabold">
                    {primaryScoredGeneric.expectedLetterGrade} ({primaryScoredGeneric.expectedGradePoint})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

