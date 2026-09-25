import React, { useState, useEffect } from 'react';
import MetricsOverview from '../../components/MetricsOverview';
import ActivityChart from '../../components/ActivityChart';
import IncomeChart from '../../components/IncomeChart';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import { subscriptionService } from '../../services/subscriptionService';
import { mockDramas } from '../../data/mockOttData';
import { Flame, CreditCard, ChevronRight, Crown, Sparkles } from 'lucide-react';

export default function DashboardPage({ onOpenIngestModal, onNavigate }) {
  const trendingDramas = mockDramas.filter(d => d.isTrending).sort((a, b) => a.trendingRank - b.trendingRank);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    subscriptionService
      .getTransactions({ limit: 4 })
      .then((res) => {
        if (res?.transactions && Array.isArray(res.transactions)) {
          setRecentTransactions(res.transactions);
        }
      })
      .catch((err) => {
        console.warn('Dashboard transactions load error:', err);
      });
  }, []);

  return (
    <div className="space-y-8 font-urbanist">
      {/* 4 Core OTT Stat Cards & Nodus Metric Row */}
      <MetricsOverview onOpenIngestModal={onOpenIngestModal} />

      {/* Streaming Traffic Area Spline Chart & Acquisition Breakdown */}
      <ActivityChart onNavigate={onNavigate} />

      {/* Wide Low-Height Platform Income & Revenue Stream Graph */}
      <IncomeChart onNavigate={onNavigate} />

      {/* Live OTT Performance Split: Top Trending Series & Live Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Trending Micro-Dramas */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
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
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent dark:border-white/10 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn shrink-0"
              >
                <span>View Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Drama List: Clean, Frameless, Perfectly Aligned */}
            <div className="divide-y divide-slate-100/80 dark:divide-white/5 pt-1">
              {trendingDramas.slice(0, 4).map((drama, idx) => {
                const rankNum = idx + 1;

                return (
                  <div
                    key={drama.id}
                    onClick={() => onNavigate('dramas')}
                    className="flex items-center space-x-3 py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                  >
                    {/* Typographic Rank Number */}
                    <span className={`font-urbanist font-black text-xs w-4 text-center shrink-0 ${
                      rankNum === 1 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {rankNum}
                    </span>

                    {/* 9:16 Portrait Poster */}
                    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xs group-hover:scale-[1.02] transition-transform duration-200">
                      <img
                        src={drama.poster}
                        alt={drama.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Title & Clean Info */}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                        {drama.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        <span>{drama.totalEpisodes} Episodes</span>
                        <span className="mx-1 text-slate-300 dark:text-white/20">·</span>
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
        <div className="lg:col-span-5 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
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
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent dark:border-white/10 px-3 py-1.5 rounded-xl transition-all gap-1 group/btn shrink-0"
              >
                <span>All Transactions</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Minimal Column Header for Effortless Reading */}
            <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 pb-2.5 mt-3 border-b border-slate-100 dark:border-white/10 px-2">
              <span className="col-span-5">Subscriber</span>
              <span className="col-span-4">Plan & Method</span>
              <span className="col-span-3 text-right">Amount & Status</span>
            </div>

            {/* Subscriptions List: Clean, Frameless, Perfectly Columnar */}
            <div className="divide-y divide-slate-100/80 dark:divide-white/5">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  No recent subscription transactions
                </div>
              ) : (
                recentTransactions.slice(0, 4).map((txn) => {
                  const initials = (txn.user || 'User')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={txn.id}
                      onClick={() => onNavigate('transactions')}
                      className="grid grid-cols-12 gap-3 items-center py-3 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      {/* Col 1: Subscriber (col-span-5) */}
                      <div className="col-span-5 flex items-center space-x-2.5 min-w-0 pr-1">
                        <div className="w-8 h-8 rounded-full bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 text-slate-950 dark:text-amber-400 font-extrabold flex items-center justify-center text-xs shrink-0">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate block group-hover:text-amber-400 transition-colors">
                            {txn.user}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate block mt-0.5">
                            {txn.phone}
                          </span>
                        </div>
                      </div>

                      {/* Col 2: Plan & Method (col-span-4) */}
                      <div className="col-span-4 min-w-0 pr-1 space-y-1">
                        <Badge plan={txn.plan} size="xs">
                          {txn.plan}
                        </Badge>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
                          {txn.method}
                        </span>
                      </div>

                      {/* Col 3: Amount & Status (col-span-3 text-right) */}
                      <div className="col-span-3 text-right shrink-0">
                        <span className="font-black text-slate-950 dark:text-white text-xs sm:text-sm font-urbanist block">
                          {txn.amount}
                        </span>
                        <Badge
                          variant={txn.status === 'SUCCESS' ? 'active' : txn.status === 'PENDING' ? 'flix9-trial' : 'inactive'}
                          size="xs"
                          className="mt-1"
                        >
                          {txn.status === 'SUCCESS' ? 'Success' : txn.status === 'PENDING' ? 'Pending' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
