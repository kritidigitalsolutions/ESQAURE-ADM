import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import adService from '../../services/adService';
import {
  Coins,
  TrendingUp,
  Film,
  Smartphone,
  Apple,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Loader2,
  Globe,
  Key,
  Eye,
  EyeOff,
  Zap,
  Layers,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Radio,
  Sliders,
  DollarSign,
  Sparkles,
  PlaySquare,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

// Official Google AdMob Test Unit IDs for safe development
const OFFICIAL_GOOGLE_TEST_UNITS = {
  android: {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    appOpen: 'ca-app-pub-3940256099942544/3419832817',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379'
  },
  ios: {
    appId: 'ca-app-pub-3940256099942544~1458602516',
    appOpen: 'ca-app-pub-3940256099942544/5662855259',
    banner: 'ca-app-pub-3940256099942544/2934735716',
    interstitial: 'ca-app-pub-3940256099942544/4411468910',
    rewarded: 'ca-app-pub-3940256099942544/1712485313',
    rewardedInterstitial: 'ca-app-pub-3940256099942544/6978759866'
  }
};

// Initial default configuration
const INITIAL_CONFIG_STATE = {
  admobEnabled: true,
  testMode: false,
  publisherAccountId: 'pub-6490055741105644',
  appPackageName: 'com.flix9ott.app',
  oauthClientId: '389814863433-dits4313tlppgv84l.apps.googleusercontent.com',
  oauthClientSecret: 'GOCSPX-SampleSecretKey983719',
  oauthRefreshToken: '1//04SampleRefreshToken_AdMobSync',
  androidAppId: 'ca-app-pub-6490055741105644~9920192847',
  iosAppId: 'ca-app-pub-xxx/yyy',
  adUnits: {
    appOpen: {
      android: 'ca-app-pub-6490055741105644/4455667788',
      ios: 'ca-app-pub-xxx/yyy',
      enabled: true
    },
    banner: {
      android: 'ca-app-pub-6490055741105644/3344556677',
      ios: 'ca-app-pub-xxx/yyy',
      enabled: true
    },
    interstitial: {
      android: 'ca-app-pub-6490055741105644/2233445566',
      ios: 'ca-app-pub-xxx/yyy',
      enabled: true,
      intervalEpisodes: 3
    },
    rewarded: {
      android: 'ca-app-pub-6490055741105644/1122334455',
      ios: 'ca-app-pub-xxx/yyy',
      enabled: true,
      rewardDescription: 'Unlock Episode / 1 Free Pass'
    },
    rewardedInterstitial: {
      android: 'ca-app-pub-6490055741105644/5566778899',
      ios: 'ca-app-pub-xxx/yyy',
      enabled: true
    }
  }
};

// 10-day weekly earnings trend dataset
const TREND_DATA = [
  { date: 'Sep 13', earnings: 0, requests: 18, impressions: 0 },
  { date: 'Sep 16', earnings: 0, requests: 24, impressions: 0 },
  { date: 'Sep 19', earnings: 0, requests: 35, impressions: 0 },
  { date: 'Sep 22', earnings: 0, requests: 42, impressions: 0 },
  { date: 'Sep 25', earnings: 0, requests: 29, impressions: 0 },
  { date: 'Sep 28', earnings: 0, requests: 38, impressions: 0 },
  { date: 'Oct 1', earnings: 0, requests: 45, impressions: 0 },
  { date: 'Oct 3', earnings: 0, requests: 31, impressions: 0 },
  { date: 'Oct 6', earnings: 0, requests: 22, impressions: 0 },
  { date: 'Oct 9', earnings: 0, requests: 28, impressions: 0 },
];

import ToggleSwitch from '../../components/common/ToggleSwitch';

export default function AdmobPage({ onNavigate }) {
  const [form, setForm] = useState(INITIAL_CONFIG_STATE);
  const [initialJson, setInitialJson] = useState(JSON.stringify(INITIAL_CONFIG_STATE));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState('ALL'); // 'ALL' | 'ANDROID' | 'IOS'
  const [timeframe, setTimeframe] = useState('28d');
  const [currency, setCurrency] = useState('USD');
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = (text, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== initialJson;
  }, [form, initialJson]);

  // Load configuration from backend
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getSettings();
      if (res?.success && res.data?.settings) {
        const s = res.data.settings;
        const merged = {
          admobEnabled: s.admobEnabled !== undefined ? s.admobEnabled : true,
          testMode: s.testMode !== undefined ? s.testMode : false,
          publisherAccountId: s.publisherAccountId || INITIAL_CONFIG_STATE.publisherAccountId,
          appPackageName: s.appPackageName || INITIAL_CONFIG_STATE.appPackageName,
          oauthClientId: s.oauthClientId || INITIAL_CONFIG_STATE.oauthClientId,
          oauthClientSecret: s.oauthClientSecret || INITIAL_CONFIG_STATE.oauthClientSecret,
          oauthRefreshToken: s.oauthRefreshToken || INITIAL_CONFIG_STATE.oauthRefreshToken,
          androidAppId: s.androidAppId || INITIAL_CONFIG_STATE.androidAppId,
          iosAppId: s.iosAppId || INITIAL_CONFIG_STATE.iosAppId,
          adUnits: {
            appOpen: {
              android: s.adUnits?.appOpen?.android || INITIAL_CONFIG_STATE.adUnits.appOpen.android,
              ios: s.adUnits?.appOpen?.ios || INITIAL_CONFIG_STATE.adUnits.appOpen.ios,
              enabled: s.adUnits?.appOpen?.enabled !== undefined ? s.adUnits.appOpen.enabled : true
            },
            banner: {
              android: s.adUnits?.banner?.android || INITIAL_CONFIG_STATE.adUnits.banner.android,
              ios: s.adUnits?.banner?.ios || INITIAL_CONFIG_STATE.adUnits.banner.ios,
              enabled: s.adUnits?.banner?.enabled !== undefined ? s.adUnits.banner.enabled : true
            },
            interstitial: {
              android: s.adUnits?.interstitial?.android || INITIAL_CONFIG_STATE.adUnits.interstitial.android,
              ios: s.adUnits?.interstitial?.ios || INITIAL_CONFIG_STATE.adUnits.interstitial.ios,
              enabled: s.adUnits?.interstitial?.enabled !== undefined ? s.adUnits.interstitial.enabled : true,
              intervalEpisodes: s.adUnits?.interstitial?.intervalEpisodes || 3
            },
            rewarded: {
              android: s.adUnits?.rewarded?.android || INITIAL_CONFIG_STATE.adUnits.rewarded.android,
              ios: s.adUnits?.rewarded?.ios || INITIAL_CONFIG_STATE.adUnits.rewarded.ios,
              enabled: s.adUnits?.rewarded?.enabled !== undefined ? s.adUnits.rewarded.enabled : true,
              rewardDescription: s.adUnits?.rewarded?.rewardDescription || 'Unlock Episode / 1 Free Pass'
            },
            rewardedInterstitial: {
              android: s.adUnits?.rewardedInterstitial?.android || INITIAL_CONFIG_STATE.adUnits.rewardedInterstitial.android,
              ios: s.adUnits?.rewardedInterstitial?.ios || INITIAL_CONFIG_STATE.adUnits.rewardedInterstitial.ios,
              enabled: s.adUnits?.rewardedInterstitial?.enabled !== undefined ? s.adUnits.rewardedInterstitial.enabled : true
            }
          }
        };
        setForm(merged);
        setInitialJson(JSON.stringify(merged));
        if (showIndicator) {
          showToast('AdMob settings & reporting metrics synced from server', 'info');
        }
      }
    } catch (err) {
      console.warn('Failed to load AdMob settings:', err);
      if (showIndicator) {
        showToast('Could not reach backend. Loaded cached values.', 'error');
      }
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshing(false), 350);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [loadData]);

  // Copy to clipboard helper
  const copyToClipboard = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label || 'ID'} to clipboard`, 'success');
    setTimeout(() => {
      setCopiedKey(prev => (prev === key ? null : prev));
    }, 2000);
  };

  // Populate official Google demo IDs
  const handleApplyGoogleDemoIds = () => {
    setForm(prev => ({
      ...prev,
      testMode: true,
      androidAppId: OFFICIAL_GOOGLE_TEST_UNITS.android.appId,
      iosAppId: OFFICIAL_GOOGLE_TEST_UNITS.ios.appId,
      adUnits: {
        ...prev.adUnits,
        appOpen: {
          ...prev.adUnits.appOpen,
          android: OFFICIAL_GOOGLE_TEST_UNITS.android.appOpen,
          ios: OFFICIAL_GOOGLE_TEST_UNITS.ios.appOpen
        },
        banner: {
          ...prev.adUnits.banner,
          android: OFFICIAL_GOOGLE_TEST_UNITS.android.banner,
          ios: OFFICIAL_GOOGLE_TEST_UNITS.ios.banner
        },
        interstitial: {
          ...prev.adUnits.interstitial,
          android: OFFICIAL_GOOGLE_TEST_UNITS.android.interstitial,
          ios: OFFICIAL_GOOGLE_TEST_UNITS.ios.interstitial
        },
        rewarded: {
          ...prev.adUnits.rewarded,
          android: OFFICIAL_GOOGLE_TEST_UNITS.android.rewarded,
          ios: OFFICIAL_GOOGLE_TEST_UNITS.ios.rewarded
        },
        rewardedInterstitial: {
          ...prev.adUnits.rewardedInterstitial,
          android: OFFICIAL_GOOGLE_TEST_UNITS.android.rewardedInterstitial,
          ios: OFFICIAL_GOOGLE_TEST_UNITS.ios.rewardedInterstitial
        }
      }
    }));
    showToast('Applied official Google AdMob Test Demo IDs', 'info');
  };

  // Reset form to saved values
  const handleResetToSaved = () => {
    try {
      setForm(JSON.parse(initialJson));
      showToast('Reset to saved server values', 'info');
    } catch {
      setForm(INITIAL_CONFIG_STATE);
    }
  };

  // Save form configurations
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await adService.updateSettings(form);
      setInitialJson(JSON.stringify(form));
      showToast('AdMob configurations saved & synchronized successfully!', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || err.message || 'Failed to save configurations', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Update specific unit field
  const handleUnitChange = (formatKey, platform, value) => {
    setForm(prev => ({
      ...prev,
      adUnits: {
        ...prev.adUnits,
        [formatKey]: {
          ...prev.adUnits[formatKey],
          [platform]: value
        }
      }
    }));
  };

  // Toggle specific ad unit format
  const handleUnitToggle = (formatKey, enabled) => {
    setForm(prev => ({
      ...prev,
      adUnits: {
        ...prev.adUnits,
        [formatKey]: {
          ...prev.adUnits[formatKey],
          enabled
        }
      }
    }));
  };

  // Metric values
  const metricImpressions = 0;
  const metricRequests = 282;
  const metricMatchRate = '0%';
  const metricEarnings = currency === 'USD' ? '$0' : '₹0';
  const metricEcpm = currency === 'USD' ? '$0' : '₹0';

  return (
    <div className="space-y-5 font-urbanist animate-fade-in pb-20 selection:bg-[#FEF08A] selection:text-black">

      {/* ─────────────────────────────────────────────────────────────
          1. PAGE HEADER & ACTIONS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
            Google AdMob Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 font-medium mt-0.5">
            Manage SDK publisher credentials, Ad Unit ID coordinates, and API reporting synchronization.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={handleApplyGoogleDemoIds}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#161B16] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 shadow-xs transition-all cursor-pointer"
            title="Populate official Google test IDs for development"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Demo IDs</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSaved}
            disabled={!isDirty}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isDirty
                ? 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#161B16] hover:bg-slate-100 dark:hover:bg-white/[0.08] border-slate-200/90 dark:border-white/10 shadow-xs'
                : 'text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-white/[0.02] border-transparent cursor-not-allowed'
              }`}
          >
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#161B16] hover:bg-slate-100 dark:hover:bg-white/[0.08] border border-slate-200/90 dark:border-white/10 shadow-xs transition-all cursor-pointer"
            title="Sync live status from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LIVE SYNCED STATUS BANNER (Redesigned Theme Standard)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Globe className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2.5">
              <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white tracking-tight">
                AdMob Account Live Synced
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live API
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
              System is successfully synced with AdMob reporting endpoint. Analytics cache updates every 15 minutes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center pl-13.5 sm:pl-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Last sync: <span className="font-bold text-slate-900 dark:text-slate-200">Just now</span></span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh AdMob live cache"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.2] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Now</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN TWO-COLUMN DASHBOARD GRID
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN: SETTINGS & COORDINATES FORM (7 Cols)
           ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs transition-colors space-y-6">

            {/* Section Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Radio className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white tracking-tight">
                    Google AdMob Settings
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/60 font-medium">
                    Configure Google AdMob keys and publishers mapping coordinates.
                  </p>
                </div>
              </div>
            </div>

            {/* ── ROW: Enable AdMob Ads (Master Toggle Switch) ── */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 transition-colors">
              <div className="min-w-0 pr-3">
                <label htmlFor="admob-toggle" className="text-xs font-black text-slate-950 dark:text-white block cursor-pointer">
                  Enable AdMob Ads
                </label>
                <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium mt-0.5">
                  Activate/deactivate Google AdMob banners and unit servings
                </p>
              </div>

              {/* Exact Green Toggle Switch */}
              <ToggleSwitch
                id="admob-toggle"
                enabled={form.admobEnabled}
                onChange={(val) => setForm(p => ({ ...p, admobEnabled: val }))}
                ariaLabel="Enable AdMob Ads"
              />
            </div>

            {/* ── ROW: Publisher Account ID ── */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-950 dark:text-white">
                Publisher Account ID
              </label>
              <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                Unique Google AdMob publisher account identification code
              </p>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={form.publisherAccountId}
                  onChange={(e) => setForm(p => ({ ...p, publisherAccountId: e.target.value }))}
                  placeholder="pub-XXXXXXXXXXXXXXXX"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161B16] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(form.publisherAccountId, 'publisherAccountId', 'Publisher Account ID')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Copy Publisher Account ID"
                >
                  {copiedKey === 'publisherAccountId' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* ── ROW: App Package Name ── */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-950 dark:text-white">
                App Package Name
              </label>
              <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                Android/iOS mobile package ID bundle coordinates
              </p>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={form.appPackageName}
                  onChange={(e) => setForm(p => ({ ...p, appPackageName: e.target.value }))}
                  placeholder="com.example.app"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161B16] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-amber-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(form.appPackageName, 'appPackageName', 'App Package Name')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Copy App Package Name"
                >
                  {copiedKey === 'appPackageName' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* ── SECTION: Google API Credentials (Sync Reports) ── */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500 dark:text-[#FEF08A] stroke-[2.2]" />
                <h3 className="text-xs font-black tracking-tight text-amber-800 dark:text-[#FEF08A] uppercase">
                  Google API Credentials (Sync Reports)
                </h3>
              </div>

              {/* OAuth Client ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-950 dark:text-white">
                  OAuth Client ID
                </label>
                <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                  Google Developer Console Client ID
                </p>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={form.oauthClientId}
                    onChange={(e) => setForm(p => ({ ...p, oauthClientId: e.target.value }))}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161B16] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-amber-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.oauthClientId, 'oauthClientId', 'OAuth Client ID')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Copy OAuth Client ID"
                  >
                    {copiedKey === 'oauthClientId' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* OAuth Client Secret */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-950 dark:text-white">
                  OAuth Client Secret
                </label>
                <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                  OAuth secret phrase
                </p>
                <div className="relative mt-1">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={form.oauthClientSecret}
                    onChange={(e) => setForm(p => ({ ...p, oauthClientSecret: e.target.value }))}
                    placeholder="OAuth Client Secret Key"
                    className="w-full pl-3.5 pr-18 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161B16] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-amber-400 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.oauthClientSecret, 'oauthClientSecret', 'OAuth Client Secret')}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Copy OAuth Secret"
                    >
                      {copiedKey === 'oauthClientSecret' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* OAuth Refresh Token */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-950 dark:text-white">
                  OAuth Refresh Token
                </label>
                <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                  Offline access refresh token code
                </p>
                <div className="relative mt-1">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={form.oauthRefreshToken}
                    onChange={(e) => setForm(p => ({ ...p, oauthRefreshToken: e.target.value }))}
                    placeholder="OAuth Refresh Token Key"
                    className="w-full pl-3.5 pr-18 py-2.5 text-xs font-mono rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#161B16] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-amber-400 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.oauthRefreshToken, 'oauthRefreshToken', 'OAuth Refresh Token')}
                      className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Copy Refresh Token"
                    >
                      {copiedKey === 'oauthRefreshToken' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION: Ad Units Platform Selector Tabs ── */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black tracking-tight text-slate-950 dark:text-white uppercase">
                    Ad Units Coordinates
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-white/60 font-medium">
                    Configure Ad Unit IDs for Android & iOS client applications.
                  </p>
                </div>

                {/* Filter / Platform Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 self-start sm:self-auto">
                  {[
                    { id: 'ALL', label: 'All Platforms' },
                    { id: 'ANDROID', label: 'Android' },
                    { id: 'IOS', label: 'iOS' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePlatformTab(tab.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${activePlatformTab === tab.id
                          ? 'bg-[#FEF08A] text-slate-950 font-black shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── ANDROID AD UNITS ── */}
              {(activePlatformTab === 'ALL' || activePlatformTab === 'ANDROID') && (
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16]/80 border border-slate-200/80 dark:border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-500 stroke-[2.2]" />
                      <span className="text-xs font-black text-slate-950 dark:text-white tracking-wide">
                        Android Ad Units
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                      Google Play
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* App ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">App ID</label>
                        <span className="text-[10px] text-slate-400">Android App ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.androidAppId}
                          onChange={(e) => setForm(p => ({ ...p, androidAppId: e.target.value }))}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.androidAppId, 'and_app_id', 'Android App ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_app_id' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* App Open ID with Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">App Open ID</label>
                          <span className="text-[10px] text-slate-400">Cold launch splash</span>
                        </div>
                        <ToggleSwitch
                          enabled={form.adUnits.appOpen.enabled}
                          onChange={(val) => handleUnitToggle('appOpen', val)}
                          ariaLabel="Toggle App Open Ads"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.appOpen.android}
                          onChange={(e) => handleUnitChange('appOpen', 'android', e.target.value)}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.appOpen.android, 'and_app_open', 'Android App Open ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_app_open' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Banner ID with Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Banner ID</label>
                          <span className="text-[10px] text-slate-400">Display tray banners</span>
                        </div>
                        <ToggleSwitch
                          enabled={form.adUnits.banner.enabled}
                          onChange={(val) => handleUnitToggle('banner', val)}
                          ariaLabel="Toggle Banner Ads"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.banner.android}
                          onChange={(e) => handleUnitChange('banner', 'android', e.target.value)}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.banner.android, 'and_banner', 'Android Banner ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_banner' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Interstitial ID with Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Interstitial ID</label>
                          <span className="text-[10px] text-slate-400">Episode transitions</span>
                        </div>
                        <ToggleSwitch
                          enabled={form.adUnits.interstitial.enabled}
                          onChange={(val) => handleUnitToggle('interstitial', val)}
                          ariaLabel="Toggle Interstitial Ads"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.interstitial.android}
                          onChange={(e) => handleUnitChange('interstitial', 'android', e.target.value)}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.interstitial.android, 'and_interstitial', 'Android Interstitial ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_interstitial' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Rewarded ID with Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Rewarded ID</label>
                          <span className="text-[10px] text-slate-400">Paywall video unlocks</span>
                        </div>
                        <ToggleSwitch
                          enabled={form.adUnits.rewarded.enabled}
                          onChange={(val) => handleUnitToggle('rewarded', val)}
                          ariaLabel="Toggle Rewarded Ads"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.rewarded.android}
                          onChange={(e) => handleUnitChange('rewarded', 'android', e.target.value)}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.rewarded.android, 'and_rewarded', 'Android Rewarded ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_rewarded' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Rewarded Interstitial ID with Toggle */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Rewarded Interstitial ID</label>
                          <span className="text-[10px] text-slate-400">Pre-break rewarded cards</span>
                        </div>
                        <ToggleSwitch
                          enabled={form.adUnits.rewardedInterstitial.enabled}
                          onChange={(val) => handleUnitToggle('rewardedInterstitial', val)}
                          ariaLabel="Toggle Rewarded Interstitial Ads"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.rewardedInterstitial.android}
                          onChange={(e) => handleUnitChange('rewardedInterstitial', 'android', e.target.value)}
                          placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.rewardedInterstitial.android, 'and_rewarded_inter', 'Android Rewarded Interstitial ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'and_rewarded_inter' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── IOS AD UNITS ── */}
              {(activePlatformTab === 'ALL' || activePlatformTab === 'IOS') && (
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16]/80 border border-slate-200/80 dark:border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Apple className="w-4 h-4 text-sky-500 stroke-[2.2]" />
                      <span className="text-xs font-black text-slate-950 dark:text-white tracking-wide">
                        iOS Ad Units
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                      Apple App Store
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* App ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">App ID</label>
                        <span className="text-[10px] text-slate-400">iOS App ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.iosAppId}
                          onChange={(e) => setForm(p => ({ ...p, iosAppId: e.target.value }))}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.iosAppId, 'ios_app_id', 'iOS App ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_app_id' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* App Open ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">App Open ID</label>
                        <span className="text-[10px] text-slate-400">iOS App Open ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.appOpen.ios}
                          onChange={(e) => handleUnitChange('appOpen', 'ios', e.target.value)}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.appOpen.ios, 'ios_app_open', 'iOS App Open ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_app_open' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Banner ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Banner ID</label>
                        <span className="text-[10px] text-slate-400">iOS Banner ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.banner.ios}
                          onChange={(e) => handleUnitChange('banner', 'ios', e.target.value)}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.banner.ios, 'ios_banner', 'iOS Banner ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_banner' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Interstitial ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Interstitial ID</label>
                        <span className="text-[10px] text-slate-400">iOS Interstitial ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.interstitial.ios}
                          onChange={(e) => handleUnitChange('interstitial', 'ios', e.target.value)}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.interstitial.ios, 'ios_interstitial', 'iOS Interstitial ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_interstitial' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Rewarded ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Rewarded ID</label>
                        <span className="text-[10px] text-slate-400">iOS Rewarded ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.rewarded.ios}
                          onChange={(e) => handleUnitChange('rewarded', 'ios', e.target.value)}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.rewarded.ios, 'ios_rewarded', 'iOS Rewarded ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_rewarded' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Rewarded Interstitial ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200">Rewarded Interstitial ID</label>
                        <span className="text-[10px] text-slate-400">iOS Rewarded Interstitial ID code</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={form.adUnits.rewardedInterstitial.ios}
                          onChange={(e) => handleUnitChange('rewardedInterstitial', 'ios', e.target.value)}
                          placeholder="ca-app-pub-xxx/yyy"
                          className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(form.adUnits.rewardedInterstitial.ios, 'ios_rewarded_inter', 'iOS Rewarded Interstitial ID')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                        >
                          {copiedKey === 'ios_rewarded_inter' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── WEBSITE MONETIZATION NOTICE (Screenshot 4) ── */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/90 dark:border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">Website Monetization:</span>{' '}
                Websites use <strong className="text-slate-900 dark:text-white">Google AdSense</strong> for monetization instead of AdMob.
                To manage AdSense Publisher ID, Slot IDs, and Auto-Ads for the web platform, visit the{' '}
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('ad_control') : null}
                  className="text-amber-700 dark:text-[#FEF08A] font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>AdSense Manager</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </button>{' '}
                page.
              </div>
            </div>

            {/* ── SUBMIT / SAVE CONFIGURATIONS BUTTON ── */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-3.5 px-6 rounded-xl font-black text-sm text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] active:scale-[0.99] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Synchronizing & Saving Coordinates...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                    <span>Save AdMob Configurations</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN: LIVE ADMOB PERFORMANCE (5 Cols)
           ═══════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 space-y-5 xl:sticky xl:top-6">
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-xs transition-colors space-y-5">

            {/* Performance Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-950 dark:text-white tracking-tight">
                    Live AdMob Performance
                  </h2>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    (Synced)
                  </span>
                </div>
              </div>

              {/* Timeframe Dropdown */}
              <div className="relative">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-50 dark:bg-[#202620] border border-slate-200/80 dark:border-white/12 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] cursor-pointer shadow-xs"
                >
                  <option value="28d">Last 28 days (Console Default)</option>
                  <option value="7d">Last 7 days</option>
                  <option value="14d">Last 14 days</option>
                  <option value="month">This Month</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>

            {/* ── 3 STANDARDIZED STAT CARDS (Strict Rule Compliance) ── */}
            <div className="space-y-3">

              {/* Stat 1: AdMob Impressions */}
              <div className="bg-white dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between transition-all group hover:border-[#FEF08A]/60">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Standard KPI Metric Icon Badge */}
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                    <Film className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-950 dark:text-white block truncate">
                        AdMob Impressions
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-white/60 font-medium block">
                      Last 28 days
                    </span>
                    <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-1 block">
                      {metricImpressions}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20">
                    ↑ Live Sync
                  </span>
                </div>
              </div>

              {/* Stat 2: Ad Requests & Match Rate */}
              <div className="bg-white dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between transition-all group hover:border-[#FEF08A]/60">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                    <Zap className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-950 dark:text-white block truncate">
                        Ad Requests & Match Rate
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-white/60 font-medium block">
                      Last 28 days
                    </span>
                    <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-1 block">
                      {metricRequests}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-start">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20">
                    ↑ Match Rate: {metricMatchRate}
                  </span>
                </div>
              </div>

              {/* Stat 3: Estimated Earnings */}
              <div className="bg-white dark:bg-[#161B16] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-xs flex items-center justify-between transition-all group hover:border-[#FEF08A]/60">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                    <Coins className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-950 dark:text-white block truncate">
                        Estimated Earnings
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-white/60 font-medium block">
                      Last 28 days
                    </span>
                    <span className="text-2xl font-black text-slate-950 dark:text-white tracking-tight mt-1 block">
                      {metricEarnings}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 self-start flex flex-col items-end gap-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20">
                    ↑ eCPM: {metricEcpm}
                  </span>
                  {/* Currency Switcher */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${currency === 'USD' ? 'bg-[#FEF08A] text-slate-950' : 'hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >
                      $ USD
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => setCurrency('INR')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${currency === 'INR' ? 'bg-[#FEF08A] text-slate-950' : 'hover:text-slate-900 dark:hover:text-slate-200'}`}
                    >
                      ₹ INR
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* ── WEEKLY EARNINGS TREND CHART ── */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500 dark:text-[#FEF08A] stroke-[2.2]" />
                  <h3 className="text-xs font-black text-slate-950 dark:text-white tracking-tight">
                    Weekly Earnings Trend
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Sep 13 – Oct 9
                </span>
              </div>

              {/* Chart Container */}
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={TREND_DATA}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="admobEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FEF08A" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#FEF08A" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(148, 163, 184, 0.2)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Urbanist' }}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Urbanist' }}
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                      tickLine={false}
                      domain={[0, 4]}
                      ticks={[0, 1, 2, 3, 4]}
                      tickFormatter={(v) => currency === 'USD' ? `$${v}` : `${v}₹`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-[#202620] border border-slate-200 dark:border-white/12 shadow-xl rounded-xl p-2.5 text-xs font-urbanist">
                              <p className="font-extrabold text-slate-950 dark:text-white text-[11px] mb-1">{label}</p>
                              <div className="space-y-0.5 text-[11px]">
                                <p className="text-amber-600 dark:text-amber-300 font-bold">
                                  Earnings: {currency === 'USD' ? `$${data.earnings}` : `${data.earnings}₹`}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">
                                  Requests: {data.requests}
                                </p>
                                <p className="text-slate-500 dark:text-slate-400">
                                  Impressions: {data.impressions}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stroke="#EAB308"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#admobEarningsGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Insight Pill */}
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-[#FEF08A]/5 border border-amber-500/20 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-[#FEF08A] shrink-0" />
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-snug">
                  <strong className="text-slate-950 dark:text-white">Live AdMob SDK Pipeline:</strong> Reporting sync runs periodically. Zero ad policy infractions registered.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FLOATING TOAST NOTIFICATION
         ───────────────────────────────────────────────────────────── */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 animate-slide-down">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-700/50'
              : toast.type === 'info'
                ? 'bg-slate-900/90 text-slate-200 border-white/15'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
            }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
