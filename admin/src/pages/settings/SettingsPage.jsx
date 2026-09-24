import React, { useState } from 'react';
import { Settings, Shield, Server, Key, FileText, CheckCircle2, Save, ExternalLink, Palette, Sparkles, Sun, Moon } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsPage() {
  const [defaultQuality, setDefaultQuality] = useState('1080p');
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [freeTeaserCount, setFreeTeaserCount] = useState(3);
  const [isSaved, setIsSaved] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6 font-urbanist max-w-4xl">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Platform Settings</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage themes, default video quality, cloud storage connections, and compliance.</p>
        </div>
        {isSaved && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl animate-fade-in border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Radical Theme & Appearance Section */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Appearance & Radial Theme Engine</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FEF08A]" />
              Radial View Transitions Active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Interface Theme Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Experience the radical circular reveal transition expanding across the entire viewport. Shortcut: <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-[#121612] border border-slate-300 dark:border-white/10 rounded text-slate-700 dark:text-slate-300 font-bold">Alt + T</kbd>
              </p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <ThemeToggle variant="pill" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <button
              type="button"
              onClick={(e) => !isDark && toggleTheme(e)}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                !isDark
                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-400/20'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B16] hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Light Mode</span>
                  {!isDark && <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 px-1.5 py-0.2 bg-amber-200/60 dark:bg-amber-900/60 rounded">Active</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  High-contrast crisp slate with clean cards and optimized daytime legibility.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={(e) => isDark && toggleTheme(e)}
              className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                isDark
                  ? 'border-[#FEF08A] bg-[#FEF08A]/5 ring-2 ring-[#FEF08A]/20'
                  : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#161B16] hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-slate-900 text-[#FEF08A] dark:bg-[#FEF08A]/30 dark:text-[#FEF08A] shrink-0 border border-slate-800 dark:border-amber-700/40">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Dark Mode (Obsidian)</span>
                  {isDark && <span className="text-[10px] font-extrabold text-[#FEF08A] px-1.5 py-0.2 bg-[#FEF08A]/20 rounded">Active</span>}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Deep OLED aesthetic with golden neon accents and reduced eye strain.
                </p>
              </div>
            </button>
          </div>
        </div>
        
        {/* Streaming & Playback Engine */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-white/10 pb-3">
            <Server className="w-4 h-4 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Video & Playback Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Video Quality</label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#161B16] focus:outline-none focus:border-[#FEF08A]"
              >
                <option value="1080p">1080p Full HD (Subscriber Default)</option>
                <option value="720p">720p HD (Standard)</option>
                <option value="Auto">Auto (Adaptive)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Free Episodes</label>
              <input
                type="number"
                value={freeTeaserCount}
                onChange={(e) => setFreeTeaserCount(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#161B16] focus:outline-none focus:border-[#FEF08A]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">Autoplay Next Episode in Vertical Player</span>
              <span className="text-[11px] text-slate-400">Instantly plays the next 2-minute episode on end</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#080B08] dark:peer-checked:bg-[#FEF08A]"></div>
            </label>
          </div>
        </div>

        {/* Cloud Infrastructure & CDN Status */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-white/10 pb-3">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Storage & API Integrations</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#161B16]">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">AWS S3 Media Bucket</p>
                <p className="text-[11px] text-slate-400 font-mono">arn:aws:s3:::esquare-media-prod-ap-south-1</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                CONNECTED (ap-south-1)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#161B16]">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Razorpay Payment Gateway</p>
                <p className="text-[11px] text-slate-400 font-mono">rzp_live_••••••••••••8819</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                WEBHOOK VERIFIED
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#161B16]">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">SMS OTP Gateway (India +91)</p>
                <p className="text-[11px] text-slate-400">MSG91 Enterprise Route with DLT Template ID</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                DLT ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Legal & Compliance Policies */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus space-y-4 transition-colors">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-white/10 pb-3">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">Legal & App Store Compliance</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-[#161B16]">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Terms & Conditions</p>
                <p className="text-[10px] text-slate-400">Version 2.1 • Last updated Aug 2026</p>
              </div>
              <button type="button" className="text-amber-600 dark:text-[#FEF08A] font-bold text-xs hover:underline flex items-center space-x-1">
                <span>Edit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/40 dark:bg-[#161B16]">
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Privacy Policy (DPDP Act)</p>
                <p className="text-[10px] text-slate-400">Indian DPDP & GDPR Compliant</p>
              </div>
              <button type="button" className="text-amber-600 dark:text-[#FEF08A] font-bold text-xs hover:underline flex items-center space-x-1">
                <span>Edit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="submit"
            className="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all shadow-sm hover:shadow active:scale-98"
          >
            <Save className="w-4 h-4 text-black" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
}
