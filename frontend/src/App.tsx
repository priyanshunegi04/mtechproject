import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import {
  AiAdvisorDrawer,
  DeanCommandCenter,
  ElectiveRoadmapAndLocker,
  HybridRecommendationStudio,
  PeerCohortExplorer,
  SideBySideComparator,
  TopInstitutionalHeader,
} from './components';
import {
  AuthPage,
  InteractiveSkillAssessmentTab,
  StudentProfileAndGradesEditorTab,
  TeacherDashboard,
} from './pages';
import { getFrontendEnv } from './config/env';

const env = getFrontendEnv();

const MainWorkspace: React.FC = () => {
  const { activeTab, cloudHealth, isAuthenticated, showAuthModal, setShowAuthModal } = useApp();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <TopInstitutionalHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          <AuthPage />
        </main>
      </div>
    );
  }

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
            {activeTab === 'studio' && <HybridRecommendationStudio />}
            {activeTab === 'roadmap' && <ElectiveRoadmapAndLocker />}
            {activeTab === 'comparator' && <SideBySideComparator />}
            {activeTab === 'peers' && <PeerCohortExplorer />}
            {activeTab === 'skill_assessment' && <InteractiveSkillAssessmentTab />}
            {activeTab === 'profile_editor' && <StudentProfileAndGradesEditorTab />}
            {activeTab === 'teacher_workspace' && <TeacherDashboard />}
            {activeTab === 'dean_command' && <DeanCommandCenter />}
          </motion.div>
        </AnimatePresence>
      </main>

      {showAuthModal && (
        <AuthPage isModal onClose={() => setShowAuthModal(false)} />
      )}

      <AiAdvisorDrawer />

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

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainWorkspace />
    </AppProvider>
  );
};

export default App;
