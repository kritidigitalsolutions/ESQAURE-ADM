import React, { useState, useEffect, useCallback } from 'react';
import adService from '../../services/adService';
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
  ArrowRight,
  Film,
  Smartphone,
  RefreshCw,
  Check,
  ToggleLeft,
  ToggleRight,
  Coins,
  ShieldAlert
} from 'lucide-react';

const MEDIATION_STRATEGIES = [
  {
    id: 'CUSTOM_FIRST',
    title: 'Both — Custom Ads First (Fallback to AdMob)',
    badge: 'Recommended for Max Revenue',
    desc: 'Always attempts to serve direct sponsor & in-house campaigns first (100% margin). If no active custom ad matches the placement, automatically falls back to Google AdMob.',
    icon: Sparkles
  },
  {
    id: 'ADMOB_FIRST',
    title: 'Both — Google AdMob First (Custom Backfill)',
    badge: 'Standard Network',
    desc: 'Requests Google AdMob ad units first to prioritize fill rate. Custom ads only serve as secondary backfill if AdMob fails or has low eCPM.',
    icon: Zap
  },
  {
    id: 'PERCENTAGE_SPLIT',
    title: 'Both — Dynamic Traffic Split (Custom vs AdMob)',
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
    icon: Coins
  }
];

const PLACEMENT_CONFIGS = [
  {
    key: 'playerPreroll',
    placementEnum: 'PLAYER_PREROLL',
    title: 'Video Player Pre-Roll Ads',
    desc: 'Plays 10-15s ad before drama episode stream begins.',
    icon: Film
  },
  {
    key: 'episodeTransition',
    placementEnum: 'EPISODE_TRANSITION',
    title: 'Episode Transition & End Interstitials',
    desc: 'Full-screen interstitial cards or video between episode switches.',
    icon: Zap,
    hasInterval: true
  },
  {
    key: 'homeBanner',
    placementEnum: 'HOME_BANNER',
    title: 'Home Page Hero & Feed Banners',
    desc: 'Landscape display banners embedded in catalog trays.',
    icon: Layers
  },
  {
    key: 'drawerCard',
    placementEnum: 'DRAWER_CARD',
    title: 'Episodes Drawer & Catalog Cards',
    desc: 'Sponsored cards placed inside the vertical episodes drawer.',
    icon: Smartphone
  },
  {
    key: 'appOpen',
    placementEnum: 'GLOBAL_POPUP',
    title: 'App Open / Cold Start Splash Ads',
    desc: 'Full screen splash card displayed when the mobile app opens.',
    icon: Sparkles
  }
];

export default function AdControlPage({ onNavigate }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    globalAdsEnabled: true,
    customAdsEnabled: true,
    admobEnabled: true,
    testMode: false,
    mediationMode: 'CUSTOM_FIRST',
    customAdSharePercent: 50,
    vipBypassAds: true,
    globalAdFrequencyCap: 6,
    adUnits: {
      interstitial: { intervalEpisodes: 3 }
    },
    placementControls: {
      playerPreroll: { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
      episodeTransition: { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
      homeBanner: { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
      drawerCard: { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
      appOpen: { mode: 'DISABLED', enabled: false }
    }
  });

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getSettings();
      if (res?.success && res.data?.settings) {
        setForm(prev => ({
          ...prev,
          ...res.data.settings,
          placementControls: {
            ...prev.placementControls,
            ...(res.data.settings.placementControls || {})
          }
        }));
      }
    } catch (err) {
      console.warn('Failed to load ad control settings:', err);
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePlacementModeChange = (key, mode) => {
    setForm(prev => ({
      ...prev,
      placementControls: {
        ...prev.placementControls,
        [key]: {
          ...prev.placementControls[key],
          mode,
          enabled: mode !== 'DISABLED'
        }
      }
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adService.updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update ad control settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-urbanist animate-fade-in pb-12">
      
      {/* Sleek Action & Status Strip */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Synchronized Mediation:
            </span>
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              Active with Mobile Apps
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FEF08A]/30 text-amber-950 dark:text-[#FEF08A] border border-amber-300/40 dark:border-amber-700/40">
            {form.mediationMode.replace(/_/g, ' ')}
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline-block">
            VIP Pass Bypass: {form.vipBypassAds ? 'Enabled' : 'Off'}
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Settings</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* 1. Master Engine Toggles Card */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
          <div className="mb-3.5 pb-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Master Ad Engine Switches
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Turn individual ad networks or the entire ad infrastructure on or off network-wide.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Global Master Switch */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              form.globalAdsEnabled
                ? 'bg-slate-50 dark:bg-[#161B16] border-slate-200/70 dark:border-white/10'
                : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  All Ads Master Switch
                </span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, globalAdsEnabled: !p.globalAdsEnabled }))}
                  className="cursor-pointer"
                >
                  {form.globalAdsEnabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-rose-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.globalAdsEnabled ? 'Ad delivery is active across platform' : 'All ads completely turned OFF'}
              </p>
            </div>

            {/* Custom Ads Network Switch */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Custom Ads Network</span>
                </span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, customAdsEnabled: !p.customAdsEnabled }))}
                  className="cursor-pointer"
                >
                  {form.customAdsEnabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.customAdsEnabled ? 'Direct sponsor ads enabled' : 'Custom ads disabled'}
              </p>
            </div>

            {/* Google AdMob Network Switch */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Google AdMob</span>
                </span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, admobEnabled: !p.admobEnabled }))}
                  className="cursor-pointer"
                >
                  {form.admobEnabled ? (
                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.admobEnabled ? 'Serving programmatic AdMob ads' : 'AdMob network disabled'}
              </p>
            </div>

            {/* Developer Test Mode */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sandbox Test Mode</span>
                </span>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, testMode: !p.testMode }))}
                  className="cursor-pointer"
                >
                  {form.testMode ? (
                    <ToggleRight className="w-7 h-7 text-amber-500" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.testMode ? 'Using Google test unit IDs' : 'Live production ads active'}
              </p>
            </div>

          </div>
        </div>

        {/* 2. Central Mediation & Delivery Strategy */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
          <div className="mb-3.5 pb-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Primary Mediation & Delivery Mode
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Select how the mobile app chooses between Custom Ads and Google AdMob.
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FEF08A]/15 dark:bg-[#FEF08A]/10 border-amber-300 dark:border-amber-400 ring-1 ring-amber-300 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-[#161B16] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-[#FEF08A]/20 text-amber-900 dark:text-[#FEF08A] border border-amber-200 dark:border-amber-700/40">
                            {strat.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {strat.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-slate-300 dark:border-white/20'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                    </div>
                  </div>

                  {/* Percentage Split Slider */}
                  {strat.id === 'PERCENTAGE_SPLIT' && isSelected && (
                    <div className="mt-3.5 pt-3 border-t border-amber-300/40 dark:border-white/10 space-y-2">
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

        {/* 3. Granular Placement-by-Placement Synchronized Control Matrix */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
          <div className="mb-3.5 pb-3 border-b border-slate-100 dark:border-white/10">
            <h3 className="text-base font-black text-slate-950 dark:text-white">
              Placement-by-Placement Synchronization
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Specify what type of ad to serve in each unique mobile app slot (Both with fallback, Custom Only, AdMob Only, or Disabled).
            </p>
          </div>

          <div className="space-y-3">
            {PLACEMENT_CONFIGS.map((slot) => {
              const Icon = slot.icon;
              const ctrl = form.placementControls?.[slot.key] || { mode: 'BOTH_CUSTOM_FIRST', enabled: true };
              const currentMode = ctrl.mode;

              return (
                <div
                  key={slot.key}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        {slot.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {slot.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Mode Buttons */}
                    {[
                      { id: 'BOTH_CUSTOM_FIRST', label: 'Both (Custom 1st)' },
                      { id: 'CUSTOM_ONLY', label: 'Custom Only' },
                      { id: 'ADMOB_ONLY', label: 'AdMob Only' },
                      { id: 'DISABLED', label: 'Disabled' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() => handlePlacementModeChange(slot.key, btn.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          currentMode === btn.id
                            ? btn.id === 'DISABLED'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-black border border-rose-200 dark:border-rose-800/60'
                              : 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                            : 'bg-white dark:bg-[#202620] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. VIP Subscriber Protection & Frequency Capping */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* VIP Shield */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
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
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, vipBypassAds: !p.vipBypassAds }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  form.vipBypassAds ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.vipBypassAds ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Hourly Frequency Capping */}
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
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
                  className="w-16 px-2 py-1 text-xs text-center font-black rounded-lg bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-400 font-bold">Ads / Hour</span>
              </div>
            </div>
          </div>

        </div>

        {/* Save Bar */}
        <div className="sticky bottom-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#161B16]/95 backdrop-blur-md border border-slate-200 dark:border-white/15 shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Ad Control rules successfully synchronized and saved!
              </span>
            )}
            {!saveSuccess && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Changes take effect dynamically on all live mobile app sessions.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving...' : 'Save Ad Control Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
