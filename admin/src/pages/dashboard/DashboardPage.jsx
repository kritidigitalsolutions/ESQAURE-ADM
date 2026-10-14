import React, { useState, useEffect } from 'react';
import MetricsOverview from '../../components/MetricsOverview';
import ActivityChart from '../../components/ActivityChart';
import IncomeChart from '../../components/IncomeChart';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import { subscriptionService } from '../../services/subscriptionService';
import { dramaService } from '../../services/dramaService';
import { Flame, CreditCard, ChevronRight, Crown, Sparkles, Loader2 } from 'lucide-react';

export default function DashboardPage({ onOpenIngestModal, onNavigate }) {
  const [trendingDramas, setTrendingDramas] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isLoadingTxns, setIsLoadingTxns] = useState(true);

  useEffect(() => {
    let isMounted = true;
    dramaService
      .getAdminDramas()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.dramas || []);
        // Prioritize isTrending, then fallback to catalog order by views
        let trending = list.filter(d => Boolean(d.isTrending));
        if (trending.length === 0) {
          trending = [...list].sort((a, b) => Number(b.viewsCount || 0) - Number(a.viewsCount || 0));
        } else {
          trending = [...trending].sort((a, b) => {
            if (a.trendingRank && b.trendingRank) return a.trendingRank - b.trendingRank;
            return Number(b.viewsCount || 0) - Number(a.viewsCount || 0);
          });
        }
        setTrendingDramas(trending);
        setIsLoadingTrending(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Dashboard trending dramas load error:', err);
        setIsLoadingTrending(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    subscriptionService
      .getTransactions({ limit: 4 })
      .then((res) => {
        if (!isMounted) return;
        if (res?.transactions && Array.isArray(res.transactions)) {
          setRecentTransactions(res.transactions);
        }
        setIsLoadingTxns(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Dashboard transactions load error:', err);
        setIsLoadingTxns(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-3.5 font-urbanist">
      {/* 4 Core OTT Stat Cards & Nodus Metric Row */}
      <MetricsOverview onOpenIngestModal={onOpenIngestModal} />

      {/* Streaming Traffic Area Spline Chart & Acquisition Breakdown */}
      <ActivityChart onNavigate={onNavigate} />

      {/* Wide Low-Height Platform Income & Revenue Stream Graph */}
      <IncomeChart onNavigate={onNavigate} />

      {/* Live OTT Performance Split: Top Trending Series & Live Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Left: Top Trending Micro-Dramas */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 shadow-xs flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight leading-snug">
                    Top Trending Micro-Dramas
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Ranked by paid conversions & completion rate
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('dramas')}
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent dark:border-white/10 px-2.5 py-1 rounded-lg transition-all gap-1 group/btn shrink-0"
              >
                <span>View Catalog</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Drama List: Clean, Frameless, Perfectly Aligned */}
            <div className="divide-y divide-slate-100/80 dark:divide-white/5 pt-1 min-h-[220px] flex flex-col justify-center">
              {isLoadingTrending ? (
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-2 rounded-xl animate-pulse">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-4 h-3 bg-slate-200/60 dark:bg-white/[0.05] rounded" />
                        <div className="w-9 h-12 rounded-lg bg-slate-200/80 dark:bg-white/[0.08]" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                          <div className="h-2.5 w-20 bg-slate-200/60 dark:bg-white/[0.05] rounded" />
                        </div>
                      </div>
                      <div className="h-5 w-16 bg-slate-200/60 dark:bg-white/[0.05] rounded-full" />
                    </div>
                  ))}
                </div>
              ) : trendingDramas.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No active series catalog found.
                </div>
              ) : (
                trendingDramas.slice(0, 4).map((drama, idx) => {
                  const rankNum = idx + 1;
                  const posterUrl = drama.posterUrl || drama.poster || drama.coverImage || drama.thumbnail || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400';
                  const titleStr = drama.title || drama.name || 'Untitled Series';
                  const epCount = drama.totalEpisodes ?? drama.episodeCount ?? (Array.isArray(drama.episodes) ? drama.episodes.length : 0);
                  const genreStr = Array.isArray(drama.genres)
                    ? drama.genres.map(g => (typeof g === 'object' ? g.name : g)).filter(Boolean).join(', ')
                    : (drama.genreDisplay || drama.genre || 'Drama');
                  const viewsDisplay = drama.views || (drama.viewsCount ? `${drama.viewsCount}` : null);

                  return (
                    <div
                      key={drama._id || drama.id || idx}
                      onClick={() => onNavigate('dramas')}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        {/* Typographic Rank Number */}
                        <span className={`font-urbanist font-black text-xs w-4 text-center shrink-0 ${
                          rankNum === 1 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {rankNum}
                        </span>

                        {/* 9:16 Portrait Poster */}
                        <div className="w-9 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xs group-hover:scale-[1.02] transition-transform duration-200">
                          <img
                            src={posterUrl}
                            alt={titleStr}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400';
                            }}
                          />
                        </div>

                        {/* Title & Clean Info */}
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                            {titleStr}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center">
                            <span>{epCount} Episodes</span>
                            <span className="mx-1 text-slate-300 dark:text-white/20">·</span>
                            <span className="text-slate-600 dark:text-slate-400 truncate">{genreStr}</span>
                            {viewsDisplay && (
                              <>
                                <span className="mx-1 text-slate-300 dark:text-white/20">·</span>
                                <span className="text-amber-400/90 font-semibold shrink-0">{viewsDisplay} views</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Rating Badge */}
                      <div className="shrink-0 flex items-center pl-2">
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 dark:bg-amber-400/15 border border-amber-400/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          ★ {drama.rating || '4.8'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Recent Subscriptions Ledger */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-white/10 shadow-nodus">
          <div>
            {/* Enhanced Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10 gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 shadow-xs flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight leading-snug">
                    Recent Subscriptions
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Razorpay webhook transactions</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className="inline-flex items-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent dark:border-white/10 px-2.5 py-1 rounded-lg transition-all gap-1 group/btn shrink-0"
              >
                <span>All Transactions</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Subscriptions List: Clean, Minimalist, Perfectly Aligned */}
            <div className="divide-y divide-slate-100/80 dark:divide-white/5 pt-1 min-h-[220px] flex flex-col justify-center">
              {isLoadingTxns ? (
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-2 rounded-xl animate-pulse">
                      <div className="flex items-center space-x-3 min-w-0 pr-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200/80 dark:bg-white/[0.08]" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                          <div className="h-2.5 w-32 bg-slate-200/60 dark:bg-white/[0.05] rounded" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <div className="h-4 w-12 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                        <div className="h-4 w-14 bg-slate-200/60 dark:bg-white/[0.05] rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-bold">
                  No recent subscription transactions
                </div>
              ) : (
                recentTransactions.slice(0, 4).map((txn) => {
                  const rawName = (txn.user || 'Subscriber').trim();
                  const initials = rawName
                    .split(/\s+/)
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'U';

                  // Format currency cleanly
                  const displayAmount = txn.amount?.startsWith('Rs. ')
                    ? `₹${txn.amount.slice(4)}`
                    : (txn.amount?.startsWith('₹') ? txn.amount : `₹${txn.amount || '0'}`);

                  // Clean status styling
                  const isSuccess = txn.status === 'SUCCESS';
                  const isPending = txn.status === 'PENDING';
                  const statusBg = isSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/30'
                    : isPending
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/30'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-800/30';
                  const dotBg = isSuccess ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-red-500';
                  const statusText = isSuccess ? 'Success' : isPending ? 'Pending' : 'Failed';

                  // Secondary subtitle: plan + clean method/phone
                  const methodStr = txn.method ? txn.method.replace('Razorpay ', '') : 'Razorpay';
                  const phoneMeta = txn.phone && txn.phone !== 'N/A' ? ` · ${txn.phone}` : '';

                  return (
                    <div
                      key={txn.id}
                      onClick={() => onNavigate('transactions')}
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      {/* Left: Avatar & Subscriber Details */}
                      <div className="flex items-center space-x-3 min-w-0 pr-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1A1A22] text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-white/10 group-hover:border-amber-400/50 group-hover:bg-amber-50/50 dark:group-hover:bg-[#FEF08A]/10 dark:group-hover:text-amber-300 transition-all">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                            {rawName}
                          </h4>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1.5">
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">{txn.plan || 'Pass'}</span>
                            <span className="text-slate-300 dark:text-white/20">·</span>
                            <span className="text-slate-500 dark:text-slate-400 truncate">{methodStr}{phoneMeta}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Amount & Status Badge */}
                      <div className="text-right shrink-0 flex flex-col items-end pl-2">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white font-urbanist tracking-tight">
                          {displayAmount}
                        </span>
                        <div className="mt-1">
                          <Badge status={txn.status} size="xs" />
                        </div>
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
