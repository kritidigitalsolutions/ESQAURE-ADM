import React, { useState, useEffect, useMemo } from 'react';
import { Crown, ChevronRight, Users, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import ProgressMetricCard from './ui/progress-metric-card';
import AnimatedNumber from './common/AnimatedNumber';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';

export default function ActivityChart({ onNavigate }) {
  const [timeRange, setTimeRange] = useState('7D'); // '1D', '7D', '1M', '1Y', 'MAX'
  const [chartType, setChartType] = useState('users'); // 'users' or 'subscribers'
  const [realActivity, setRealActivity] = useState(null);
  const [subOverview, setSubOverview] = useState(null);
  const [subPlans, setSubPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Time ranges definition
  const periodOptions = [
    { label: '1D', points: 12 },
    { label: '7D', points: 14 },
    { label: '1M', points: 15 },
    { label: '1Y', points: 12 },
    { label: 'MAX', points: 12 },
  ];

  // Base anchor date
  const baseDate = useMemo(() => new Date(), []);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      userService.getActivityAnalytics(),
      subscriptionService.getOverview(),
      subscriptionService.getPlans()
    ]).then(([actRes, overRes, plansRes]) => {
      if (!isMounted) return;
      if (actRes.status === 'fulfilled' && actRes.value?.users) {
        setRealActivity(actRes.value);
      }
      if (overRes.status === 'fulfilled' && overRes.value?.kpis) {
        setSubOverview(overRes.value.kpis);
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.plans)) {
        setSubPlans(plansRes.value.plans);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.warn('ActivityChart fetch fallback:', err);
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Construct chart datasets: uses 100% genuine database metrics when available
  const chartDatasets = useMemo(() => {
    const monthYearStr = baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (realActivity?.users && realActivity?.subscribers) {
      return {
        users: {
          unit: 'Users',
          title: 'Active Platform Users',
          subtitle: `Registered user accounts & engagement (${monthYearStr})`,
          data: realActivity.users,
        },
        subscribers: {
          unit: 'Subscribers',
          title: 'Subscriptions & Activations',
          subtitle: `Active paid subscriptions & trials (${monthYearStr})`,
          data: realActivity.subscribers,
        },
      };
    }

    // Default baseline if loading
    const emptyList = Array(12).fill(null).map((_, i) => ({
      time: `${i * 2}:00`,
      date: `${i * 2}:00`,
      raw: 0,
      badge: '0',
      note: 'No events'
    }));

    return {
      users: {
        unit: 'Users',
        title: 'Active Platform Users',
        subtitle: `Registered user accounts & engagement (${monthYearStr})`,
        data: {
          '1D': emptyList,
          '7D': emptyList,
          '1M': emptyList,
          '1Y': emptyList,
          'MAX': emptyList,
        },
      },
      subscribers: {
        unit: 'Subscribers',
        title: 'Subscriptions & Activations',
        subtitle: `Active paid subscriptions & trials (${monthYearStr})`,
        data: {
          '1D': emptyList,
          '7D': emptyList,
          '1M': emptyList,
          '1Y': emptyList,
          'MAX': emptyList,
        },
      },
    };
  }, [baseDate, realActivity]);

  const currentMeta = chartDatasets[chartType];
  const rawList = currentMeta.data[timeRange] || currentMeta.data['7D'] || [];

  const chartSeriesData = useMemo(() => {
    return rawList.map((item) => ({
      value: item.raw,
      date: item.time,
    }));
  }, [rawList]);

  // Compute peak value & current total display
  const sumVal = rawList.reduce((sum, d) => sum + (d.raw || 0), 0);
  const totalFormatted =
    chartType === 'users'
      ? `${sumVal >= 1000 ? (sumVal / 1000).toFixed(1) + 'k' : sumVal} Users`
      : `${sumVal} Subscribers`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mb-3.5 font-sans">
      {/* Left Column: Progress Metric Card */}
      <div className="lg:col-span-8 flex">
        <ProgressMetricCard
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          defaultView="bars"
          total={totalFormatted}
          percent={sumVal > 0 ? '+100%' : '0%'}
          trend="up"
          loading={isLoading}
          accent="amber"
          period={timeRange}
          periodOptions={periodOptions}
          onPeriodChange={(opt) => setTimeRange(opt.label)}
          tabs={[
            { id: 'users', label: 'Users' },
            { id: 'subscribers', label: 'Subscribers' },
          ]}
          activeTab={chartType}
          onTabChange={(tabId) => setChartType(tabId)}
          data={chartSeriesData}
          size="md"
          showStats={true}
          className="h-full min-h-[290px] sm:min-h-[300px]"
        />
      </div>

      {/* Right Column: Live Subscription Monetization Overview Card */}
      <div className="lg:col-span-4 bg-white dark:bg-[#121216] rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.03)] card-subtle-hover flex flex-col justify-between group">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <Crown className="w-4 h-4 text-slate-950 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-950 dark:text-white text-sm sm:text-base font-urbanist tracking-tight">
                  Subscription Monetization
                </h3>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-300 bg-emerald-200 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-300/40 dark:border-emerald-500/30">
              Live DB
            </span>
          </div>

          {/* Monthly Recurring Revenue (MRR) Box */}
          <div className="mt-3 space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-100/90 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-urbanist">
                  Monthly Run Rate (MRR)
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  Recurring Revenue
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                {isLoading ? (
                  <div className="h-8 w-28 bg-slate-200/80 dark:bg-white/[0.08] rounded-lg animate-pulse" />
                ) : (
                  <span className="text-2xl sm:text-[26px] font-black text-slate-950 dark:text-white font-urbanist tracking-tight block">
                    ₹{subOverview?.totalMrr || '0'}
                  </span>
                )}
                {isLoading ? (
                  <div className="h-4 w-16 bg-slate-200/60 dark:bg-white/[0.05] rounded animate-pulse" />
                ) : (
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {subOverview?.activeSubscribers ?? 0} active
                  </span>
                )}
              </div>
            </div>

            {/* Live Plan Breakdown from DB */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block font-urbanist">
                ACTIVE PLAN TIERS
              </span>

              {isLoading ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#18181E] border border-slate-100 dark:border-white/10 flex items-center justify-between animate-pulse">
                    <div className="h-3.5 w-24 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                    <div className="h-4 w-16 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#18181E] border border-slate-100 dark:border-white/10 flex items-center justify-between animate-pulse">
                    <div className="h-3.5 w-28 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                    <div className="h-4 w-14 bg-slate-200/80 dark:bg-white/[0.08] rounded" />
                  </div>
                </>
              ) : (
                <>
                  {/* Tier 1: Paid Plans */}
                  {subPlans.slice(0, 2).map((plan) => (
                    <div key={plan._id || plan.id || plan.name} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#18181E] border border-slate-100 dark:border-white/10 transition-all shadow-2xs flex items-center justify-between">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 text-[10.5px] font-urbanist truncate max-w-[150px]">
                        {plan.name}
                      </span>
                      <div className="text-right flex items-baseline space-x-1">
                        <span className="text-slate-950 dark:text-white font-black text-sm font-urbanist tracking-tight">
                          ₹{plan.price}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 font-bold text-[10.5px]">
                          ({plan.durationMonths || Math.max(1, Math.round((plan.durationDays || 30) / 30))} mo)
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Tier 2: 7-Day Free Trial AutoPay */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#18181E] border border-slate-100 dark:border-white/10 transition-all shadow-2xs flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 text-[10.5px] font-urbanist">
                      7-Day Trial Mandates
                    </span>
                    <div className="text-right flex items-baseline space-x-1">
                      <span className="text-slate-950 dark:text-white font-black text-sm font-urbanist tracking-tight">
                        {subOverview?.activeTrialUsers ?? 0}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-bold text-[10.5px]">
                        active trials
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {isLoading ? 'Calculating churn...' : `Churn Rate: ${subOverview?.churnRate || '0.0%'}`}
          </span>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('subscriptions')}
            className="font-bold text-slate-950 dark:text-white hover:text-amber-400 flex items-center gap-0.5 transition-colors cursor-pointer"
          >
            <span>Manage Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
