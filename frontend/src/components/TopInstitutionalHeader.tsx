import React from 'react';
import {
  BarChart3,
  BookOpen,
  Bot,
  Compass,
  Cpu,
  Database,
  Edit3,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  LogOut,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  Info,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActiveNavigationTab, useApp } from '../context/AppContext';

export const TopInstitutionalHeader: React.FC = () => {
  const {
    darkMode,
    toggleDarkMode,
    activeTab,
    setActiveTab,
    isAdvisorOpen,
    setIsAdvisorOpen,
    currentUser,
    cloudHealth,
    refreshCloudHealth,
    logoutUser,
  } = useApp();

  const navigate = useNavigate();

  const roleBadgeLabel =
    currentUser.role === 'student'
      ? 'Student'
      : currentUser.role === 'faculty_advisor'
        ? 'Faculty Advisor'
        : 'Dean / HOD Admin';

  const [showProvenanceModal, setShowProvenanceModal] = React.useState<boolean>(false);

  const verifiedSkillBadge =
    currentUser.role === 'student'
      ? currentUser.skillAssessment?.evaluatedSkillLevel &&
        currentUser.skillAssessment.totalScore > 0
        ? `Verified • ${currentUser.skillAssessment.evaluatedSkillLevel} (${currentUser.skillAssessment.totalScore}%)`
        : 'Verified Student Account'
      : `Verified Faculty (${currentUser.department || 'CSED'})`;

  const studentNavItems: {
    id: ActiveNavigationTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'studio',
      label: 'AI Recommendation Studio',
      shortLabel: 'AI Studio',
      icon: <Sparkles className="w-4 h-4" />,
      badge: '12 EF Baskets',
    },
    {
      id: 'roadmap',
      label: 'Semesters V–VIII Roadmap Builder',
      shortLabel: 'Roadmap Builder',
      icon: <Lock className="w-4 h-4" />,
      badge: currentUser.preferenceLockedAt ? 'Locked' : 'Draft',
    },
    {
      id: 'comparator',
      label: '6-Axis Radar Comparator',
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
      id: 'skill_assessment',
      label: 'Interactive Skill Assessment Test',
      shortLabel: '10Q Skill Test',
      icon: <Cpu className="w-4 h-4" />,
      badge:
        currentUser.skillAssessment && currentUser.skillAssessment.totalScore > 0
          ? `${currentUser.skillAssessment.totalScore}%`
          : '10Q Quiz',
    },
    {
      id: 'profile_editor',
      label: 'My Profile & Grades Editor',
      shortLabel: 'Profile & Grades',
      icon: <Edit3 className="w-4 h-4" />,
    },
  ];

  const facultyNavItems: {
    id: ActiveNavigationTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'teacher_workspace',
      label: 'Teacher & Faculty Advisor Workspace',
      shortLabel: 'Mentee Roster',
      icon: <Users className="w-4 h-4" />,
      badge: currentUser.primarySpecializationBasket || 'EF_BASKET_05',
    },
    {
      id: 'course_manager',
      label: 'Course & Syllabus Management',
      shortLabel: 'Course Manager',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Atlas Catalog',
    },
    ...(currentUser.role === 'dean_admin'
      ? [
          {
            id: 'dean_command' as ActiveNavigationTab,
            label: 'Dean / HOD Command Center',
            shortLabel: 'Dean Command',
            icon: <BarChart3 className="w-4 h-4" />,
            badge: 'Merit Engine',
          },
        ]
      : []),
  ];

  const visibleNavItems =
    currentUser.role === 'student' ? studentNavItems : facultyNavItems;

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

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
              Role-Separated Academic Counseling &amp; Merit Seat Allocation Portal
            </span>
          </div>

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
              <span className="font-medium">MongoDB Atlas Cloud</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 font-mono text-[11px]">
                {cloudHealth.atlasLatencyMs}ms
              </span>
              <RefreshCw className="w-3 h-3 opacity-70" />
            </button>

            <button
              onClick={() => setShowProvenanceModal(true)}
              title="Click to view Machine Learning provenance and academic data disclosures"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/70 border border-slate-600/50 text-slate-200 hover:bg-slate-800 transition text-[11px]"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Data Provenance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clean Main Institutional Header Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Brand Logo */}
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
                    {currentUser.role === 'student' ? 'Student Workspace' : 'Faculty Portal'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Thapar Institute of Engineering &amp; Technology • CSED
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Clean Authenticated User Identity, Verified Status, Dark Mode Toggle, and Logout */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser.name}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#8B1E24] text-white">
                    {roleBadgeLabel}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    ✓ {verifiedSkillBadge}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                  <span>
                    {currentUser.role === 'student'
                      ? `Roll: ${currentUser.rollNumber || '102403042'} • Sem ${currentUser.currentSemester} • CGPA ${currentUser.cgpa.toFixed(2)}`
                      : `Employee ID: ${currentUser.employeeId || 'EMP_CSED_104'} • Dept: ${currentUser.department || 'CSED'}`}
                  </span>
                </div>
              </div>
            </div>

            {currentUser.role === 'student' && (
              <button
                onClick={() => setIsAdvisorOpen(!isAdvisorOpen)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#8B1E24] to-[#6B151A] hover:from-[#7A191F] hover:to-[#561014] text-white text-xs font-semibold shadow-sm transition"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Academic Advisor</span>
              </button>
            )}

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Single Logout Button */}
            <button
              onClick={handleLogout}
              title="Log out and return to /login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Strict Role-Separated Navigation Tabs Bar */}
        <nav className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {visibleNavItems.map((item) => {
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
                  Data Provenance &amp; Privacy Disclosures
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
                <span className="font-bold">Strict Per-User Data Isolation:</span> Each authenticated student account queries exclusively their own profile (`User.findById(req.user.id)`), grades, and preferences.
              </div>
              <p>
                Recommendations marked <strong className="text-emerald-600 dark:text-emerald-400">ML-Generated</strong> are computed live by the Python FastAPI microservice; if cold-starting, deterministic catalog heuristics are labeled transparently.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowProvenanceModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8B1E24] hover:bg-[#70161B] text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
