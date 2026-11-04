import React, { useState, useEffect } from 'react';
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
import { WhatsAppGroupModal } from './components/ui/WhatsAppGroupModal';
import { Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Info, ShieldCheck } from 'lucide-react';

const ProtectedDashboardWrapper: React.FC<{ children: React.ReactNode; onOpenAuth: () => void }> = ({ children, onOpenAuth }) => {
  const { currentUser, currentRole, verifyUserAccess, setActiveTab } = useApp();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
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

// Admin Route Guard (Phase 4 & 10)
const ProtectedAdminWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentRole, login, showToast } = useApp();
  const [adminEmail, setAdminEmail] = useState('rathoreaadarsh084@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  if (currentRole === 'admin') {
    return <>{children}</>;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      const res = await login(adminEmail, 'admin', adminPassword, 'Master Admin', '', 'login');
      if (!res.success) {
        setError(res.error || 'Invalid admin credentials');
      }
    } catch (err: any) {
      setError(err?.message || 'Admin authentication error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-amber-500/40 space-y-6 bg-black/90 shadow-2xl shadow-amber-500/20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Admin Authentication Required</h2>
          <p className="text-xs text-gray-400 mt-1">
            Access to <strong className="text-amber-400 font-mono">/admin</strong> is restricted to verified administrators.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">Admin Email</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-gray-400 uppercase">Admin Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-900 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {error && <div className="text-xs text-rose-400 text-center">{error}</div>}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? 'Authenticating...' : 'Unlock Admin Dashboard 🛡️'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    toastMessage,
    toastData,
    currentUser,
    currentRole,
    hasActivePurchase,
    isWhatsAppModalOpen,
    closeWhatsAppModal,
    whatsAppModalData
  } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // URL Path Synchronization for /admin (Phase 4)
  useEffect(() => {
    if (window.location.pathname === '/admin' && activeTab !== 'admin-dashboard') {
      setActiveTab('admin-dashboard');
    }
  }, [activeTab, setActiveTab]);

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
        return (
          <ProtectedAdminWrapper>
            <AdminDashboard />
          </ProtectedAdminWrapper>
        );
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

  const showFooter = !['course-learning', 'admin-dashboard'].includes(activeTab);

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

      {/* Global WhatsApp Group Modal */}
      <WhatsAppGroupModal
        isOpen={isWhatsAppModalOpen}
        onClose={closeWhatsAppModal}
        transactionId={whatsAppModalData?.transactionId}
        amountPaid={whatsAppModalData?.amount}
        productTitle={whatsAppModalData?.title || 'Purchased File / Course'}
        whatsappGroupUrl="https://chat.whatsapp.com/D7KO9Sr39oOJ1RDxM7OvqY"
      />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Global Toast Notification */}
      {(toastData || toastMessage) && (() => {
        const activeToast = toastData || { message: toastMessage || '', type: 'info' as const };
        const isError = activeToast.type === 'error';
        const isWarning = activeToast.type === 'warning';
        const isInfo = activeToast.type === 'info';

        return (
          <div
            className={`fixed bottom-6 right-6 z-50 glass-panel border backdrop-blur-xl px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 transition-all duration-300 animate-bounce ${isError
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
