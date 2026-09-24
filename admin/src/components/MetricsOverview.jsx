import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Crown, Users, IndianRupee, PlayCircle, LayoutGrid, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import AnimatedNumber from './common/AnimatedNumber';

export default function MetricsOverview({ onOpenIngestModal }) {
  const [activeTab, setActiveTab] = useState('revenue');
  const [userTab, setUserTab] = useState('total');
  const [subTab, setSubTab] = useState('active');

  // Dynamic values for User Base Card (Audience & Acquisition)
  const userMetrics = {
    total: {
      label: 'Total Users',
      sublabel: 'Platform Registered Base',
      value: '148,920',
      badge: '+18.2%',
      unit: '',
      footerLeft: '12,450 paid subscribers',
      footerRight: '8.4% conversion rate',
    },
    active: {
      label: 'Daily Active Users',
      sublabel: 'Active Sessions Today',
      value: '64,800',
      badge: '+12.4%',
      unit: 'DAU',
      footerLeft: '72% active stream viewers',
      footerRight: 'Avg 4.2 sessions / user',
    },
    new: {
      label: 'New Installs',
      sublabel: 'First-time Installs',
      value: '2,450',
      badge: '+14.5%',
      unit: '',
      footerLeft: '54.2% organic store search',
      footerRight: '+14.5% vs last week',
    },
  };

  // Dynamic values for Subscriptions Card (Subscription Monetization)
  const subscriptionMetrics = {
    active: {
      label: 'Paid Subscribers',
      sublabel: 'Active Paid Subscriptions',
      value: '12,450',
      badge: '+24.1%',
      unit: '',
      footerLeft: '8.4% of total user base',
      footerRight: '₹199 avg monthly plan',
    },
    new: {
      label: 'New Subscribers',
      sublabel: 'Daily Paid Signups Today',
      value: '1,280',
      badge: '+31.5%',
      unit: 'Today',
      footerLeft: '+310 UPI / Card activations',
      footerRight: '+24.1% vs yesterday',
    },
    renewals: {
      label: 'Auto-Renewal Rate',
      sublabel: 'Subscription Retention & Recurring Pay',
      value: '94.6%',
      badge: '+3.2%',
      unit: '',
      footerLeft: 'Churn low at 5.4%',
      footerRight: 'Avg lifetime: 4.8 months',
    },
  };

  // Dynamic current month/year for real-time reporting
  const currentMonthYear = useMemo(() => {
    const d = new Date();
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${month} ${year}`;
  }, []);

  // Dynamic values for the Hero Metric Card based on active tab (Income & Monetization)
  const metricData = {
    revenue: {
      centerValue: '₹94,500',
      centerLabel: `TODAY'S REVENUE • ${currentMonthYear}`,
      stat1Label: 'MONTHLY REVENUE',
      stat1Value: '₹24.8 Lakh',
      stat1Badge: '+28.4%',
      stat2Label: 'LIFETIME REVENUE',
      stat2Value: '₹1.82 Cr',
      stat2Badge: '+35.6%',
    },
    subscribers: {
      centerValue: '12,450',
      centerLabel: `ACTIVE SUBSCRIBERS • ${currentMonthYear}`,
      stat1Label: 'NEW SUBSCRIBERS TODAY',
      stat1Value: '1,280',
      stat1Badge: '+24.1%',
      stat2Label: 'CONVERSION RATE',
      stat2Value: '8.4%',
      stat2Badge: '+2.1%',
    },
    plans: {
      centerValue: '₹199',
      centerLabel: `AVG REVENUE PER USER • ${currentMonthYear}`,
      stat1Label: 'MONTHLY PLANS',
      stat1Value: '₹18.4L',
      stat1Badge: '74.2%',
      stat2Label: 'ANNUAL PASSES',
      stat2Value: '₹6.4L',
      stat2Badge: '25.8%',
    },
  };

  const current = metricData[activeTab];

  return (
    <div className="space-y-4 mb-8 font-sans">
      
      {/* 2 Core Stat Cards: 1) User Base & 2) Paid Subscriptions (Subscribers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: User Base */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 sm:p-7 min-h-[170px] border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform shadow-xs">
                  <Users className="w-5 h-5 text-slate-950 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block font-urbanist">
                    {userMetrics[userTab].label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    {userMetrics[userTab].sublabel}
                  </span>
                </div>
              </div>

              {/* Switcher Buttons */}
              <div className="relative bg-slate-100/90 dark:bg-[#161B16] p-1 rounded-xl w-full sm:w-[290px] border border-slate-200/70 dark:border-white/10 shadow-xs">
                {/* Sliding Active Indicator Pill */}
                <span
                  className="absolute top-1 bottom-1 left-1 rounded-lg bg-[#FEF08A] shadow-xs transition-transform duration-300 ease-out pointer-events-none border border-amber-300/60"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    transform: `translateX(${
                      userTab === 'total' ? '0%' : userTab === 'active' ? '100%' : '200%'
                    })`,
                  }}
                />

                {/* 3 Equal Columns Grid */}
                <div className="grid grid-cols-3 relative z-10 w-full">
                  <button
                    type="button"
                    onClick={() => setUserTab('total')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      userTab === 'total'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Total Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTab('active')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      userTab === 'active'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Active Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTab('new')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      userTab === 'new'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    New Installs
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 sm:mt-7 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                  <AnimatedNumber value={userMetrics[userTab].value} />
                </span>
                {userMetrics[userTab].unit && (
                  <span className="text-base font-bold text-slate-400 dark:text-slate-500">
                    {userMetrics[userTab].unit}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3.5 h-3.5" /> <AnimatedNumber value={userMetrics[userTab].badge} />
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Paid Subscriptions */}
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 sm:p-7 min-h-[170px] border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-slate-950 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block font-urbanist">
                    {subscriptionMetrics[subTab].label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    {subscriptionMetrics[subTab].sublabel}
                  </span>
                </div>
              </div>

              {/* Switcher Buttons */}
              <div className="relative bg-slate-100/90 dark:bg-[#161B16] p-1 rounded-xl w-full sm:w-[290px] border border-slate-200/70 dark:border-white/10 shadow-xs">
                {/* Sliding Active Indicator Pill */}
                <span
                  className="absolute top-1 bottom-1 left-1 rounded-lg bg-[#FEF08A] shadow-xs transition-transform duration-300 ease-out pointer-events-none border border-amber-300/60"
                  style={{
                    width: 'calc((100% - 8px) / 3)',
                    transform: `translateX(${
                      subTab === 'active' ? '0%' : subTab === 'new' ? '100%' : '200%'
                    })`,
                  }}
                />

                {/* 3 Equal Columns Grid */}
                <div className="grid grid-cols-3 relative z-10 w-full">
                  <button
                    type="button"
                    onClick={() => setSubTab('active')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      subTab === 'active'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Subscribers
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('new')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      subTab === 'new'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    New Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('renewals')}
                    className={`py-1.5 text-xs font-bold rounded-lg text-center flex items-center justify-center transition-colors duration-200 select-none ${
                      subTab === 'renewals'
                        ? 'text-slate-950 font-extrabold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Renewals
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-7 flex items-baseline justify-between">
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                  <AnimatedNumber value={subscriptionMetrics[subTab].value} />
                </span>
                {subscriptionMetrics[subTab].unit && (
                  <span className="text-base font-bold text-slate-500 dark:text-slate-500">
                    {subscriptionMetrics[subTab].unit}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3.5 h-3.5" /> <AnimatedNumber value={subscriptionMetrics[subTab].badge} />
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Hero Income / Revenue Banner */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus relative overflow-hidden group transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Two Split Metrics + Top Driver */}
          <div className="flex flex-col justify-between shrink-0">
            <div className="flex items-center space-x-6">
              {/* Stat 1 */}
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  {current.stat1Label}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                    <AnimatedNumber value={current.stat1Value} />
                  </span>
                  <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <AnimatedNumber value={current.stat1Badge} />
                  </span>
                </div>
              </div>

              {/* Vertical divider */}
              <div className="h-9 w-px bg-slate-200 dark:bg-white/10" />

              {/* Stat 2 */}
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  {current.stat2Label}
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                    <AnimatedNumber value={current.stat2Value} />
                  </span>
                  <span className="inline-flex items-center text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <AnimatedNumber value={current.stat2Badge} />
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom subtitle */}
            <div className="mt-3 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <p className="text-xs font-medium text-slate-400 dark:text-slate-400">
                Top Revenue Driver:{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Monthly All-Access Pass (₹199)
                </span>
              </p>
            </div>
          </div>

          {/* Center: Hero Stat Box */}
          <div className="flex flex-col items-start lg:items-center justify-center lg:border-x lg:border-slate-100 dark:lg:border-white/10 lg:px-8 py-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
              <AnimatedNumber value={current.centerValue} />
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mt-1">
              {current.centerLabel}
            </span>
          </div>

          {/* Right: Switcher Tabs */}
          <div className="relative bg-slate-100/90 dark:bg-[#161B16] p-1.5 rounded-full flex items-center border border-slate-200/70 dark:border-white/10 shadow-xs self-start lg:self-center shrink-0 w-full sm:w-[320px]">
            {/* Sliding Pill */}
            <span
              className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-[#FEF08A] shadow-md transition-transform duration-300 ease-out pointer-events-none border border-amber-300/60"
              style={{
                width: 'calc((100% - 12px) / 3)',
                transform: `translateX(${
                  activeTab === 'revenue' ? '0%' : activeTab === 'subscribers' ? '100%' : '200%'
                })`,
              }}
            />

            <div className="grid grid-cols-3 relative z-10 w-full">
              <button
                type="button"
                onClick={() => setActiveTab('revenue')}
                className={`py-2 text-xs font-bold rounded-full flex items-center justify-center space-x-1.5 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'revenue' ? 'text-slate-950 font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Revenue</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('subscribers')}
                className={`py-2 text-xs font-bold rounded-full flex items-center justify-center space-x-1.5 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'subscribers' ? 'text-slate-950 font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Subscribers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className={`py-2 text-xs font-bold rounded-full flex items-center justify-center space-x-1.5 transition-colors duration-200 cursor-pointer ${
                  activeTab === 'plans' ? 'text-slate-950 font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Plans</span>
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
