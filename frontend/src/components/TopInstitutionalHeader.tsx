import React from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Bot,
  Compass,
  Cpu,
  Database,
  GraduationCap,
  Lock,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
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
    cloudHealth,
    refreshCloudHealth,
  } = useApp();

  const roleBadgeLabel =
    currentUser.role === 'student'
      ? 'B.E. CSE Student'
      : currentUser.role === 'faculty_advisor'
        ? 'Faculty Advisor'
        : 'Dean / HOD Admin';

  const navItems: {
    id: ActiveNavigationTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'studio',
      label: 'Hybrid Recommendation Studio',
      shortLabel: 'ML Studio',
      icon: <Sparkles className="w-4 h-4" />,
      badge: '12 EF Baskets',
    },
    {
      id: 'roadmap',
      label: 'Sem V–VII Roadmap & Preference Locker',
      shortLabel: 'Roadmap & Lock',
      icon: <Lock className="w-4 h-4" />,
      badge: currentUser.preferenceLockedAt ? 'Locked' : 'Action Req',
    },
    {
      id: 'comparator',
      label: '6-Axis Elective & Basket Comparator',
      shortLabel: '6-Axis Comparator',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'peers',
      label: 'Peer Cohort (k-NN) & Placement Insights',
      shortLabel: 'Peer Cohort (50)',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'dean_command',
      label: 'Dean / HOD Command Center',
      shortLabel: 'Dean Portal',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'B2B Admin',
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
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#8B1E24] text-white">
                    {roleBadgeLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <span>
                    {currentUser.rollNumber
                      ? `Roll: ${currentUser.rollNumber}`
                      : `ID: ${currentUser.employeeId}`}
                  </span>
                  <span>•</span>
                  <span>{currentUser.email}</span>
                </div>
              </div>

              {currentUser.role === 'student' && (
                <div className="pl-2.5 border-l border-slate-300 dark:border-slate-700 flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Current CGPA
                  </span>
                  <span className="text-sm font-extrabold text-[#8B1E24] dark:text-rose-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    {currentUser.cgpa.toFixed(2)}
                  </span>
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
    </header>
  );
};

