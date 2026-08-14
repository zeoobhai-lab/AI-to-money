import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ParticleBackground } from './components/3d/ParticleBackground';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { AuthModal } from './pages/AuthModal';
import { CheckoutPage } from './pages/CheckoutPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CourseLearningPage } from './pages/student/CourseLearningPage';
import { StudyMaterialPage } from './pages/student/StudyMaterialPage';
import { TestQuizPage } from './pages/student/TestQuizPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Info, Lock } from 'lucide-react';

const ProtectedDashboardWrapper: React.FC<{ children: React.ReactNode; onOpenAuth: () => void }> = ({ children, onOpenAuth }) => {
  const { currentUser, currentRole, verifyUserAccess, setActiveTab } = useApp();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (!currentUser || currentRole === 'guest') {
      setAuthorized(false);
      return;
    }
    if (currentRole === 'admin') {
      setAuthorized(true);
      return;
    }

    verifyUserAccess(currentUser.email).then((res) => {
      setAuthorized(res.authorized);
      if (!res.authorized) {
        setActiveTab('home');
      }
    });
  }, [currentUser, currentRole, verifyUserAccess, setActiveTab]);

  if (authorized === null) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center">
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 space-y-4 max-w-md animate-pulse">
          <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
          <h3 className="text-lg font-black text-white">Verifying Database Purchase...</h3>
          <p className="text-xs text-gray-400">Authenticating authorization and checking purchases table on Supabase.</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <HomePage onOpenAuth={onOpenAuth} />;
  }

  return <>{children}</>;
};

const MainAppContent: React.FC = () => {
  const { activeTab, toastMessage, toastData, currentUser, currentRole, hasActivePurchase } = useApp();
  const [authModalOpen, setAuthModalOpen] = useState(false);



  const isEnrolledStudent =
    currentUser &&
    currentRole === 'student' &&
    (hasActivePurchase || (currentUser.enrolledCourseIds && currentUser.enrolledCourseIds.length > 0));

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        if (isEnrolledStudent) {
          return (
            <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
              <StudentDashboard />
            </ProtectedDashboardWrapper>
          );
        }
        return <HomePage onOpenAuth={() => setAuthModalOpen(true)} />;
      case 'courses':
        return <CoursesPage />;
      case 'course-detail':
        if (isEnrolledStudent) {
          return (
            <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
              <CourseLearningPage />
            </ProtectedDashboardWrapper>
          );
        }
        return <CourseDetailPage onOpenAuth={() => setAuthModalOpen(true)} />;
      case 'checkout':
        if (isEnrolledStudent) {
          return (
            <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
              <StudentDashboard />
            </ProtectedDashboardWrapper>
          );
        }
        return <CheckoutPage />;
      case 'student-dashboard':
        return (
          <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
            <StudentDashboard />
          </ProtectedDashboardWrapper>
        );
      case 'course-learning':
        return (
          <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
            <CourseLearningPage />
          </ProtectedDashboardWrapper>
        );
      case 'study-material':
        return (
          <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
            <StudyMaterialPage />
          </ProtectedDashboardWrapper>
        );
      case 'tests':
      case 'quizzes':
        return (
          <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
            <TestQuizPage />
          </ProtectedDashboardWrapper>
        );
      case 'admin-dashboard':
        return <AdminDashboard />;
      default:
        if (isEnrolledStudent) {
          return (
            <ProtectedDashboardWrapper onOpenAuth={() => setAuthModalOpen(true)}>
              <StudentDashboard />
            </ProtectedDashboardWrapper>
          );
        }
        return <HomePage onOpenAuth={() => setAuthModalOpen(true)} />;
    }
  };

  const showFooter = !['course-learning'].includes(activeTab);

  return (
    <div className="min-h-screen bg-[#05070d] text-gray-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Interactive 3D Ambient Particle Background */}
      <ParticleBackground />

      {/* Global Navbar */}
      <Navbar onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Main Page Body */}
      <main className="flex-1 relative z-10">
        {renderActivePage()}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Global Toast Notification */}
      { (toastData || toastMessage) && (() => {
        const activeToast = toastData || { message: toastMessage || '', type: 'info' as const };
        const isError = activeToast.type === 'error';
        const isWarning = activeToast.type === 'warning';
        const isInfo = activeToast.type === 'info';
        
        return (
          <div
            className={`fixed bottom-6 right-6 z-50 glass-panel border backdrop-blur-xl px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 transition-all duration-300 animate-bounce ${
              isError
                ? 'border-rose-500/50 bg-[#16070a]/95 text-rose-300 shadow-rose-500/30'
                : isWarning
                ? 'border-amber-500/50 bg-[#140f07]/95 text-amber-300 shadow-amber-500/30'
                : isInfo
                ? 'border-sky-500/50 bg-[#070e14]/95 text-sky-300 shadow-sky-500/30'
                : 'border-cyan-400/50 bg-[#070a14]/95 text-cyan-300 shadow-cyan-500/30'
            }`}
          >
            {isError && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {isInfo && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            {!isError && !isWarning && !isInfo && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span>{activeToast.message}</span>
          </div>
        );
      })()}
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
