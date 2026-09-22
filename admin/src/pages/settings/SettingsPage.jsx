import React, { useState } from 'react';
import { Settings, Shield, Server, Key, FileText, CheckCircle2, Save, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [defaultQuality, setDefaultQuality] = useState('1080p');
  const [autoplayNext, setAutoplayNext] = useState(true);
  const [freeTeaserCount, setFreeTeaserCount] = useState(3);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div class="space-y-6 font-urbanist max-w-4xl">
      
      {/* Top Header */}
      <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-extrabold text-slate-950">Platform Settings</h2>
          <p class="text-xs text-slate-400 mt-0.5">Manage default video quality, cloud storage connections, and payment settings.</p>
        </div>
        {isSaved && (
          <span class="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl animate-fade-in">
            <CheckCircle2 class="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} class="space-y-6">
        
        {/* Streaming & Playback Engine */}
        <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Server class="w-4 h-4 text-amber-500" />
            <h3 class="font-extrabold text-sm text-slate-950">Video & Playback Settings</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Default Video Quality</label>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:outline-none focus:border-[#FEF08A]"
              >
                <option value="1080p">1080p Full HD (VIP Default)</option>
                <option value="720p">720p HD (Standard)</option>
                <option value="Auto">Auto (Adaptive)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Number of Free Episodes</label>
              <input
                type="number"
                value={freeTeaserCount}
                onChange={(e) => setFreeTeaserCount(e.target.value)}
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 bg-slate-50 focus:outline-none focus:border-[#FEF08A]"
              />
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span class="font-bold text-slate-900 block">Autoplay Next Episode in Vertical Player</span>
              <span class="text-[11px] text-slate-400">Instantly plays the next 2-minute episode on end</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                class="sr-only peer"
              />
              <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#080B08]"></div>
            </label>
          </div>
        </div>

        {/* Cloud Infrastructure & CDN Status */}
        <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Shield class="w-4 h-4 text-emerald-500" />
            <h3 class="font-extrabold text-sm text-slate-950">Storage & API Integrations</h3>
          </div>

          <div class="space-y-2.5 text-xs">
            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <p class="font-bold text-slate-900">AWS S3 Media Bucket</p>
                <p class="text-[11px] text-slate-400 font-mono">arn:aws:s3:::esquare-media-prod-ap-south-1</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                CONNECTED (ap-south-1)
              </span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <p class="font-bold text-slate-900">Razorpay Payment Gateway</p>
                <p class="text-[11px] text-slate-400 font-mono">rzp_live_••••••••••••8819</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                WEBHOOK VERIFIED
              </span>
            </div>

            <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div>
                <p class="font-bold text-slate-900">SMS OTP Gateway (India +91)</p>
                <p class="text-[11px] text-slate-400">MSG91 Enterprise Route with DLT Template ID</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                DLT ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Legal & Compliance Policies */}
        <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus space-y-4">
          <div class="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <FileText class="w-4 h-4 text-blue-500" />
            <h3 class="font-extrabold text-sm text-slate-950">Legal & App Store Compliance</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p class="font-bold text-slate-900">Terms & Conditions</p>
                <p class="text-[10px] text-slate-400">Version 2.1 • Last updated Aug 2026</p>
              </div>
              <button type="button" class="text-[#080B08] font-bold text-xs hover:underline flex items-center space-x-1">
                <span>Edit</span>
                <ExternalLink class="w-3 h-3" />
              </button>
            </div>

            <div class="p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p class="font-bold text-slate-900">Privacy Policy (DPDP Act)</p>
                <p class="text-[10px] text-slate-400">Indian DPDP & GDPR Compliant</p>
              </div>
              <button type="button" class="text-[#080B08] font-bold text-xs hover:underline flex items-center space-x-1">
                <span>Edit</span>
                <ExternalLink class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button Bar */}
        <div class="flex items-center justify-end space-x-3">
          <button
            type="submit"
            class="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl flex items-center space-x-2 transition-all"
          >
            <Save class="w-4 h-4 text-black" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
}
