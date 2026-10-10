import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  KeyRound,
  ShieldCheck,
  Loader2,
  Radio,
  RefreshCw,
  Check,
  X,
  BadgeCheck,
  Shield
} from 'lucide-react';
import { updateAdminPassword, updateAdminProfile, getFirebaseErrorMessage } from '../../services/firebase';

export default function SettingsPage() {
  // Admin Profile State
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Load existing profile values from localStorage on component mount
  const loadProfile = () => {
    try {
      const savedName = localStorage.getItem('admin_user_name') || 'Administrator';
      const savedEmail = localStorage.getItem('admin_user_email') || 'admin@e2stories.com';
      setAdminName(savedName);
      setAdminEmail(savedEmail);
    } catch (err) {
      console.error('Error reading profile from localStorage', err);
      setAdminName('Administrator');
      setAdminEmail('admin@e2stories.com');
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Handle Admin Profile Update (Name & Login Email)
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');

    if (!adminName.trim()) {
      setProfileErrorMsg('Admin name cannot be empty.');
      return;
    }

    if (!adminEmail.trim()) {
      setProfileErrorMsg('Login email address cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail.trim())) {
      setProfileErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsProfileSaving(true);

    try {
      const cleanName = adminName.trim();
      const cleanEmail = adminEmail.trim();

      // Update Firebase Auth profile
      await updateAdminProfile(cleanName);

      localStorage.setItem('admin_user_name', cleanName);
      localStorage.setItem('admin_user_email', cleanEmail);

      // Notify other components (e.g. Topbar) of profile update
      window.dispatchEvent(new Event('admin_profile_updated'));

      setProfileSuccessMsg('Admin profile updated successfully.');
    } catch (err) {
      console.error('Failed to update admin profile', err);
      const friendlyErr = getFirebaseErrorMessage(err);
      setProfileErrorMsg(friendlyErr || 'Failed to update profile. Please try again.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle Firebase Password Update
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.');
      return;
    }

    if (!newPassword) {
      setPasswordErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsPasswordSaving(true);

    try {
      await updateAdminPassword(newPassword, currentPassword);
      setPasswordSuccessMsg('Admin password updated successfully in Firebase.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to update admin password in Firebase:', err);
      const friendlyErr = getFirebaseErrorMessage(err);
      setPasswordErrorMsg(friendlyErr);
    } finally {
      setIsPasswordSaving(false);
    }
  };

  // Password validation checks
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = Boolean(newPassword && confirmPassword && newPassword === confirmPassword);

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Clean, Minimal, Compact)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Admin Settings
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                <span>Firebase Auth Active</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Manage administrator credentials, profile identity, and authentication security
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={loadProfile}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Reload profile defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 text-[11px] font-bold flex items-center space-x-1.5">
            <BadgeCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Role: Super Admin</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TWO-COLUMN BALANCED STUDIO (Profile on Left, Security on Right)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: Profile Details & Identity (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          
          {/* Profile Form Card */}
          <form
            onSubmit={handleProfileSave}
            className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <User className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                    Profile Identity
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Display name and administrative contact credentials
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                Identity
              </span>
            </div>

            {/* Profile Avatar Badge */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#18181E] rounded-xl border border-slate-200/90 dark:border-white/10 flex items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 font-black text-sm shrink-0 shadow-2xs">
                  {(adminName || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-950 dark:text-white truncate">
                    {adminName || 'Administrator'}
                  </p>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                    {adminEmail || 'admin@e2stories.com'}
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 shrink-0">
                Primary
              </span>
            </div>

            {/* Feedback Messages */}
            {profileErrorMsg && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{profileErrorMsg}</span>
                </div>
                <button type="button" onClick={() => setProfileErrorMsg('')} className="p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {profileSuccessMsg && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>{profileSuccessMsg}</span>
                </div>
                <button type="button" onClick={() => setProfileSuccessMsg('')} className="p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Form Inputs */}
            <div className="space-y-2.5 text-xs">
              {/* Admin Display Name */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Admin Display Name *</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => {
                      setAdminName(e.target.value);
                      if (profileSuccessMsg) setProfileSuccessMsg('');
                      if (profileErrorMsg) setProfileErrorMsg('');
                    }}
                    placeholder="Administrator"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                  />
                </div>
              </div>

              {/* Login Email Address */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Administrative Login Email *</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (profileSuccessMsg) setProfileSuccessMsg('');
                      if (profileErrorMsg) setProfileErrorMsg('');
                    }}
                    placeholder="admin@e2stories.com"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-400 font-medium">
                Used for platform topbar &amp; console logs
              </span>

              <button
                type="submit"
                disabled={isProfileSaving}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isProfileSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Account System Diagnostics Card */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5 text-xs">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Console Access Credentials
            </span>
            
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
              <span className="font-medium">Access Tier</span>
              <span className="font-bold text-slate-900 dark:text-white">Root Super Administrator</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
              <span className="font-medium">Auth Provider</span>
              <span className="font-bold text-slate-900 dark:text-white">Firebase Authentication</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
              <span className="font-medium">Session Protocol</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">TLS 1.3 / AES-256</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Password & Security (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-3">
          
          {/* Password Form Card */}
          <form
            onSubmit={handlePasswordSave}
            className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <KeyRound className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                    Security &amp; Password
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Update authentication password for this administrator account
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                Security
              </span>
            </div>

            {/* Feedback Messages */}
            {passwordErrorMsg && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{passwordErrorMsg}</span>
                </div>
                <button type="button" onClick={() => setPasswordErrorMsg('')} className="p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {passwordSuccessMsg && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>{passwordSuccessMsg}</span>
                </div>
                <button type="button" onClick={() => setPasswordSuccessMsg('')} className="p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Password Inputs */}
            <div className="space-y-2.5 text-xs">
              
              {/* Current Password */}
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (passwordSuccessMsg) setPasswordSuccessMsg('');
                      if (passwordErrorMsg) setPasswordErrorMsg('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password (2 Columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>New Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordSuccessMsg) setPasswordSuccessMsg('');
                        if (passwordErrorMsg) setPasswordErrorMsg('');
                      }}
                      placeholder="Min 6 characters"
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Confirm Password *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordSuccessMsg) setPasswordSuccessMsg('');
                        if (passwordErrorMsg) setPasswordErrorMsg('');
                      }}
                      placeholder="Repeat new password"
                      className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Validation Helper Pills */}
              <div className="flex items-center space-x-2 pt-0.5">
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  isLengthValid
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/10'
                }`}>
                  <Check className={`w-2.5 h-2.5 ${isLengthValid ? 'text-emerald-500' : 'opacity-40'}`} />
                  <span>≥ 6 chars</span>
                </span>

                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  isMatchValid
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/10'
                }`}>
                  <Check className={`w-2.5 h-2.5 ${isMatchValid ? 'text-emerald-500' : 'opacity-40'}`} />
                  <span>Passwords match</span>
                </span>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[10.5px] text-slate-400 font-medium">
                Applies immediately to future logins
              </span>

              <button
                type="submit"
                disabled={isPasswordSaving || !currentPassword || !newPassword || !confirmPassword || !isLengthValid || !isMatchValid}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isPasswordSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Security Best Practices Card */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-1.5 text-xs">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Security Best Practices
            </span>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Use a unique password not shared with other platforms. Changing credentials re-validates Firebase authentication sessions across active admin browsers.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
