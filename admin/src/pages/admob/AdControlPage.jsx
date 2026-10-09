import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import adService from '../../services/adService';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import {
  Sparkles,
  Save,
  Loader2,
  CheckCircle2,
  Zap,
  Film,
  Layers,
  Smartphone,
  RefreshCw,
  Coins,
  Crown,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  Activity,
  Radio
} from 'lucide-react';

// 3 Core Delivery Strategies
const MAIN_STRATEGIES = [
  {
    id: 'CUSTOM_FIRST',
    backendMode: 'CUSTOM_FIRST',
    title: 'Smart Auto',
    subtitle: 'Custom ads 1st → AdMob fallback',
    desc: 'Direct custom ads first. Automatically fills with Google AdMob if none active.',
    icon: Sparkles,
    badge: 'Max Revenue'
  },
  {
    id: 'CUSTOM_ONLY',
    backendMode: 'CUSTOM_ONLY',
    title: 'Custom Ads',
    subtitle: 'Direct campaigns & OTT promos',
    desc: 'Only displays direct custom ad campaigns. Google AdMob is completely turned off.',
    icon: Layers,
    badge: '100% Margin'
  },
  {
    id: 'ADMOB_ONLY',
    backendMode: 'ADMOB_ONLY',
    title: 'Google AdMob',
    subtitle: 'Fully automated network',
    desc: 'Serves Google AdMob programmatic ads exclusively. Custom ad campaigns are bypassed.',
    icon: Coins,
    badge: 'Automated'
  }
];

// 5 Mobile Placement Locations
const PLACEMENT_LIST = [
  {
    key: 'playerPreroll',
    title: 'Video Pre-Roll Ads',
    desc: 'Plays before episode video stream begins',
    icon: Film
  },
  {
    key: 'episodeTransition',
    title: 'Between Episodes Interstitial',
    desc: 'Full-screen card when transitioning episodes',
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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
          mediationMode: s.mediationMode || 'CUSTOM_FIRST',
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
        if (showIndicator) showToast('Settings refreshed from server');
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
      showToast('Settings saved & synced across mobile apps!');
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
      if (stratId === 'CUSTOM_ONLY') admobEnabled = false;
      if (stratId === 'ADMOB_ONLY') customAdsEnabled = false;

      return {
        ...prev,
        mediationMode: stratId,
        customAdsEnabled,
        admobEnabled
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

  const activePlacementsCount = useMemo(() => {
    return PLACEMENT_LIST.filter(p => {
      const ctrl = form.placementControls?.[p.key];
      return ctrl?.enabled && ctrl?.mode !== 'DISABLED';
    }).length;
  }, [form.placementControls]);

  return (
    <div className="w-full space-y-6 font-urbanist animate-fade-in pb-10 selection:bg-[#FEF08A] selection:text-black">

      {/* ─────────────────────────────────────────────────────────────
          1. CLEAN TOP HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
            Ad Delivery & Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Configure mobile ad mediation priorities, placement switches, and audience fatigue limits.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#161B16] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Reload settings from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              isDirty
                ? 'bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black ring-2 ring-[#FEF08A]/40'
                : 'bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-600 border border-slate-200/70 dark:border-white/5 cursor-not-allowed'
            }`}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MASTER KILL-SWITCH (Single quiet hero card)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Radio className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
                Global App Ads
              </h2>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${
                form.globalAdsEnabled
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.globalAdsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {form.globalAdsEnabled ? 'Active' : 'Muted'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate sm:whitespace-normal">
              Master switch for all video pre-rolls, interstitials, sponsor banners and app open splash ads.
            </p>
          </div>
        </div>

        <div className="shrink-0 pl-2">
          <ToggleSwitch
            enabled={form.globalAdsEnabled}
            onChange={() => setForm(p => ({ ...p, globalAdsEnabled: !p.globalAdsEnabled }))}
            title="Master switch for all ads"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. DELIVERY STRATEGY (Clean, Modern Segmented Cards)
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-urbanist">
              Mediation Strategy
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 hidden sm:block">
              Choose how sponsor campaigns and programmatic ads are prioritized across the app.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            Active: <strong className="text-slate-900 dark:text-white font-bold">{MAIN_STRATEGIES.find(s => s.id === form.mediationMode)?.title || 'Smart Auto'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MAIN_STRATEGIES.map((strat) => {
            const isSelected = form.mediationMode === strat.id;
            const Icon = strat.icon;

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
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#FEF08A] ${
                  isSelected
                    ? 'bg-amber-50/40 dark:bg-[#161B16] border-amber-300 dark:border-[#FEF08A]/60 ring-2 ring-[#FEF08A]/30 shadow-xs'
                    : 'bg-white dark:bg-[#121612] border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  {/* Header Row: Icon + Badge + Clean Radio Check */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#FEF08A] text-slate-950 shadow-xs ring-1 ring-amber-300/70 dark:ring-transparent'
                        : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/10 group-hover:scale-105'
                    }`}>
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${
                        isSelected
                          ? 'bg-[#FEF08A]/50 dark:bg-[#FEF08A]/20 text-slate-950 dark:text-[#FEF08A] border border-amber-300/60 dark:border-[#FEF08A]/30'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5'
                      }`}>
                        {strat.badge}
                      </span>

                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-[#FEF08A] text-slate-950 ring-2 ring-amber-300/50 dark:ring-[#FEF08A]/30 shadow-xs'
                          : 'border-2 border-slate-300 dark:border-white/20 group-hover:border-slate-400 dark:group-hover:border-white/30'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white tracking-tight">
                      {strat.title}
                    </h4>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                      {strat.subtitle}
                    </p>
                  </div>

                  {/* Clean Description */}
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-medium">
                    {strat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. PLACEMENT LOCATIONS & AUDIENCE SAFEGUARDS (Balanced 2 Columns)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ── LEFT COLUMN (7 Cols): PLACEMENT SLOTS (Single Unified Card) ── */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-urbanist">
              Placement Locations
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <strong className="text-slate-800 dark:text-slate-200">{activePlacementsCount} of {PLACEMENT_LIST.length}</strong> slots enabled
            </span>
          </div>

          <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
            {PLACEMENT_LIST.map((slot) => {
              const Icon = slot.icon;
              const ctrl = form.placementControls?.[slot.key] || { mode: 'BOTH_CUSTOM_FIRST', enabled: true };
              const isEnabled = ctrl.enabled && ctrl.mode !== 'DISABLED';

              return (
                <div
                  key={slot.key}
                  className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                    isEnabled ? 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]' : 'opacity-60 bg-slate-50/20 dark:bg-white/[0.01]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {slot.title}
                        </span>
                        {slot.hasInterval && isEnabled && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161B16] text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            <span>Every</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={form.adUnits?.interstitial?.intervalEpisodes ?? 3}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                setForm(p => ({
                                  ...p,
                                  adUnits: {
                                    ...p.adUnits,
                                    interstitial: {
                                      ...(p.adUnits?.interstitial || {}),
                                      intervalEpisodes: val
                                    }
                                  }
                                }));
                              }}
                              className="w-6 text-center font-black rounded bg-white dark:bg-[#121612] text-slate-950 dark:text-white text-xs border border-slate-300 dark:border-white/20"
                            />
                            <span>eps</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                        {slot.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <ToggleSwitch
                      enabled={isEnabled}
                      onChange={() => handlePlacementToggle(slot.key)}
                      title={isEnabled ? 'Mute placement' : 'Enable placement'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 Cols): AUDIENCE SAFEGUARDS & OVERRIDES ── */}
        <div className="lg:col-span-5 space-y-4">

          {/* Card: Audience Protections */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-urbanist px-0.5">
              Audience Protections
            </h3>

            <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
              {/* VIP Pass */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Crown className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                      VIP Ad-Free Pass
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate font-medium">
                      Subscribers never see any ads
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <ToggleSwitch
                    enabled={form.vipBypassAds}
                    onChange={() => setForm(p => ({ ...p, vipBypassAds: !p.vipBypassAds }))}
                    title="Toggle VIP Ad-Free Pass"
                  />
                </div>
              </div>

              {/* Hourly Cap */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Clock className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                      Hourly Ad Limit
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate font-medium">
                      Cap per free user / hr
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {[3, 6, 10].map(cap => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, globalAdFrequencyCap: cap }))}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        form.globalAdFrequencyCap === cap
                          ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                          : 'bg-slate-100 dark:bg-[#161B16] text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200/70 dark:border-white/10'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible: Developer Sandbox & Overrides */}
          <div className="border border-slate-200/90 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-[#121612] shadow-xs">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3.5 hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Developer Sandbox & Overrides</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showAdvanced && (
              <div className="p-3.5 border-t border-slate-100 dark:border-white/5 space-y-3 text-xs animate-fade-in bg-slate-50/30 dark:bg-black/10">
                {/* Sandbox Test Mode */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Sandbox Test Mode
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Use Google test unit IDs safely
                    </span>
                  </div>
                  <ToggleSwitch
                    enabled={form.testMode}
                    onChange={() => setForm(p => ({ ...p, testMode: !p.testMode }))}
                    title="Sandbox Test Mode"
                  />
                </div>

                {/* Per-Placement Source Override */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px]">
                    Per-Placement Source Override
                  </span>
                  {PLACEMENT_LIST.map((slot) => {
                    const ctrl = form.placementControls?.[slot.key] || { mode: 'BOTH_CUSTOM_FIRST', enabled: true };
                    return (
                      <div key={slot.key} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#161B16] text-[11px] border border-slate-200/60 dark:border-white/5">
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                          {slot.title}
                        </span>
                        <select
                          value={ctrl.mode}
                          onChange={(e) => handlePlacementModeChange(slot.key, e.target.value)}
                          className="text-[10px] font-bold rounded-lg bg-slate-50 dark:bg-[#121612] border border-slate-200 dark:border-white/10 px-2 py-0.5 text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="BOTH_CUSTOM_FIRST">Both (Custom 1st)</option>
                          <option value="CUSTOM_ONLY">Custom Only</option>
                          <option value="ADMOB_ONLY">AdMob Only</option>
                          <option value="DISABLED">Disabled</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>


      {/* ─────────────────────────────────────────────────────────────
          6. CLEAN TOAST
         ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-2xl text-xs font-bold transition-all border animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-900 text-white border-rose-700'
            : toast.type === 'info'
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-emerald-900 text-emerald-100 border-emerald-700'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-300" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
