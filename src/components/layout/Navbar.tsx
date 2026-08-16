import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfileModal } from '../ui/UserProfileModal';
import {
  Sparkles,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Flame
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    logout,
    activeTab,
    setActiveTab,
    hasActivePurchase,
    flagship,
    siteSettings
  } = useApp();

  const [scrolled, setScrolled] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isEnrolledStudent =
    currentUser &&
    currentRole === 'student' &&
    (hasActivePurchase || (currentUser.enrolledCourseIds && currentUser.enrolledCourseIds.length > 0));

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-500 ${
        scrolled
          ? 'backdrop-blur-2xl bg-[#030408]/90 border-b border-purple-500/20 shadow-lg shadow-purple-900/10'
          : 'backdrop-blur-md bg-[#030408]/50 border-b border-transparent'
      }`}
    >
      {/* Top Notification Banner */}
      {siteSettings.isBannerActive && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 px-4 py-1.5 text-center text-xs font-black text-black flex items-center justify-center gap-2 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-text" style={{ backgroundSize: '200% 100%' }} />
          <Sparkles className="w-3.5 h-3.5 fill-black animate-spin relative z-10" />
          <span className="relative z-10">{siteSettings.announcementBannerText}</span>
          <span className="relative z-10 bg-black text-amber-300 text-[10px] px-2 py-0.5 rounded-full uppercase font-mono ml-2">
            LIMITED SEATS
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab(isEnrolledStudent ? 'student-dashboard' : 'home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/25 group-hover:scale-110 group-hover:shadow-purple-500/40 transition-all duration-300 animate-glow-ring">
              <div className="w-full h-full bg-[#030408] rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black text-white tracking-wider flex items-center gap-1.5 group-hover:text-amber-100 transition-colors">
                {siteSettings.logoText}
              </span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">
                Income From AI
              </span>
            </div>
          </div>

          {/* Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800/60 backdrop-blur-sm">
            {isEnrolledStudent ? (
              <button
                onClick={() => setActiveTab('student-dashboard')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                  activeTab === 'student-dashboard' || activeTab === 'course-learning'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-md shadow-amber-400/25 font-black scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                My Course Dashboard 🎓
              </button>
            ) : (
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === 'home'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-md shadow-amber-400/25 font-black scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Flagship Course
                </button>
            )}

            {currentRole === 'admin' && (
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1.5 ${
                  activeTab === 'admin-dashboard'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 scale-105'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Control Panel</span>
              </button>
            )}
          </nav>

          {/* Right User Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel border border-purple-500/30 text-xs font-bold text-white hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group"
                  title="Click to view details and upload photo"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400/80 group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="hidden md:inline group-hover:text-amber-300 transition-colors">
                    {currentUser.name} {currentRole === 'admin' ? '(Master Admin)' : ''}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="p-2.5 rounded-xl glass-panel border border-red-500/30 text-red-400 hover:bg-red-500/15 hover:border-red-400/50 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-6 py-2.5 rounded-xl btn-3d-gold text-xs font-black flex items-center gap-2 uppercase tracking-wider"
              >
                <UserIcon className="w-4 h-4 text-black" />
                <span>Student Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile & Photo Upload Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
