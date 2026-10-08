import React from 'react';
import AnimatedNumber from '../../../components/common/AnimatedNumber';
import {
  Coins,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Flame,
  Layers,
  Crown,
  Eye,
  MousePointerClick,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export default function AdOverviewTab({
  settings,
  customAdsStats,
  admobData,
  onUpdateSettings,
  onSwitchTab
}) {
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
  } = admobData;

  const handleToggle = (key, val) => {
    onUpdateSettings({ [key]: val });
  };

  return (
    <div className="space-y-4 font-urbanist">
      
      {/* 4 Standardized Metric Cards complying with ESQUARE Admin guidelines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Google AdMob Revenue */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                AdMob Monthly Earnings
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                <Coins className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                <AnimatedNumber value={monthlyRevenue} />
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {growthRate}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">vs previous month</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Today's Earnings:</span>
            <span className="text-slate-950 dark:text-white font-extrabold text-[11px]">{todayRevenue}</span>
          </div>
        </div>

        {/* Card 2: Custom Sponsor Impressions & CTR */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Direct Custom Ads CTR
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                <MousePointerClick className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                {customAdsStats?.ctr || '6.34%'}
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[11px] text-slate-400 font-semibold">
                  <strong>{customAdsStats?.clicks?.toLocaleString() || '6,510'}</strong> total clicks logged
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Active Campaigns:</span>
            <button
              onClick={() => onSwitchTab('custom')}
              className="text-amber-600 dark:text-[#FEF08A] font-extrabold text-[11px] hover:underline"
            >
              {customAdsStats?.active ?? 3} Active (Manage →)
            </button>
          </div>
        </div>

        {/* Card 3: Combined Impressions */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Combined Impressions
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                <Eye className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                <AnimatedNumber value={impressions} />
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> +15.2%
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">Ad requests served</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Direct Sponsor Views:</span>
            <span className="text-slate-950 dark:text-white font-extrabold text-[11px]">
              {(customAdsStats?.impressions || 102700).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Average eCPM & Fill Rate */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Average eCPM & Fill
              </span>
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                <TrendingUp className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl sm:text-[28px] font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                {ecpm}
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> {fillRate} Fill
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">optimal match</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Top Format Yield:</span>
            <span className="text-amber-600 dark:text-[#FEF08A] font-extrabold text-[11px]">₹213.20 (Rewarded)</span>
          </div>
        </div>

      </div>

      {/* Quick Monetization Engine Controls Banner */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 border border-slate-200/90 dark:border-white/10 shadow-nodus">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              Live Ad Engine & Mediation Controls
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              One-click master controls governing mobile app ad delivery in real-time.
            </p>
          </div>
          <button
            onClick={() => onSwitchTab('mediation')}
            className="text-xs font-bold text-amber-700 dark:text-[#FEF08A] hover:underline self-start sm:self-auto"
          >
            Advanced Mediation Settings →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
          
          {/* Toggle 1: AdMob Network Live */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">AdMob Network</span>
              <span className="text-[10px] text-slate-400 block">
                {settings?.admobEnabled ? 'Serving Google Ads' : 'Network Disabled'}
              </span>
            </div>
            <button
              onClick={() => handleToggle('admobEnabled', !settings?.admobEnabled)}
              className="cursor-pointer"
              title="Toggle AdMob Network"
            >
              {settings?.admobEnabled ? (
                <ToggleRight className="w-7 h-7 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-400" />
              )}
            </button>
          </div>

          {/* Toggle 2: Developer Test Mode */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Test Mode (Sandbox)</span>
              <span className="text-[10px] text-slate-400 block">
                {settings?.testMode ? 'Using Google Test IDs' : 'Production Live IDs'}
              </span>
            </div>
            <button
              onClick={() => handleToggle('testMode', !settings?.testMode)}
              className="cursor-pointer"
              title="Toggle Test Mode"
            >
              {settings?.testMode ? (
                <ToggleRight className="w-7 h-7 text-amber-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-400" />
              )}
            </button>
          </div>

          {/* Toggle 3: VIP Ad-Free Shield */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> VIP Bypass
              </span>
              <span className="text-[10px] text-slate-400 block">
                {settings?.vipBypassAds ? 'Paid members see 0 ads' : 'Ads shown to everyone'}
              </span>
            </div>
            <button
              onClick={() => handleToggle('vipBypassAds', !settings?.vipBypassAds)}
              className="cursor-pointer"
              title="Toggle VIP Ad Shield"
            >
              {settings?.vipBypassAds ? (
                <ToggleRight className="w-7 h-7 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-400" />
              )}
            </button>
          </div>

          {/* Control 4: Mediation Mode */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">Mediation Mode</span>
              <span className="text-[10px] text-slate-400 block truncate">
                {settings?.mediationMode === 'CUSTOM_FIRST' ? 'Custom First (Sponsor)' : settings?.mediationMode}
              </span>
            </div>
            <select
              value={settings?.mediationMode || 'CUSTOM_FIRST'}
              onChange={(e) => handleToggle('mediationMode', e.target.value)}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-[#202620] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="CUSTOM_FIRST">Custom 1st</option>
              <option value="ADMOB_FIRST">AdMob 1st</option>
              <option value="PERCENTAGE_SPLIT">50/50 Split</option>
              <option value="CUSTOM_ONLY">Custom Only</option>
              <option value="ADMOB_ONLY">AdMob Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Left: 6-Month Revenue Growth Trend Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight">
                  Monthly Ad Revenue Trend
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">6-month growth trajectory (Oct 2025 – Mar 2026)</p>
              </div>
              <span className="text-[11px] font-black px-2.5 py-1 bg-amber-50 dark:bg-[#FEF08A]/15 text-amber-800 dark:text-[#FEF08A] border border-amber-200 dark:border-amber-700/40 rounded-lg">
                March Peak: ₹4.85L
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-52 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/10" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#FEF08A', opacity: 0.15 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 dark:bg-[#1C221C] text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-800 dark:border-white/12">
                            <p className="font-bold text-amber-300 dark:text-[#FEF08A]">{data.month}</p>
                            <p className="font-black text-sm text-white">Revenue: ₹{(data.revenue / 100000).toFixed(2)} Lakh</p>
                            <p className="text-slate-300">Avg eCPM: ₹{data.ecpm.toFixed(2)}</p>
                            <p className="text-slate-400 text-[11px]">Impressions: {data.impressions}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                    {monthlyTrend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === monthlyTrend.length - 1 ? '#FEF08A' : '#FDE047'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Average Monthly Growth: <strong className="text-slate-900 dark:text-white">+18.5%</strong></span>
            <span>Total 6-Month Earnings: <strong className="text-slate-900 dark:text-white">₹21.25 Lakh</strong></span>
          </div>
        </div>

        {/* Right: Ad Format Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base font-urbanist tracking-tight">
                  Ad Format Revenue Share
                </h3>
                <p className="text-xs text-slate-400 font-medium">Monthly revenue split by ad format</p>
              </div>
            </div>

            {/* Ad Format Progress List */}
            <div className="space-y-4 mt-2">
              {adFormatBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-100 dark:border-white/10 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-extrabold text-slate-950 dark:text-white flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.format}</span>
                    </span>
                    <span className="font-black text-slate-950 dark:text-white">{item.revenue} <span className="text-slate-400 font-normal">({item.share})</span></span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-[#121612] h-2.5 rounded-full overflow-hidden my-2">
                    <div className={`${item.progressBg} h-full rounded-full transition-all duration-500`} style={{ width: item.share }} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1.5">
                    <span>Placement: {item.placement}</span>
                    <span className="text-amber-700 dark:text-[#FEF08A] font-bold">eCPM: {item.ecpm}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 p-3 rounded-xl bg-amber-50/70 dark:bg-[#FEF08A]/10 border border-amber-200 dark:border-amber-700/30 flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-[#FEF08A] shrink-0" />
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">
              <strong className="text-slate-950 dark:text-white">Optimization Insight:</strong> Rewarded video ads on episode 3 unlocks yield 3.4x higher eCPM than standard banners.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
