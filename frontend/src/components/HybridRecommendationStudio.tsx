import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Cpu,
  Filter,
  Flame,
  Info,
  Layers,
  PlusCircle,
  Search,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IndustryPartner, ScoredBasketRecommendation } from '../types';

const PARTNER_BADGE_STYLES: Record<
  IndustryPartner,
  { bg: string; text: string; border: string; label: string }
> = {
  NVIDIA: {
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-500/30',
    label: 'NVIDIA DLI Partner',
  },
  Xebia: {
    bg: 'bg-purple-500/15 dark:bg-purple-500/20',
    text: 'text-purple-800 dark:text-purple-300',
    border: 'border-purple-500/30',
    label: 'Xebia Cloud Partner',
  },
  'EC-Council': {
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-500/30',
    label: 'EC-Council Cyber Partner',
  },
  'Future First': {
    bg: 'bg-sky-500/15 dark:bg-sky-500/20',
    text: 'text-sky-800 dark:text-sky-300',
    border: 'border-sky-500/30',
    label: 'Future First Quant Partner',
  },
  TIET: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-[#8B1E24] dark:text-rose-300',
    border: 'border-[#8B1E24]/25',
    label: 'TIET CSED Core Track',
  },
};

export const HybridRecommendationStudio: React.FC = () => {
  const {
    currentUser,
    updateCgpa,
    preferenceWeights,
    updatePreferenceWeight,
    applyPresetWeights,
    rankedBaskets,
    rankedCourses,
    selectedBasketPrefs,
    setSelectedBasketPrefs,
    selectedGenericPrefs,
    setSelectedGenericPrefs,
    comparedBasketIds,
    toggleCompareBasket,
    setActiveTab,
    isMlLoading,
    isLiveBaskets,
    isLiveCourses,
    basketSourceMetadata,
    courseSourceMetadata,
  } = useApp();

  const [expandedShapBaskets, setExpandedShapBaskets] = useState<Record<string, boolean>>({
    [rankedBaskets[0]?.basket.basketId || 'EF_BASKET_09']: true,
    [rankedBaskets[1]?.basket.basketId || 'EF_BASKET_05']: true,
  });

  const [showAllBaskets, setShowAllBaskets] = useState<boolean>(true);
  const [slotFilter, setSlotFilter] = useState<string>('ALL');
  const [courseSearch, setCourseSearch] = useState<string>('');
  const [partnerFilter, setPartnerFilter] = useState<string>('ALL');

  const toggleShap = (basketId: string) => {
    setExpandedShapBaskets((prev) => ({
      ...prev,
      [basketId]: !prev[basketId],
    }));
  };

  const handleAddBasketToPreferences = (basketId: string) => {
    setSelectedBasketPrefs((prev) => {
      if (prev.includes(basketId)) return prev;
      if (prev.length >= 5) {
        return [...prev.slice(0, 4), basketId];
      }
      return [...prev, basketId];
    });
  };

  const handleAddGenericToPreferences = (courseCode: string) => {
    setSelectedGenericPrefs((prev) => {
      if (prev.includes(courseCode)) return prev;
      if (prev.length >= 5) {
        return [...prev.slice(0, 4), courseCode];
      }
      return [...prev, courseCode];
    });
  };

  const filteredBaskets = rankedBaskets.filter((item) => {
    if (partnerFilter !== 'ALL' && item.basket.industryPartner !== partnerFilter) {
      return false;
    }
    return true;
  });

  const displayedBaskets = showAllBaskets ? filteredBaskets : filteredBaskets.slice(0, 6);

  const filteredCourses = rankedCourses.filter((item) => {
    if (slotFilter !== 'ALL' && item.course.electiveSlot !== slotFilter) {
      return false;
    }
    if (courseSearch.trim().length > 0) {
      const q = courseSearch.toLowerCase();
      return (
        item.course.courseCode.toLowerCase().includes(q) ||
        item.course.title.toLowerCase().includes(q) ||
        item.course.labTechStack.some((t) => t.toLowerCase().includes(q)) ||
        item.course.syllabusKeywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Top Student Academic Summary & Sem I–IV Core Grades Strip */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#8B1E24] text-white p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-amber-300 border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Model Hybrid Recommender (TF-IDF + SVD Collaborative + LightGBM + SHAP)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser.name}{' '}
              <span className="text-rose-300 font-mono text-lg">
                ({currentUser.rollNumber || currentUser.employeeId})
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {currentUser.statementOfPurpose}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold">
                Target Roles:
              </span>
              {currentUser.targetCareerRoles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          {/* Sem I-IV Core Prerequisite Grade Badges */}
          <div className="bg-slate-900/75 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[300px]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sem I–IV Core Prerequisite Vector
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                <span className="text-[10px] uppercase font-bold text-emerald-300">CGPA:</span>
                <input
                  type="number"
                  min={4.0}
                  max={10.0}
                  step={0.05}
                  value={currentUser.cgpa}
                  onChange={(e) => updateCgpa(parseFloat(e.target.value) || 0)}
                  className="w-14 bg-transparent text-emerald-300 text-xs font-bold font-mono focus:outline-none text-right cursor-pointer"
                  title="Adjust CGPA (debounced live inference)"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Object.entries(currentUser.coreGrades).map(([code, grade]) => (
                <div
                  key={code}
                  className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center"
                >
                  <div className="text-[10px] font-mono text-slate-300">{code}</div>
                  <div
                    className={`text-xs font-extrabold ${
                      grade >= 9 ? 'text-emerald-400' : grade >= 8 ? 'text-sky-300' : 'text-amber-300'
                    }`}
                  >
                    {grade}/10
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Real-Time Preference Weight Sliders Studio */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Real-Time Hybrid Ranking Weight Sliders
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Adjusting these 4 objective weights dynamically re-ranks all 12 Official TIET Elective Focus Baskets and 58 electives in real time.
            </p>
          </div>

          {/* Preset Weight Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Presets:
            </span>
            <button
              onClick={() => applyPresetWeights('balanced')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#8B1E24] hover:text-white text-slate-700 dark:text-slate-200 transition"
            >
              Balanced Hybrid
            </button>
            <button
              onClick={() => applyPresetWeights('placement')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#8B1E24] hover:text-white text-slate-700 dark:text-slate-200 transition"
            >
              Placement & Industry
            </button>
            <button
              onClick={() => applyPresetWeights('cgpa')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#8B1E24] hover:text-white text-slate-700 dark:text-slate-200 transition"
            >
              Max CGPA Boost
            </button>
            <button
              onClick={() => applyPresetWeights('light_workload')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-[#8B1E24] hover:text-white text-slate-700 dark:text-slate-200 transition"
            >
              Low Lab Workload
            </button>
          </div>
        </div>

        {/* 4 Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
          {/* Slider 1: Career & Placement Alignment */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
                Career & Placement Fit
              </span>
              <span className="px-2 py-0.5 rounded bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 font-mono text-xs font-bold">
                {preferenceWeights.careerAlignment}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={preferenceWeights.careerAlignment}
              onChange={(e) => updatePreferenceWeight('careerAlignment', Number(e.target.value))}
              className="w-full accent-[#8B1E24] cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Weights NVIDIA / Xebia / EC-Council / Future First industry tracks & target roles.
            </p>
          </div>

          {/* Slider 2: CGPA Boost Potential */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                CGPA Boost Potential
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
                {preferenceWeights.cgpaBoost}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={preferenceWeights.cgpaBoost}
              onChange={(e) => updatePreferenceWeight('cgpaBoost', Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Prioritizes LightGBM expected grade point & prerequisite mastery advantage.
            </p>
          </div>

          {/* Slider 3: Syllabus & Skill Match */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                Syllabus & Skill Match
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-mono text-xs font-bold">
                {preferenceWeights.syllabusMatch}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={preferenceWeights.syllabusMatch}
              onChange={(e) => updatePreferenceWeight('syllabusMatch', Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              TF-IDF + SVD semantic similarity with CLOs, lab stack & k-NN senior cohort.
            </p>
          </div>

          {/* Slider 4: Low Workload Preference */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Low Workload Preference
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold">
                {preferenceWeights.lowWorkload}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={preferenceWeights.lowWorkload}
              onChange={(e) => updatePreferenceWeight('lowWorkload', Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              Balances weekly lab/sessional self-effort hours against Sem V–VII core load.
            </p>
          </div>
        </div>
      </section>

      {/* Top Recommended Elective Focus Baskets Section */}
      <section className="space-y-4">
        {/* Academic Data Transparency Banner */}
        <div className="rounded-xl p-3.5 text-xs bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Academic Data Transparency & Privacy Notice:</span>{' '}
              {basketSourceMetadata?.source === 'ml_service' ? (
                <span>
                  Recommendations are computed live by the Python ML Hybrid Ranker (Model: <code className="font-mono text-emerald-600 dark:text-emerald-400">{basketSourceMetadata.model_version}</code>) evaluated on a synthetic development dataset for academic benchmarking. No unanonymized student records are processed.
                </span>
              ) : (
                <span>
                  Remote ML microservice is cold-starting or offline; displaying deterministic catalog fallback recommendations based on prerequisite matching and CGPA.
                </span>
              )}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            Source: <strong className="text-slate-900 dark:text-white">{basketSourceMetadata?.source || (isLiveBaskets ? 'ml_service' : 'local_fallback')}</strong>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                <span>Official TIET Elective Focus Baskets (Ranked 1–12 for {currentUser.name})</span>
              </h3>
              {basketSourceMetadata?.source === 'ml_service' || isLiveBaskets ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ML-Generated (Synthetic Dev Model)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Demo Fallback (Catalog Heuristics)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each Elective Focus Basket sequences 4 Professional Electives across Sem V (PE-I), Sem VI (PE-II & PE-III), and Sem VII (PE-IV).
            </p>
          </div>

          {/* Partner Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'NVIDIA', 'Xebia', 'EC-Council', 'Future First', 'TIET'] as const).map(
              (partner) => (
                <button
                  key={partner}
                  onClick={() => setPartnerFilter(partner)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    partnerFilter === partner
                      ? 'bg-[#8B1E24] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {partner === 'ALL' ? 'All 12 Baskets' : partner}
                </button>
              )
            )}
          </div>
        </div>

        {/* Basket Cards Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {displayedBaskets.map((item: ScoredBasketRecommendation) => {
            const { basket, seatCompetition, shapReasons, trajectoryCourses } = item;
            const partnerStyle = PARTNER_BADGE_STYLES[basket.industryPartner];
            const isShapOpen = Boolean(expandedShapBaskets[basket.basketId]);
            const prefIndex = selectedBasketPrefs.indexOf(basket.basketId);
            const isCompared = comparedBasketIds.includes(basket.basketId);

            return (
              <div
                key={basket.basketId}
                className={`rounded-2xl bg-white dark:bg-slate-900 border transition shadow-sm hover:shadow-md flex flex-col justify-between ${
                  item.rank <= 3
                    ? 'border-[#8B1E24]/40 dark:border-rose-500/40 ring-1 ring-[#8B1E24]/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Card Header: Rank, Title, Partner Badge & Composite Match Score */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${
                            item.rank === 1
                              ? 'bg-[#8B1E24] text-white'
                              : item.rank <= 3
                                ? 'bg-slate-900 dark:bg-slate-700 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          #{item.rank} Recommended
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {basket.basketId}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${partnerStyle.bg} ${partnerStyle.text} ${partnerStyle.border}`}
                        >
                          {partnerStyle.label}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${
                            item.sourceMetadata?.source === 'ml_service' || isLiveBaskets
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                          }`}
                          title={item.sourceMetadata?.disclaimer || 'Recommendation provenance'}
                        >
                          {item.sourceMetadata?.source === 'ml_service' || isLiveBaskets ? 'ML-Generated' : 'Demo Fallback'}
                        </span>
                      </div>

                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {basket.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {basket.careerTracks.map((track) => (
                          <span
                            key={track}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            {track}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Composite Match Circular / Pill Score */}
                    <div className="text-right shrink-0">
                      <div className="inline-flex flex-col items-end px-3.5 py-2 rounded-xl bg-gradient-to-br from-[#8B1E24]/10 to-rose-500/5 dark:from-rose-500/20 dark:to-slate-800 border border-[#8B1E24]/25">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B1E24] dark:text-rose-300">
                          Hybrid Match
                        </span>
                        <span className="text-2xl font-black text-[#8B1E24] dark:text-rose-400">
                          {item.compositeMatchScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Seat Availability & Estimated CGPA Cutoff Badge */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-[#8B1E24] dark:text-rose-400 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {seatCompetition.filledSeats}/{seatCompetition.seatCapacity} Seats Filled
                        </span>
                        <span className="mx-1.5 text-slate-400">•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Est. Cutoff:{' '}
                          <span className="font-mono font-bold text-[#8B1E24] dark:text-rose-400">
                            {seatCompetition.estimatedCutoffCgpa.toFixed(2)} CGPA
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          seatCompetition.competitionStatus === 'HIGH_PROBABILITY'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                            : seatCompetition.competitionStatus === 'MODERATE_COMPETITION'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {seatCompetition.allotmentProbabilityPct}% Allotment Odds (
                        {seatCompetition.studentCgpaMargin >= 0
                          ? `+${seatCompetition.studentCgpaMargin.toFixed(2)}`
                          : seatCompetition.studentCgpaMargin.toFixed(2)}{' '}
                        CGPA)
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics Row: Expected Basket SGPA, Projected CGPA, Weekly Hours */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                      <div className="text-[10px] font-semibold uppercase text-emerald-800 dark:text-emerald-300">
                        Pred. Basket SGPA
                      </div>
                      <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                        {item.expectedBasketSgpa.toFixed(2)}{' '}
                        <span className="text-xs font-mono">
                          ({item.expectedCgpaDelta >= 0 ? `+${item.expectedCgpaDelta}` : item.expectedCgpaDelta})
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50">
                      <div className="text-[10px] font-semibold uppercase text-sky-800 dark:text-sky-300">
                        Proj. Cum. CGPA
                      </div>
                      <div className="text-base font-extrabold text-sky-700 dark:text-sky-400">
                        {item.projectedCumulativeCgpa.toFixed(2)} / 10
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                      <div className="text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-300">
                        Avg Effort / Course
                      </div>
                      <div className="text-base font-extrabold text-amber-700 dark:text-amber-400">
                        {item.avgWeeklyWorkloadHours} hrs/wk
                      </div>
                    </div>
                  </div>

                  {/* 4-Semester Progression (Sem V PE-I -> Sem VI PE-II & PE-III -> Sem VII PE-IV) */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>4-Semester Progression Trajectory (Sem V → Sem VII)</span>
                      <span className="font-mono text-[11px]">
                        Prereqs: {basket.keyPrerequisites.join(', ')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trajectoryCourses.map((tc) => (
                        <div
                          key={`${basket.basketId}-${tc.electiveSlot}`}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded bg-[#8B1E24]/15 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 font-mono text-[10px] font-bold">
                                Sem {tc.semester} • {tc.electiveSlot}
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                                {tc.courseCode}
                              </span>
                            </div>
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                              {tc.title}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
                              {tc.expectedLetterGrade} ({tc.expectedGradePoint})
                            </span>
                            <div className="text-[10px] text-slate-400 font-mono">
                              L-T-P {tc.ltp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expandable SHAP Explainability Breakdown */}
                  <div className="border-t border-slate-200/80 dark:border-slate-800 pt-3">
                    <button
                      onClick={() => toggleShap(basket.basketId)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#8B1E24] dark:hover:text-rose-400 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
                        <span>SHAP Explainability Breakdown (Why this basket matches you)</span>
                      </span>
                      {isShapOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isShapOpen && (
                      <div className="mt-3 space-y-2">
                        {shapReasons.map((shap, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-100">
                                {shap.feature}{' '}
                                <span className="font-mono text-[11px] text-slate-500">
                                  [{shap.studentValue}]
                                </span>
                              </span>
                              <span
                                className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  shap.direction === 'positive'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                {shap.shapImpact >= 0 ? `+${shap.shapImpact}` : shap.shapImpact} SHAP
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                              {shap.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 rounded-b-2xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddBasketToPreferences(basket.basketId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        prefIndex !== -1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#8B1E24] hover:bg-[#73181D] text-white'
                      }`}
                    >
                      {prefIndex !== -1 ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Choice #{prefIndex + 1} in Counseling</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Add to Top-5 Preferences</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => toggleCompareBasket(basket.basketId)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isCompared
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{isCompared ? 'Comparing (6-Axis)' : 'Compare Radar'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('roadmap')}
                    className="text-xs font-bold text-[#8B1E24] dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Locker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBaskets.length > 6 && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllBaskets(!showAllBaskets)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-sm hover:bg-slate-50"
            >
              <span>
                {showAllBaskets
                  ? 'Show Top 6 Recommended Baskets'
                  : `Show All ${filteredBaskets.length} Official TIET Elective Focus Baskets`}
              </span>
              {showAllBaskets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        )}
      </section>

      {/* Individual Professional & Generic Electives Catalog Explorer */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                <span>Individual TIET Course Predictions & Sem V Generic Electives (58 Courses)</span>
              </h3>
              {courseSourceMetadata?.source === 'ml_service' || isLiveCourses ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ML-Generated (GBDT Regressor)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <Info className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Demo Fallback (Catalog Heuristics)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filter by Professional Elective slot (`PE-I` to `PE-IV`) or Semester V Generic Electives (`GE-SEM5`) with predicted MST/EST/Sessional scores.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search UCS549, CUDA, Kubernetes..."
                className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#8B1E24]"
              />
            </div>

            {/* Slot Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['ALL', 'PE-I', 'PE-II', 'PE-III', 'PE-IV', 'GE-SEM5'] as const).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSlotFilter(slot)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    slotFilter === slot
                      ? 'bg-[#8B1E24] text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  {slot === 'GE-SEM5' ? 'Generic (Sem V)' : slot}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">Code & Title</th>
                <th className="py-3 px-3">Slot & L-T-P</th>
                <th className="py-3 px-3">Lab Tech Stack</th>
                <th className="py-3 px-3">Pred. Grade & Marks (MST/EST/Sess)</th>
                <th className="py-3 px-3">Seats & Est. Cutoff</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {isMlLoading && rankedCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#8B1E24] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Computing live course grade and workload predictions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No elective courses found matching &quot;{courseSearch}&quot; in slot {slotFilter}.
                  </td>
                </tr>
              ) : (
                filteredCourses.slice(0, 18).map((sc) => {
                const { course } = sc;
                const isGeSelected = selectedGenericPrefs.includes(course.courseCode);
                return (
                  <tr
                    key={course.courseCode}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-[#8B1E24] dark:text-rose-400">
                          {course.courseCode}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                          {course.industryPartner}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {course.title}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Sem {course.semester} • {course.electiveSlot}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        L-T-P: {course.ltp} ({course.credits} Cr)
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {course.labTechStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                          {sc.expectedLetterGrade} ({sc.expectedGradePoint})
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {sc.expectedWeeklyWorkloadHours} hrs/wk
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        MST: {sc.expectedMarks.mstOut30}/30 • EST: {sc.expectedMarks.estOut45}/45 •
                        Sess: {sc.expectedMarks.sessionalOut30}/30
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {course.enrolledCount}/{course.seatCapacity} Filled
                      </div>
                      <div className="text-[11px] text-[#8B1E24] dark:text-rose-400">
                        Cutoff: {sc.estimatedCutoffCgpa.toFixed(2)} CGPA ({sc.allotmentProbabilityPct}%)
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      {course.category === 'GENERIC_ELECTIVE' ? (
                        <button
                          onClick={() => handleAddGenericToPreferences(course.courseCode)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isGeSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#8B1E24] text-white hover:bg-[#70161B]'
                          }`}
                        >
                          {isGeSelected ? 'In GE Top-5' : '+ Add GE Pref'}
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {course.basketId}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

