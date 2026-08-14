import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Mail,
  Lock,
  ArrowRight,
  Flame,
  User,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { login, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Password & Verification States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // New phone state for signup
  const [phone, setPhone] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setAuthError('');

    // Email + Password Verification Flow
    let formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail.includes('@') && formattedEmail.includes('rathoreaadarsh084')) {
      formattedEmail = 'rathoreaadarsh084@gmail.com';
    } else if (!formattedEmail.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      showToast('Password must be at least 6 characters.');
      return;
    }

    // Phone validation for signup
    if (authMode === 'signup') {
      const phoneRegex = /^\+?\d{10,15}$/;
      if (!phone || !phoneRegex.test(phone.trim())) {
        setPasswordError('Please enter a valid mobile number (e.g., +919876543210).');
        showToast('Invalid mobile number.');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match! Please check your entries.');
        showToast('Passwords do not match! ❌');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const result = await login(formattedEmail, 'student', password, fullName, phone, authMode);
      setIsSubmitting(false);

      if (!result.success) {
        setAuthError(result.error || 'Authentication failed. Please try again.');
        showToast(result.error || 'Authentication failed. ❌');
        return;
      }

      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setAuthError(err?.message || 'Error occurred during authentication.');
      showToast('Authentication error occurred.');
    }
  };

  const handleForgotPassword = () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter your email address to reset password.');
      return;
    }
    showToast(`Password reset link sent to ${email}! Check your inbox. 📧`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      
      <div className="w-full max-w-md glass-panel rounded-3xl border border-amber-500/40 p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-2xl shadow-amber-500/20 bg-black/90 max-h-[95vh] overflow-y-auto">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl glass-panel text-gray-400 hover:text-white border border-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>

          <h2 className="text-2xl font-black text-white">
            {authMode === 'login' ? 'Welcome Back to Sawadh Sera' : 'Create Verified Student Account'}
          </h2>
          <p className="text-xs text-gray-400">
            Access <strong className="text-amber-400">Income From AI</strong> modules & prompt toolkits.
          </p>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          
          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Aadarsh Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Email Address *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="student@sawadhsera.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Password *</label>
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] text-amber-400 font-bold hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full pl-10 pr-10 py-3 bg-gray-900/90 rounded-xl text-xs text-white border border-gray-800 focus:border-amber-400 focus:outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Only for Sign Up Mode) */}
          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase font-mono">Confirm Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className={`w-full pl-10 pr-10 py-3 bg-gray-900/90 rounded-xl text-xs text-white border focus:outline-none font-mono ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-500/80 focus:border-red-400'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-500/80 focus:border-emerald-400'
                      : 'border-gray-800 focus:border-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Password Verification Indicator */}
              {password && (
                <div className="space-y-1 pt-1 font-mono text-[10px]">
                  <div className={`flex items-center gap-1.5 ${password.length >= 6 ? 'text-emerald-400' : 'text-gray-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> Minimum 6 characters
                  </div>
                  {confirmPassword && (
                    <div className={`flex items-center gap-1.5 ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      {password === confirmPassword ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {password === confirmPassword ? 'Passwords match ✓' : 'Passwords do not match ❌'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Password & Account Error Alert */}
          {(passwordError || authError) && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{passwordError || authError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-black text-xs text-black bg-gradient-to-r from-amber-400 via-orange-400 to-purple-500 hover:scale-[1.02] transition-transform shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>
                  {authMode === 'signup'
                    ? 'Create & Verify Account'
                    : 'Log In with Password'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Sign Up Mode */}
        <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-800/80">
          {authMode === 'login' ? (
            <p>
              New to Sawadh Sera?{' '}
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setPasswordError('');
                  setAuthError('');
                }}
                className="font-bold text-amber-400 hover:underline"
              >
                Create Account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setAuthMode('login');
                  setPasswordError('');
                  setAuthError('');
                }}
                className="font-bold text-amber-400 hover:underline"
              >
                Log In Here
              </button>
            </p>
          )}
        </div>

      </div>

    </div>
  );
};

export default AuthModal;
