import React, { useState } from 'react';
import ToggleSwitch from '../../../components/common/ToggleSwitch';
import {
  SlidersHorizontal,
  Crown,
  Clock,
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight
} from 'lucide-react';

const MEDIATION_STRATEGIES = [
  {
    id: 'CUSTOM_FIRST',
    title: 'Custom Ads First (Fallback to AdMob)',
    badge: 'Recommended for Max Revenue',
    desc: 'Always attempts to serve direct sponsor & in-house campaigns first (100% margin). If no active custom ad matches the placement, automatically falls back to Google AdMob.',
    icon: Sparkles
  },
  {
    id: 'ADMOB_FIRST',
    title: 'Google AdMob First',
    badge: 'Standard Network',
    desc: 'Requests Google AdMob ad units first to prioritize fill rate. Custom ads only serve as secondary backfill if AdMob fails or has low eCPM.',
    icon: Zap
  },
  {
    id: 'PERCENTAGE_SPLIT',
    title: 'Dynamic Traffic Split (Custom vs AdMob)',
    badge: 'A/B Monetization',
    desc: 'Distribute ad impression requests by percentage (e.g. 50% Custom Direct Ads, 50% Google AdMob).',
    icon: SlidersHorizontal
  },
  {
    id: 'CUSTOM_ONLY',
    title: 'Custom Direct Sponsors Only',
    badge: 'Zero External SDK Traffic',
    desc: 'Only serve direct sponsor campaigns and in-house OTT promos. Completely bypasses Google AdMob network.',
    icon: Layers
  },
  {
    id: 'ADMOB_ONLY',
    title: 'Google AdMob Only',
    badge: 'Automated Programmatic',
    desc: 'Only serve Google AdMob ads. In-house custom ads will be ignored.',
    icon: Zap
  }
];

export default function MediationTab({ settings, onSaveSettings }) {
  const [form, setForm] = useState(() => ({
    mediationMode: settings?.mediationMode || 'CUSTOM_FIRST',
    customAdSharePercent: settings?.customAdSharePercent ?? 50,
    vipBypassAds: settings?.vipBypassAds ?? true,
    globalAdFrequencyCap: settings?.globalAdFrequencyCap ?? 6
  }));

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save mediation settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-urbanist">
      
      {/* Strategy Selection Container */}
      <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
        <div className="mb-4 pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-black text-slate-950 dark:text-white">
            Mediation & Ad Waterfall Delivery Rules
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Determine how the OTT player and mobile app select between direct custom sponsors and Google AdMob.
          </p>
        </div>

        <div className="space-y-3">
          {MEDIATION_STRATEGIES.map((strat) => {
            const Icon = strat.icon;
            const isSelected = form.mediationMode === strat.id;

            return (
              <div
                key={strat.id}
                onClick={() => setForm(p => ({ ...p, mediationMode: strat.id }))}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FEF08A]/15 dark:bg-[#FEF08A]/10 border-amber-300 dark:border-amber-400 ring-1 ring-amber-300 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-[#18181E] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#FEF08A] text-slate-950'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                          {strat.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-[#FEF08A]/20 text-amber-900 dark:text-[#FEF08A] border border-amber-200 dark:border-amber-400/30">
                          {strat.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {strat.desc}
                      </p>
                    </div>
                  </div>

                  {/* Radio circle */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-slate-300 dark:border-white/20'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                  </div>
                </div>

                {/* Conditional Traffic Split Slider */}
                {strat.id === 'PERCENTAGE_SPLIT' && isSelected && (
                  <div className="mt-4 pt-3.5 border-t border-amber-300/40 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Direct Custom Ads: <strong className="text-amber-600 dark:text-[#FEF08A]">{form.customAdSharePercent}%</strong></span>
                      <span>Google AdMob: <strong className="text-emerald-600 dark:text-emerald-400">{100 - form.customAdSharePercent}%</strong></span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="95"
                      step="5"
                      value={form.customAdSharePercent}
                      onChange={(e) => setForm(p => ({ ...p, customAdSharePercent: Number(e.target.value) }))}
                      className="w-full accent-[#FEF08A] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* VIP Protection & Frequency Capping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* VIP Shield */}
        <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Crown className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">
                VIP Subscriber Ad-Free Shield
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Automatically bypass all advertisements (both AdMob and custom sponsors) for users with an active paid OTT subscription plan.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {form.vipBypassAds ? 'Shield Active (VIPs See 0 Ads)' : 'Disabled (Ads Shown to VIPs)'}
            </span>
            <ToggleSwitch
              enabled={form.vipBypassAds}
              onChange={() => setForm(p => ({ ...p, vipBypassAds: !p.vipBypassAds }))}
              title="VIP Ad-Free Shield"
            />
          </div>
        </div>

        {/* Global Hourly Frequency Capping */}
        <div className="bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Clock className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h4 className="text-sm font-black text-slate-950 dark:text-white">
                Global Hourly Frequency Cap
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Maximum interstitial and video pre-roll impressions permitted per free user per hour to preserve audience retention and prevent app fatigue.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Max Ads Per Hour:
            </span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="30"
                value={form.globalAdFrequencyCap}
                onChange={(e) => setForm(p => ({ ...p, globalAdFrequencyCap: Number(e.target.value) }))}
                className="w-16 px-2 py-1 text-xs text-center font-black rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
              />
              <span className="text-xs text-slate-400 font-bold">Ads / Hour</span>
            </div>
          </div>
        </div>

      </div>

      {/* Save Button Dock */}
      <div className="sticky bottom-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#18181E]/95 backdrop-blur-md border border-slate-200 dark:border-white/15 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Mediation and delivery rules successfully saved!
            </span>
          )}
          {!saveSuccess && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Rules apply dynamically to all live mobile app sessions.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isSaving ? 'Saving...' : 'Save Mediation Rules'}</span>
        </button>
      </div>

    </form>
  );
}
