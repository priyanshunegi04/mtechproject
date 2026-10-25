import React from 'react';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';

const RADAR_COLORS = ['#8B1E24', '#0284C7', '#10B981'];

export const SideBySideComparator: React.FC = () => {
  const {
    comparatorMode,
    setComparatorMode,
    comparedBasketIds,
    toggleCompareBasket,
    comparedCourseCodes,
    toggleCompareCourse,
    rankedBaskets,
    rankedCourses,
  } = useApp();

  const selectedBaskets = rankedBaskets.filter((rb) =>
    comparedBasketIds.includes(rb.basket.basketId)
  );
  const selectedCourses = rankedCourses.filter((rc) =>
    comparedCourseCodes.includes(rc.course.courseCode)
  );

  // Build 6-Axis Radar Chart dataset
  const radarAxes: {
    key:
      | 'mathIntensity'
      | 'codingLabLoad'
      | 'cgpaScoringEase'
      | 'placementDemand'
      | 'researchRelevance'
      | 'prerequisiteReadiness';
    label: string;
  }[] = [
    { key: 'mathIntensity', label: 'Math Intensity' },
    { key: 'codingLabLoad', label: 'Coding/Lab Load' },
    { key: 'cgpaScoringEase', label: 'CGPA Scoring Ease' },
    { key: 'placementDemand', label: 'Placement Demand' },
    { key: 'researchRelevance', label: 'Research Relevance' },
    { key: 'prerequisiteReadiness', label: 'Prerequisite Readiness' },
  ];

  const radarChartData = radarAxes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.label };
    if (comparatorMode === 'baskets') {
      selectedBaskets.forEach((sb) => {
        row[sb.basket.name] = sb.radarMetrics[axis.key];
      });
    } else {
      selectedCourses.forEach((sc) => {
        row[`${sc.course.courseCode} ${sc.course.title.slice(0, 18)}`] = sc.radarMetrics[axis.key];
      });
    }
    return row;
  });

  // Historical Grade Distribution BarChart data for selected items
  const gradeTiers = ['A+ (10)', 'A (10)', 'A- (9)', 'B (8)', 'B- (7)', 'C (6)'];
  const gradeDistData = gradeTiers.map((tierLabel, idx) => {
    const row: Record<string, string | number> = { grade: tierLabel };
    if (comparatorMode === 'baskets') {
      selectedBaskets.forEach((sb) => {
        const pe1Code = sb.basket.electiveSequence['PE-I'][0];
        const pe1Course = rankedCourses.find((c) => c.course.courseCode === pe1Code);
        row[sb.basket.name] =
          pe1Course?.course.historicalGradeDistribution[idx]?.percentage ?? 16;
      });
    } else {
      selectedCourses.forEach((sc) => {
        row[sc.course.courseCode] =
          sc.course.historicalGradeDistribution[idx]?.percentage ?? 16;
      });
    }
    return row;
  });

  return (
    <div className="space-y-8">
      {/* Header & Mode Toggle (Baskets vs Individual Courses) */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>6-Axis Side-by-Side Elective & Basket Comparator</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compare any 2 or 3 Official TIET Elective Focus Baskets or individual `UCS`/`UMC`/`UHU` courses across 6 academic & career dimensions.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setComparatorMode('baskets')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                comparatorMode === 'baskets'
                  ? 'bg-[#8B1E24] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compare EF Baskets (2–3)</span>
            </button>
            <button
              onClick={() => setComparatorMode('courses')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                comparatorMode === 'courses'
                  ? 'bg-[#8B1E24] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Compare Individual Courses (2–3)</span>
            </button>
          </div>
        </div>

        {/* Selector Pills */}
        {comparatorMode === 'baskets' ? (
          <div className="flex flex-wrap gap-2">
            {rankedBaskets.map((rb) => {
              const active = comparedBasketIds.includes(rb.basket.basketId);
              return (
                <button
                  key={rb.basket.basketId}
                  onClick={() => toggleCompareBasket(rb.basket.basketId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-[#8B1E24] text-white border-[#8B1E24] shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#8B1E24]/50'
                  }`}
                >
                  {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>
                    {rb.basket.basketId.replace('EF_BASKET_', 'B')}: {rb.basket.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
            {rankedCourses.slice(0, 24).map((rc) => {
              const active = comparedCourseCodes.includes(rc.course.courseCode);
              return (
                <button
                  key={rc.course.courseCode}
                  onClick={() => toggleCompareCourse(rc.course.courseCode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                    active
                      ? 'bg-[#8B1E24] text-white border-[#8B1E24]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="font-mono font-bold">{rc.course.courseCode}</span>
                  <span className="truncate max-w-[150px]">{rc.course.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Dual Visual Analytics: 6-Axis RadarChart + Historical Grade Distribution BarChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6-Axis Radar Chart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
              <span>6-Axis Academic & Career Radar Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Math Intensity • Coding/Lab Load • CGPA Scoring Ease • Placement Demand • Research Relevance • Prerequisite Readiness
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarChartData}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.35} />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                {comparatorMode === 'baskets'
                  ? selectedBaskets.map((sb, idx) => (
                      <Radar
                        key={sb.basket.basketId}
                        name={sb.basket.name}
                        dataKey={sb.basket.name}
                        stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                        fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                        fillOpacity={0.22}
                        strokeWidth={2.5}
                      />
                    ))
                  : selectedCourses.map((sc, idx) => {
                      const k = `${sc.course.courseCode} ${sc.course.title.slice(0, 18)}`;
                      return (
                        <Radar
                          key={sc.course.courseCode}
                          name={k}
                          dataKey={k}
                          stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                          fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                          fillOpacity={0.22}
                          strokeWidth={2.5}
                        />
                      );
                    })}
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Grade Distribution BarChart */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
              <span>Historical TIET Batch Grade Distribution (% of Enrolled Students)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Empirical grade curves (`A+` down to `C`) from past 4 Thapar CSE cohorts (2022–2025).
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistData} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {comparatorMode === 'baskets'
                  ? selectedBaskets.map((sb, idx) => (
                      <Bar
                        key={sb.basket.basketId}
                        dataKey={sb.basket.name}
                        fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                        radius={[6, 6, 0, 0]}
                      />
                    ))
                  : selectedCourses.map((sc, idx) => (
                      <Bar
                        key={sc.course.courseCode}
                        dataKey={sc.course.courseCode}
                        fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                        radius={[6, 6, 0, 0]}
                      />
                    ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Comparison Cards (CLOs, Syllabus Topics, Lab Stack, Seat Cutoffs) */}
      {comparatorMode === 'baskets' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {selectedBaskets.map((sb, idx) => (
            <div
              key={sb.basket.basketId}
              className="rounded-2xl bg-white dark:bg-slate-900 border-2 p-6 shadow-sm space-y-4"
              style={{ borderColor: `${RADAR_COLORS[idx % RADAR_COLORS.length]}55` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-[#8B1E24] dark:text-rose-400">
                    {sb.basket.basketId} • {sb.basket.collaboration}
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {sb.basket.name}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-[#8B1E24] text-white font-black text-sm">
                  {sb.compositeMatchScore}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    Pred. Basket SGPA
                  </div>
                  <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {sb.expectedBasketSgpa} ({sb.expectedCgpaDelta >= 0 ? `+${sb.expectedCgpaDelta}` : sb.expectedCgpaDelta})
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">
                    Live Seat Cutoff
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {sb.seatCompetition.estimatedCutoffCgpa.toFixed(2)} CGPA ({sb.seatCompetition.allotmentProbabilityPct}%)
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4-Course Sequence (Sem V → Sem VII):
                </div>
                {sb.trajectoryCourses.map((tc) => (
                  <div
                    key={tc.courseCode}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 text-xs flex items-center justify-between"
                  >
                    <span>
                      <strong className="font-mono text-[#8B1E24] dark:text-rose-400">
                        {tc.courseCode}
                      </strong>{' '}
                      {tc.title}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {tc.expectedLetterGrade}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Industry Career Roles:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sb.basket.careerTracks.map((role) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {selectedCourses.map((sc, idx) => (
            <div
              key={sc.course.courseCode}
              className="rounded-2xl bg-white dark:bg-slate-900 border-2 p-6 shadow-sm space-y-4"
              style={{ borderColor: `${RADAR_COLORS[idx % RADAR_COLORS.length]}55` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-[#8B1E24] dark:text-rose-400">
                    {sc.course.courseCode} • Sem {sc.course.semester} ({sc.course.electiveSlot})
                  </span>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {sc.course.title}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs">
                  {sc.expectedLetterGrade} ({sc.expectedGradePoint})
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {sc.course.labTechStack.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1"
                  >
                    <Cpu className="w-3 h-3 text-[#8B1E24]" />
                    {t}
                  </span>
                ))}
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Syllabus Topics:
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 capitalize">
                  {sc.course.syllabusKeywords.join(' • ')}
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Course Learning Outcomes (CLOs):
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {sc.course.clos.map((clo, cIdx) => (
                    <li key={cIdx} className="leading-snug">
                      • {clo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

