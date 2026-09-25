import React, { useState, useEffect, useMemo } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import { Crown, Search, X, CheckCircle2, CreditCard, ArrowUpRight, RefreshCw, Zap, Users } from 'lucide-react';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Badge from '../../components/common/Badge';
import KpiStatCard from '../../components/common/KpiStatCard';

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [overviewKpis, setOverviewKpis] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL'); // 'ALL' | '1M' | '6M' | '12M' | 'TRIAL'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [subsRes, overviewRes, plansRes] = await Promise.allSettled([
        subscriptionService.getSubscribers({ limit: 100 }),
        subscriptionService.getOverview(),
        subscriptionService.getPlans()
      ]);

      if (subsRes.status === 'fulfilled' && Array.isArray(subsRes.value?.subscribers)) {
        setSubscribers(subsRes.value.subscribers);
      }
      if (overviewRes.status === 'fulfilled' && overviewRes.value?.kpis) {
        setOverviewKpis(overviewRes.value.kpis);
      }
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.plans)) {
        setPlans(plansRes.value.plans);
      }
    } catch (err) {
      console.warn('Subscribers load fallback:', err);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      const term = searchTerm.toLowerCase();
      const name = (s.user || s.name || '').toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const email = (s.email || '').toLowerCase();
      const planName = (s.planName || s.plan || '').toLowerCase();

      const matchesSearch = !term || name.includes(term) || phone.includes(term) || email.includes(term) || planName.includes(term);

      const matchesPlan =
        planFilter === 'ALL' ||
        (planFilter === '1M' && (planName.includes('1 month') || planName.includes('monthly') || planName.includes('30 days'))) ||
        (planFilter === '6M' && (planName.includes('6 month') || planName.includes('180 days'))) ||
        (planFilter === '12M' && (planName.includes('12 month') || planName.includes('yearly') || planName.includes('annual'))) ||
        (planFilter === 'TRIAL' && s.isTrial);

      return matchesSearch && matchesPlan;
    });
  }, [subscribers, searchTerm, planFilter]);

  const handleExtendVip = async (id, name) => {
    try {
      await subscriptionService.overrideSubscriberVip(id, { action: 'EXTEND', days: 30 });
      showToast(`Added 30 days subscription access for ${name || 'Subscriber'}.`);
      loadData(false);
    } catch (err) {
      alert(err.message || 'Failed to extend subscription.');
    }
  };

  const handleRevokeVip = async (id, name) => {
    if (!window.confirm(`Revoke subscription access for ${name || 'Subscriber'} immediately?`)) return;
    try {
      await subscriptionService.overrideSubscriberVip(id, { action: 'REVOKE' });
      showToast(`Revoked subscription access for ${name || 'Subscriber'}.`);
      loadData(false);
    } catch (err) {
      alert(err.message || 'Failed to revoke subscription.');
    }
  };

  const count1M = useMemo(() => {
    return plans.find((p) => p.code === 'PLAN_1M' || p.name?.toLowerCase().includes('1 month'))?.activeSubscribers || 0;
  }, [plans]);

  const count12M = useMemo(() => {
    return plans.find((p) => p.code === 'PLAN_12M' || p.name?.toLowerCase().includes('12 month'))?.activeSubscribers || 0;
  }, [plans]);

  return (
    <div className="space-y-6 font-urbanist pb-16 selection:bg-[#FEF08A] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold border border-slate-800 dark:border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 4 Core Subscriber KPIs (100% Dynamic from MongoDB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Subscribers */}
        <KpiStatCard
          icon={Crown}
          title="Active Subscribers"
          subtitle="Paid Base"
          value={(overviewKpis?.activeSubscribers ?? subscribers.length).toLocaleString()}
          footerLeft={`${plans.length} plan tiers configured`}
          footerRight="Live in DB"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 2: 1 Month Pass */}
        <KpiStatCard
          icon={CreditCard}
          title="1 Month Pass"
          subtitle="30 Days"
          value={count1M}
          animateNumber
          footerLeft="Monthly Cadence"
          footerRight="AutoPay"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 3: 12 Months All-Access */}
        <KpiStatCard
          icon={Crown}
          title="12 Months Pass"
          subtitle="Annual Tier"
          value={count12M}
          animateNumber
          footerLeft="Highest LTV cohort"
          footerRight="365 Days"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 4: Monthly Run-Rate (MRR) */}
        <KpiStatCard
          icon={CreditCard}
          title="Monthly Run-Rate"
          subtitle="Recurring AutoPay"
          value={`₹${overviewKpis?.totalMrr || '0.00'}`}
          footerLeft="Razorpay e-Mandate"
          footerRight="Immediate Expire"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by subscriber name, phone (+91)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Plans' },
            { id: '1M', label: '1 Month' },
            { id: '6M', label: '6 Months' },
            { id: '12M', label: '12 Months' },
            { id: 'TRIAL', label: '7-Day Trial' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPlanFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                planFilter === item.id
                  ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-[#161B16] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-transparent dark:border-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161B16] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Subscriber</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">AutoPay Mandate</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-5">Membership Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-900 dark:text-slate-100">
              {isLoading && subscribers.length === 0 ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-4"><div className="h-4 w-20 bg-slate-200 dark:bg-white/10 rounded" /></td>
                    <td className="py-4 px-5"><div className="h-5 w-16 bg-slate-200 dark:bg-white/10 rounded-full" /></td>
                  </tr>
                ))
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No subscribers match your query</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {searchTerm ? `No active subscribers found for "${searchTerm}".` : 'No subscribers found in this filter.'}
                      </p>
                      <button
                        onClick={() => { setSearchTerm(''); setPlanFilter('ALL'); }}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const userName = sub.user || sub.name || 'Viewer';
                  const userPhone = sub.phone || 'N/A';
                  const userEmail = sub.email || '';
                  const planTitle = sub.planName || sub.plan || 'Premium';
                  const expiryText = sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : sub.vipExpiresAt || 'N/A';
                  const daysLeft = sub.daysRemaining !== undefined ? sub.daysRemaining : 0;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[#FEF08A]/40 text-slate-950 dark:text-amber-400 border border-amber-300 dark:border-amber-700/40 flex items-center justify-center font-bold text-xs shrink-0">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-black dark:text-white">
                              {userName}
                            </p>
                            {userEmail && <p className="text-[11px] text-slate-400 font-medium">{userEmail}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-slate-300">
                        {userPhone}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge plan={planTitle} size="xs">
                          {planTitle}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {sub.autoRenew ? (
                          <Badge variant="razorpay" size="xs">
                            Razorpay
                          </Badge>
                        ) : (
                          <Badge variant="given-by-admin" size="xs">
                            Given by Admin
                          </Badge>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <div>
                          <span>{expiryText}</span>
                          {daysLeft > 0 ? (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              {daysLeft} days left
                            </span>
                          ) : (
                            <span className="block text-[10px] text-slate-400">Expired</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            sub.status === 'EXPIRED'
                              ? 'inactive'
                              : sub.status === 'TRIAL'
                              ? 'flix9-trial'
                              : 'active'
                          }
                          size="xs"
                        >
                          {sub.status === 'EXPIRED' ? 'Inactive' : sub.status === 'TRIAL' ? 'Trial' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
