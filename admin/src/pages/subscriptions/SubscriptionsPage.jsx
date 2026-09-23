import React, { useState } from 'react';
import { mockSubscriptions } from '../../data/mockOttData';
import { Crown, Check, Edit2, IndianRupee, TrendingUp, Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState(mockSubscriptions);

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Monetization Overview KPIs */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-extrabold text-slate-950 font-urbanist">₹24.8 Lakh</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+35.6%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">₹17.8L Monthly + ₹7.0L Yearly</p>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Subscribers</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-extrabold text-slate-950 font-urbanist">12,450</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+24.1%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">8,940 Monthly · 3,510 Annual</p>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Free-to-Subscriber Conversion</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-extrabold text-slate-950 font-urbanist">8.4%</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">+1.2%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">Industry avg: 5.2%</p>
        </div>

        <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Churn Rate</span>
          <div class="mt-2 flex items-baseline justify-between">
            <span class="text-2xl font-extrabold text-slate-950 font-urbanist">1.8%</span>
            <span class="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">-0.4%</span>
          </div>
          <p class="text-[11px] text-slate-400 mt-1">High retention cohort</p>
        </div>
      </div>

      {/* Subscription Plans Configuration */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.code}
            class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col justify-between relative overflow-hidden"
          >
            {/* Top Badge */}
            <div class="flex items-center justify-between mb-4">
              <span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF08A] text-slate-950">
                {plan.badge}
              </span>
              <span class="text-xs font-mono font-bold text-slate-400">Code: {plan.code}</span>
            </div>

            <div>
              <h3 class="text-xl font-extrabold text-slate-950">{plan.name}</h3>
              <div class="mt-2 flex items-baseline space-x-2">
                <span class="text-4xl font-extrabold text-slate-950 font-urbanist">₹{plan.price}</span>
                <span class="text-xs font-bold text-slate-400">/ {plan.period}</span>
              </div>

              {/* Stats Strip */}
              <div class="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span class="text-slate-400 text-[10px] block">Active Subscribers</span>
                  <span class="font-extrabold text-slate-900">{plan.activeSubscribers.toLocaleString()} Subscribers</span>
                </div>
                <div>
                  <span class="text-slate-400 text-[10px] block">MRR Share</span>
                  <span class="font-extrabold text-emerald-700">{plan.mrrContribution}</span>
                </div>
              </div>

              {/* Features List */}
              <div class="mt-6 space-y-2.5 text-xs">
                <p class="font-extrabold text-slate-900 text-[11px] uppercase tracking-wider">Perks & Entitlements</p>
                {plan.features.map((feat, idx) => (
                  <div key={idx} class="flex items-center space-x-2 text-slate-700">
                    <div class="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Check class="w-3 h-3 text-emerald-700 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">Razorpay Auto-Renew Active</span>
              <button
                class="px-3 py-1.5 bg-slate-100 hover:bg-[#FEF08A] hover:text-black rounded-xl text-xs font-bold transition-colors"
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
