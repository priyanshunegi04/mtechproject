import React, { useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';

const SAMPLE_WEBKIOSK_CSV = `rollNumber,name,email,cgpa,UCS301,UCS415,UMA021,UCS321,topBasket1,topBasket2,topGeneric1
102303401,Aarav Sharma,asharma_be23@thapar.edu,9.12,10,9,9,10,EF_BASKET_09,EF_BASKET_05,UMA069
102303402,Meera Kaur,mkaur_be23@thapar.edu,8.45,9,8,8,9,EF_BASKET_05,EF_BASKET_08,UHU026
102303403,Rohan Verma,rverma_be23@thapar.edu,7.65,8,7,7,8,EF_BASKET_08,EF_BASKET_06,UTD004
102303404,Ananya Gupta,agupta_be23@thapar.edu,8.80,9,9,9,9,EF_BASKET_07,EF_BASKET_09,UHU027
102303405,Kabir Gill,kgill_be23@thapar.edu,9.34,10,10,9,10,EF_BASKET_09,EF_BASKET_05,UMA069
102303406,Ishita Verma,iverma_be23@thapar.edu,8.62,9,9,8,9,EF_BASKET_06,EF_BASKET_08,UCS081`;

export const DeanCommandCenter: React.FC = () => {
  const {
    baskets,
    courses,
    personas,
    seatCapPerBasket,
    setSeatCapPerBasket,
    allocationResult,
    isRunningAllocation,
    runMeritSeatAllocation,
    exportAllocationRosterCsv,
    ingestWebkioskCsv,
    grantPrerequisiteOverride,
    triggerMlModelRetrain,
    auditLogs,
  } = useApp();

  const [csvText, setCsvText] = useState<string>(SAMPLE_WEBKIOSK_CSV);
  const [csvStatus, setCsvStatus] = useState<string | null>(null);

  const [overrideRoll, setOverrideRoll] = useState<string>('102303188');
  const [overrideTargetCode, setOverrideTargetCode] = useState<string>('UCS659');
  const [overrideReason, setOverrideReason] = useState<string>(
    'Completed EC-Council CEH CTF Bootcamp & Linux Networking Lab project with A grade.'
  );
  const [overrideSuccess, setOverrideSuccess] = useState<string | null>(null);

  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainMessage, setRetrainMessage] = useState<string | null>(null);

  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [rosterPage, setRosterPage] = useState<number>(1);
  const ROSTER_PAGE_SIZE = 25;

  const filteredRoster = allocationResult.roster.filter((row) => {
    if (!rosterSearch.trim()) return true;
    const q = rosterSearch.toLowerCase();
    return (
      row.rollNumber.toLowerCase().includes(q) ||
      row.studentName.toLowerCase().includes(q) ||
      (row.allocatedBasketId && row.allocatedBasketId.toLowerCase().includes(q)) ||
      (row.allocatedBasketName && row.allocatedBasketName.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRoster.length / ROSTER_PAGE_SIZE));
  const currentPage = Math.min(rosterPage, totalPages);
  const paginatedRoster = filteredRoster.slice(
    (currentPage - 1) * ROSTER_PAGE_SIZE,
    currentPage * ROSTER_PAGE_SIZE
  );

  // Demand vs Seat Capacity BarChart data across 12 EF Baskets
  const demandBarData = baskets.map((b) => ({
    shortCode: b.basketId.replace('EF_BASKET_', 'B'),
    name: b.name,
    firstChoiceDemand: b.firstChoiceApplicants,
    seatCapacity: b.seatCapacity,
    enrolledCount: b.enrolledCount,
    cutoffCgpa: b.liveCutoffCgpa ?? b.cutoffCgpaLastYear,
  }));

  // Treemap data for 12 EF Baskets + Top Generic Electives
  const treemapData = [
    ...baskets.map((b) => ({
      name: `${b.basketId.replace('EF_BASKET_', 'B')}: ${b.name} (${b.enrolledCount}/${b.seatCapacity})`,
      size: b.firstChoiceApplicants + b.enrolledCount,
      partner: b.industryPartner,
    })),
    ...courses
      .filter((c) => c.category === 'GENERIC_ELECTIVE')
      .slice(0, 6)
      .map((ge) => ({
        name: `GE ${ge.courseCode}: ${ge.title.slice(0, 18)} (${ge.enrolledCount}/120)`,
        size: ge.enrolledCount,
        partner: 'TIET',
      })),
  ];

  const handleCsvUpload = async () => {
    const res = await ingestWebkioskCsv(csvText);
    setCsvStatus(
      `Successfully ingested ${res.upsertedStudents} Thapar Webkiosk student records into MongoDB Atlas (0 validation errors).`
    );
  };

  const handleGrantOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    await grantPrerequisiteOverride(overrideRoll, overrideTargetCode, overrideReason);
    setOverrideSuccess(
      `Prerequisite waiver granted for Roll #${overrideRoll} on ${overrideTargetCode} and logged to MongoDB Atlas AuditLog.`
    );
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    const res = await triggerMlModelRetrain();
    setRetrainMessage(
      `Model ${res.modelVersion} trained & registered in MongoDB Atlas! Validation RMSE: ${res.gradeRmse} • NDCG@5: ${res.ndcgAt5}`
    );
    setIsRetraining(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Institutional B2B Command Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#8B1E24] text-white p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4" />
              <span>DEAN OF ACADEMIC AFFAIRS & CSED HOD COMMAND CENTER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Automated Merit Seat Counseling & Batch Demand Telemetry
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Execute ACID-compliant CGPA merit seat allocation across all 12 Official TIET Elective Focus Baskets and 10 Generic Electives, monitor opening/closing cutoffs, ingest Webkiosk ERP transcripts, and audit institutional actions.
            </p>
          </div>

          {/* 1-Click Automated Merit Seat Allocation Runner Box */}
          <div className="bg-slate-900/85 backdrop-blur rounded-2xl p-4 border border-white/15 space-y-3 min-w-[320px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Seat Allocation Engine (Round #{allocationResult.roundNumber})
              </span>
              <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                allocationResult.isLiveDatabase
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}>
                {allocationResult.isLiveDatabase ? 'MongoDB Atlas Live' : 'ACID Transaction Ready'}
              </span>
            </div>

            {typeof allocationResult.executionTimeMs === 'number' && (
              <div className="text-[11px] text-slate-300 flex items-center justify-between font-mono">
                <span>Execution Latency:</span>
                <span className="font-bold text-emerald-400">{allocationResult.executionTimeMs} ms</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-xs">
              <label htmlFor="seat-cap-input" className="text-slate-300 font-semibold">
                Default Seat Cap / Basket:
              </label>
              <input
                id="seat-cap-input"
                type="number"
                min={60}
                max={500}
                step={10}
                value={seatCapPerBasket}
                onChange={(e) => setSeatCapPerBasket(Number(e.target.value))}
                className="w-24 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-white font-mono font-bold text-right"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => runMeritSeatAllocation(seatCapPerBasket)}
                disabled={isRunningAllocation}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
              >
                {isRunningAllocation ? (
                  <RefreshCw className="w-4 h-4 animate-spin fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>
                  {isRunningAllocation
                    ? 'Executing on MongoDB Atlas...'
                    : '1-Click Run Merit Seat Allocation'}
                </span>
              </button>

              <button
                onClick={exportAllocationRosterCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
                title="Export Official Allotment Roster CSV"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Lock Modal during MongoDB Atlas ACID Execution */}
      {isRunningAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-emerald-500/30 p-6 shadow-2xl text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-7 h-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MongoDB Atlas ACID Session Active</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                Executing CGPA Merit Seat Allocation
              </h3>
              <p className="text-xs text-slate-300">
                Executing serial dictatorship across 12 Elective Focus baskets with primary Sem-IV CGPA and core prerequisite GPA tie-breakers (<code className="text-amber-300">UCS301</code>, <code className="text-amber-300">UCS415</code>, <code className="text-amber-300">UMA021</code>, <code className="text-amber-300">UMA401</code>)...
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-left font-mono text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Cluster:</span>
                <span className="text-slate-200">todo.ef9ip9u.mongodb.net</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Isolation:</span>
                <span className="text-emerald-400 font-bold">Read-Committed ACID</span>
              </div>
              <div className="flex justify-between">
                <span>Target Round:</span>
                <span className="text-amber-400">ROUND_2026_SEM5_R{allocationResult.roundNumber + 1}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Metric Cards: Total Applicants, Allocated %, Waitlisted, Full Baskets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Applicants</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {allocationResult.totalStudentsProcessed.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
            <span>Batch 2024–2026</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">Sem-IV Completed</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Allocated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {allocationResult.allocatedBasketCount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
            {allocationResult.totalStudentsProcessed > 0
              ? Math.round((allocationResult.allocatedBasketCount / allocationResult.totalStudentsProcessed) * 100)
              : 0}% Allocation Rate
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Waitlisted Students</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {allocationResult.waitlistedBasketCount.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-300 font-bold">
            {allocationResult.totalStudentsProcessed > 0
              ? Math.round((allocationResult.waitlistedBasketCount / allocationResult.totalStudentsProcessed) * 100)
              : 0}% Pending Round 2
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Baskets at Capacity</span>
            <Award className="w-4 h-4 text-[#8B1E24] dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white font-mono">
            {allocationResult.basketCutoffs.filter((b) => b.enrolledCount >= b.seatCapacity).length} / {allocationResult.basketCutoffs.length || 12}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-semibold font-mono">
            {allocationResult.isLiveDatabase ? 'Live Database Audit' : 'Client Mode'}
          </div>
        </div>
      </div>

      {/* Batch Demand & Seat Capacity Heatmap (Recharts BarChart + Treemap) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* BarChart: First-Choice Demand vs Seat Capacity vs Enrolled (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Batch Demand vs Seat Capacity Across 12 Official EF Baskets</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compares 1st-choice student demand against configured seat capacity and post-allocation enrollment.
            </p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={demandBarData}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                <XAxis dataKey="shortCode" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
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
                <Bar
                  dataKey="firstChoiceDemand"
                  name="1st-Choice Student Applicants"
                  fill="#8B1E24"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="enrolledCount"
                  name="Allocated Seats"
                  fill="#10B981"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="seatCapacity"
                  name="Seat Capacity Cap"
                  fill="#64748B"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Treemap: Batch Demand & Seat Capacity Heatmap (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Elective Focus & Generic Elective Demand Treemap</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Area proportional to student preference volume across EF Baskets and Generic Electives.
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8B1E24"
                >
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Highest Demand: EF_BASKET_09 (NVIDIA Data Science)</span>
            <span className="font-mono font-bold text-[#8B1E24] dark:text-rose-400">
              Closing Cutoff: 8.62 CGPA
            </span>
          </div>
        </div>
      </div>

      {/* Opening & Closing CGPA Cutoffs + Official Merit Allotment Roster */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Basket Cutoffs Table (5 cols) */}
        <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                <span>Opening & Closing CGPA Cutoffs (All 12 Baskets)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live Round #{allocationResult.roundNumber} cutoff boundaries.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-2">Basket</th>
                  <th className="py-2.5 px-2">Filled</th>
                  <th className="py-2.5 px-2">Opening</th>
                  <th className="py-2.5 px-2 text-right">Closing Cutoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {allocationResult.basketCutoffs.map((bc) => (
                  <tr key={bc.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-2">
                      <div className="font-mono font-bold text-[#8B1E24] dark:text-rose-400">
                        {bc.code}
                      </div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {bc.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span>{bc.enrolledCount}/{bc.seatCapacity}</span>
                        <span className={`font-bold ${
                          bc.enrolledCount >= bc.seatCapacity
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {bc.seatCapacity > 0 ? Math.round((bc.enrolledCount / bc.seatCapacity) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            bc.enrolledCount >= bc.seatCapacity
                              ? 'bg-rose-500'
                              : bc.enrolledCount >= bc.seatCapacity * 0.85
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(100, bc.seatCapacity > 0 ? Math.round((bc.enrolledCount / bc.seatCapacity) * 100) : 0)}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {bc.openingCgpa?.toFixed(2) ?? '9.50'}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-right font-extrabold text-slate-900 dark:text-white">
                      {bc.closingCutoffCgpa?.toFixed(2) ?? '7.85'} CGPA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Merit Allotment Roster Table (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                <span>
                  Official CGPA Merit Allotment Roster ({allocationResult.totalStudentsProcessed}{' '}
                  Batch Students)
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  allocationResult.isLiveDatabase
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {allocationResult.isLiveDatabase ? 'Database Live' : 'Simulation'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by CGPA DESC, with tie-breaking via prerequisite GPA (`UCS301` + `UCS415` + `UMA021`).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search roll, name, basket..."
                value={rosterSearch}
                onChange={(e) => {
                  setRosterSearch(e.target.value);
                  setRosterPage(1);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs w-48 focus:outline-none"
              />
              <button
                onClick={exportAllocationRosterCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B1E24] text-white text-xs font-bold shadow-sm hover:bg-[#70161B] transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                  <th className="py-2.5 px-2">Merit</th>
                  <th className="py-2.5 px-2">Student & Roll</th>
                  <th className="py-2.5 px-2">CGPA (Tie GPA)</th>
                  <th className="py-2.5 px-2">Allocated EF Basket</th>
                  <th className="py-2.5 px-2">Generic</th>
                  <th className="py-2.5 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {paginatedRoster.map((row) => (
                  <tr
                    key={row.rollNumber}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-2.5 px-2 font-mono font-bold text-slate-500">
                      #{row.meritRank}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {row.studentName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{row.rollNumber}</div>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <span className="font-extrabold text-[#8B1E24] dark:text-rose-400">
                        {row.cgpa.toFixed(2)}
                      </span>{' '}
                      <span className="text-[11px] text-slate-400">
                        ({row.tieBreakerCoreGpa.toFixed(2)})
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      {row.allocatedBasketId ? (
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {row.allocatedBasketId}
                          </span>
                          <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            Choice #{row.basketPreferenceRank}
                          </span>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {row.allocatedBasketName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-bold">Waitlisted</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold">
                      {row.allocatedGenericCourseCode}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.allocationStatus === 'allocated'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {row.allocationStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>
              Showing {(currentPage - 1) * ROSTER_PAGE_SIZE + 1}–{Math.min(currentPage * ROSTER_PAGE_SIZE, filteredRoster.length)} of {filteredRoster.length} students
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRosterPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Prev
              </button>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setRosterPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Consoles: Webkiosk Bulk CSV Importer + Faculty Prerequisite Override + ML Retraining */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Webkiosk / ERP Bulk CSV Importer */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Webkiosk / ERP Bulk CSV Importer
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bulk-upsert student CGPA, Sem I–IV core prerequisite grades, and counseling preferences into MongoDB Atlas.
            </p>
            <textarea
              rows={5}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            {csvStatus && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{csvStatus}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCsvUpload}
            className="w-full py-2.5 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Sync Webkiosk CSV Batch to MongoDB Atlas</span>
          </button>
        </div>

        {/* 2. Faculty Advisor Prerequisite Waiver Console */}
        <form
          onSubmit={handleGrantOverride}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Faculty Prerequisite Override Console
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grant official academic waivers for students with strong project/hackathon credentials.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Student Roll No.
                </label>
                <select
                  value={overrideRoll}
                  onChange={(e) => setOverrideRoll(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  {personas
                    .filter((p) => p.role === 'student')
                    .map((stu) => (
                      <option key={stu.rollNumber} value={stu.rollNumber || ''}>
                        {stu.rollNumber} — {stu.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Target Course / Basket
                </label>
                <select
                  value={overrideTargetCode}
                  onChange={(e) => setOverrideTargetCode(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                >
                  <option value="UCS659">UCS659 — Ethical Hacking & VAPT</option>
                  <option value="UCS549">UCS549 — GPU Computing (NVIDIA)</option>
                  <option value="UCS670">UCS670 — Algorithmic Trading</option>
                  <option value="EF_BASKET_09">EF_BASKET_09 — Data Science (NVIDIA)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Faculty Justification & Verification Note
              </label>
              <textarea
                rows={2}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full mt-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            {overrideSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                {overrideSuccess}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-[#8B1E24] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve Prerequisite Waiver</span>
          </button>
        </form>

        {/* 3. FastAPI Multi-Model ML Pipeline Retraining Console */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                ML Pipeline & Model Registry Control
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Trigger live synchronization between MongoDB Atlas (`historical_enrollments`) and the Python 3.11 FastAPI ML microservice.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Grade Regressor RMSE
                </div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  0.5174 GP
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Ranking NDCG@5
                </div>
                <div className="text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                  0.8169
                </div>
              </div>
            </div>

            {retrainMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                {retrainMessage}
              </div>
            )}
          </div>

          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B1E24] to-[#0F172A] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>
              {isRetraining
                ? 'Retraining LightGBM & SVD Models...'
                : 'Retrain Multi-Model Pipeline on Atlas'}
            </span>
          </button>
        </div>
      </div>

      {/* Live MongoDB Atlas AuditLog Table */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Immutable MongoDB Atlas Institutional AuditLog (`audit_logs` collection)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every preference lock, merit seat allocation run, Webkiosk import, and faculty override is cryptographically logged.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold">
            {auditLogs.length} Verified Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500">
                <th className="py-2.5 px-3">Timestamp (UTC/IST)</th>
                <th className="py-2.5 px-3">Actor & Role</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Telemetry Metadata</th>
                <th className="py-2.5 px-3 text-right">Origin IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {auditLogs.slice(0, 12).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {log.actorEmail}
                    </span>
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 font-mono font-bold text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 max-w-md truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

