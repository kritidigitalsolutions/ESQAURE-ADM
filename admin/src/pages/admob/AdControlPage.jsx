import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import adService from '../../services/adService';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import {
  Smartphone,
  ShieldCheck,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
  Layers,
  Sparkles,
  Crown,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Radio,
  Check
} from 'lucide-react';

// Mobile Traffic Strategies
const MOBILE_STRATEGIES = [
  {
    id: 'ADMOB_ONLY',
    title: 'AdMob Only',
    desc: 'Serves Google AdMob SDK units. Disables direct-sold custom campaigns.'
  },
  {
    id: 'CUSTOM_ONLY',
    title: 'Custom Only',
    desc: 'Serves direct-sold campaigns. Disables Google AdMob network entirely.'
  },
  {
    id: 'CUSTOM_FIRST',
    title: 'Custom Priority',
    desc: 'Serves Custom Ads first. Seamlessly falls back to AdMob if caps are reached.'
  }
];

// Mobile Placements
const MOBILE_PLACEMENTS = [
  {
    key: 'playerPreroll',
    title: 'Video Pre-Roll Ads',
    desc: 'Plays before episode video stream begins',
    icon: Film
  },
  {
    key: 'episodeTransition',
    title: 'Episode Interstitials',
    desc: 'Full-screen card shown between episodes',
    icon: Zap,
    hasInterval: true
  },
  {
    key: 'homeBanner',
    title: 'Home Feed Banners',
    desc: 'Display banners embedded inside catalog trays',
    icon: Layers
  },
  {
    key: 'drawerCard',
    title: 'Episode Drawer Cards',
    desc: 'Sponsored card in vertical episode selector',
    icon: Smartphone
  },
  {
    key: 'appOpen',
    title: 'App Open Splash Ads',
    desc: 'Full-screen splash shown on cold app launch',
    icon: Sparkles
  }
];

export default function AdControlPage({ onNavigate }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [initialFormJson, setInitialFormJson] = useState('');

  const [form, setForm] = useState({
    globalAdsEnabled: true,
    customAdsEnabled: true,
    admobEnabled: true,
    testMode: false,
    mediationMode: 'CUSTOM_ONLY',
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

  const toastTimerRef = useRef(null);
  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const isDirty = useMemo(() => {
    if (!initialFormJson) return false;
    return JSON.stringify(form) !== initialFormJson;
  }, [form, initialFormJson]);

  const activeSlotsCount = useMemo(() => {
    return MOBILE_PLACEMENTS.filter(p => {
      const ctrl = form.placementControls?.[p.key];
      return ctrl?.enabled && ctrl?.mode !== 'DISABLED';
    }).length;
  }, [form.placementControls]);

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getSettings();
      if (res?.success && res.data?.settings) {
        const s = res.data.settings;
        const normalized = {
          globalAdsEnabled: s.globalAdsEnabled !== undefined ? s.globalAdsEnabled : true,
          customAdsEnabled: s.customAdsEnabled !== undefined ? s.customAdsEnabled : true,
          admobEnabled: s.admobEnabled !== undefined ? s.admobEnabled : true,
          testMode: s.testMode !== undefined ? s.testMode : false,
          mediationMode: s.mediationMode || 'CUSTOM_ONLY',
          customAdSharePercent: s.customAdSharePercent ?? 50,
          vipBypassAds: s.vipBypassAds !== undefined ? s.vipBypassAds : true,
          globalAdFrequencyCap: s.globalAdFrequencyCap ?? 6,
          adUnits: {
            ...(s.adUnits || {}),
            interstitial: {
              ...(s.adUnits?.interstitial || {}),
              intervalEpisodes: s.adUnits?.interstitial?.intervalEpisodes ?? 3
            }
          },
          placementControls: {
            playerPreroll: s.placementControls?.playerPreroll || { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
            episodeTransition: s.placementControls?.episodeTransition || { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
            homeBanner: s.placementControls?.homeBanner || { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
            drawerCard: s.placementControls?.drawerCard || { mode: 'BOTH_CUSTOM_FIRST', enabled: true },
            appOpen: s.placementControls?.appOpen || { mode: 'DISABLED', enabled: false }
          }
        };
        setForm(normalized);
        setInitialFormJson(JSON.stringify(normalized));
        if (showIndicator) showToast('Settings synchronized with server');
      }
    } catch (err) {
      console.warn('Failed to load ad settings:', err);
      if (showIndicator) showToast('Failed to load settings', 'error');
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshing(false), 300);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [loadData]);

  const handleSave = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      await adService.updateSettings(form);
      setInitialFormJson(JSON.stringify(form));
      showToast('Mobile ad rules saved & synced live!');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStrategyChange = (stratId) => {
    setForm(prev => {
      let customAdsEnabled = true;
      let admobEnabled = true;
      if (stratId === 'CUSTOM_ONLY') {
        admobEnabled = false;
        customAdsEnabled = true;
      } else if (stratId === 'ADMOB_ONLY') {
        customAdsEnabled = false;
        admobEnabled = true;
      }

      return {
        ...prev,
        mediationMode: stratId,
        customAdsEnabled,
        admobEnabled
      };
    });
  };

  const handleMobileAdmobToggle = (nextVal) => {
    setForm(prev => {
      const nextAdmob = nextVal;
      let nextMode = prev.mediationMode;
      if (!nextAdmob && prev.customAdsEnabled) {
        nextMode = 'CUSTOM_ONLY';
      } else if (nextAdmob && !prev.customAdsEnabled) {
        nextMode = 'ADMOB_ONLY';
      } else if (nextAdmob && prev.customAdsEnabled) {
        nextMode = prev.mediationMode === 'ADMOB_ONLY' ? 'CUSTOM_FIRST' : prev.mediationMode;
      }
      return {
        ...prev,
        admobEnabled: nextAdmob,
        mediationMode: nextMode
      };
    });
  };

  const handleMobileCustomAdsToggle = (nextVal) => {
    setForm(prev => {
      const nextCustom = nextVal;
      let nextMode = prev.mediationMode;
      if (!nextCustom && prev.admobEnabled) {
        nextMode = 'ADMOB_ONLY';
      } else if (nextCustom && !prev.admobEnabled) {
        nextMode = 'CUSTOM_ONLY';
      } else if (nextCustom && prev.admobEnabled) {
        nextMode = prev.mediationMode === 'CUSTOM_ONLY' ? 'CUSTOM_FIRST' : prev.mediationMode;
      }
      return {
        ...prev,
        customAdsEnabled: nextCustom,
        mediationMode: nextMode
      };
    });
  };

  const handlePlacementToggle = (key) => {
    setForm(prev => {
      const current = prev.placementControls?.[key] || { mode: 'BOTH_CUSTOM_FIRST', enabled: true };
      const nextEnabled = !current.enabled;
      let defaultMode = 'BOTH_CUSTOM_FIRST';
      if (prev.mediationMode === 'CUSTOM_ONLY') defaultMode = 'CUSTOM_ONLY';
      if (prev.mediationMode === 'ADMOB_ONLY') defaultMode = 'ADMOB_ONLY';

      return {
        ...prev,
        placementControls: {
          ...prev.placementControls,
          [key]: {
            ...current,
            enabled: nextEnabled,
            mode: nextEnabled
              ? (current.mode === 'DISABLED' ? defaultMode : current.mode)
              : 'DISABLED'
          }
        }
      };
    });
  };

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black">

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Clean, Minimal, Compact)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 shadow-xs">
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Ads Control Center
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/30 text-amber-900 dark:text-amber-300 border border-amber-200/70 dark:border-amber-400/30">
                <Radio className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                <span>Live Sync Active</span>
              </span>
              {isDirty && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Unified orchestration to mediate and deliver ads across Mobile App platforms
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer disabled:opacity-50"
            title="Reload settings from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MASTER ENGINES & TRAFFIC STRATEGY (Unified Card)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                Master Engines & Traffic Strategy
              </h3>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                Control AdMob & Direct Custom ad pipelines and select default routing rule
              </p>
            </div>
          </div>
        </div>

        {/* Master Switches Strip (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* AdMob Toggle Card */}
          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Smartphone className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    Google AdMob Integration
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    form.admobEnabled
                      ? 'bg-amber-100 dark:bg-amber-400/10 text-amber-900 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {form.admobEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  Google AdMob SDK ads inside Android & iOS apps
                </p>
              </div>
            </div>
            <div className="shrink-0 pl-1">
              <ToggleSwitch
                enabled={form.admobEnabled}
                onChange={handleMobileAdmobToggle}
                size="sm"
                title="Toggle Google AdMob Integration"
              />
            </div>
          </div>

          {/* Custom Ads Toggle Card */}
          <div className="p-3 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    Direct Custom Ads Engine
                  </h4>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    form.customAdsEnabled
                      ? 'bg-amber-100 dark:bg-amber-400/10 text-amber-900 dark:text-amber-400'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {form.customAdsEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  Direct sponsor campaigns & in-house video promos
                </p>
              </div>
            </div>
            <div className="shrink-0 pl-1">
              <ToggleSwitch
                enabled={form.customAdsEnabled}
                onChange={handleMobileCustomAdsToggle}
                size="sm"
                title="Toggle Direct Custom Ads Engine"
              />
            </div>
          </div>
        </div>

        {/* Traffic Strategy 3-Option Cards */}
        <div className="pt-1">
          <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
            Default Traffic Routing Strategy
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {MOBILE_STRATEGIES.map((strat) => {
              const isSelected = form.mediationMode === strat.id;

              return (
                <div
                  key={strat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStrategyChange(strat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStrategyChange(strat.id);
                    }
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between select-none ${
                    isSelected
                      ? 'bg-amber-50/60 dark:bg-amber-400/[0.04] border border-amber-300 dark:border-amber-400/60 ring-1 ring-amber-400/30 shadow-xs'
                      : 'bg-white dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-950 dark:text-white">
                      {strat.title}
                    </span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border border-amber-500 bg-[#FACC15]'
                          : 'border border-slate-300 dark:border-white/20'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                    {strat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TWO-COLUMN BALANCED STUDIO (Placements on Left, Audience on Right)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* LEFT COLUMN: Placement Locations (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Film className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                    Mobile Placement Locations
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Toggle individual ad format slots inside the mobile app experience
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                {activeSlotsCount} of {MOBILE_PLACEMENTS.length} Active
              </span>
            </div>

            {/* Placements List */}
            <div className="space-y-2">
              {MOBILE_PLACEMENTS.map((slot) => {
                const Icon = slot.icon;
                const ctrl = form.placementControls?.[slot.key] || { mode: 'BOTH_CUSTOM_FIRST', enabled: true };
                const isEnabled = ctrl.enabled && ctrl.mode !== 'DISABLED';

                return (
                  <div
                    key={slot.key}
                    className={`p-2.5 sm:p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                      isEnabled
                        ? 'border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02]'
                        : 'border-slate-200/50 dark:border-white/5 opacity-60 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                        <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {slot.title}
                          </span>
                          
                          {/* Stepper interval for Interstitials */}
                          {slot.hasInterval && isEnabled && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-[#18181E] text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                              <span className="text-slate-400 font-semibold">Every</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = form.adUnits?.interstitial?.intervalEpisodes ?? 3;
                                  if (cur > 1) {
                                    setForm(p => ({
                                      ...p,
                                      adUnits: {
                                        ...p.adUnits,
                                        interstitial: { ...(p.adUnits?.interstitial || {}), intervalEpisodes: cur - 1 }
                                      }
                                    }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="font-extrabold text-slate-950 dark:text-white px-0.5">
                                {form.adUnits?.interstitial?.intervalEpisodes ?? 3}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = form.adUnits?.interstitial?.intervalEpisodes ?? 3;
                                  if (cur < 10) {
                                    setForm(p => ({
                                      ...p,
                                      adUnits: {
                                        ...p.adUnits,
                                        interstitial: { ...(p.adUnits?.interstitial || {}), intervalEpisodes: cur + 1 }
                                      }
                                    }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-slate-400 font-semibold">eps</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                          {slot.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-1">
                      <ToggleSwitch
                        enabled={isEnabled}
                        onChange={() => handlePlacementToggle(slot.key)}
                        size="sm"
                        title={isEnabled ? 'Mute placement' : 'Enable placement'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Audience Protections & Developer Sandbox (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Card 1: Audience Protections */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Crown className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                    Audience Protections
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Safeguard subscriber experience & limit ad fatigue
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* VIP Ad-Free Pass */}
              <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    VIP Ad-Free Pass
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                    Active paying subscribers never see any ads
                  </span>
                </div>
                <div className="shrink-0 pl-1">
                  <ToggleSwitch
                    enabled={form.vipBypassAds}
                    onChange={() => setForm(p => ({ ...p, vipBypassAds: !p.vipBypassAds }))}
                    size="sm"
                    title="Toggle VIP Ad-Free Pass"
                  />
                </div>
              </div>

              {/* Hourly Ad Limit */}
              <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    Hourly Ad Limit
                  </span>
                  <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                    Max ad impressions per free user
                  </span>
                </div>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 shrink-0">
                  {[3, 6, 10].map(cap => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, globalAdFrequencyCap: cap }))}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all cursor-pointer ${
                        form.globalAdFrequencyCap === cap
                          ? 'bg-[#FACC15] text-slate-950 font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      {cap}/hr
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Developer Sandbox & Overrides */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-2.5">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                  Developer Sandbox
                </h3>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                  Testing overrides for Google app review
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                  Sandbox Test Mode
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                  Serve Google test ad unit IDs during debugging
                </span>
              </div>
              <div className="shrink-0 pl-1">
                <ToggleSwitch
                  enabled={form.testMode}
                  onChange={() => setForm(p => ({ ...p, testMode: !p.testMode }))}
                  size="sm"
                  title="Sandbox Test Mode"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. TOAST NOTIFICATION
         ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[99999] flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-bold transition-all border animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-700'
              : 'bg-slate-950 dark:bg-[#18181E] text-white border-amber-300/40 dark:border-amber-400/30 shadow-xs'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
