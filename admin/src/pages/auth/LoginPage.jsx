import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import AnimatedGradientBackground from '../../components/ui/AnimatedGradientBackground';
import InteractiveHoverButton from '../../components/ui/InteractiveHoverButton';
import { loginWithEmail, sendResetPasswordEmail, getFirebaseErrorMessage } from '../../services/firebase';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('e2.storiesofficial@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'forgot_password' | 'reset_sent'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-fill default credentials
  const handleAutoFill = () => {
    setEmail('e2.storiesofficial@gmail.com');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  // Handle Firebase Email/Password Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginWithEmail(cleanEmail, password);

      // Persist user session info for fast UI hydration
      try {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_user_email', user.email || cleanEmail);
        if (user.displayName) {
          localStorage.setItem('admin_user_name', user.displayName);
        }
      } catch (err) {
        console.error('Error storing session', err);
      }

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error('Firebase authentication failed:', err);
      const friendlyError = getFirebaseErrorMessage(err);
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Firebase Password Reset Request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your admin email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await sendResetPasswordEmail(cleanEmail);
      setViewMode('reset_sent');
      setSuccessMessage(`A password reset link has been sent to ${cleanEmail}`);
    } catch (err) {
      console.error('Firebase password reset failed:', err);
      const friendlyError = getFirebaseErrorMessage(err);
      setErrorMessage(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0C] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-urbanist relative overflow-hidden selection:bg-[#FEF08A] selection:text-slate-950">
      
      {/* Animated Gradient Background */}
      <AnimatedGradientBackground />

      {/* Subtle Dot Grid Ambient Overlay */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"
      />

      <div className="w-full max-w-[390px] relative z-10 flex flex-col items-center">
        
        {/* Brand Logo on Background */}
        <div className="mb-5 sm:mb-6 transition-transform duration-300 hover:scale-105 relative animate-login-logo">
          <img
            src="/logo-transparent.png"
            alt="Admin Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* Clean Glassmorphic Card Container */}
        <div className="w-full relative bg-[#121216]/90 backdrop-blur-2xl border border-white/10 rounded-[22px] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 animate-login-card">

          {/* Header inside Card */}
          <div className="text-center mb-6 animate-login-item-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-urbanist">
              Admin Panel
            </h1>
          </div>

          {/* VIEW MODE 1: LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-0">

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 text-xs font-medium mb-3.5 animate-fadeIn animate-login-shake">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                  {errorMessage.includes('console.firebase.google.com') && (
                    <a
                      href="https://console.firebase.google.com/project/e2-stories/authentication"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#FEF08A] hover:underline pl-6"
                    >
                      <span>Open Firebase Authentication Console →</span>
                    </a>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div className="relative mb-3 animate-login-item-2">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input w-full pl-10 pr-3.5 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/35 text-white placeholder:text-slate-400 text-sm rounded-xl focus:outline-none transition-all duration-200"
                />
              </div>

              {/* Password Input */}
              <div className="relative mb-2 animate-login-item-3">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input w-full pl-10 pr-10 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/35 text-white placeholder:text-slate-400 text-sm rounded-xl focus:outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 stroke-[1.8]" /> : <Eye className="w-4 h-4 stroke-[1.8]" />}
                </button>
              </div>

              {/* Row with Auto-fill credentials button & Forgot password link */}
              <div className="flex items-center justify-between mb-5 animate-login-item-4">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FEF08A] hover:text-[#FDE047] hover:underline focus:outline-none transition-colors cursor-pointer"
                  title="Fill default credentials: e2.storiesofficial@gmail.com / Admin@123"
                >
                  <KeyRound className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Auto-fill Credentials</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setViewMode('forgot_password');
                  }}
                  className="text-xs font-semibold text-[#f85c37] hover:text-[#ff704d] hover:underline focus:outline-none transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button with Interactive Hover Animation */}
              <div className="animate-login-item-5">
                <InteractiveHoverButton
                  type="submit"
                  text="Sign In"
                  isLoading={isLoading}
                />
              </div>

            </form>
          )}

          {/* VIEW MODE 2: FORGOT PASSWORD FORM */}
          {viewMode === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
              
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setViewMode('login');
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-base font-bold text-white tracking-tight">Forgot Password?</h2>
                <p className="text-xs text-slate-400">
                  Enter your registered admin email address and we'll send you a password reset link.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 text-xs font-medium animate-fadeIn">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span className="leading-relaxed">{errorMessage}</span>
                  </div>
                  {errorMessage.includes('console.firebase.google.com') && (
                    <a
                      href="https://console.firebase.google.com/project/e2-stories/authentication"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-[#FEF08A] hover:underline pl-6"
                    >
                      <span>Open Firebase Authentication Console →</span>
                    </a>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4 stroke-[1.8]" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/35 text-white placeholder:text-slate-400 text-sm rounded-xl focus:outline-none transition-colors"
                />
              </div>

              {/* Submit Reset Request */}
              <InteractiveHoverButton
                type="submit"
                text="Send Reset Link"
                isLoading={isLoading}
                className="mt-2"
              />

            </form>
          )}

          {/* VIEW MODE 3: RESET SENT CONFIRMATION */}
          {viewMode === 'reset_sent' && (
            <div className="space-y-4 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-white tracking-tight">Check Your Inbox</h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {successMessage || `We have sent a password reset instructions link to your email address.`}
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-full py-2.5 px-3 bg-white hover:bg-neutral-100 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
