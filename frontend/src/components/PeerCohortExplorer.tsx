import React from 'react';
import {
  Award,
  Briefcase,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';

const PIE_COLORS = ['#8B1E24', '#0284C7', '#10B981', '#F59E0B'];

export const PeerCohortExplorer: React.FC = () => {
  const { currentUser, peerCohort, isMlLoading, peerCohortSourceMetadata } = useApp();
  const isMlLive = (peerCohortSourceMetadata?.source === 'ml_service') || (peerCohort.sourceMetadata?.source === 'ml_service');

  return (
    <div className="space-y-8">
      {/* Top KPI Cards for 50-Peer k-NN Cohort */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#8B1E24] text-white p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>k-NN Peer Cohort Matcher + TruncatedSVD Collaborative Filtering</span>
              </div>
              {isMlLoading ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-xs font-semibold text-sky-300 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>Computing Live k-NN Trajectories...</span>
                </div>
              ) : isMlLive ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>ML-Generated Cohort (Synthetic Dev Data)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Demo Fallback Cohort (Catalog Heuristics)</span>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-extrabold">
              Nearest 50 TIET CSE Seniors Cohort Explorer
            </h2>
            <p className="text-xs sm:text-sm text-slate-200">
              Matched against 3,500 synthetic development senior profiles modeled after TIET CSE grading distributions and 2026 elective sequences using cosine similarity over your Sem I–IV core vector.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-300">Matched Seniors</div>
              <div className="text-2xl font-black text-white">{peerCohort.cohortSize}</div>
              <div className="text-[11px] text-emerald-300 font-mono">
                {peerCohort.avgPeerSimilarityPct}% Cosine Sim
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-300">Cohort Sem IV CGPA</div>
              <div className="text-2xl font-black text-white">
                {peerCohort.avgCohortCgpaSem4.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Yours: {currentUser.cgpa.toFixed(2)}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-300">Avg Elective SGPA</div>
              <div className="text-2xl font-black text-emerald-300">
                {peerCohort.avgCohortElectiveSgpa.toFixed(2)}
              </div>
              <div className="text-[11px] text-emerald-300 font-mono">
                +{peerCohort.avgCohortCgpaDelta.toFixed(2)} SGPA Boost
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-300">Super-Dream / Dream</div>
              <div className="text-2xl font-black text-amber-300">
                {(peerCohort.placementSummary[0]?.percentage || 44) +
                  (peerCohort.placementSummary[1]?.percentage || 38)}
                %
              </div>
              <div className="text-[11px] text-amber-200 font-mono">CIL Placement Tier</div>
            </div>
          </div>
        </div>
      </section>

      {/* Academic Data Transparency Banner */}
      <div className="rounded-xl p-3.5 text-xs bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white">Alumni Peer Cohort Provenance:</span>{' '}
            {isMlLive ? (
              <span>
                Retrieved via 50-NN Cosine Distance & SVD matrix factorization from a 3,500-student development cohort designed for academic testing. Student data privacy regulations protect private academic transcripts from unauthorized display.
              </span>
            ) : (
              <span>
                Client-side heuristic cohort fallback active while the Python ML service is cold-starting or offline.
              </span>
            )}
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          Cohort Source: <strong className="text-slate-900 dark:text-white">{peerCohortSourceMetadata?.source || (isMlLive ? 'ml_service' : 'local_fallback')}</strong>
        </span>
      </div>

      {/* Charts Grid: Senior Basket Selection Distribution + Placement Outcome PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Basket Selection & Resulting SGPA BarChart (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Which Elective Focus Baskets Your 50 Nearest Seniors Picked</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compares senior enrollment count (%) alongside their resulting Sem V–VII Elective SGPA.
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={peerCohort.basketDistribution}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
                <XAxis dataKey="basketName" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8B1E24" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[7, 10]}
                  stroke="#10B981"
                  tick={{ fontSize: 11 }}
                />
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
                  yAxisId="left"
                  dataKey="peerCount"
                  name="Seniors Enrolled (out of 50)"
                  fill="#8B1E24"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="avgElectiveSgpa"
                  name="Resulting Avg Elective SGPA"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: CIL Placement & Higher Studies Breakdown (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>CIL Placement & Higher-Studies Outcomes (50 Peers)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Center for Industrial Liaison (CIL) placement distribution for your matched cohort.
            </p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={peerCohort.placementSummary}
                    dataKey="count"
                    nameKey="tier"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={4}
                  >
                    {peerCohort.placementSummary.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            {peerCohort.placementSummary.map((item, idx) => (
              <div
                key={item.tier}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">{item.tier}</span>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {item.count} seniors ({item.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nearest Historical Thapar CSE Seniors Table */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
              <span>Closest k-NN Matched Thapar CSE Seniors (Individual Trajectories)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Anonymized historical student trajectories from MongoDB Atlas `historical_enrollments`.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">Senior Roll & Batch</th>
                <th className="py-3 px-3">k-NN Cosine Match</th>
                <th className="py-3 px-3">Sem IV CGPA → Elective SGPA</th>
                <th className="py-3 px-3">Chosen EF Basket & Generic</th>
                <th className="py-3 px-3">Career Role</th>
                <th className="py-3 px-3 text-right">CIL Placement Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {peerCohort.closestSeniors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    {isMlLoading
                      ? 'Matching k-NN peers across 3,500 historical TIET graduates in MongoDB Atlas...'
                      : 'No historical seniors matched.'}
                  </td>
                </tr>
              ) : (
                peerCohort.closestSeniors.map((senior) => (
                  <tr
                    key={senior.studentId}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        Roll #{senior.rollNo}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        TIET CSE Batch of {senior.batchYear}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 font-mono font-bold">
                        {senior.similarityScorePct}% Match
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <span className="text-slate-600 dark:text-slate-300">
                        {senior.cgpaSem4.toFixed(2)}
                      </span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {senior.avgElectiveSgpa.toFixed(2)}
                      </span>
                      <span className="ml-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                        (+{senior.cgpaDelta.toFixed(2)})
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {senior.chosenBasketId}: {senior.chosenBasketName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Generic Elective: {senior.chosenGenericElective}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {senior.preferredCareerTrack}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          senior.placementTier === 'Super-Dream'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : senior.placementTier === 'Dream'
                              ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                              : 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {senior.placementTier}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

