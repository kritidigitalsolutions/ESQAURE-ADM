import React, { useState } from 'react';
import { mockAdmobOverview } from '../../data/mockOttData';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import {
  Coins,
  TrendingUp,
  Eye,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  PauseCircle,
  Layers,
  Settings,
  DollarSign,
  Download,
  Sparkles,
  Play,
  Film,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  RefreshCw
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

export default function AdmobPage() {
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { monthlyRevenue, growthRate, todayRevenue, impressions, ecpm, matchRate, fillRate, adFormatBreakdown, monthlyTrend, adUnits } = mockAdmobOverview;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filteredAdUnits = selectedFormat === 'ALL'
    ? adUnits
    : adUnits.filter(unit => unit.type.toLowerCase().includes(selectedFormat.toLowerCase()));

  return (
    <div className="space-y-8 font-sans">
      
      {/* Top Banner / Actions Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shadow-xs shrink-0">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                Google AdMob Monetization
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> AdMob Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Real-time ad revenue reporting, eCPM tracking, ad format distribution, and ad unit configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-transparent dark:border-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Stats</span>
          </button>
          
          <a
            href="https://admob.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-950 bg-[#FEF08A] hover:bg-[#FDE047] transition-all shadow-xs"
          >
            <span>Open AdMob Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 4 Core AdMob Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Monthly Ad Revenue */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Monthly Ad Revenue
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-black flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> {growthRate}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                <AnimatedNumber value={monthlyRevenue} />
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 block">
                March 2026 total earnings
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Today's Revenue:</span>
            <span className="text-slate-950 dark:text-white font-extrabold">
              <AnimatedNumber value={todayRevenue} />
            </span>
          </div>
        </div>

        {/* Card 2: Average eCPM */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Average eCPM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-black flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +8.6%
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                <AnimatedNumber value={ecpm} />
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 block">
                Effective cost per 1,000 views
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Highest eCPM:</span>
            <span className="text-amber-600 dark:text-[#FEF08A] font-extrabold">₹213.20 (Rewarded)</span>
          </div>
        </div>

        {/* Card 3: Total Ad Impressions */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Ad Impressions
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-black flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +15.2%
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                <AnimatedNumber value={impressions} />
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1 block">
                Served ad impressions this month
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Ad Requests Served:</span>
            <span className="text-slate-950 dark:text-white font-extrabold">2.86M</span>
          </div>
        </div>

        {/* Card 4: Match & Fill Rate */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                Fill & Match Rate
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-black flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Optimal
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                <AnimatedNumber value={fillRate} />
              </span>
              <span className="text-xs font-bold text-slate-400">Fill</span>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-1 block">
              Match rate: <strong className="text-slate-800 dark:text-slate-200">{matchRate}</strong>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Unfilled Inventory:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">0.8% (Very Low)</span>
          </div>
        </div>

      </div>

      {/* Middle Section: 6-Month Ad Revenue Trend & Ad Format Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: 6-Month Revenue Growth Trend Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base font-urbanist tracking-tight">
                  Monthly Ad Revenue Trend
                </h3>
                <p className="text-xs text-slate-400 font-medium">6-month growth trajectory (Oct 2025 – Mar 2026)</p>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-amber-50 dark:bg-[#FEF08A]/15 text-amber-800 dark:text-[#FEF08A] border border-amber-200 dark:border-amber-700/40 rounded-lg">
                March Peak: ₹4.85L
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-64 w-full mt-4">
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

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Average Monthly Growth: <strong className="text-slate-900 dark:text-white">+18.5%</strong></span>
            <span>Total 6-Month Earnings: <strong className="text-slate-900 dark:text-white">₹21.25 Lakh</strong></span>
          </div>
        </div>

        {/* Right: Ad Format Breakdown */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between transition-colors">
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

      {/* Ad Units Inventory Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-black text-slate-950 dark:text-white text-base font-urbanist tracking-tight">
              AdMob Ad Units Inventory
            </h3>
            <p className="text-xs text-slate-400 font-medium">Configured in-app ad placements & live performance</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-[#161B16] p-1 rounded-xl border border-slate-200/70 dark:border-white/10">
            {['ALL', 'Rewarded', 'Interstitial', 'Native'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFormat(type)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedFormat === type
                    ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                <th className="pb-3 px-3">Ad Unit Name & ID</th>
                <th className="pb-3 px-3">Format</th>
                <th className="pb-3 px-3">Floor eCPM</th>
                <th className="pb-3 px-3">Actual eCPM</th>
                <th className="pb-3 px-3">Monthly Impressions</th>
                <th className="pb-3 px-3">Monthly Revenue</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-medium">
              {filteredAdUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.04] transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-extrabold text-slate-950 dark:text-white block">{unit.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{unit.id}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-[#161B16] font-extrabold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 text-[11px]">
                      {unit.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-bold">{unit.floorEcpm}</td>
                  <td className="py-3.5 px-3 text-amber-600 dark:text-[#FEF08A] font-extrabold">{unit.ecpm}</td>
                  <td className="py-3.5 px-3 text-slate-800 dark:text-slate-200 font-bold">{unit.impressions}</td>
                  <td className="py-3.5 px-3 font-black text-slate-950 dark:text-white">{unit.monthlyRevenue}</td>
                  <td className="py-3.5 px-3 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                      unit.status === 'ACTIVE'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
