import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { subscriptionService } from '../../services/subscriptionService';
import Badge from '../../components/common/Badge';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import KpiStatCard from '../../components/common/KpiStatCard';
import {
  Crown,
  Check,
  Edit3,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Clock,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Info,
  ChevronRight,
  Zap,
  CheckCircle2,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  TrendingUp,
  Calendar,
  Eye,
  Smartphone,
  Search,
  Filter,
  Layers,
  HelpCircle,
  Settings2,
  Receipt,
  Users,
  Download,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react';

const STORAGE_KEY_PLANS = 'esquare_subscription_plans';
const STORAGE_KEY_TRIAL = 'esquare_trial_config';

const DEFAULT_TRIAL_CONFIG = {
  enabled: true,
  trialFee: 2,
  trialDurationDays: 7,
  termsText:
    'Enjoy a 7-day free trial for just Rs. 2. The Rs. 2 trial payment is non-refundable. After the 7-day trial period ends, your subscription will automatically renew as a paid subscription through the enabled AutoPay option. The applicable subscription fee will be charged automatically unless you cancel via your UPI app (Google Pay / PhonePe) before the trial period ends.'
};

export default function SubscriptionsPage() {
  // Loading & Sync States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Overview KPIs State (from backend MongoDB aggregations)
  const [overviewKpis, setOverviewKpis] = useState(null);

  // Real Plans State (from MongoDB SubscriptionPlan)
  const [plans, setPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load plans cache', e);
    }
    return [];
  });

  // Real Trial Config State (from MongoDB SubscriptionSetting)
  const [trialConfig, setTrialConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRIAL);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load trial config cache', e);
    }
    return DEFAULT_TRIAL_CONFIG;
  });

  // Modal State for Create / Edit Plan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalViewTab, setModalViewTab] = useState('form'); // 'form' | 'preview'
  const [currentPlan, setCurrentPlan] = useState(null);

  // Modal State for Trial Settings
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [trialFormData, setTrialFormData] = useState(DEFAULT_TRIAL_CONFIG);

  // Form State inside Modal
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    price: 99,
    originalPrice: 99,
    period: '30 Days',
    durationDays: 30,
    durationMonths: 1,
    badge: 'Popular',
    savingsText: '',
    trialEligible: true,
    trialFee: 2,
    trialDays: 7,
    status: 'ACTIVE',
    features: [
      'Unlock all paywalled episodes (Episode 4+)',
      '1080p Full HD vertical streaming',
      'Ad-free uninterrupted viewing',
      'Hindi & English subtitles'
    ]
  });

  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Save to localStorage when plans change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Error saving plans to localStorage:', e);
    }
  }, [plans]);

  // Save to localStorage when trialConfig changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRIAL, JSON.stringify(trialConfig));
    } catch (e) {
      console.error('Error saving trial config to localStorage:', e);
    }
  }, [trialConfig]);

  // Lock background page and main scrolling when any modal popup is open
  useEffect(() => {
    if (isModalOpen || isTrialModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const mainEl = document.querySelector('main');
      const originalMainOverflow = mainEl ? mainEl.style.overflow : '';

      document.body.style.overflow = 'hidden';
      if (mainEl) {
        mainEl.style.overflow = 'hidden';
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        if (mainEl) {
          mainEl.style.overflow = originalMainOverflow;
        }
      };
    }
  }, [isModalOpen, isTrialModalOpen]);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Fetch all subscription data from backend
  const loadAllData = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const [overviewData, plansData, trialData] = await Promise.allSettled([
        subscriptionService.getOverview(),
        subscriptionService.getPlans(),
        subscriptionService.getTrialSettings()
      ]);

      if (overviewData.status === 'fulfilled' && overviewData.value?.kpis) {
        setOverviewKpis(overviewData.value.kpis);
      }
      if (plansData.status === 'fulfilled' && plansData.value?.plans?.length > 0) {
        setPlans(plansData.value.plans);
      }
      if (trialData.status === 'fulfilled' && trialData.value?.settings) {
        setTrialConfig((prev) => ({
          ...prev,
          enabled: trialData.value.settings.trialEnabled,
          trialFee: trialData.value.settings.trialFee,
          trialDurationDays: trialData.value.settings.trialDurationDays,
          termsText: trialData.value.settings.termsText
        }));
      }
    } catch (err) {
      console.warn('Backend subscription fetch fallback:', err);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, []);

  // Dynamic KPI calculations
  const totalSubscribers = useMemo(() => {
    if (overviewKpis?.activeSubscribers) return overviewKpis.activeSubscribers;
    return plans.reduce((acc, p) => acc + (Number(p.activeSubscribers) || 0), 0);
  }, [plans, overviewKpis]);

  const totalMrrEstimated = useMemo(() => {
    if (overviewKpis?.totalMrr) return overviewKpis.totalMrr;
    let total = 0;
    plans.forEach((p) => {
      const subs = Number(p.activeSubscribers) || 0;
      const price = Number(p.price) || 0;
      const months = Number(p.durationMonths) || (p.durationDays ? Math.max(1, Math.round(p.durationDays / 30)) : 1);
      const monthlyPerSub = price / months;
      total += subs * monthlyPerSub;
    });
    return (total / 100000).toFixed(1); // Lakhs
  }, [plans, overviewKpis]);

  // Open modal in CREATE mode
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setModalViewTab('form');
    const randomId = 'plan_' + Date.now().toString().slice(-4);
    setFormData({
      id: randomId,
      code: 'PLAN_' + Date.now().toString().slice(-4),
      name: '',
      price: 99,
      originalPrice: 99,
      period: '30 Days',
      durationDays: 30,
      durationMonths: 1,
      badge: 'Popular Starter',
      savingsText: '',
      trialEligible: true,
      trialFee: trialConfig.trialFee || 2,
      trialDays: trialConfig.trialDurationDays || 7,
      status: 'ACTIVE',
      features: [
        'Unlock all paywalled episodes (Episode 4+)',
        '1080p Full HD vertical streaming',
        'Ad-free uninterrupted viewing',
        'Hindi & English subtitles'
      ]
    });
    setNewFeatureInput('');
    setIsModalOpen(true);
  };

  // Open modal in EDIT mode
  const handleOpenEditModal = (plan) => {
    setModalMode('edit');
    setModalViewTab('form');
    setCurrentPlan(plan);
    setFormData({
      id: plan.id || plan._id || plan.code,
      code: plan.code || '',
      name: plan.name || '',
      price: plan.price || 0,
      originalPrice: plan.originalPrice || plan.price || 0,
      period: plan.period || `${plan.durationDays || 30} Days`,
      durationDays: plan.durationDays || 30,
      durationMonths: plan.durationMonths || 1,
      badge: plan.badge || '',
      savingsText: plan.savingsText || '',
      trialEligible: plan.trialEligible !== undefined ? plan.trialEligible : true,
      trialFee: plan.trialFee || 2,
      trialDays: plan.trialDays || 7,
      status: plan.status || 'ACTIVE',
      features: Array.isArray(plan.features) ? [...plan.features] : []
    });
    setNewFeatureInput('');
    setIsModalOpen(true);
  };

  // Duplicate a plan
  const handleDuplicatePlan = async (plan) => {
    const newId = 'plan_' + Date.now().toString().slice(-4);
    const newCode = `${plan.code}_COPY_${Date.now().toString().slice(-4)}`;
    const duplicated = {
      ...plan,
      id: newId,
      code: newCode,
      name: `${plan.name} (Copy)`,
      status: 'DRAFT',
      activeSubscribers: 0,
      mrrContribution: 'Rs. 0.00 Lakh'
    };
    try {
      const created = await subscriptionService.createPlan(duplicated);
      if (created?.plan) {
        setPlans((prev) => [...prev, created.plan]);
      } else {
        setPlans((prev) => [...prev, duplicated]);
      }
    } catch (err) {
      setPlans((prev) => [...prev, duplicated]);
    }
    showToast(`Duplicated "${plan.name}" as draft.`);
  };

  // Delete plan
  const handleDeletePlan = async (planId, planName) => {
    if (plans.length <= 1) {
      alert('You must have at least one subscription plan in the system.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      try {
        await subscriptionService.deletePlan(planId);
      } catch (err) {
        console.warn('Delete plan API fallback:', err);
      }
      setPlans((prev) => prev.filter((p) => (p.id ? p.id !== planId : p._id ? p._id !== planId : p.code !== planId)));
      showToast(`Deleted plan "${planName}".`);
      setIsModalOpen(false);
    }
  };

  // Add perk inside modal
  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureInput.trim()]
    }));
    setNewFeatureInput('');
  };

  // Remove perk inside modal
  const handleRemoveFeature = (idx) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== idx)
    }));
  };

  // Form Submit in Modal (Save or Create)
  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a plan name.');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    let autoSavings = formData.savingsText;
    if (Number(formData.originalPrice) > Number(formData.price) && !autoSavings) {
      const savedAmount = Number(formData.originalPrice) - Number(formData.price);
      autoSavings = `Save Rs. ${savedAmount} vs base rate`;
    }

    if (modalMode === 'create') {
      const autoCode = formData.code || ('PLAN_' + formData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_')) || ('PLAN_' + Date.now().toString().slice(-4));
      const newPlan = {
        ...formData,
        code: autoCode,
        id: formData.id || 'plan_' + Date.now().toString().slice(-4),
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        durationDays: Number(formData.durationDays) || 30,
        durationMonths: Number(formData.durationMonths) || 1,
        activeSubscribers: 0,
        mrrContribution: 'Rs. 0.00 Lakh',
        savingsText: autoSavings
      };

      try {
        const created = await subscriptionService.createPlan(newPlan);
        if (created?.plan) {
          setPlans((prev) => [...prev, created.plan]);
        } else {
          setPlans((prev) => [...prev, newPlan]);
        }
      } catch (err) {
        console.warn('API error, saving locally:', err);
        setPlans((prev) => [...prev, newPlan]);
      }
      showToast(`Created new plan "${newPlan.name}".`);
    } else {
      const targetId = currentPlan.id || currentPlan._id || currentPlan.code;
      const updatedPayload = {
        ...formData,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || Number(formData.price),
        durationDays: Number(formData.durationDays) || 30,
        durationMonths: Number(formData.durationMonths) || 1,
        savingsText: autoSavings
      };

      try {
        const res = await subscriptionService.updatePlan(targetId, updatedPayload);
        setPlans((prev) =>
          prev.map((p) => {
            if ((currentPlan.id && p.id === currentPlan.id) || (currentPlan._id && p._id === currentPlan._id) || p.code === currentPlan.code) {
              return res?.plan || { ...p, ...updatedPayload };
            }
            return p;
          })
        );
      } catch (err) {
        console.warn('API error, updating locally:', err);
        setPlans((prev) =>
          prev.map((p) => {
            if ((currentPlan.id && p.id === currentPlan.id) || (currentPlan._id && p._id === currentPlan._id) || p.code === currentPlan.code) {
              return { ...p, ...updatedPayload };
            }
            return p;
          })
        );
      }
      showToast(`Updated plan "${formData.name}".`);
    }

    setIsModalOpen(false);
  };

  // Save Trial Settings Modal
  const handleSaveTrialSettings = async (e) => {
    e.preventDefault();
    try {
      await subscriptionService.updateTrialSettings({
        enabled: trialFormData.enabled,
        trialFee: trialFormData.trialFee,
        trialDurationDays: trialFormData.trialDurationDays,
        termsText: trialFormData.termsText
      });
    } catch (err) {
      console.warn('API error, updating trial settings locally:', err);
    }
    setTrialConfig({ ...trialFormData });
    setIsTrialModalOpen(false);
    showToast('7-Day Free Trial settings updated.');
  };


  return (
    <div className="space-y-6 font-urbanist w-full pb-16 selection:bg-[#FEF08A] selection:text-black">

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold border border-slate-800 dark:border-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4 CORE MONETIZATION KPI OVERVIEW CARDS (100% Dynamic)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Subscription Revenue */}
        <KpiStatCard
          icon={CreditCard}
          title="Monthly Revenue"
          subtitle="Recurring Yield"
          value={`₹${totalMrrEstimated}`}
          footerLeft="Total collected"
          footerRight={`₹${(overviewKpis?.totalRevenueCollected || 0).toLocaleString()}`}
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 2: Active Subscribers */}
        <KpiStatCard
          icon={Crown}
          title="Active Subscribers"
          subtitle="Paid Subscriber Base"
          value={totalSubscribers}
          animateNumber
          footerLeft={`${plans.filter((p) => p.status === 'ACTIVE').length} active plan tiers`}
          footerRight="Active in DB"
          footerRightColor="text-emerald-600 dark:text-emerald-400 font-bold"
        />

        {/* Metric 3: 7-Day Free Trial AutoPay Activations */}
        <KpiStatCard
          icon={Zap}
          title={`7-Day Trials (₹${trialConfig.trialFee})`}
          subtitle="AutoPay Mandates"
          value={overviewKpis?.activeTrialUsers ?? 0}
          animateNumber
          footerLeft="Razorpay e-Mandate"
          footerRight={trialConfig.enabled ? 'Campaign Active' : 'Campaign Paused'}
          footerRightColor={trialConfig.enabled ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 font-bold'}
        />

        {/* Metric 4: Monthly Churn Rate */}
        <KpiStatCard
          icon={ShieldCheck}
          title="Monthly Churn"
          subtitle="Retention Cohort"
          value={overviewKpis?.churnRate || '0.0%'}
          footerLeft="Zero-Grace Enforcement"
          footerRight="Immediate Lock"
          footerRightColor="text-slate-600 dark:text-slate-400 font-bold"
        />
      </div>

      {/* ======================================================== */}
      {/* SECTION HEADER & PRIMARY ACTION BAR (Website Standard)   */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight">
              E² Stories Subscription Plans ({plans.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Manage your pricing tiers, perks, strikethrough savings, and AutoPay renewals directly below.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadAllData(false)}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Data'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUBSCRIPTION PLAN CARDS GRID (100% Dynamic from MongoDB)  */}
      {/* ======================================================== */}
      {isLoading && plans.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-96 rounded-2xl bg-slate-100 dark:bg-[#121612] border border-slate-200/80 dark:border-white/10 p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-20 h-6 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="w-3/4 h-8 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="w-1/2 h-10 rounded-lg bg-slate-200 dark:bg-white/10" />
                <div className="space-y-2 pt-4">
                  <div className="w-full h-4 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="w-5/6 h-4 rounded bg-slate-200 dark:bg-white/10" />
                  <div className="w-4/6 h-4 rounded bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
              <div className="w-full h-10 rounded-xl bg-slate-200 dark:bg-white/10 mt-6" />
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-10 border border-slate-200/80 dark:border-white/10 text-center space-y-3 shadow-nodus">
          <CreditCard className="w-10 h-10 mx-auto text-slate-400 stroke-[1.5]" />
          <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
            No subscription plans created yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Create your first subscription tier to enable the paywall and AutoPay renewals across the mobile app.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-black text-xs transition-all shadow-xs cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create First Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {plans.map((plan) => {
          const isAnnual = plan.code === 'PLAN_12M' || plan.durationDays === 365 || plan.name?.toLowerCase().includes('12 month');
          const isPopular = plan.badge?.toLowerCase().includes('popular') || plan.badge?.toLowerCase().includes('save 16');

          return (
            <div
              key={plan.id || plan.code}
              className={`bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border flex flex-col justify-between relative overflow-hidden transition-all shadow-nodus group ${
                isAnnual
                  ? 'border-amber-300 dark:border-amber-500/50 ring-2 ring-[#FEF08A]/40 dark:ring-amber-500/20'
                  : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              {/* Top Badge & Code */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <Badge
                    plan={plan.name}
                    size="xs"
                  >
                    {plan.badge || plan.name}
                  </Badge>
                  <div className="flex items-center space-x-1.5">
                    {plan.status === 'DRAFT' ? (
                      <Badge variant="no-plan" size="xs">
                        Draft
                      </Badge>
                    ) : (
                      <Badge variant="active" size="xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Plan Title & Pricing */}
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                  {plan.name}
                </h3>

                <div className="mt-2.5 flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                    ₹{plan.price}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    / {plan.period}
                  </span>
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <span className="text-xs font-bold text-slate-400 line-through ml-1">
                      ₹{plan.originalPrice}
                    </span>
                  )}
                </div>

                {/* Savings or Billing Tagline */}
                {plan.savingsText && (
                  <div className="mt-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                    <span>{plan.savingsText}</span>
                  </div>
                )}

                {/* 7-Day Trial Tag on Plan */}
                {plan.trialEligible && (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                        7-Day Trial for ₹{trialConfig.trialFee}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      AutoPay Mandate
                    </span>
                  </div>
                )}

                {/* Metrics Strip */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Active Subscribers</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                    {(plan.activeSubscribers || 0).toLocaleString()}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-4 space-y-2 text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-[10px] uppercase tracking-wider">
                    Perks &amp; Entitlements
                  </p>
                  {plan.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  AutoPay Renewal
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleDuplicatePlan(plan)}
                    title="Duplicate as draft"
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#161B16] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 text-xs transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(plan)}
                    className="px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    Edit Plan Pricing &gt;
                  </button>
                </div>
              </div>

            </div>
          );
        })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7-DAY FREE TRIAL (₹2 TOKEN AUTOPAY MANDATE) SPOTLIGHT    */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-950 dark:text-white text-base sm:text-lg tracking-tight">
                  {trialConfig.trialDurationDays}-Day Free Trial (₹{trialConfig.trialFee} Token AutoPay Mandate)
                </h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase ${
                  trialConfig.enabled
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/50'
                    : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${trialConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {trialConfig.enabled ? 'Campaign Active' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                High-conversion subscriber acquisition flow enabled by Razorpay &amp; UPI e-Mandate
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => {
                setTrialFormData({ ...trialConfig });
                setIsTrialModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#161B16] hover:bg-[#FEF08A] hover:text-slate-950 dark:hover:bg-[#FEF08A] dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-white/10 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Trial Architecture Diagram & Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 space-y-2 hover:border-[#FEF08A]/50 dark:hover:border-[#FEF08A]/30 transition-all">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">1</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">User Signs Up for ₹{trialConfig.trialFee}</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Enjoy a {trialConfig.trialDurationDays}-day free trial for just ₹{trialConfig.trialFee}. The ₹{trialConfig.trialFee} payment is non-refundable and authenticates the user's UPI/Card mandate.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 space-y-2 hover:border-[#FEF08A]/50 dark:hover:border-[#FEF08A]/30 transition-all">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">2</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">{trialConfig.trialDurationDays} Days Full Access</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Viewer enjoys complete access to all paywalled episodes across all micro-dramas in 1080p Full HD with zero ads.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200/70 dark:border-white/10 space-y-2 hover:border-[#FEF08A]/50 dark:hover:border-[#FEF08A]/30 transition-all">
            <div className="flex items-center space-x-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">3</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">Automatic AutoPay Renewal</h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              After {trialConfig.trialDurationDays} days, subscription automatically renews as a paid plan unless cancelled before the trial ends.
            </p>
          </div>

        </div>

        {/* Trial Terms Callout Box */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16]/80 border border-slate-200/80 dark:border-white/10 flex items-start space-x-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <Info className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-white text-xs">
              Statutory In-App Terms &amp; Compliance Notice
            </p>
            <p className="leading-relaxed text-xs text-slate-600 dark:text-slate-400 italic">
              "{trialConfig.termsText}"
            </p>
          </div>
        </div>

      </div>


  {/* ======================================================== */}
  {/* CREATE & EDIT SUBSCRIPTION PLAN MODAL (Light & Dark Mode) */}
  {/* ======================================================== */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 font-urbanist"
          onWheel={(e) => e.stopPropagation()}
        >
          <div
            className="bg-white dark:bg-[#121612] text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200/90 dark:border-white/12 overflow-hidden flex flex-col h-[88vh] max-h-[820px] animate-in zoom-in-95 duration-150 font-urbanist"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#161B16]">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight leading-snug">
                    {modalMode === 'create' ? 'Create New Subscription Plan' : 'Edit Subscription Plan'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure tier duration, pricing, perks, and AutoPay mandate eligibility
                  </p>
                </div>
              </div>

              {/* Header Actions: Mobile Tab Switcher + Status Pill + Close */}
              <div className="flex items-center space-x-3">
                {/* Mobile / Tablet View Switcher (< lg) */}
                <div className="flex lg:hidden items-center bg-slate-100 dark:bg-[#1C221C] p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setModalViewTab('form')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalViewTab === 'form'
                        ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalViewTab('preview')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalViewTab === 'preview'
                        ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                {/* Plan Status Segmented Control */}
                <div className="flex items-center bg-slate-100 dark:bg-[#1C221C] p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'ACTIVE' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                      formData.status === 'ACTIVE'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${formData.status === 'ACTIVE' ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                    <span>Active</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.status === 'DRAFT'
                        ? 'bg-amber-400 text-slate-950 font-extrabold shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <span>Draft</span>
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Responsive 2-Column Split (Left Column Scrolls, Right Column Stays Static) */}
            <form onSubmit={handleSaveModal} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              
              <div className="flex-1 min-h-0 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                
                {/* Left Column: Form Controls (7 cols on lg - Independently Scrollable) */}
                <div className={`${modalViewTab === 'form' ? 'block' : 'hidden lg:block'} lg:col-span-7 space-y-5 overflow-y-auto pr-1 sm:pr-3 max-h-full scroll-smooth`}>
                  
                  {/* 1. Plan Name & Quick Starters */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                      Plan Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1 Month Pass, 6 Months Pass, 12 Months Annual"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 text-xs font-bold bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:bg-white dark:focus:bg-[#101410] focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    {/* 1-Click Quick Preset Starters */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                      {[
                        { name: '1 Month Pass', period: '30 Days', days: 30, months: 1, price: 99, originalPrice: 99, badge: 'Popular Starter' },
                        { name: '6 Months Pass', period: '180 Days', days: 180, months: 6, price: 499, originalPrice: 594, badge: 'Save 16%' },
                        { name: '12 Months Annual', period: '365 Days', days: 365, months: 12, price: 899, originalPrice: 1188, badge: 'Best Value (Save ₹289)' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              name: preset.name,
                              period: preset.period,
                              durationDays: preset.days,
                              durationMonths: preset.months,
                              price: preset.price,
                              originalPrice: preset.originalPrice,
                              badge: preset.badge
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-[#1C221C] hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-all cursor-pointer shadow-2xs"
                        >
                          <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500 stroke-[2.5]" />
                          {preset.name} (₹{preset.price})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Billing Duration Segmented Cards */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                      Billing Duration / Cadence
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: '30 Days', title: '1 Month', days: 30, months: 1 },
                        { label: '180 Days', title: '6 Months', days: 180, months: 6 },
                        { label: '365 Days', title: '12 Months', days: 365, months: 12 },
                        { label: '7 Days', title: 'Weekly', days: 7, months: 0.25 },
                      ].map((dur) => {
                        const isSelected = formData.period === dur.label;
                        return (
                          <button
                            key={dur.label}
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              period: dur.label,
                              durationDays: dur.days,
                              durationMonths: dur.months
                            })}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#FEF08A] text-slate-950 border-amber-300 font-extrabold shadow-xs ring-2 ring-amber-300/40'
                                : 'bg-white dark:bg-[#101410] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 font-bold'
                            }`}
                          >
                            <span className="block text-xs">{dur.title}</span>
                            <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                              {dur.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Pricing & Strikethrough Savings */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Selling Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                          Selling Price (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min={1}
                            required
                            placeholder="e.g. 99, 499, 899"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-8 pr-4 py-2.5 text-sm font-black bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Strikethrough Price */}
                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                          Strikethrough Price (₹) <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                            ₹
                          </span>
                          <input
                            type="number"
                            min={0}
                            placeholder="e.g. 199, 594, 1188"
                            value={formData.originalPrice}
                            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                            className="w-full pl-8 pr-4 py-2.5 text-sm font-bold bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Smart Live Savings Pill with 1-Click "Apply as Tagline" */}
                    {Number(formData.originalPrice) > Number(formData.price) && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
                          <span>
                            Saves ₹{Number(formData.originalPrice) - Number(formData.price)} ({Math.round(((Number(formData.originalPrice) - Number(formData.price)) / Number(formData.originalPrice)) * 100)}% discount vs base rate)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const diff = Number(formData.originalPrice) - Number(formData.price);
                            setFormData(prev => ({
                              ...prev,
                              savingsText: `Yearly savings: ₹${diff} compared with paying ₹99 monthly for 12 months (₹1,188)`
                            }));
                          }}
                          className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-colors cursor-pointer ml-2 shrink-0 shadow-2xs"
                          title="Auto-fill the tagline with this savings calculation"
                        >
                          Use as Tagline ↵
                        </button>
                      </div>
                    )}

                    {/* Card Badge Tag & Savings Tagline */}
                    <div className="space-y-3 pt-1 border-t border-slate-200/60 dark:border-white/5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                            Card Badge Tag
                          </label>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Shown as a highlight badge</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Popular Starter / Save 16% / Best Value (Save ₹289)"
                          value={formData.badge}
                          onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                          className="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />

                        {/* Quick Badge Chips */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['Popular Starter', 'Save 16%', 'Best Value (Save ₹289)', 'Special Offer', 'Limited Deal'].map((bText) => (
                            <button
                              key={bText}
                              type="button"
                              onClick={() => setFormData({ ...formData, badge: bText })}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#1C221C] hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
                            >
                              + {bText}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                          Custom Savings Tagline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Yearly savings: ₹289 compared with paying ₹99 monthly for 12 months (₹1,188)"
                          value={formData.savingsText}
                          onChange={(e) => setFormData({ ...formData, savingsText: e.target.value })}
                          className="w-full px-4 py-2 text-xs font-semibold bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. 7-Day Free Trial AutoPay Mandate Switch */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    formData.trialEligible
                      ? 'bg-amber-500/10 border-amber-300/80 dark:border-amber-500/40 shadow-xs'
                      : 'bg-slate-50/70 dark:bg-[#161B16] border-slate-200/80 dark:border-white/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                          formData.trialEligible
                            ? 'bg-[#FEF08A] text-slate-950'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                        }`}>
                          <Zap className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-950 dark:text-white">
                            Enable 7-Day Free Trial for ₹{trialConfig.trialFee} with AutoPay
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Users start with a non-refundable ₹{trialConfig.trialFee} mandate verification before renewing automatically at ₹{formData.price || 0}
                          </p>
                        </div>
                      </div>

                      {/* Smooth Slide Switch */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, trialEligible: !formData.trialEligible })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.trialEligible ? 'bg-[#FEF08A]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title="Toggle 7-day trial eligibility"
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.trialEligible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* 5. Perks & Features List */}
                  <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 dark:text-slate-200">
                        Perks &amp; Features List ({formData.features.length})
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Click chips to add instantly</span>
                    </div>

                    {/* Quick Add Preset Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Unlock all paywalled episodes (Episode 4+)',
                        '1080p Full HD vertical streaming',
                        'Ad-free uninterrupted viewing',
                        'Hindi & English subtitles',
                        'Offline episode downloads for travel',
                        'Subscriber badge in comments'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (!formData.features.includes(preset)) {
                              setFormData({ ...formData, features: [...formData.features, preset] });
                            }
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-[#1C221C] hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shadow-2xs"
                        >
                          + {preset.length > 28 ? preset.slice(0, 26) + '...' : preset}
                        </button>
                      ))}
                    </div>

                    {/* Custom Perk Input */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Add a new perk (e.g. 1080p vertical streaming)..."
                        value={newFeatureInput}
                        onChange={(e) => setNewFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                        className="flex-1 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#101410] border border-slate-200/90 dark:border-white/10 rounded-xl focus:border-[#FEF08A] text-slate-950 dark:text-white focus:outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="px-4 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                      >
                        Add Perk
                      </button>
                    </div>

                    {/* Feature Items List */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {formData.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#101410] border border-slate-200/80 dark:border-white/10 text-xs group hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center space-x-2.5 text-slate-800 dark:text-slate-200 min-w-0 pr-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                            </div>
                            <span className="truncate leading-snug">{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer shrink-0"
                            title="Remove perk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right Column: Live Subscriber Card Preview (5 cols on lg - Non-Scrollable Static View) */}
                <div className={`${modalViewTab === 'preview' ? 'flex overflow-y-auto' : 'hidden lg:flex lg:overflow-hidden'} lg:col-span-5 flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 h-full shrink-0 select-none`}>
                  <div>
                    {/* Live Preview Header Strip */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Live Subscriber Card Preview
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        In-App View
                      </span>
                    </div>

                    {/* The Mirrored Live Plan Card */}
                    <div className="bg-white dark:bg-[#1A201A] rounded-2xl p-5 border border-amber-300/80 dark:border-amber-400/50 shadow-md dark:shadow-2xl ring-2 ring-[#FEF08A]/40 dark:ring-[#FEF08A]/20 flex flex-col justify-between">
                      <div>
                        {/* Top Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <Badge
                            variant={
                              formData.badge?.toLowerCase().includes('premium') || formData.badge?.toLowerCase().includes('best value')
                                ? 'flix9-premium'
                                : 'flix9-basic'
                            }
                            size="xs"
                          >
                            {formData.badge || 'Plan Tier'}
                          </Badge>
                          {formData.status === 'DRAFT' ? (
                            <Badge variant="no-plan" size="xs">
                              Draft
                            </Badge>
                          ) : (
                            <Badge variant="active" size="xs">
                              Active
                            </Badge>
                          )}
                        </div>

                        {/* Plan Name */}
                        <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight truncate">
                          {formData.name || 'Untitled Plan'}
                        </h3>

                        {/* Price & Strikethrough */}
                        <div className="mt-2 flex items-baseline space-x-2">
                          <span className="text-3xl font-black text-slate-950 dark:text-white font-urbanist tracking-tight">
                            ₹{formData.price || 0}
                          </span>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            / {formData.period || '30 Days'}
                          </span>
                          {Number(formData.originalPrice) > Number(formData.price) && (
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 line-through ml-1">
                              ₹{formData.originalPrice}
                            </span>
                          )}
                        </div>

                        {/* Savings Tagline */}
                        {formData.savingsText && (
                          <div className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                            <span className="truncate">{formData.savingsText}</span>
                          </div>
                        )}

                        {/* 7-Day Trial Strip in Preview */}
                        {formData.trialEligible && (
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#141914] border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                              <span className="font-bold text-slate-900 dark:text-white text-[11px]">
                                7-Day Free Trial for ₹{trialConfig.trialFee}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              AutoPay Mandate
                            </span>
                          </div>
                        )}

                        {/* Perks Strip in Preview */}
                        <div className="mt-4 space-y-2 text-xs">
                          <p className="font-extrabold text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-wider">
                            Perks &amp; Entitlements
                          </p>
                          {formData.features?.slice(0, 4).map((feat, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-slate-700 dark:text-slate-300">
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-2 h-2 text-emerald-700 dark:text-emerald-400 stroke-[3]" />
                              </div>
                              <span className="text-xs truncate">{feat}</span>
                            </div>
                          ))}
                          {formData.features.length > 4 && (
                            <p className="text-[10px] text-slate-400 font-semibold pl-5">
                              +{formData.features.length - 4} more benefits
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Preview Action */}
                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          AutoPay Renewal
                        </span>
                        <span className="px-3.5 py-1.5 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-xs shadow-xs">
                          Subscribe
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] text-[11px] text-slate-600 dark:text-slate-400 font-medium text-center flex items-center justify-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Changes reflect immediately for all subscribers upon saving.</span>
                  </div>
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="px-6 py-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-[#161B16] shrink-0">
                <div>
                  {modalMode === 'edit' && plans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(formData.id || formData.code, formData.name)}
                      className="px-3.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Plan</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-black transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    {modalMode === 'create' ? 'Create & Publish Plan' : 'Save Plan Changes'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* 7-DAY FREE TRIAL CONFIGURATION MODAL                     */}
      {/* ======================================================== */}
      {isTrialModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150 font-urbanist"
          onWheel={(e) => e.stopPropagation()}
          onClick={() => setIsTrialModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#161B16] rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200/90 dark:border-white/12 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 font-urbanist"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between shrink-0 bg-white dark:bg-[#161B16]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-2xs">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight">
                    Edit Free Trial Settings
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Configure token fee, duration period, and legal AutoPay notice
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTrialModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTrialSettings} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Campaign Status Toggle Card */}
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                  Campaign Status
                </label>
                <div
                  onClick={() => setTrialFormData((prev) => ({ ...prev, enabled: !prev.enabled }))}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    trialFormData.enabled
                      ? 'bg-amber-500/5 dark:bg-[#FEF08A]/5 border-amber-300/60 dark:border-[#FEF08A]/30'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/90 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${trialFormData.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-950 dark:text-white">
                        {trialFormData.enabled ? 'Campaign is Active' : 'Campaign is Paused'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {trialFormData.enabled
                          ? 'New subscribers can claim the trial on paywall checkout'
                          : 'Trial promotion is paused and hidden from viewers'}
                      </p>
                    </div>
                  </div>

                  {/* Modern Animated Toggle Switch */}
                  <div className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out shrink-0 ${
                    trialFormData.enabled ? 'bg-[#FEF08A]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-slate-950 dark:bg-slate-900 shadow-md transform transition-transform duration-200 ease-in-out ${
                      trialFormData.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Token Fee & Duration Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Trial Token Fee */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                    Trial Token Fee (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-xs select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={1}
                      required
                      value={trialFormData.trialFee}
                      onChange={(e) => setTrialFormData((prev) => ({ ...prev, trialFee: Number(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2.5 text-xs font-bold bg-slate-50 dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60"
                    />
                  </div>
                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 5, 10].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setTrialFormData((prev) => ({ ...prev, trialFee: fee }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          trialFormData.trialFee === fee
                            ? 'bg-[#FEF08A] text-slate-950 shadow-2xs font-black'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        ₹{fee} {fee === 2 && '(Default)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trial Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1.5">
                    Trial Duration (Days)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      required
                      value={trialFormData.trialDurationDays}
                      onChange={(e) => setTrialFormData((prev) => ({ ...prev, trialDurationDays: Number(e.target.value) }))}
                      className="w-full pl-3.5 pr-14 py-2.5 text-xs font-bold bg-slate-50 dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold select-none">
                      Days
                    </span>
                  </div>
                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[3, 7, 14, 30].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setTrialFormData((prev) => ({ ...prev, trialDurationDays: days }))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          trialFormData.trialDurationDays === days
                            ? 'bg-[#FEF08A] text-slate-950 shadow-2xs font-black'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {days}D {days === 7 && '(Default)'}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Real-time UX Flow Strip */}
              <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-[#FEF08A]/5 border border-amber-300/40 dark:border-[#FEF08A]/20 flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  <strong className="text-slate-950 dark:text-white font-bold">Live Flow:</strong> User verifies <span className="font-bold text-amber-700 dark:text-amber-300">₹{trialFormData.trialFee}</span> token → Gets <span className="font-bold text-amber-700 dark:text-amber-300">{trialFormData.trialDurationDays} days</span> full access → Auto-renews to plan rate.
                </p>
              </div>

              {/* Statutory AutoPay Terms Notice */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
                    Statutory AutoPay Terms Notice
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTrialFormData((prev) => ({
                        ...prev,
                        termsText: `Enjoy a ${prev.trialDurationDays}-day free trial for just ₹${prev.trialFee}. The ₹${prev.trialFee} trial payment is non-refundable. After the ${prev.trialDurationDays}-day trial period ends, your subscription will automatically renew as a paid subscription through the enabled AutoPay option. The applicable subscription fee will be charged automatically unless you cancel the subscription before the trial period ends.`
                      }));
                    }}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Standard Template
                  </button>
                </div>
                <textarea
                  rows={3}
                  required
                  value={trialFormData.termsText}
                  onChange={(e) => setTrialFormData((prev) => ({ ...prev, termsText: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-[#121612] border border-slate-200 dark:border-white/10 rounded-xl text-slate-950 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 leading-relaxed resize-none"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  This statutory compliance disclosure is presented on user paywalls before UPI/Card mandate authorization.
                </p>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsTrialModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  Save Settings
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
