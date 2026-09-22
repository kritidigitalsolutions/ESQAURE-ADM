import React from 'react';
import MetricsOverview from '../../components/MetricsOverview';
import ActivityChart from '../../components/ActivityChart';
import IncomeChart from '../../components/IncomeChart';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import { mockDramas, mockTransactions } from '../../data/mockOttData';
import { Flame, CreditCard, ChevronRight, Crown, Sparkles } from 'lucide-react';

export default function DashboardPage({ onOpenIngestModal, onNavigate }) {
  const trendingDramas = mockDramas.filter(d => d.isTrending).sort((a, b) => a.trendingRank - b.trendingRank);

  // Time stamps for recent subscriptions
  const relativeTimes = ['2m ago', '12m ago', '28m ago', '54m ago', '1h ago', '2h ago'];

  return (
    <div className="space-y-8">
      {/* 4 Core OTT Stat Cards & Nodus Metric Row */}
      <MetricsOverview onOpenIngestModal={onOpenIngestModal} />

      {/* Streaming Traffic Area Spline Chart & Acquisition Breakdown */}
      <ActivityChart onNavigate={onNavigate} />

      {/* Wide Low-Height Platform Income & Revenue Stream Graph */}
      <IncomeChart onNavigate={onNavigate} />

      {/* Live OTT Performance Split: Top Trending Series & Live Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Trending Micro-Dramas */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 dark:border-amber-400/20 flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-[17px] font-urbanist tracking-tight leading-snug">
                    Top Trending Micro-Dramas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Ranked by paid conversions & completion rate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('dramas')}
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn shrink-0"
              >
                <span>View Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Drama List: Clean, Frameless, Perfectly Aligned */}
            <div className="divide-y divide-slate-100/80 dark:divide-slate-800 pt-1">
              {trendingDramas.slice(0, 4).map((drama, idx) => {
                const rankNum = idx + 1;

                return (
                  <div
                    key={drama.id}
                    onClick={() => onNavigate('dramas')}
                    className="flex items-center space-x-3 py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Typographic Rank Number */}
                    <span className={`font-urbanist font-black text-xs w-4 text-center shrink-0 ${
                      rankNum === 1 ? 'text-amber-500' : 'text-slate-400'
                    }`}>
                      {rankNum}
                    </span>

                    {/* 9:16 Portrait Poster */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                      <img
                        src={drama.poster}
                        alt={drama.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Title & Clean Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-600 transition-colors">
                        {drama.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        <span>{drama.totalEpisodes} Episodes</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span className="text-slate-600 dark:text-slate-400">{drama.genres.join(', ')}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Recent Subscriptions Ledger */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111111] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 dark:bg-amber-400/10 border border-amber-400/30 dark:border-amber-400/20 flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-[17px] font-urbanist tracking-tight leading-snug">
                    Recent Subscriptions
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Live Razorpay webhook transactions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn shrink-0"
              >
                <span>All Transactions</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Minimal Column Header for Effortless Reading */}
            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600 pb-2.5 mt-3 border-b border-slate-100 dark:border-slate-800 px-2">
              <span className="col-span-5">Subscriber</span>
              <span className="col-span-4">Plan & Method</span>
              <span className="col-span-3 text-right">Amount & Status</span>
            </div>

            {/* Subscriptions List: Clean, Frameless, Perfectly Columnar */}
            <div className="divide-y divide-slate-100/80 dark:divide-slate-800">
              {mockTransactions.slice(0, 4).map((txn) => {
                const isYearly = txn.plan.toLowerCase().includes('yearly');
                const isSuccess = txn.status === 'SUCCESS';
                const initials = txn.user
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={txn.id}
                    onClick={() => onNavigate('transactions')}
                    className="grid grid-cols-12 gap-3 items-center py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    {/* Col 1: Subscriber (col-span-5) */}
                    <div className="col-span-5 flex items-center space-x-2.5 min-w-0 pr-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isYearly ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate block group-hover:text-amber-600 transition-colors">
                          {txn.user}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate block mt-0.5">
                          {txn.phone}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Plan & Method (col-span-4) */}
                    <div className="col-span-4 min-w-0 pr-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                        isYearly ? 'bg-[#FEF08A] text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {txn.plan}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-500 font-medium truncate block mt-1">
                        {txn.method}
                      </span>
                    </div>

                    {/* Col 3: Amount & Status (col-span-3 text-right) */}
                    <div className="col-span-3 text-right shrink-0">
                      <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm font-urbanist block">
                        <AnimatedNumber value={txn.amount} />
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                        isSuccess ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {txn.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
