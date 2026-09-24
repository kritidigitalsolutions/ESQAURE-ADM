import React, { useState } from 'react';
import { mockSubscriptions } from '../../data/mockOttData';
import { Crown, Check, Edit2, IndianRupee, TrendingUp, Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(mockSubscriptions);

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Monetization Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-urbanist">₹24.8 Lakh</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">+35.6%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">₹17.8L Monthly + ₹7.0L Yearly</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Subscribers</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-urbanist">12,450</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">+24.1%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">8,940 Monthly · 3,510 Annual</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free-to-Subscriber Conversion</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-urbanist">8.4%</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">+1.2%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Industry avg: 5.2%</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors group">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Churn Rate</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-950 dark:text-white font-urbanist">1.8%</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">-0.4%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High retention cohort</p>
        </div>
      </div>

      {/* Subscription Plans Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col justify-between relative overflow-hidden transition-colors"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF08A] text-slate-950 shadow-xs">
                {plan.badge}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">Code: {plan.code}</span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">{plan.name}</h3>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-4xl font-extrabold text-slate-950 dark:text-white font-urbanist">₹{plan.price}</span>
                <span className="text-xs font-bold text-slate-400">/ {plan.period}</span>
              </div>

              {/* Stats Strip */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Active Subscribers</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{plan.activeSubscribers.toLocaleString()} Subscribers</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">MRR Share</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400">{plan.mrrContribution}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-2.5 text-xs">
                <p className="font-extrabold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">Perks & Entitlements</p>
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Razorpay Auto-Renew Active</span>
              <button
                className="px-3 py-1.5 bg-slate-100 dark:bg-[#161B16] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/10 rounded-xl text-xs font-bold transition-all"
              >
                Edit Plan Pricing &gt;
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
