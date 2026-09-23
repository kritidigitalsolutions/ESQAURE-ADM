import React, { useState } from 'react';
import { mockUsers } from '../../data/mockOttData';
import { Crown, Search, X, CheckCircle2, Shield, Calendar, CreditCard, ArrowUpRight, TrendingUp } from 'lucide-react';
import AnimatedNumber from '../../components/common/AnimatedNumber';

export default function SubscribersPage() {
  // Filter for VIP subscribers only
  const [subscribers, setSubscribers] = useState(() => mockUsers.filter(u => u.isVip));
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL'); // 'ALL' | 'MONTHLY' | 'YEARLY'

  const filteredSubscribers = subscribers.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
                          s.name.toLowerCase().includes(term) ||
                          s.phone.includes(term) ||
                          s.email.toLowerCase().includes(term) ||
                          s.id.toLowerCase().includes(term) ||
                          s.plan.toLowerCase().includes(term);
    const matchesPlan = planFilter === 'ALL' ||
                        (planFilter === 'MONTHLY' && s.plan.toLowerCase().includes('monthly')) ||
                        (planFilter === 'YEARLY' && s.plan.toLowerCase().includes('yearly'));
    return matchesSearch && matchesPlan;
  });

  const handleExtendVip = (id) => {
    setSubscribers(prev => prev.map(sub => {
      if (sub.id === id) {
        return {
          ...sub,
          vipExpiresAt: '30 Days Added'
        };
      }
      return sub;
    }));
    alert('VIP subscription extended by 30 days!');
  };

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* 4 Core VIP Subscriber KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active VIP Members</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-950 mt-2">
            <AnimatedNumber value="12,450" />
          </h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +18.4% this month
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Pass (₹199)</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
              ₹199
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-950 mt-2">
            <AnimatedNumber value="8,940" />
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">71.8% of total subscribers</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Pass (₹1,499)</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs">
              VIP
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-950 mt-2">
            <AnimatedNumber value="3,510" />
          </h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-1">Highest retention tier</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Run-Rate (MRR)</span>
            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-950 mt-2">
            <AnimatedNumber value="₹24.8 Lakh" />
          </h3>
          <p className="text-[11px] font-semibold text-slate-500 mt-1">Razorpay recurring auto-pay</p>
        </div>

      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by subscriber name, phone (+91)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {['ALL', 'MONTHLY', 'YEARLY'].map((plan) => (
            <button
              key={plan}
              onClick={() => setPlanFilter(plan)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                planFilter === plan
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {plan === 'ALL' ? 'All VIPs' : plan === 'MONTHLY' ? 'Monthly Pass' : 'Yearly Pass'}
            </button>
          ))}
        </div>

      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Subscriber</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Watch Time</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Membership Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-900">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">No VIP subscribers match your query</p>
                      <p className="text-[11px] text-slate-400">
                        {searchTerm ? `No active subscribers found for "${searchTerm}".` : 'No subscribers found in this tier.'}
                      </p>
                      <button
                        onClick={() => { setSearchTerm(''); setPlanFilter('ALL'); }}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-black flex items-center space-x-1">
                          <span>{sub.name}</span>
                          <Crown className="w-3 h-3 text-amber-600 fill-amber-500 inline" />
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">{sub.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-800">
                    {sub.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                      {sub.plan}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {sub.totalWatchTime}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {sub.vipExpiresAt}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      ACTIVE VIP
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleExtendVip(sub.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-colors"
                    >
                      +30 Days
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
