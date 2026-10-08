import React, { useState, useEffect, useCallback } from 'react';
import { mockAdmobOverview } from '../../data/mockOttData';
import adService from '../../services/adService';
import KpiStatCard from '../../components/common/KpiStatCard';
import {
  Coins,
  TrendingUp,
  Film,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Smartphone,
  Apple,
  Sparkles,
  Copy,
  Check,
  Pencil,
  X,
  Save,
  RotateCcw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CheckCircle,
  Layers,
  ArrowUpRight,
  Info
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

export default function AdmobPage({ onNavigate }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [editingUnitKey, setEditingUnitKey] = useState(null);
  const [unitFilter, setUnitFilter] = useState('ALL');

  const {
    monthlyRevenue,
    growthRate,
    todayRevenue,
    impressions,
    ecpm,
    matchRate,
    fillRate,
    adFormatBreakdown,
    monthlyTrend
  } = mockAdmobOverview;

  // Settings form state
  const [form, setForm] = useState({
    admobEnabled: true,
    testMode: false,
    androidAppId: 'ca-app-pub-9920192847192847~1234567890',
    iosAppId: 'ca-app-pub-9920192847192847~0987654321',
    adUnits: {
      rewarded: {
        android: 'ca-app-pub-9920192847192847/1122334455',
        ios: 'ca-app-pub-9920192847192847/5544332211',
        enabled: true,
        rewardDescription: 'Unlock Episode / 1 Free Pass',
        floorEcpm: '₹180.00',
        actualEcpm: '₹213.20'
      },
      interstitial: {
        android: 'ca-app-pub-9920192847192847/2233445566',
        ios: 'ca-app-pub-9920192847192847/6655443322',
        enabled: true,
        intervalEpisodes: 3,
        floorEcpm: '₹110.00',
        actualEcpm: '₹135.10'
      },
      banner: {
        android: 'ca-app-pub-9920192847192847/3344556677',
        ios: 'ca-app-pub-9920192847192847/7766554433',
        enabled: true,
        floorEcpm: '₹85.00',
        actualEcpm: '₹117.10'
      },
      native: {
        android: 'ca-app-pub-9920192847192847/5566778899',
        ios: 'ca-app-pub-9920192847192847/9988776655',
        enabled: true,
        floorEcpm: '₹95.00',
        actualEcpm: '₹124.50'
      },
      appOpen: {
        android: 'ca-app-pub-9920192847192847/4455667788',
        ios: 'ca-app-pub-9920192847192847/8877665544',
        enabled: false,
        floorEcpm: '₹130.00',
        actualEcpm: '₹145.00'
      }
    }
  });

  const [googleTestUnits, setGoogleTestUnits] = useState(null);

  // Load backend configuration
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await adService.getSettings();
      if (res?.success && res.data?.settings) {
        setForm(prev => ({
          ...prev,
          ...res.data.settings,
          adUnits: {
            ...prev.adUnits,
            ...(res.data.settings.adUnits || {})
          }
        }));
        if (res.data.googleTestUnits) {
          setGoogleTestUnits(res.data.googleTestUnits);
        }
      }
    } catch (err) {
      console.warn('Failed to load AdMob settings:', err);
    } finally {
      if (showIndicator) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleUnitToggle = async (formatKey) => {
    const updatedEnabled = !form.adUnits[formatKey]?.enabled;
    const updatedForm = {
      ...form,
      adUnits: {
        ...form.adUnits,
        [formatKey]: {
          ...form.adUnits[formatKey],
          enabled: updatedEnabled
        }
      }
    };
    setForm(updatedForm);
    try {
      await adService.updateSettings(updatedForm);
    } catch (err) {
      console.error('Failed to toggle unit:', err);
    }
  };

  const handleApplyGoogleTestUnits = () => {
    if (!googleTestUnits) return;
    setForm(prev => ({
      ...prev,
      testMode: true,
      androidAppId: googleTestUnits.android.appId,
      iosAppId: googleTestUnits.ios.appId,
      adUnits: {
        rewarded: {
          ...prev.adUnits.rewarded,
          android: googleTestUnits.android.rewarded,
          ios: googleTestUnits.ios.rewarded
        },
        interstitial: {
          ...prev.adUnits.interstitial,
          android: googleTestUnits.android.interstitial,
          ios: googleTestUnits.ios.interstitial
        },
        banner: {
          ...prev.adUnits.banner,
          android: googleTestUnits.android.banner,
          ios: googleTestUnits.ios.banner
        },
        appOpen: {
          ...prev.adUnits.appOpen,
          android: googleTestUnits.android.appOpen,
          ios: googleTestUnits.ios.appOpen
        },
        native: {
          ...prev.adUnits.native,
          android: googleTestUnits.android.native,
          ios: googleTestUnits.ios.native
        }
      }
    }));
  };

  const handleSaveForm = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adService.updateSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setEditingUnitKey(null);
    } catch (err) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const unitsList = [
    {
      key: 'rewarded',
      name: 'Rewarded Video Ads',
      placement: 'Episode Paywall Unlock (Ep 3+)',
      type: 'Rewarded Video',
      icon: Film,
      yieldTag: 'Highest Yield',
      floorEcpm: '₹180.00',
      actualEcpm: '₹213.20',
      impressions: '1.42M',
      revenue: '₹3,02,800',
      share: '62.4%'
    },
    {
      key: 'interstitial',
      name: 'Navigation & Episode End Interstitial',
      placement: 'Episode End & Navigation Transitions',
      type: 'Interstitial',
      icon: Zap,
      yieldTag: 'Core Monetization',
      floorEcpm: '₹110.00',
      actualEcpm: '₹135.10',
      impressions: '890k',
      revenue: '₹1,20,300',
      share: '24.8%'
    },
    {
      key: 'native',
      name: 'Native In-Feed Sponsored Cards',
      placement: 'Home Trays & Search Feed',
      type: 'Native Card',
      icon: Sparkles,
      yieldTag: 'High CTR',
      floorEcpm: '₹95.00',
      actualEcpm: '₹124.50',
      impressions: '310k',
      revenue: '₹38,600',
      share: '8.0%'
    },
    {
      key: 'banner',
      name: 'Standard Display Banner (Footer)',
      placement: 'Player Bottom & Feed Footer',
      type: 'Display Banner',
      icon: Layers,
      yieldTag: 'Steady Impressions',
      floorEcpm: '₹85.00',
      actualEcpm: '₹117.10',
      impressions: '220k',
      revenue: '₹23,500',
      share: '4.8%'
    },
    {
      key: 'appOpen',
      name: 'App Open Cold Start Splash',
      placement: 'Mobile App Launch / Resume',
      type: 'App Open Splash',
      icon: Smartphone,
      yieldTag: 'High Visibility',
      floorEcpm: '₹130.00',
      actualEcpm: '₹145.00',
      impressions: '—',
      revenue: '—',
      share: '0.0%'
    }
  ];

  const filteredUnits = unitFilter === 'ALL'
    ? unitsList
    : unitsList.filter(u => u.type.toLowerCase().includes(unitFilter.toLowerCase()));

  const activeEditingUnit = unitsList.find(u => u.key === editingUnitKey);

  return (
    <div className="space-y-3.5 font-urbanist animate-fade-in pb-16 selection:bg-[#FEF08A] selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. SLEEK STATUS & ACTION STRIP (No redundant page title!)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        
        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10">
            <span className={`w-2 h-2 rounded-full ${form.admobEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Network Status:
            </span>
            <span className={`font-extrabold ${form.admobEnabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
              {form.admobEnabled ? 'Active & Live' : 'Disabled'}
            </span>
          </div>

          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
            form.testMode
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
          }`}>
            {form.testMode ? '⚠ Test Mode Active (Google Demo IDs)' : '✓ Production Live Mode'}
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline-block">
            SDK v23.0 • Real-time Mediation
          </span>
        </div>

        {/* Clean Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/70 dark:border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>

          <a
            href="https://admob.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] transition-all shadow-xs cursor-pointer"
          >
            <span>Open AdMob Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CORE KPI STAT CARDS (Universal KpiStatCard Standard)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiStatCard
          icon={Coins}
          title="Monthly Ad Revenue"
          subtitle="Net AdMob Monetization"
          value={`₹${(monthlyRevenue || 485200).toLocaleString('en-IN')}`}
          badgeVariant="active"
          badgeLabel={growthRate || "+22.4%"}
          footerLeft="Today's Yield"
          footerRight={todayRevenue || "₹18,450"}
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        <KpiStatCard
          icon={TrendingUp}
          title="Average eCPM"
          subtitle="Effective Cost / 1k Views"
          value={`₹${ecpm || "170.80"}`}
          badgeVariant="active"
          badgeLabel="+8.6%"
          footerLeft="Highest Yield Format"
          footerRight="Rewarded (₹213.20)"
          footerRightColor="text-amber-600 dark:text-[#FEF08A] font-bold"
        />

        <KpiStatCard
          icon={Film}
          title="Ad Impressions"
          subtitle="Served Across OTT App"
          value={typeof impressions === 'number' ? impressions.toLocaleString('en-IN') : (impressions || "2,840,000")}
          badgeVariant="active"
          badgeLabel="+15.2%"
          footerLeft="Requests Match"
          footerRight="2.86M (98.6%)"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        <KpiStatCard
          icon={CheckCircle2}
          title="Fill & Match Rate"
          subtitle="Ad Network Inventory"
          value={fillRate || "99.2%"}
          badgeVariant="active"
          badgeLabel="Optimal"
          footerLeft="Unfilled Inventory"
          footerRight="0.8% (Healthy)"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODERN ANALYTICS: Slim Trend Chart + Ad Format Share
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Left: 6-Month Trend Area Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-black text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight">
                  Revenue Growth Trajectory
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">6-month monthly revenue & yield expansion</p>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 bg-amber-50 dark:bg-[#FEF08A]/15 text-amber-900 dark:text-[#FEF08A] border border-amber-200/70 dark:border-amber-700/40 rounded-lg">
                Peak: ₹4.85 Lakh
              </span>
            </div>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admobRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FEF08A" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FEF08A" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 dark:bg-[#1C221C] text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800 dark:border-white/15 font-urbanist">
                            <p className="font-bold text-amber-300 dark:text-[#FEF08A]">{data.month}</p>
                            <p className="font-black text-sm text-white">Revenue: ₹{(data.revenue / 100000).toFixed(2)} Lakh</p>
                            <p className="text-slate-300 text-[11px]">Avg eCPM: ₹{data.ecpm?.toFixed?.(2) || data.ecpm}</p>
                            <p className="text-slate-400 text-[11px]">Impressions: {data.impressions}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#EAB308"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#admobRevenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Avg Monthly Increase: <strong className="text-slate-900 dark:text-white font-extrabold">+18.5%</strong></span>
            <span>Total 6M Yield: <strong className="text-slate-900 dark:text-white font-extrabold">₹21.25 Lakh</strong></span>
          </div>
        </div>

        {/* Right: Ad Format Revenue Share */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-black text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight">
                  Format Revenue Distribution
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Share of earnings across ad formats</p>
              </div>
            </div>

            <div className="space-y-2.5 mt-2">
              {adFormatBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/60 dark:border-white/10 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-extrabold text-slate-950 dark:text-white flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.format}</span>
                    </span>
                    <span className="font-black text-slate-950 dark:text-white">
                      {item.revenue} <span className="text-slate-400 font-normal">({item.share})</span>
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200/80 dark:bg-[#121612] h-1.5 rounded-full overflow-hidden my-1">
                    <div className={`${item.progressBg} h-full rounded-full transition-all duration-500`} style={{ width: item.share }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    <span className="truncate max-w-[190px]">{item.placement}</span>
                    <span className="text-amber-700 dark:text-[#FEF08A] font-bold">eCPM: {item.ecpm}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center space-x-2 text-[11px] text-slate-600 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-[#FEF08A] shrink-0" />
            <span>Rewarded video generates <strong className="text-slate-950 dark:text-white font-bold">62.4%</strong> of ad revenue with ₹213 eCPM.</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. APP IDs & CREDENTIALS CONFIGURATION (Clean 2-Column Section)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
              Google AdMob App IDs & Environment
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Required for Google Mobile Ads SDK initialization in Android & iOS apps.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleApplyGoogleTestUnits}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fill Google Test Demo IDs</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Android App ID */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span>Android AdMob App ID</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(form.androidAppId, 'androidAppId')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'androidAppId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'androidAppId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={form.androidAppId}
              onChange={(e) => setForm(p => ({ ...p, androidAppId: e.target.value }))}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
            />
          </div>

          {/* iOS App ID */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Apple className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <span>iOS AdMob App ID</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(form.iosAppId, 'iosAppId')}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'iosAppId' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'iosAppId' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={form.iosAppId}
              onChange={(e) => setForm(p => ({ ...p, iosAppId: e.target.value }))}
              placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-white dark:bg-[#121612] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FEF08A]/60"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4" /> Changes deployed and synced to mobile apps!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                AdMob App IDs apply immediately to mobile app sessions.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveForm}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Deploying...' : 'Save App IDs'}</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. ADMOB UNITS INVENTORY TABLE
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus overflow-hidden">
        
        {/* Table Header & Format Filter Pills */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
              Ad Units Inventory & Delivery Control
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live configured ad placements, Unit IDs, and instant delivery toggles.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl border border-slate-200/70 dark:border-white/10">
            {['ALL', 'Rewarded', 'Interstitial', 'Native', 'Banner', 'App Open'].map((type) => (
              <button
                key={type}
                onClick={() => setUnitFilter(type)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  unitFilter === type
                    ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Inventory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-urbanist">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[10.5px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider bg-slate-50/70 dark:bg-[#161B16]/50">
                <th className="py-2.5 px-4">Ad Unit & Format</th>
                <th className="py-2.5 px-3">Android Unit ID</th>
                <th className="py-2.5 px-3">iOS Unit ID</th>
                <th className="py-2.5 px-3 text-center">Floor / eCPM</th>
                <th className="py-2.5 px-3 text-center">Delivery</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
              {filteredUnits.map((item) => {
                const Icon = item.icon;
                const unitConfig = form.adUnits[item.key] || {};
                const isEnabled = unitConfig.enabled;

                return (
                  <tr
                    key={item.key}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Format Title & Icon */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                          <Icon className="w-4 h-4 stroke-[2.2]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-slate-950 dark:text-white block truncate">
                              {item.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-[#161B16] text-[9.5px] font-bold text-slate-500 border border-slate-200 dark:border-white/10">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium block truncate max-w-xs mt-0.5">
                            {item.placement}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Android Unit ID */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={unitConfig.android}>
                          {unitConfig.android || '—'}
                        </span>
                        {unitConfig.android && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(unitConfig.android, `${item.key}_and`)}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded cursor-pointer"
                            title="Copy Android ID"
                          >
                            {copiedKey === `${item.key}_and` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* iOS Unit ID */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[140px]" title={unitConfig.ios}>
                          {unitConfig.ios || '—'}
                        </span>
                        {unitConfig.ios && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(unitConfig.ios, `${item.key}_ios`)}
                            className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded cursor-pointer"
                            title="Copy iOS ID"
                          >
                            {copiedKey === `${item.key}_ios` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* eCPM Yield */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-amber-600 dark:text-[#FEF08A]">
                        {item.actualEcpm}
                      </span>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleUnitToggle(item.key)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer border transition-colors ${
                          isEnabled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            : 'bg-slate-100 dark:bg-[#161B16] text-slate-400 border-slate-200 dark:border-white/10'
                        }`}
                      >
                        {isEnabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </td>

                    {/* Action: Edit Unit */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingUnitKey(item.key)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit IDs</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Quick Ad Unit Editor Modal
         ───────────────────────────────────────────────────────────── */}
      {editingUnitKey && activeEditingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#282E28] rounded-2xl border border-slate-200 dark:border-white/15 p-5 w-full max-w-lg shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400">
                  <activeEditingUnit.icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Edit {activeEditingUnit.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">{activeEditingUnit.placement}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUnitKey(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Android Ad Unit ID
                </label>
                <input
                  type="text"
                  value={form.adUnits[editingUnitKey]?.android || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      adUnits: {
                        ...prev.adUnits,
                        [editingUnitKey]: {
                          ...prev.adUnits[editingUnitKey],
                          android: val
                        }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  iOS Ad Unit ID
                </label>
                <input
                  type="text"
                  value={form.adUnits[editingUnitKey]?.ios || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      adUnits: {
                        ...prev.adUnits,
                        [editingUnitKey]: {
                          ...prev.adUnits[editingUnitKey],
                          ios: val
                        }
                      }
                    }));
                  }}
                  className="w-full px-3 py-2 font-mono text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                />
              </div>

              {editingUnitKey === 'interstitial' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Show Interstitial Every X Episodes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.adUnits.interstitial?.intervalEpisodes || 3}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm(prev => ({
                        ...prev,
                        adUnits: {
                          ...prev.adUnits,
                          interstitial: {
                            ...prev.adUnits.interstitial,
                            intervalEpisodes: val
                          }
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {editingUnitKey === 'rewarded' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reward Incentive Label
                  </label>
                  <input
                    type="text"
                    value={form.adUnits.rewarded?.rewardDescription || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        adUnits: {
                          ...prev.adUnits,
                          rewarded: {
                            ...prev.adUnits.rewarded,
                            rewardDescription: val
                          }
                        }
                      }));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingUnitKey(null)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                disabled={isSaving}
                className="px-4 py-1.5 text-xs font-black bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 rounded-xl cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Unit ID'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
