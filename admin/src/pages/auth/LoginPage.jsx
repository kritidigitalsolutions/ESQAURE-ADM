import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import AnimatedGradientBackground from '../../components/ui/AnimatedGradientBackground';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'forgot_password' | 'reset_sent'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Auto Fill Demo Credentials
  const handleAutoFill = () => {
    setEmail('admin@e2stories.com');
    setPassword('Admin@123');
    setErrorMessage('');
  };

  // Handle Login Submission
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Simulate authenticating admin credentials
    setTimeout(() => {
      setIsLoading(false);
      try {
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_user_email', email);
      } catch (err) {
        console.error('Error storing session', err);
      }
      if (onLoginSuccess) {
        onLoginSuccess({ email });
      }
    }, 750);
  };

  // Handle Forgot Password Request
  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your admin email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    // Simulate sending password reset email
    setTimeout(() => {
      setIsLoading(false);
      setViewMode('reset_sent');
      setSuccessMessage(`Password reset link has been sent to ${email}`);
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-urbanist relative overflow-hidden selection:bg-[#ECBD2A] selection:text-black">
      
      {/* Animated Radial Breathing Gradient Background with Website Brand Palette (#ECBD2A) */}
      <AnimatedGradientBackground 
        Breathing={true} 
        animationSpeed={0.02} 
        breathingRange={5} 
        startingGap={125}
        position="50% 20%" 
        gradientColors={[
          "#0A0A0A",
          "#4D1D09",
          "#8A3D0B",
          "#C27D16",
          "#ECBD2A",
          "#F4D465",
          "#FDF5CF"
        ]}
        gradientStops={[35, 50, 60, 70, 80, 90, 100]}
      />

      <div className="w-full max-w-md relative z-10">
        
        {/* Clean Glassmorphic Card Container */}
        <div className="relative bg-black/30 backdrop-blur-2xl border border-white/15 rounded-3xl p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.6)] transition-all">
          
          {/* Brand Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-2">
              <img
                src="/logo-transparent.png"
                alt="Admin Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-urbanist">
              Admin Panel
            </h1>
          </div>

          {/* VIEW MODE 1: LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-tight">Admin Sign In</h2>
                <p className="text-xs text-slate-300">Enter your credentials to access the admin panel.</p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 text-xs font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/40 text-white text-sm rounded-xl focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setViewMode('forgot_password');
                    }}
                    className="text-xs font-semibold text-[#ECBD2A] hover:underline focus:outline-none transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/40 text-white text-sm rounded-xl focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-[#ECBD2A] hover:bg-[#dbaa1e] active:bg-[#c99b17] text-slate-950 font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Admin</span>
                  )}
                </button>

                {/* Auto Credentials Button */}
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="w-full py-2.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.07] border border-white/10 hover:border-white/20 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#ECBD2A]" />
                  <span>Auto Credentials</span>
                </button>
              </div>

            </form>
          )}

          {/* VIEW MODE 2: FORGOT PASSWORD FORM */}
          {viewMode === 'forgot_password' && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
              
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setViewMode('login');
                  }}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
                <h2 className="text-lg font-bold text-white tracking-tight">Forgot Password?</h2>
                <p className="text-xs text-slate-400">
                  Enter your registered admin email address and we'll send you a password reset link.
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-200 text-xs font-medium animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 hover:border-white/20 focus:border-white/40 text-white text-sm rounded-xl focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Submit Reset Request */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#ECBD2A] hover:bg-[#dbaa1e] active:bg-[#c99b17] text-slate-950 font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Sending email...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

            </form>
          )}

          {/* VIEW MODE 3: RESET SENT CONFIRMATION */}
          {viewMode === 'reset_sent' && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Check Your Inbox</h2>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                  {successMessage || `We have sent a password reset instructions link to your email address.`}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setViewMode('login')}
                  className="w-full py-3 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
