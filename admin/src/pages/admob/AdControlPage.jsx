import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import adService from '../../services/adService';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import {
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  Power
} from 'lucide-react';

export default function AdControlPage({ onNavigate }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [initialFormJson, setInitialFormJson] = useState('');
  const toastTimerRef = useRef(null);

  // Core Form State
  const [form, setForm] = useState({
    globalAdsEnabled: true,
    customAdsEnabled: true,
    admobEnabled: true,
    mediationMode: 'CUSTOM_FIRST', // 'CUSTOM_FIRST' (Both) | 'ADMOB_ONLY' | 'CUSTOM_ONLY'
    testMode: false,
    androidAppId: '',
    iosAppId: '',
    vipBypassAds: true,
    globalAdFrequencyCap: 6
  });

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const isDirty = useMemo(() => {
    if (!initialFormJson) return false;
    return JSON.stringify(form) !== initialFormJson;
  }, [form, initialFormJson]);

  // Determine current active delivery mode
  const currentMode = useMemo(() => {
    if (!form.globalAdsEnabled) return 'DISABLED';
    if (form.admobEnabled && form.customAdsEnabled) return 'BOTH';
    if (form.admobEnabled && !form.customAdsEnabled) return 'ADMOB_ONLY';
    if (!form.admobEnabled && form.customAdsEnabled) return 'CUSTOM_ONLY';
    return 'DISABLED';
  }, [form.globalAdsEnabled, form.admobEnabled, form.customAdsEnabled]);

  // Fetch Settings & Stats from Backend
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getSettings();
      if (res?.success && res.data?.settings) {
        const s = res.data.settings;
        const normalized = {
          globalAdsEnabled: s.globalAdsEnabled !== undefined ? Boolean(s.globalAdsEnabled) : true,
          customAdsEnabled: s.customAdsEnabled !== undefined ? Boolean(s.customAdsEnabled) : true,
          admobEnabled: s.admobEnabled !== undefined ? Boolean(s.admobEnabled) : true,
          mediationMode: s.mediationMode || 'CUSTOM_FIRST',
          testMode: Boolean(s.testMode),
          androidAppId: s.androidAppId || '',
          iosAppId: s.iosAppId || '',
          vipBypassAds: s.vipBypassAds !== undefined ? Boolean(s.vipBypassAds) : true,
          globalAdFrequencyCap: s.globalAdFrequencyCap ?? 6
        };
        setForm(normalized);
        setInitialFormJson(JSON.stringify(normalized));

        if (showIndicator) showToast('Settings synchronized from server');
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

  // Save Settings
  const handleSave = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setIsSaving(true);
    try {
      await adService.updateSettings(form);
      setInitialFormJson(JSON.stringify(form));
      showToast('Ad controls updated & synced live with mobile app!');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Delivery Mode Handler
  const handleSelectMode = (modeKey) => {
    setForm((prev) => {
      if (modeKey === 'BOTH') {
        return {
          ...prev,
          globalAdsEnabled: true,
          admobEnabled: true,
          customAdsEnabled: true,
          mediationMode: 'CUSTOM_FIRST'
        };
      }
      if (modeKey === 'ADMOB_ONLY') {
        return {
          ...prev,
          globalAdsEnabled: true,
          admobEnabled: true,
          customAdsEnabled: false,
          mediationMode: 'ADMOB_ONLY'
        };
      }
      if (modeKey === 'CUSTOM_ONLY') {
        return {
          ...prev,
          globalAdsEnabled: true,
          admobEnabled: false,
          customAdsEnabled: true,
          mediationMode: 'CUSTOM_ONLY'
        };
      }
      if (modeKey === 'DISABLED') {
        return {
          ...prev,
          globalAdsEnabled: false
        };
      }
      return prev;
    });
  };

  // Toggle AdMob Network directly
  const handleToggleAdmob = (nextVal) => {
    setForm((prev) => {
      const nextAdmob = Boolean(nextVal);
      let nextMode = prev.mediationMode;
      let nextGlobal = prev.globalAdsEnabled;

      if (nextAdmob && !prev.customAdsEnabled) {
        nextMode = 'ADMOB_ONLY';
        nextGlobal = true;
      } else if (nextAdmob && prev.customAdsEnabled) {
        nextMode = 'CUSTOM_FIRST';
        nextGlobal = true;
      } else if (!nextAdmob && !prev.customAdsEnabled) {
        nextMode = 'CUSTOM_FIRST';
      } else if (!nextAdmob && prev.customAdsEnabled) {
        nextMode = 'CUSTOM_ONLY';
      }

      return {
        ...prev,
        admobEnabled: nextAdmob,
        globalAdsEnabled: nextGlobal,
        mediationMode: nextMode
      };
    });
  };

  // Toggle Custom Ads directly
  const handleToggleCustom = (nextVal) => {
    setForm((prev) => {
      const nextCustom = Boolean(nextVal);
      let nextMode = prev.mediationMode;
      let nextGlobal = prev.globalAdsEnabled;

      if (nextCustom && !prev.admobEnabled) {
        nextMode = 'CUSTOM_ONLY';
        nextGlobal = true;
      } else if (nextCustom && prev.admobEnabled) {
        nextMode = 'CUSTOM_FIRST';
        nextGlobal = true;
      } else if (!nextCustom && !prev.admobEnabled) {
        nextMode = 'CUSTOM_FIRST';
      } else if (!nextCustom && prev.admobEnabled) {
        nextMode = 'ADMOB_ONLY';
      }

      return {
        ...prev,
        customAdsEnabled: nextCustom,
        globalAdsEnabled: nextGlobal,
        mediationMode: nextMode
      };
    });
  };

  return (
    <div className="space-y-4 font-urbanist selection:bg-[#FEF08A] selection:text-black">

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Standard Theme Bar with Compact Icon Badge)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          {/* Standard compact header icon badge */}
          <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Ads Control
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/30 text-slate-950 border border-amber-300/60 dark:border-amber-400/30">
                <Radio className="w-2.5 h-2.5 animate-pulse text-amber-500" />
                <span>Live Control</span>
              </span>
              {isDirty && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                  Unsaved Changes
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              Manage Google AdMob and Custom direct sponsor ads across mobile apps
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-all border border-slate-200/80 dark:border-white/10 cursor-pointer hover:scale-105 active:scale-90 shadow-sm disabled:opacity-50 shrink-0"
            title="Reload settings from server"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] active:bg-[#CA8A04] text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 stroke-[2.2]" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MASTER ADS POWER STATE BANNER (Activate / Disable All Ads)
         ───────────────────────────────────────────────────────────── */}
      <div className={`rounded-xl p-4 border transition-all ${
        form.globalAdsEnabled
          ? 'bg-white dark:bg-[#121216] border-slate-200/80 dark:border-white/10 shadow-xs'
          : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              form.globalAdsEnabled
                ? 'bg-[#FEF08A] text-slate-950'
                : 'bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
            }`}>
              <Power className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white truncate">
                  Master Ads Delivery Status
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  form.globalAdsEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/30'
                    : 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300/60 dark:border-rose-500/30'
                }`}>
                  {form.globalAdsEnabled ? 'ALL ADS ENABLED' : 'ADS DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {form.globalAdsEnabled
                  ? 'Ads are actively running on mobile apps based on your selected delivery mode below.'
                  : 'All ads are currently paused. Neither AdMob nor Custom sponsor ads will appear in the app.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {form.globalAdsEnabled ? 'Active' : 'Turned Off'}
            </span>
            <ToggleSwitch
              enabled={form.globalAdsEnabled}
              onChange={(nextVal) => setForm(p => ({ ...p, globalAdsEnabled: Boolean(nextVal) }))}
              size="md"
              title="Toggle All Ads Delivery"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CORE DELIVERY MODE SELECTOR (Both Ads / Only AdMob / Only Custom)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select What Ads To Show
            </h3>
            <p className="text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
              Choose your active delivery strategy with one click
            </p>
          </div>
          {form.globalAdsEnabled && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#FEF08A] text-slate-950 shadow-xs">
              Current: {currentMode === 'BOTH' ? 'Both Ads' : currentMode === 'ADMOB_ONLY' ? 'Only AdMob' : currentMode === 'CUSTOM_ONLY' ? 'Only Custom Ads' : 'Disabled'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: BOTH ADS */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectMode('BOTH')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectMode('BOTH');
              }
            }}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between border select-none ${
              form.globalAdsEnabled && currentMode === 'BOTH'
                ? 'bg-amber-50/60 dark:bg-amber-400/[0.05] border-amber-300 dark:border-amber-400/60 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-white dark:bg-[#18181E] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <Layers className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      Both Ads
                    </h4>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      AdMob + Custom
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    form.globalAdsEnabled && currentMode === 'BOTH'
                      ? 'border border-amber-500 bg-[#FACC15]'
                      : 'border border-slate-300 dark:border-white/20'
                  }`}
                >
                  {form.globalAdsEnabled && currentMode === 'BOTH' && (
                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">
                Show direct sponsor ads first, and automatically fill remaining impressions with Google AdMob ads.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Status:</span>
              <span className="text-amber-700 dark:text-amber-300">AdMob ON • Custom ON</span>
            </div>
          </div>

          {/* Option 2: ONLY ADMOB */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectMode('ADMOB_ONLY')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectMode('ADMOB_ONLY');
              }
            }}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between border select-none ${
              form.globalAdsEnabled && currentMode === 'ADMOB_ONLY'
                ? 'bg-amber-50/60 dark:bg-amber-400/[0.05] border-amber-300 dark:border-amber-400/60 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-white dark:bg-[#18181E] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <Smartphone className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      Only AdMob
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Google Network Only
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    form.globalAdsEnabled && currentMode === 'ADMOB_ONLY'
                      ? 'border border-amber-500 bg-[#FACC15]'
                      : 'border border-slate-300 dark:border-white/20'
                  }`}
                >
                  {form.globalAdsEnabled && currentMode === 'ADMOB_ONLY' && (
                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">
                Only show Google AdMob ads (Banners, Interstitials, Rewarded). Direct sponsor campaigns are muted.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Status:</span>
              <span className="text-amber-700 dark:text-amber-300">AdMob ON • Custom OFF</span>
            </div>
          </div>

          {/* Option 3: ONLY CUSTOM ADS */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleSelectMode('CUSTOM_ONLY')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectMode('CUSTOM_ONLY');
              }
            }}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between border select-none ${
              form.globalAdsEnabled && currentMode === 'CUSTOM_ONLY'
                ? 'bg-amber-50/60 dark:bg-amber-400/[0.05] border-amber-300 dark:border-amber-400/60 ring-2 ring-amber-400/30 shadow-xs'
                : 'bg-white dark:bg-[#18181E] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <Sparkles className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      Only Custom Ads
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Direct Sponsors Only
                    </span>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    form.globalAdsEnabled && currentMode === 'CUSTOM_ONLY'
                      ? 'border border-amber-500 bg-[#FACC15]'
                      : 'border border-slate-300 dark:border-white/20'
                  }`}
                >
                  {form.globalAdsEnabled && currentMode === 'CUSTOM_ONLY' && (
                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">
                Only show direct sponsors, video pre-rolls, and in-house promos. Google AdMob SDK network is turned off.
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span>Status:</span>
              <span className="text-amber-700 dark:text-amber-300">AdMob OFF • Custom ON</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. INDIVIDUAL AD NETWORKS MANAGEMENT (AdMob & Custom Ads)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 4A. GOOGLE ADMOB CARD */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Standard KPI Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                  Google AdMob
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  form.admobEnabled
                    ? 'bg-amber-100 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-400/30'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}>
                  {form.admobEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Google mobile ads SDK integration
              </p>
            </div>
          </div>

          <ToggleSwitch
            enabled={form.admobEnabled}
            onChange={handleToggleAdmob}
            size="md"
            title="Toggle Google AdMob"
          />
        </div>

        {/* 4B. CUSTOM SPONSOR ADS CARD */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Standard KPI Icon Badge */}
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-slate-950 dark:text-white">
                  Custom Direct Ads
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  form.customAdsEnabled
                    ? 'bg-amber-100 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-400/30'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}>
                  {form.customAdsEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Direct brand sponsors & in-house promos
              </p>
            </div>
          </div>

          <ToggleSwitch
            enabled={form.customAdsEnabled}
            onChange={handleToggleCustom}
            size="md"
            title="Toggle Custom Sponsor Ads"
          />
        </div>

      </div>



      {/* ─────────────────────────────────────────────────────────────
          6. TOAST NOTIFICATION
         ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[99999] flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-2xl text-xs font-bold transition-all border animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-700'
              : 'bg-slate-950 dark:bg-[#18181E] text-white border-amber-300/40 dark:border-amber-400/30 shadow-xs'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
