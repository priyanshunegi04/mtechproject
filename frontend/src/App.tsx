import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AiAdvisorDrawer, TopInstitutionalHeader } from './components';
import {
  LoginPage,
  SignupPage,
  StudentDashboard,
  TeacherDashboard,
} from './pages';
import { getFrontendEnv } from './config/env';

const env = getFrontendEnv();

const AuthenticatedShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, cloudHealth, currentUser } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <TopInstitutionalHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {currentUser.role === 'student' && <AiAdvisorDrawer />}

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>{env.VITE_INSTITUTION_NAME}</strong> • Computer Science &amp; Engineering
            Department (CSED) • Scheme {env.VITE_CURRICULUM_SCHEME_YEAR}
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Cloud API: {env.VITE_API_BASE_URL}</span>
            <span>•</span>
            <span>Atlas Ping: {cloudHealth.atlasLatencyMs}ms</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const StudentForbiddenRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/student/dashboard', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-2xl p-6 max-w-md w-full shadow-xl text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          403 Forbidden — Faculty Portal Restricted
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Student accounts do not have permission to access Faculty Advisor or Dean Administrative routes. Redirecting you to <span className="font-mono font-bold">/student/dashboard</span>...
        </p>
        <button
          onClick={() => navigate('/student/dashboard', { replace: true })}
          className="px-4 py-2 rounded-xl bg-[#8B1E24] text-white text-xs font-bold"
        >
          Return to Student Dashboard Now
        </button>
      </div>
    </div>
  );
};

const ProtectedStudentRoute: React.FC = () => {
  const { isAuthenticated, currentUser, setActiveTab, activeTab } = useApp();

  useEffect(() => {
    if (
      isAuthenticated &&
      currentUser.role === 'student' &&
      ['teacher_workspace', 'course_manager', 'dean_command'].includes(activeTab)
    ) {
      setActiveTab('studio');
    }
  }, [isAuthenticated, currentUser.role, activeTab, setActiveTab]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'faculty_advisor' || currentUser.role === 'dean_admin') {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  return (
    <AuthenticatedShell>
      <StudentDashboard />
    </AuthenticatedShell>
  );
};

const ProtectedFacultyRoute: React.FC = () => {
  const { isAuthenticated, currentUser, setActiveTab, activeTab } = useApp();

  useEffect(() => {
    if (
      isAuthenticated &&
      (currentUser.role === 'faculty_advisor' || currentUser.role === 'dean_admin') &&
      !['teacher_workspace', 'course_manager', 'dean_command'].includes(activeTab)
    ) {
      setActiveTab('teacher_workspace');
    }
  }, [isAuthenticated, currentUser.role, activeTab, setActiveTab]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'student') {
    return <StudentForbiddenRedirect />;
  }

  return (
    <AuthenticatedShell>
      <TeacherDashboard />
    </AuthenticatedShell>
  );
};

const LogoutRoute: React.FC = () => {
  const { logoutUser } = useApp();

  useEffect(() => {
    logoutUser();
  }, [logoutUser]);

  return <Navigate to="/login" replace />;
};

const RootRedirectRoute: React.FC = () => {
  const { isAuthenticated, currentUser } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'faculty_advisor' || currentUser.role === 'dean_admin') {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  return <Navigate to="/student/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<RootRedirectRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route path="/student/dashboard" element={<ProtectedStudentRoute />} />
      <Route path="/student/*" element={<ProtectedStudentRoute />} />
      <Route path="/faculty/dashboard" element={<ProtectedFacultyRoute />} />
      <Route path="/faculty/*" element={<ProtectedFacultyRoute />} />
      <Route path="*" element={<RootRedirectRoute />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
