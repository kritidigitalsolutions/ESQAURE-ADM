import React, { useState, useEffect, useMemo } from 'react';
import { subscriptionService } from '../../services/subscriptionService';
import {
  Crown,
  Search,
  X,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Users,
  Download,
  Plus,
  Trash2,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import PageLoader from '../../components/common/PageLoader';
import Badge from '../../components/common/Badge';
import { confirmModal, alertModal } from '../../context/DialogContext';

/**
 * Clean & Minimalist Subscribers & Access Management Page for ESQUARE Admin.
 * Strictly adheres to #FEF08A / #FACC15 brand guidelines, Material Dark hierarchy,
 * compact density, and unified single-row toolbars.
 */
export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [overviewKpis, setOverviewKpis] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL'); // 'ALL' | '1M' | '6M' | '12M' | 'TRIAL'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'expiry' | 'name'
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

  // Filter subscribers based on search term & plan filter
  const filteredSubscribers = useMemo(() => {
    const list = subscribers.filter((s) => {
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
        (planFilter === 'TRIAL' && (s.isTrial || s.status === 'TRIAL'));

      return matchesSearch && matchesPlan;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = (a.user || a.name || '').toLowerCase();
        const nameB = (b.user || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'expiry') {
        const dateA = a.currentPeriodEnd ? new Date(a.currentPeriodEnd).getTime() : (a.daysRemaining ?? 9999);
        const dateB = b.currentPeriodEnd ? new Date(b.currentPeriodEnd).getTime() : (b.daysRemaining ?? 9999);
        return dateA - dateB;
      }
      return 0; // Default order
    });
  }, [subscribers, searchTerm, planFilter, sortBy]);

  // Tab counts
  const counts = useMemo(() => {
    const total = subscribers.length;
    let m1 = 0;
    let m6 = 0;
    let m12 = 0;
    let trial = 0;
    let autoPay = 0;
    let manual = 0;
    let expired = 0;

    subscribers.forEach((s) => {
      const p = (s.planName || s.plan || '').toLowerCase();
      if (p.includes('1 month') || p.includes('monthly') || p.includes('30 days')) m1++;
      if (p.includes('6 month') || p.includes('180 days')) m6++;
      if (p.includes('12 month') || p.includes('yearly') || p.includes('annual')) m12++;
      if (s.isTrial || s.status === 'TRIAL') trial++;
      if (s.autoRenew) autoPay++;
      else manual++;
      if (s.status === 'EXPIRED') expired++;
    });

    return { total, m1, m6, m12, trial, autoPay, manual, expired };
  }, [subscribers]);

  const count1M = useMemo(() => {
    return plans.find((p) => p.code === 'PLAN_1M' || p.name?.toLowerCase().includes('1 month'))?.activeSubscribers || counts.m1;
  }, [plans, counts.m1]);

  const count12M = useMemo(() => {
    return plans.find((p) => p.code === 'PLAN_12M' || p.name?.toLowerCase().includes('12 month'))?.activeSubscribers || counts.m12;
  }, [plans, counts.m12]);

  const handleExtendVip = async (id, name) => {
    try {
      await subscriptionService.overrideSubscriberVip(id, { action: 'EXTEND', days: 30 });
      showToast(`Added 30 days subscription access for ${name || 'Subscriber'}.`);
      loadData(false);
    } catch (err) {
      await alertModal({
        title: 'Action Failed',
        message: err.message || 'Failed to extend subscription.',
        variant: 'danger'
      });
    }
  };

  const handleRevokeVip = async (id, name) => {
    const subscriberName = name || 'Subscriber';
    const confirmed = await confirmModal({
      title: 'Revoke Subscription Access',
      message: `Revoke VIP subscription access for ${subscriberName} immediately? Entitlement access will be terminated.`,
      itemName: subscriberName,
      confirmText: 'Revoke Access',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await subscriptionService.overrideSubscriberVip(id, { action: 'REVOKE' });
      showToast(`Revoked subscription access for ${subscriberName}.`);
      loadData(false);
    } catch (err) {
      await alertModal({
        title: 'Revocation Failed',
        message: err.message || 'Failed to revoke subscription.',
        variant: 'danger'
      });
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    if (filteredSubscribers.length === 0) {
      await alertModal({
        title: 'Export Notice',
        message: 'No subscribers found to export.',
        variant: 'info'
      });
      return;
    }
    const headers = ['Subscriber Name', 'Phone', 'Email', 'Plan', 'Mandate', 'Expiry Date', 'Days Left', 'Status'];
    const rows = filteredSubscribers.map((s) => [
      `"${(s.user || s.name || 'Viewer').replace(/"/g, '""')}"`,
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.planName || s.plan || 'Premium').replace(/"/g, '""')}"`,
      `"${s.autoRenew ? 'Razorpay AutoPay' : 'Given by Admin'}"`,
      `"${s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString('en-IN') : (s.vipExpiresAt || 'N/A')}"`,
      `"${s.daysRemaining ?? '0'}"`,
      `"${s.status || 'ACTIVE'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `subscribers_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Subscribers CSV exported successfully.');
  };

  const cleanPlanName = (raw) => {
    if (!raw) return 'VIP Member';
    return String(raw).replace(/\s*\([^)]*\)/g, '').trim();
  };

  return (
    <div className="space-y-3 font-urbanist pb-14 selection:bg-[#FEF08A] selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-3.5 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-slate-800 dark:border-slate-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 4 Compact Uniform KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Active Subscribers */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Crown className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Active Subscribers
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Paid Base
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                <AnimatedNumber value={overviewKpis?.activeSubscribers ?? subscribers.length} />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              {plans.length} plan tiers configured
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Live in DB
            </span>
          </div>
        </div>

        {/* Metric 2: 1 Month Pass */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <CreditCard className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  1 Month Pass
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  30 Days Cadence
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                <AnimatedNumber value={count1M} />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Monthly subscribers
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              AutoPay
            </span>
          </div>
        </div>

        {/* Metric 3: 12 Months Pass */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Crown className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  12 Months Pass
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Annual Cohort
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                <AnimatedNumber value={count12M} />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Highest LTV cohort
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              365 Days
            </span>
          </div>
        </div>

        {/* Metric 4: Monthly Run-Rate (MRR) */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Monthly Run-Rate
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Recurring AutoPay
                </span>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                ₹{overviewKpis?.totalMrr || '0.00'}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Razorpay e-Mandate
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Active MRR
            </span>
          </div>
        </div>
      </div>


      {/* Unified Single-Row Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Segmented Plan Tabs */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: `All Plans (${counts.total})` },
            { id: '1M', label: `1 Month (${counts.m1})` },
            { id: '6M', label: `6 Months (${counts.m6})` },
            { id: '12M', label: `12 Months (${counts.m12})` },
            { id: 'TRIAL', label: `7-Day Trial (${counts.trial})` }
          ].map((item) => {
            const isSelected = planFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPlanFilter(item.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-[#24242E] text-slate-950 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Search + Sort Dropdown */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone (+91), email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:border-[#FEF08A] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="relative flex items-center shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer transition-colors"
            >
              <option value="newest" className="dark:bg-[#1E1E26]">Recent First</option>
              <option value="expiry" className="dark:bg-[#1E1E26]">Expiry (Soonest)</option>
              <option value="name" className="dark:bg-[#1E1E26]">Name (A - Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden xl:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredSubscribers.length}</strong> matches
          </span>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-[#18181E] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-full transition-all cursor-pointer active:scale-90 hover:scale-105 shadow-sm shrink-0"
            title="Sync live subscribers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#18181E] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all border border-slate-200 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Subscribers Table Container */}
      <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#18181E] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3 min-w-[170px]">Subscriber</th>
                <th className="py-2.5 px-3 w-40">Contact Phone</th>
                <th className="py-2.5 px-3 min-w-[190px]">Email</th>
                <th className="py-2.5 px-3 w-36">Subscription Plan</th>
                <th className="py-2.5 px-3 w-40">Expiry Date</th>
                <th className="py-2.5 px-3 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-900 dark:text-slate-100">
              {isLoading && subscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10">
                    <PageLoader size="sm" text="Loading subscriber directory..." minHeight="min-h-[200px]" />
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No subscribers match query
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {searchTerm ? `No active records found for "${searchTerm}".` : 'No subscribers found in this filter tier.'}
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setPlanFilter('ALL');
                        }}
                        className="mt-1 px-3 py-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const userName = sub.user || sub.name || 'Viewer';
                  const userPhone = sub.phone && sub.phone !== 'N/A' && sub.phone !== '—' ? sub.phone : '—';
                  const userEmail = sub.email && sub.email !== 'N/A' && sub.email !== '—' ? sub.email : '—';
                  const planTitle = sub.planName || sub.plan || 'VIP';
                  const expiryText = sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : sub.vipExpiresAt || '—';
                  const daysLeft = sub.daysRemaining !== undefined ? sub.daysRemaining : 0;
                  const isExpired = sub.status === 'EXPIRED' || daysLeft <= 0;
                  const isTrial = sub.isTrial || sub.status === 'TRIAL';

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Subscriber Identity */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-7 h-7 rounded-full bg-[#FEF08A] text-slate-950 shadow-xs border border-amber-300 dark:border-amber-400/30 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs"
                            style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28 }}
                          >
                            {sub.avatarUrl ? (
                              <img
                                src={sub.avatarUrl}
                                alt={userName}
                                className="w-full h-full object-cover rounded-full block"
                                style={{ width: 28, height: 28, minWidth: 28, minHeight: 28, maxWidth: 28, maxHeight: 28 }}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (
                              userName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">
                            {userName}
                          </span>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs font-medium text-slate-800 dark:text-slate-300">
                        {userPhone}
                      </td>

                      {/* Email */}
                      <td className="py-2 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        {userEmail !== '—' ? (
                          <span className="truncate max-w-[200px] block" title={userEmail}>
                            {userEmail}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono text-xs select-none">
                            —
                          </span>
                        )}
                      </td>

                      {/* Subscription Plan Badge */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge plan={cleanPlanName(planTitle)} size="xs" />
                      </td>

                      {/* Expiry Date */}
                      <td className="py-2 px-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        <span className="text-xs font-semibold">{expiryText}</span>
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <Badge
                          variant={isExpired ? 'inactive' : isTrial ? 'pending' : 'active'}
                          label={isExpired ? 'Expired' : isTrial ? 'Trial' : 'Active'}
                          size="xs"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div className="px-3 sm:px-4 py-2 bg-slate-50/60 dark:bg-[#18181E]/80 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-medium text-[11px] text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-900 dark:text-white">{filteredSubscribers.length}</strong> of {counts.total} subscribers
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-medium">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active Subscriptions: <strong className="text-slate-700 dark:text-slate-200">{counts.total - counts.expired}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Trial Accounts: <strong className="text-slate-700 dark:text-slate-200">{counts.trial}</strong>
            </span>
            {counts.expired > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Expired: <strong className="text-slate-700 dark:text-slate-200">{counts.expired}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
