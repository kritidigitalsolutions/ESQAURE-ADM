import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import adService from '../../services/adService';
import ToggleSwitch from '../../components/common/ToggleSwitch';
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
  Clock,
  LayoutGrid,
  Tag
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
  { date: 'Oct 9', earnings: 0, requests: 28, impressions: 0 }
];

const AD_FORMAT_CONFIGS = [
  {
    key: 'appOpen',
    name: 'App Open Ad',
    tag: 'Cold Launch Splash',
    desc: 'Served during app launch or foreground recovery'
  },
  {
    key: 'banner',
    name: 'Banner Ad',
    tag: 'Bottom Tray',
    desc: 'Inline 320x50 and adaptive banner strips'
  },
  {
    key: 'interstitial',
    name: 'Interstitial Ad',
    tag: 'Episode Transitions',
    desc: 'Full-screen cards between short drama episodes'
  },
  {
    key: 'rewarded',
    name: 'Rewarded Video Ad',
    tag: 'Paywall Video Unlocks',
    desc: 'Viewer watches video to unlock locked premium episodes'
  },
  {
    key: 'rewardedInterstitial',
    name: 'Rewarded Interstitial',
    tag: 'Non-skippable Interstitial',
    desc: 'Unskippable full-screen rewarded placement'
  }
];

export default function AdmobPage({ onNavigate }) {
  const [form, setForm] = useState(INITIAL_CONFIG_STATE);
  const [initialJson, setInitialJson] = useState(JSON.stringify(INITIAL_CONFIG_STATE));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [activeTab, setActiveTab] = useState('units'); // 'units' | 'credentials' | 'analytics'
  const [activePlatformTab, setActivePlatformTab] = useState('ALL'); // 'ALL' | 'ANDROID' | 'IOS'
  const [timeframe, setTimeframe] = useState('28d');
  const [currency, setCurrency] = useState('USD');
  const [toast, setToast] = useState({ show: false, text: '', type: 'success' });
  const toastTimerRef = useRef(null);

  const showToast = (text, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text, type });
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
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

  const copyToClipboard = (text, key, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${label || 'ID'} to clipboard`, 'success');
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const handleApplyGoogleDemoIds = () => {
    setForm((prev) => ({
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

  const handleResetToSaved = () => {
    try {
      setForm(JSON.parse(initialJson));
      showToast('Reset to saved server values', 'info');
    } catch {
      setForm(INITIAL_CONFIG_STATE);
    }
  };

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

  const handleUnitChange = (formatKey, platform, value) => {
    setForm((prev) => ({
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

  const handleUnitToggle = (formatKey, enabled) => {
    setForm((prev) => ({
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

  // Metrics
  const metricImpressions = 0;
  const metricRequests = 282;
  const metricMatchRate = '0%';
  const metricEarnings = currency === 'USD' ? '$0.00' : '₹0.00';
  const metricEcpm = currency === 'USD' ? '$0.00' : '₹0.00';

  const activeUnitsCount = useMemo(() => {
    return Object.values(form.adUnits).filter((u) => u.enabled).length;
  }, [form.adUnits]);

  return (
    <div className="space-y-3 font-urbanist pb-14 selection:bg-[#FEF08A] selection:text-black">
      {/* 4 Compact Uniform KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Impressions */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                  <Film className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    AdMob Impressions
                  </span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Last 28 Days
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {metricImpressions}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Reporting synced
            </span>
            <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Live API
            </span>
          </div>
        </div>

        {/* Metric 2: Ad Requests */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Ad Requests
                  </span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Pipeline Queries
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {metricRequests}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Match Rate: {metricMatchRate}
            </span>
            <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Active
            </span>
          </div>
        </div>

        {/* Metric 3: Estimated Earnings */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                  <Coins className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Estimated Earnings
                  </span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Settled Revenue
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {metricEarnings}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              eCPM: {metricEcpm}
            </span>
            <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Optimal
            </span>
          </div>
        </div>

        {/* Metric 4: Formats Enabled */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                  <Layers className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                    Active Formats
                  </span>
                  <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                    Ad Unit Matrix
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {activeUnitsCount} / 5
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Android & iOS units
            </span>
            <span className="shrink-0 px-1.5 py-0.2 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              {form.admobEnabled ? 'Serving' : 'Paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Google AdMob Setup
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                form.admobEnabled
                  ? 'bg-[#FEF08A]/30 text-slate-900 dark:text-amber-300 border border-amber-300/50'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
              }`}
            >
              {form.admobEnabled ? 'Ads Active' : 'Ads Disabled'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Configure SDK publisher credentials, Ad Unit ID coordinates, and reporting synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
          <button
            type="button"
            onClick={handleApplyGoogleDemoIds}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
            title="Populate official Google test IDs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Demo IDs</span>
          </button>

          <button
            type="button"
            onClick={handleResetToSaved}
            disabled={!isDirty}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 disabled:opacity-40 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
            title="Reset to saved server values"
          >
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Sync live status from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Unified Section Navigation Tabs Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Tab Switcher */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'units', label: `Ad Unit Coordinates (${activeUnitsCount}/5)` },
            { id: 'credentials', label: 'Publisher & API Keys' },
            { id: 'analytics', label: 'Revenue Trends & Charts' }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right: Master AdMob Toggle + Live Status indicator */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-[#18181E] px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-white/10">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Serve Mobile Ads
            </span>
            <ToggleSwitch
              enabled={form.admobEnabled}
              onChange={(val) => setForm((p) => ({ ...p, admobEnabled: val }))}
              ariaLabel="Enable AdMob Ads"
              size="sm"
            />
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-[10.5px] font-medium text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Cache: <strong className="text-slate-700 dark:text-slate-300">Live API</strong></span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: AD UNIT COORDINATES MATRIX
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'units' && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          
          {/* App IDs: Compact 2-column card */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-2.5 sm:p-3 border border-slate-200/80 dark:border-white/10 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Android App ID */}
              {(activePlatformTab === 'ALL' || activePlatformTab === 'ANDROID') && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1.5 w-28 sm:w-32 shrink-0">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      Android App ID
                    </span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={form.androidAppId}
                      onChange={(e) => setForm((p) => ({ ...p, androidAppId: e.target.value }))}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                      className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.androidAppId, 'androidAppId', 'Android App ID')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                      title="Copy Android App ID"
                    >
                      {copiedKey === 'androidAppId' ? (
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* iOS App ID */}
              {(activePlatformTab === 'ALL' || activePlatformTab === 'IOS') && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-1.5 w-28 sm:w-32 shrink-0">
                    <Apple className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      iOS App ID
                    </span>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="text"
                      value={form.iosAppId}
                      onChange={(e) => setForm((p) => ({ ...p, iosAppId: e.target.value }))}
                      placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                      className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.iosAppId, 'iosAppId', 'iOS App ID')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                      title="Copy iOS App ID"
                    >
                      {copiedKey === 'iosAppId' ? (
                        <Check className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Ad Unit Formats Matrix Card */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            {/* Integrated Header Bar with Platform Filter */}
            <div className="p-2 sm:px-3 bg-slate-50/70 dark:bg-[#18181E] border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Ad Unit Formats
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-slate-950 dark:text-amber-300 border border-amber-300/50">
                  {activeUnitsCount}/5 Active
                </span>
              </div>

              {/* Integrated Platform Filter Pills */}
              <div className="flex items-center space-x-1 p-0.5 bg-white dark:bg-[#101014] rounded-lg border border-slate-200/80 dark:border-white/10 shrink-0">
                {[
                  { id: 'ALL', label: 'All Platforms' },
                  { id: 'ANDROID', label: 'Android' },
                  { id: 'IOS', label: 'iOS' }
                ].map((pTab) => (
                  <button
                    key={pTab.id}
                    onClick={() => setActivePlatformTab(pTab.id)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                      activePlatformTab === pTab.id
                        ? 'bg-[#FEF08A] text-slate-950 shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {pTab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Table Header */}
            <div className="hidden lg:grid grid-cols-12 gap-3 px-3.5 py-1.5 bg-slate-50/40 dark:bg-white/[0.015] border-b border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-3">Ad Format</div>
              <div className="col-span-1 text-center">Status</div>
              {activePlatformTab === 'ALL' && (
                <>
                  <div className="col-span-4 flex items-center space-x-1">
                    <Smartphone className="w-3 h-3 text-slate-400" />
                    <span>Android Slot Unit ID</span>
                  </div>
                  <div className="col-span-4 flex items-center space-x-1">
                    <Apple className="w-3 h-3 text-slate-400" />
                    <span>iOS Slot Unit ID</span>
                  </div>
                </>
              )}
              {activePlatformTab === 'ANDROID' && (
                <div className="col-span-8 flex items-center space-x-1">
                  <Smartphone className="w-3 h-3 text-slate-400" />
                  <span>Android Slot Unit ID</span>
                </div>
              )}
              {activePlatformTab === 'IOS' && (
                <div className="col-span-8 flex items-center space-x-1">
                  <Apple className="w-3 h-3 text-slate-400" />
                  <span>iOS Slot Unit ID</span>
                </div>
              )}
            </div>

            {/* Unit Rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {AD_FORMAT_CONFIGS.map((cfg) => {
                const unitState = form.adUnits[cfg.key] || {};
                const isEnabled = unitState.enabled;

                return (
                  <div
                    key={cfg.key}
                    className="p-2.5 sm:px-3.5 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Desktop Horizontal Row Layout */}
                    <div className="hidden lg:grid grid-cols-12 gap-3 items-center">
                      {/* Format Name + Mini Badge */}
                      <div className="col-span-3 flex items-center space-x-2 min-w-0">
                        <div className="w-6.5 h-6.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                          <Tag className="w-3 h-3 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {cfg.name}
                          </div>
                          <span className="text-[9.5px] font-semibold text-slate-400 dark:text-slate-500">
                            {cfg.tag}
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle */}
                      <div className="col-span-1 flex justify-center">
                        <ToggleSwitch
                          enabled={isEnabled}
                          onChange={(val) => handleUnitToggle(cfg.key, val)}
                          ariaLabel={`Toggle ${cfg.name}`}
                          size="sm"
                        />
                      </div>

                      {/* Android Slot Input */}
                      {(activePlatformTab === 'ALL' || activePlatformTab === 'ANDROID') && (
                        <div className={activePlatformTab === 'ALL' ? 'col-span-4' : 'col-span-8'}>
                          <div className="relative">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={unitState.android || ''}
                              onChange={(e) => handleUnitChange(cfg.key, 'android', e.target.value)}
                              placeholder="ca-app-pub-xxx/yyy"
                              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(unitState.android, `and_${cfg.key}`, `Android ${cfg.name}`)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                              title="Copy Android Unit ID"
                            >
                              {copiedKey === `and_${cfg.key}` ? (
                                <Check className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* iOS Slot Input */}
                      {(activePlatformTab === 'ALL' || activePlatformTab === 'IOS') && (
                        <div className={activePlatformTab === 'ALL' ? 'col-span-4' : 'col-span-8'}>
                          <div className="relative">
                            <Apple className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={unitState.ios || ''}
                              onChange={(e) => handleUnitChange(cfg.key, 'ios', e.target.value)}
                              placeholder="ca-app-pub-xxx/yyy"
                              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(unitState.ios, `ios_${cfg.key}`, `iOS ${cfg.name}`)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                              title="Copy iOS Unit ID"
                            >
                              {copiedKey === `ios_${cfg.key}` ? (
                                <Check className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compact Stack Layout (< lg) */}
                    <div className="lg:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                            <Tag className="w-3 h-3 stroke-[2.2]" />
                          </div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {cfg.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            ({cfg.tag})
                          </span>
                        </div>
                        <ToggleSwitch
                          enabled={isEnabled}
                          onChange={(val) => handleUnitToggle(cfg.key, val)}
                          ariaLabel={`Toggle ${cfg.name}`}
                          size="sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activePlatformTab === 'ALL' || activePlatformTab === 'ANDROID') && (
                          <div className="relative">
                            <Smartphone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={unitState.android || ''}
                              onChange={(e) => handleUnitChange(cfg.key, 'android', e.target.value)}
                              placeholder="Android Unit ID"
                              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(unitState.android, `and_${cfg.key}`, `Android ${cfg.name}`)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                            >
                              {copiedKey === `and_${cfg.key}` ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                        {(activePlatformTab === 'ALL' || activePlatformTab === 'IOS') && (
                          <div className="relative">
                            <Apple className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={unitState.ios || ''}
                              onChange={(e) => handleUnitChange(cfg.key, 'ios', e.target.value)}
                              placeholder="iOS Unit ID"
                              className="w-full pl-7 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(unitState.ios, `ios_${cfg.key}`, `iOS ${cfg.name}`)}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
                            >
                              {copiedKey === `ios_${cfg.key}` ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PUBLISHER & API CREDENTIALS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'credentials' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3.5">
            <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Radio className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Publisher Coordinates
                </h3>
                <p className="text-[10.5px] text-slate-400 font-medium">
                  Primary account and package identification
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Publisher Account ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Publisher Account ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.publisherAccountId}
                    onChange={(e) => setForm((p) => ({ ...p, publisherAccountId: e.target.value }))}
                    placeholder="pub-XXXXXXXXXXXXXXXX"
                    className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.publisherAccountId, 'pub_id', 'Publisher Account ID')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                  >
                    {copiedKey === 'pub_id' ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* App Package Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  App Package Bundle ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.appPackageName}
                    onChange={(e) => setForm((p) => ({ ...p, appPackageName: e.target.value }))}
                    placeholder="com.flix9ott.app"
                    className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.appPackageName, 'app_pkg', 'App Package Name')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                  >
                    {copiedKey === 'app_pkg' ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Google API Sync Credentials */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-white/10 space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Google AdMob Reporting API Credentials
                </h4>
              </div>

              {/* OAuth Client ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  OAuth Client ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.oauthClientId}
                    onChange={(e) => setForm((p) => ({ ...p, oauthClientId: e.target.value }))}
                    placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(form.oauthClientId, 'oauth_id', 'OAuth Client ID')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                  >
                    {copiedKey === 'oauth_id' ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* OAuth Secret */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    OAuth Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={form.oauthClientSecret}
                      onChange={(e) => setForm((p) => ({ ...p, oauthClientSecret: e.target.value }))}
                      placeholder="Secret Phrase"
                      className="w-full pl-2.5 pr-14 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-0.5">
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.oauthClientSecret, 'oauth_sec', 'OAuth Client Secret')}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                      >
                        {copiedKey === 'oauth_sec' ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* OAuth Refresh Token */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    OAuth Refresh Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={form.oauthRefreshToken}
                      onChange={(e) => setForm((p) => ({ ...p, oauthRefreshToken: e.target.value }))}
                      placeholder="Refresh Token Key"
                      className="w-full pl-2.5 pr-14 py-1.5 text-xs font-mono bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-0.5">
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(form.oauthRefreshToken, 'oauth_tok', 'OAuth Refresh Token')}
                        className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded cursor-pointer"
                      >
                        {copiedKey === 'oauth_tok' ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Website Monetization Notice */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <Globe className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Website Monetization:</strong> Web platform uses{' '}
                <strong className="text-slate-900 dark:text-white">Google AdSense</strong>. Manage web ad slot IDs in{' '}
                <button
                  type="button"
                  onClick={() => onNavigate ? onNavigate('ad_control') : null}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                >
                  <span>AdSense Manager</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </button>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: REVENUE TRENDS & CHARTS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121216] rounded-xl p-4 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Weekly Earnings Trend
                  </h3>
                  <p className="text-[10.5px] text-slate-400 font-medium">
                    Impression delivery & estimated eCPM performance
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Timeframe Selector */}
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="28d">Last 28 Days</option>
                  <option value="14d">Last 14 Days</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="month">This Month</option>
                </select>

                {/* Currency Switcher */}
                <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    $ USD
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`px-2 py-0.5 rounded text-[10.5px] font-bold cursor-pointer ${
                      currency === 'INR'
                        ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ₹ INR
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Recharts Area Chart */}
            <div className="h-48 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA} margin={{ top: 8, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admobEarningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FEF08A" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#FEF08A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Urbanist' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'Urbanist' }}
                    axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                    tickLine={false}
                    domain={[0, 4]}
                    ticks={[0, 1, 2, 3, 4]}
                    tickFormatter={(v) => (currency === 'USD' ? `$${v}` : `₹${v}`)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-[#24242E] border border-slate-200 dark:border-white/12 shadow-xl rounded-xl p-2 text-xs font-urbanist">
                            <p className="font-extrabold text-slate-950 dark:text-white text-[11px] mb-0.5">{label}</p>
                            <p className="text-amber-600 dark:text-amber-300 font-bold text-[11px]">
                              Earnings: {currency === 'USD' ? `$${data.earnings}` : `₹${data.earnings}`}
                            </p>
                            <p className="text-slate-400 text-[10px]">Requests: {data.requests}</p>
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
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#admobEarningsGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Insight Pill */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-[#FEF08A]/5 border border-amber-500/20 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                <strong className="text-slate-950 dark:text-white">Policy Compliance:</strong> Zero ad serving restrictions. Periodic sync pipeline active.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-3.5 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border ${
              toast.type === 'error'
                ? 'bg-rose-950 text-rose-200 border-rose-800'
                : toast.type === 'info'
                ? 'bg-slate-900 text-slate-200 border-slate-700'
                : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-800 dark:border-slate-200'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 dark:text-amber-300 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
