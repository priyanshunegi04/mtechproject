import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Compass,
  Cpu,
  Database,
  Edit3,
  GraduationCap,
  Lock,
  LogOut,
  Moon,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  UserPlus,
  Users,
  Info,
  X,
} from 'lucide-react';
import { ActiveNavigationTab, useApp } from '../context/AppContext';

export const TopInstitutionalHeader: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    activeTab,
    setActiveTab,
    isAdvisorOpen,
    setIsAdvisorOpen,
    personas,
    currentUser,
    switchPersona,
    updateCgpa,
    cloudHealth,
    refreshCloudHealth,
    setShowAuthModal,
    logoutUser,
  } = useApp();

  const roleBadgeLabel =
    currentUser.role === 'student'
      ? 'B.E. CSE Student'
      : currentUser.role === 'faculty_advisor'
        ? 'Faculty Advisor'
        : 'Dean / HOD Admin';

  const [showProvenanceModal, setShowProvenanceModal] = React.useState<boolean>(false);

  const verifiedSkillBadge =
    currentUser.skillAssessment?.evaluatedSkillLevel &&
    currentUser.skillAssessment.totalScore > 0
      ? `${currentUser.skillAssessment.evaluatedSkillLevel} (${currentUser.skillAssessment.totalScore}%)`
      : currentUser.codingProfileScore >= 85
        ? 'Advanced Verified'
        : 'Proficient Verified';

  const navItems: {
    id: ActiveNavigationTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
    roles?: ('student' | 'faculty_advisor' | 'dean_admin')[];
  }[] = [
    {
      id: 'studio',
      label: 'AI Recommendation Studio',
      shortLabel: 'ML Studio',
      icon: <Sparkles className="w-4 h-4" />,
      badge: '12 EF Baskets',
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'roadmap',
      label: 'Semesters V–VIII Roadmap Builder',
      shortLabel: 'Roadmap & Lock',
      icon: <Lock className="w-4 h-4" />,
      badge: currentUser.preferenceLockedAt ? 'Locked' : 'Action Req',
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'comparator',
      label: '6-Axis Radar Comparator',
      shortLabel: '6-Axis Comparator',
      icon: <Compass className="w-4 h-4" />,
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'peers',
      label: 'Peer Cohort (k-NN) & Placement Insights',
      shortLabel: 'Peer Cohort (50)',
      icon: <Users className="w-4 h-4" />,
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'skill_assessment',
      label: 'Interactive Skill Assessment Test',
      shortLabel: 'Skill Test (10Q)',
      icon: <Cpu className="w-4 h-4" />,
      badge:
        currentUser.skillAssessment && currentUser.skillAssessment.totalScore > 0
          ? `${currentUser.skillAssessment.totalScore}%`
          : '10Q Quiz',
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'profile_editor',
      label: 'My Profile & Grades Editor',
      shortLabel: 'Profile & Grades',
      icon: <Edit3 className="w-4 h-4" />,
      roles: ['student', 'faculty_advisor', 'dean_admin'],
    },
    {
      id: 'teacher_workspace',
      label: 'Teacher & Faculty Advisor Workspace',
      shortLabel: 'Teacher Portal',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Faculty',
      roles: ['faculty_advisor', 'dean_admin'],
    },
    {
      id: 'dean_command',
      label: 'Dean / HOD Command Center',
      shortLabel: 'Dean Portal',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'B2B Admin',
      roles: ['faculty_advisor', 'dean_admin', 'student'],
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
      {/* Top Institutional Crimson & Slate-Navy Banner */}
      <div className="bg-gradient-to-r from-[#8B1E24] via-[#70161B] to-[#0F172A] text-white px-4 lg:px-8 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/15 font-semibold tracking-wide uppercase text-[10px]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              TIET Patiala • CSED 2026 Curriculum Scheme
            </span>
            <span className="hidden md:inline text-white/85">
              Enterprise B2B SaaS Elective Recommendation & Merit Seat Counseling Platform
            </span>
          </div>

          {/* Live Cloud Health & MongoDB Atlas Ping Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={refreshCloudHealth}
              title="Click to ping remote MongoDB Atlas cluster & FastAPI ML microservice"
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-900/80 transition"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-300" />
              <span className="font-medium">Connected to MongoDB Atlas Cloud</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[11px]">
                {cloudHealth.atlasLatencyMs}ms
              </span>
              <RefreshCw className="w-3 h-3 opacity-70" />
            </button>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-600/50 text-slate-200">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-mono">{cloudHealth.mlModelVersion}</span>
            </div>

            <button
              onClick={() => setShowProvenanceModal(true)}
              title="Click to view Machine Learning provenance and academic data disclosures"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-600/50 text-slate-200 hover:bg-slate-800 transition text-[11px]"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Data Provenance & Privacy</span>
              <span className="md:hidden">Provenance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Institutional Header Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand Logo + Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8B1E24] to-[#5B1115] flex items-center justify-center text-white shadow-md shadow-[#8B1E24]/25 border border-white/15">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Thapar<span className="text-[#8B1E24] dark:text-rose-400">ElectiveAI</span>
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[#8B1E24]/10 text-[#8B1E24] dark:bg-rose-500/20 dark:text-rose-300 border border-[#8B1E24]/20">
                    B.E. CSE 2026
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thapar Institute of Engineering & Technology • Hybrid ML Counseling & Seat Allocation
                </p>
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8B1E24] text-white text-xs font-semibold shadow-sm"
              >
                <Bot className="w-4 h-4" />
                AI Advisor
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Right Side: Active User Telemetry + Live Demo Role Switcher + AI Drawer + Dark Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Current Active User Card */}
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#8B1E24] text-white">
                    {roleBadgeLabel}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    ✓ {verifiedSkillBadge}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono flex-wrap">
                  <span>
                    {currentUser.rollNumber
                      ? `Roll: ${currentUser.rollNumber} • Sem ${currentUser.currentSemester}`
                      : `ID: ${currentUser.employeeId}`}
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {currentUser.contactNumber || '+91-9876543210'}
                  </span>
                </div>
              </div>

              {currentUser.role === 'student' && (
                <div className="pl-2.5 border-l border-slate-300 dark:border-slate-700 flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Current CGPA
                  </span>
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#8B1E24] dark:text-rose-400 shrink-0" />
                    <input
                      type="number"
                      min={4.0}
                      max={10.0}
                      step={0.05}
                      value={currentUser.cgpa}
                      onChange={(e) => updateCgpa(parseFloat(e.target.value) || 0)}
                      className="w-14 text-sm font-extrabold text-[#8B1E24] dark:text-rose-400 bg-transparent border-b border-dashed border-[#8B1E24]/40 dark:border-rose-400/40 focus:outline-none font-mono text-right hover:border-solid cursor-pointer"
                      title="Adjust student CGPA (debounced live inference)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live Demo Role / Persona Switcher */}
            <div className="flex items-center gap-1.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700/60 rounded-xl px-2.5 py-1">
              <Activity className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <label
                  htmlFor="demo-persona-switcher"
                  className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300"
                >
                  Live Demo Role Switcher
                </label>
                <select
                  id="demo-persona-switcher"
                  value={currentUser.personaKey}
                  onChange={(e) => switchPersona(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2"
                >
                  {personas.map((p) => (
                    <option
                      key={p.personaKey}
                      value={p.personaKey}
                      className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {p.label} — {p.subtitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop AI Academic Advisor Button */}
            <button
              onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8B1E24] to-[#6B151A] hover:from-[#7A191F] hover:to-[#561014] text-white text-xs font-semibold shadow-sm transition"
            >
              <Bot className="w-4 h-4" />
              <span>AI Academic Advisor</span>
              <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px]">Live</span>
            </button>

            {/* Sign In / Sign Up & Logout Buttons */}
            <button
              onClick={() => setShowAuthModal(true)}
              title="Open Institutional Login / Signup Portal"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#8B1E24] text-slate-800 dark:text-slate-200 text-xs font-bold transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8B1E24] dark:text-rose-400" />
              <span className="hidden sm:inline">Sign In / Sign Up</span>
            </button>

            <button
              onClick={logoutUser}
              title="Logout of current session"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Logout</span>
            </button>

            {/* Desktop Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-[#8B1E24] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Data Provenance & Academic Privacy Disclosure Modal */}
      {showProvenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#8B1E24] dark:text-rose-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Data Provenance & Privacy Disclosures
                </h3>
              </div>
              <button
                onClick={() => setShowProvenanceModal(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <span className="font-bold">Synthetic Development Dataset Disclosure:</span> All student profiles, historical enrollments (17,500 records), and senior peer cohorts displayed in this application are generated for academic research, testing, and benchmarking purposes.
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. FERPA & Digital Personal Data Protection (DPDP) Compliance</h4>
                <p>
                  To respect student data privacy and comply with higher education data ethics regulations, unanonymized real student academic transcripts are never stored, published, or transmitted to client browsers without prior institutional clearance.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. How to Distinguish Real ML Output from Fallbacks</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong className="text-emerald-600 dark:text-emerald-400">ML-Generated:</strong> Computed in real time by the remote Python FastAPI microservice (TF-IDF Content Recommender, TruncatedSVD Collaborative Filtering, HistGradientBoosting Grade Regressor, and TreeSHAP explainability).
                  </li>
                  <li>
                    <strong className="text-amber-600 dark:text-amber-400">Demo Fallback:</strong> If the ML service is cold-starting or offline, deterministic catalog heuristics based on prerequisite matching and CGPA are returned to ensure zero downtime.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Path to Verified Institutional Deployment</h4>
                <p>
                  Transitioning from academic development benchmark to verified registrar deployment requires formal approval from Thapar Institute&apos;s Academic Senate to ingest fully de-identified transcript matrices (anonymized hash tokens, semester grade points from 2020–2024 batches) via the Dean Command Center Webkiosk Ingestion pipeline.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowProvenanceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8B1E24] hover:bg-[#70161B] text-white transition"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

