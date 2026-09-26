import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Save, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';

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
  useEffect(() => {
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
  }, []);

  // Handle Admin Profile Update (Name & Login Email)
  const handleProfileSave = (e) => {
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

    setTimeout(() => {
      try {
        const cleanName = adminName.trim();
        const cleanEmail = adminEmail.trim();
        localStorage.setItem('admin_user_name', cleanName);
        localStorage.setItem('admin_user_email', cleanEmail);
        
        // Notify other components (e.g. Topbar) of profile update
        window.dispatchEvent(new Event('admin_profile_updated'));
        
        setProfileSuccessMsg('Admin profile updated successfully.');
      } catch (err) {
        console.error('Failed to update admin profile', err);
        setProfileErrorMsg('Failed to update profile. Please try again.');
      } finally {
        setIsProfileSaving(false);
      }
    }, 400);
  };

  // Handle Password Update
  const handlePasswordSave = (e) => {
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

    setTimeout(() => {
      setIsPasswordSaving(false);
      setPasswordSuccessMsg('Admin password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  return (
    <div className="space-y-6 font-urbanist max-w-4xl">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Admin Settings</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your administrator name, login email address, and security password.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Admin Profile Controls (Name & Login Email Update) */}
      <form onSubmit={handleProfileSave} className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
              <User className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Profile Details</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Update admin display name and login email address</p>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {profileErrorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{profileErrorMsg}</span>
          </div>
        )}

        {profileSuccessMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Admin Name */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Admin Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/60 transition-colors"
              />
            </div>
          </div>

          {/* Login Email */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Login Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/60 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save Profile Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isProfileSaving}
            className="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isProfileSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>Save Profile Details</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 2. Password Update Controls */}
      <form onSubmit={handlePasswordSave} className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
              <KeyRound className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Security & Password</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Update your account login password</p>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {passwordErrorMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{passwordErrorMsg}</span>
          </div>
        )}

        {passwordSuccessMsg && (
          <div className="flex items-center space-x-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{passwordSuccessMsg}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
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
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordSuccessMsg) setPasswordSuccessMsg('');
                    if (passwordErrorMsg) setPasswordErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordSuccessMsg) setPasswordSuccessMsg('');
                    if (passwordErrorMsg) setPasswordErrorMsg('');
                  }}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] focus:ring-1 focus:ring-[#FEF08A]/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Update Password Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isPasswordSaving}
            className="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-extrabold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-60"
          >
            {isPasswordSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-slate-950" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </form>

    </div>
  );
}

