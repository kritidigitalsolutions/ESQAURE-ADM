import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Gift,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Search,
  X,
  Download,
  Calendar,
  Check,
  CheckCircle2,
  Users,
  ToggleLeft,
  ToggleRight,
  Pencil,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Eye,
  CheckCheck
} from 'lucide-react';
import voucherService from '../../services/voucherService';
import { subscriptionService } from '../../services/subscriptionService';
import PageLoader from '../../components/common/PageLoader';
import ModalPortal from '../../components/common/ModalPortal';

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const DEFAULT_PLAN_OPTIONS = [
  { code: 'PLAN_1M', name: '1 Month Pass', durationDays: 30, priceLabel: 'Worth ₹99' },
  { code: 'PLAN_6M', name: '6 Month Pass', durationDays: 180, priceLabel: 'Worth ₹499' },
  { code: 'PLAN_12M', name: '12 Month Annual Pass', durationDays: 365, priceLabel: 'Worth ₹899' },
  { code: 'CUSTOM', name: 'Custom VIP Pass', durationDays: 60, priceLabel: 'Custom Plan' }
];

const EMPTY_VOUCHER_FORM = {
  code: '',
  planCode: 'PLAN_1M',
  planName: '1 Month Pass',
  durationDays: 30,
  voucherType: 'SINGLE_USE',
  maxUses: 1,
  expiryDate: '',
  campaignName: '',
  notes: ''
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function VoucherStatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  const isPaused = status === 'PAUSED';
  const isExhausted = status === 'EXHAUSTED';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
        isActive
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
          : isPaused
          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
          : isExhausted
          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40'
          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isActive
            ? 'bg-emerald-500'
            : isPaused
            ? 'bg-amber-500'
            : isExhausted
            ? 'bg-indigo-500'
            : 'bg-slate-400'
        }`}
      />
      <span>{status || 'EXPIRED'}</span>
    </span>
  );
}

// ─── Create/Edit Voucher Modal ────────────────────────────────────────────────
function VoucherModal({ initial, planOptions = DEFAULT_PLAN_OPTIONS, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(
    isEdit
      ? {
          code: initial.code,
          planCode: initial.planCode || (planOptions[0]?.code || 'PLAN_1M'),
          planName: initial.planName || (planOptions[0]?.name || '1 Month Pass'),
          durationDays: initial.durationDays || (planOptions[0]?.durationDays || 30),
          voucherType: initial.voucherType || 'SINGLE_USE',
          maxUses: initial.maxUses || 1,
          expiryDate: initial.expiryDate
            ? new Date(initial.expiryDate).toISOString().split('T')[0]
            : '',
          campaignName: initial.campaignName || '',
          notes: initial.notes || ''
        }
      : {
          ...EMPTY_VOUCHER_FORM,
          planCode: planOptions[0]?.code || 'PLAN_1M',
          planName: planOptions[0]?.name || '1 Month Pass',
          durationDays: planOptions[0]?.durationDays || 30
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePlanSelect = (code) => {
    const p = planOptions.find((item) => item.code === code);
    if (p) {
      setForm((prev) => ({
        ...prev,
        planCode: p.code,
        planName: p.name,
        durationDays: p.durationDays
      }));
    }
  };

  const generateCode = () => {
    const prefixes = ['VIP', 'PASS', 'GIFT', 'FREE', 'PRO'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const days = form.durationDays || 30;
    const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
    set('code', `${p}${days}-${rnd}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.expiryDate) {
      setError('Voucher code and expiry date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        durationDays: Number(form.durationDays) || 30,
        maxUses: form.voucherType === 'SINGLE_USE' ? 1 : Math.max(1, Number(form.maxUses) || 1)
      };

      if (isEdit) {
        await voucherService.updateVoucher(initial.id, payload);
      } else {
        await voucherService.createVoucher(payload);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-[#24242E] rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Gift className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  {isEdit ? 'Edit Plan Voucher' : 'Create Plan Voucher'}
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  Grants 100% complimentary subscription plan upon redemption
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2.5 border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Voucher Code */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Voucher Code *
                </label>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={generateCode}
                    className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    Generate Random
                  </button>
                )}
              </div>
              <input
                type="text"
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                disabled={isEdit}
                placeholder="e.g. VIP1M-GIFT, ANNUALPASS26"
                className="w-full px-2.5 py-1.5 font-mono text-xs font-bold uppercase rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:border-[#FEF08A] transition-colors disabled:opacity-60"
                required
              />
            </div>

            {/* Plan To Grant */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subscription Plan Granted *
              </label>
              <select
                value={form.planCode}
                onChange={(e) => handlePlanSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
              >
                {planOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name} ({opt.durationDays} Days • {opt.priceLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Days if needed */}
            {form.planCode === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Plan Name
                  </label>
                  <input
                    type="text"
                    value={form.planName}
                    onChange={(e) => set('planName', e.target.value)}
                    placeholder="e.g. 3 Month VIP"
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationDays}
                    onChange={(e) => set('durationDays', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  />
                </div>
              </div>
            )}

            {/* Voucher Type & Max Uses */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Type
                </label>
                <select
                  value={form.voucherType}
                  onChange={(e) => {
                    const t = e.target.value;
                    set('voucherType', t);
                    if (t === 'SINGLE_USE') set('maxUses', 1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="SINGLE_USE">Single-Use (1 User Gift)</option>
                  <option value="MULTI_USE">Multi-Use (Campaign Batch)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Redemption Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.voucherType === 'SINGLE_USE' ? 1 : form.maxUses}
                  onChange={(e) => set('maxUses', e.target.value)}
                  disabled={form.voucherType === 'SINGLE_USE'}
                  placeholder="1"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A] disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => set('expiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                required
              />
            </div>

            {/* Campaign Name / Recipient Note */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign / Partner
                </label>
                <input
                  type="text"
                  value={form.campaignName}
                  onChange={(e) => set('campaignName', e.target.value)}
                  placeholder="e.g. YouTube Collab"
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient / Memo
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="e.g. Gifted to @reviewer"
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Plan Voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Bulk Generate Plan Vouchers Modal ────────────────────────────────────────
function BulkVoucherModal({ planOptions = DEFAULT_PLAN_OPTIONS, onClose, onSaved }) {
  const [prefix, setPrefix] = useState('VIP');
  const [count, setCount] = useState(5);
  const [planCode, setPlanCode] = useState(planOptions[0]?.code || 'PLAN_1M');
  const [voucherType, setVoucherType] = useState('SINGLE_USE');
  const [maxUses, setMaxUses] = useState(1);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [campaignName, setCampaignName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = planOptions.find((p) => p.code === planCode) || planOptions[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!prefix.trim() || !count || !expiryDate) {
      setError('Prefix, count, and expiry date are required.');
      return;
    }
    setSaving(true);
    try {
      await voucherService.bulkGenerateVouchers({
        prefix: prefix.toUpperCase().trim(),
        count: Number(count),
        planCode: selectedPlan?.code || 'PLAN_1M',
        planName: selectedPlan?.name,
        durationDays: selectedPlan?.durationDays || 30,
        voucherType,
        maxUses: voucherType === 'SINGLE_USE' ? 1 : Math.max(1, Number(maxUses) || 1),
        expiryDate,
        campaignName: campaignName.trim(),
        notes: notes.trim()
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to bulk generate vouchers.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-[#24242E] rounded-xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  Bulk Generate Plan Vouchers
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  Create a batch of unique VIP access vouchers instantly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2.5 border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prefix (e.g. CAMPUS) *
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="CAMPUS"
                  className="w-full px-2.5 py-1.5 font-mono text-xs font-bold uppercase rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity (Max 50) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subscription Plan Granted *
              </label>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
              >
                {planOptions.filter(p => p.code !== 'CUSTOM').map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.name} ({opt.durationDays} Days • {opt.priceLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Type
                </label>
                <select
                  value={voucherType}
                  onChange={(e) => {
                    const t = e.target.value;
                    setVoucherType(t);
                    if (t === 'SINGLE_USE') setMaxUses(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="SINGLE_USE">Single-Use (1 User Gift)</option>
                  <option value="MULTI_USE">Multi-Use (Shared Code)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Redemption Limit
                </label>
                <input
                  type="number"
                  min="1"
                  value={voucherType === 'SINGLE_USE' ? 1 : maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  disabled={voucherType === 'SINGLE_USE'}
                  className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] disabled:opacity-60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] cursor-pointer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Campaign / Partner
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. College Fest 2026"
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Memo
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Batch gift vouchers"
                  className="w-full px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Generating...' : `Generate ${count} Vouchers`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Redemption History Drawer/Modal ──────────────────────────────────────────
function RedemptionsModal({ voucher, onClose }) {
  const users = voucher?.usedBy || [];

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-[#24242E] rounded-xl max-w-lg w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  Voucher Claimants: {voucher.code}
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  {voucher.planName} • {voucher.currentUses} of {voucher.maxUses} claimed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {users.length === 0 ? (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No users have redeemed this voucher yet.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-white/5">
              {users.map((u, i) => (
                <div key={i} className="pt-2 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {u.userName || 'Subscriber'}
                    </div>
                    <div className="text-[10.5px] text-slate-400 font-mono">
                      {u.userPhone || 'Registered Account'}
                    </div>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 text-right">
                    <span>{formatDate(u.redeemedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Test Redeem Voucher Modal ────────────────────────────────────────────────
function QuickRedeemModal({ voucher, onClose, onRedeemed }) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resMsg, setResMsg] = useState(null);

  const handleRedeem = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResMsg(null);
    try {
      const res = await voucherService.redeemVoucher({
        code: voucher.code,
        phoneNumber: phone.trim()
      });
      if (res?.success) {
        setResMsg({ success: true, text: res.message || 'Plan activated successfully!' });
        setTimeout(() => {
          onRedeemed();
        }, 1200);
      } else {
        setResMsg({ success: false, text: res?.message || 'Failed to redeem voucher' });
      }
    } catch (err) {
      setResMsg({
        success: false,
        text: err?.response?.data?.message || err?.message || 'Error redeeming voucher'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-[#24242E] rounded-xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  Grant Plan via Voucher
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  Code: <strong className="font-mono text-[#FEF08A]">{voucher.code}</strong> ({voucher.planName})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {resMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-semibold border ${
                resMsg.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200'
              }`}
            >
              {resMsg.text}
            </div>
          )}

          <form onSubmit={handleRedeem} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Mobile Number or Email *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 7600000097 or user@example.com"
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FEF08A]"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Instantly activates {voucher.planName} ({voucher.durationDays} Days) on this account.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Activating...' : 'Redeem & Grant Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Main Plan Vouchers Page ──────────────────────────────────────────────────
export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    pausedCount: 0,
    expiredCount: 0,
    exhaustedCount: 0,
    totalGrantedPlans: 0,
    totalVouchers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', voucher: v } | { mode: 'bulk' }
  const [viewHistoryVoucher, setViewHistoryVoucher] = useState(null);
  const [quickRedeemVoucher, setQuickRedeemVoucher] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchPlans = useCallback(async () => {
    try {
      const res = await subscriptionService.getPlans();
      const list = res?.plans || (Array.isArray(res) ? res : []);
      if (list.length > 0) setPlans(list);
    } catch (err) {
      console.warn('Failed to load plans for vouchers:', err);
    }
  }, []);

  const dynamicPlanOptions = useMemo(() => {
    if (!plans || plans.length === 0) return DEFAULT_PLAN_OPTIONS;
    const mapped = plans.map((p) => ({
      code: p.code,
      name: p.name,
      durationDays: p.durationDays || (p.durationMonths ? p.durationMonths * 30 : 30),
      priceLabel: `Worth ₹${p.price}`
    }));
    return [
      ...mapped,
      { code: 'CUSTOM', name: 'Custom VIP Pass', durationDays: 60, priceLabel: 'Custom Plan' }
    ];
  }, [plans]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await voucherService.getAdminVouchers({ limit: 100 });
      if (res?.success) {
        setVouchers(res.data?.vouchers || []);
        if (res.data?.stats) setStats(res.data.stats);
      } else {
        setError(res?.message || 'Failed to fetch plan vouchers');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Network error fetching vouchers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchPlans();
  }, [fetchData, fetchPlans]);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    showToast(`Copied ${code} to clipboard`);
  };

  const handleToggle = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await voucherService.toggleVoucherStatus(id);
      if (res?.success) {
        setVouchers((prev) =>
          prev.map((v) => (v.id === id ? { ...v, status: res.data.status } : v))
        );
        showToast('Voucher status updated successfully');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to toggle voucher');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete voucher "${code}"?`)) return;
    setActionLoadingId(id);
    try {
      const res = await voucherService.deleteVoucher(id);
      if (res?.success) {
        setVouchers((prev) => prev.filter((v) => v.id !== id));
        showToast(`Voucher "${code}" deleted successfully`);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete voucher');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!vouchers.length) return;
    const headers = [
      'Voucher Code',
      'Plan Granted',
      'Duration (Days)',
      'Voucher Type',
      'Redeemed Count',
      'Max Uses',
      'Expiry Date',
      'Status',
      'Campaign',
      'Notes'
    ];
    const rows = filteredVouchers.map((v) => [
      v.code,
      v.planName,
      v.durationDays,
      v.voucherType,
      v.currentUses || 0,
      v.maxUses,
      formatDate(v.expiryDate),
      v.status,
      `"${(v.campaignName || '').replace(/"/g, '""')}"`,
      `"${(v.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plan_vouchers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];

    if (statusFilter !== 'ALL') {
      result = result.filter((v) => v.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (v) =>
          v.code.toLowerCase().includes(q) ||
          v.planName.toLowerCase().includes(q) ||
          (v.campaignName && v.campaignName.toLowerCase().includes(q)) ||
          (v.notes && v.notes.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'uses') return (b.currentUses || 0) - (a.currentUses || 0);
      if (sortBy === 'expiry') return new Date(a.expiryDate) - new Date(b.expiryDate);
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      return 0;
    });

    return result;
  }, [vouchers, statusFilter, searchTerm, sortBy]);

  return (
    <div className="space-y-3 sm:space-y-3.5 font-urbanist text-slate-900 dark:text-slate-100 pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#18181E] text-[#FEF08A] border border-amber-400/30 px-3 py-2 rounded-lg text-xs font-bold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Overview Cards - Consistent Theme Badge (#FEF08A), Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Active Vouchers */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                <Gift className="w-5 h-5 text-slate-950 dark:text-amber-300 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Active Vouchers
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Ready to Redeem
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {stats.activeCount || 0}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">Available passes</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Live</span>
          </div>
        </div>

        {/* Metric 2: Full Plans Granted */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                <Sparkles className="w-5 h-5 text-slate-950 dark:text-amber-300 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Plans Granted
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  VIP Activations
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {(stats.totalGrantedPlans || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">Total claimed passes</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Activated</span>
          </div>
        </div>

        {/* Metric 3: Total Vouchers */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                <Layers className="w-5 h-5 text-slate-950 dark:text-amber-300 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Total Vouchers
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  All Records
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {vouchers.length}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">
              {stats.exhaustedCount || 0} fully redeemed
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-bold">Total</span>
          </div>
        </div>

        {/* Metric 4: Campaign Redemption Health */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-xs shrink-0">
                <Calendar className="w-5 h-5 text-slate-950 dark:text-amber-300 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Active Ratio
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Voucher State
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {vouchers.length > 0
                  ? `${Math.round((stats.activeCount / vouchers.length) * 100)}%`
                  : '100%'}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">
              {stats.expiredCount || 0} expired
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal</span>
          </div>
        </div>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Subscription Plan Vouchers
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
              {filteredVouchers.length} Vouchers
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Create and distribute vouchers that grant complete subscription passes (100% complimentary VIP access).
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-lg transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh vouchers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setModal({ mode: 'bulk' })}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bulk Generate</span>
          </button>

          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="py-1.5 px-3 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Plan Voucher</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar - Compact Single Row */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${vouchers.length})` },
            { id: 'ACTIVE', label: `Active (${stats.activeCount})` },
            { id: 'PAUSED', label: `Paused (${stats.pausedCount || 0})` },
            { id: 'EXHAUSTED', label: `Redeemed (${stats.exhaustedCount || 0})` },
            { id: 'EXPIRED', label: `Expired (${stats.expiredCount || 0})` }
          ].map((item) => {
            const isSelected = statusFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
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

        {/* Search & Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search voucher, plan, campaign..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-none focus:border-[#FEF08A] placeholder:text-slate-400 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
          >
            <option value="newest">Recent First</option>
            <option value="uses">Most Redemptions</option>
            <option value="expiry">Expiry (Soonest)</option>
            <option value="code">Code (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2 border border-rose-200 dark:border-rose-800/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vouchers Table */}
      <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
        {loading ? (
          <PageLoader size="sm" text="Loading plan vouchers..." minHeight="min-h-[200px]" />
        ) : filteredVouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-1.5 text-slate-400">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
              <Gift className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No plan vouchers found
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {searchTerm ? `No vouchers matching "${searchTerm}".` : 'No vouchers in this view.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#18181E] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Voucher Code</th>
                  <th className="py-2.5 px-3">Plan Granted</th>
                  <th className="py-2.5 px-3">Campaign / Recipient</th>
                  <th className="py-2.5 px-3">Type & Quota</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-900 dark:text-slate-100">
                {filteredVouchers.map((v) => {
                  const pct = Math.round(((v.currentUses || 0) / (v.maxUses || 1)) * 100);
                  const isBusy = actionLoadingId === v.id;
                  const hasClaims = (v.usedBy || []).length > 0 || (v.currentUses || 0) > 0;

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Code */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF08A]/35 dark:bg-[#FEF08A]/15 font-mono font-bold text-xs text-slate-950 dark:text-[#FEF08A] border border-amber-300/40 dark:border-amber-400/25">
                            {v.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(v.code)}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
                            title="Copy voucher code"
                          >
                            {copiedCode === v.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {v.notes && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[170px] mt-0.5">
                            {v.notes}
                          </span>
                        )}
                      </td>

                      {/* Complete Plan Granted */}
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-950 dark:text-white text-xs">
                            {v.planName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-md bg-[#FEF08A]/30 dark:bg-[#FEF08A]/10 text-[9.5px] font-bold text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-400/25">
                            {v.durationDays}d Full VIP
                          </span>
                        </div>
                      </td>

                      {/* Campaign / Partner */}
                      <td className="py-2 px-3">
                        {v.campaignName ? (
                          <span className="text-slate-700 dark:text-slate-300 text-[11px] font-semibold block truncate max-w-[160px]">
                            {v.campaignName}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                            Direct Gift
                          </span>
                        )}
                      </td>

                      {/* Type & Usage Quota */}
                      <td className="py-2 px-3">
                        <div className="space-y-1 w-24">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            <span>{v.currentUses || 0} / {v.maxUses}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {v.voucherType === 'SINGLE_USE' ? '1-use' : 'Multi'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-[#18181E] rounded-full h-1.5 overflow-hidden border border-slate-200/40 dark:border-white/5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-indigo-500' : 'bg-[#FACC15]'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px] font-medium whitespace-nowrap">
                        {formatDate(v.expiryDate)}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <VoucherStatusBadge status={v.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Quick Redeem Test */}
                          {v.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => setQuickRedeemVoucher(v)}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] hover:bg-amber-100 dark:hover:bg-amber-950/40 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer"
                              title="Grant this plan to a user"
                            >
                              Grant
                            </button>
                          )}

                          {/* View Claimants */}
                          {hasClaims && (
                            <button
                              type="button"
                              onClick={() => setViewHistoryVoucher(v)}
                              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                              title="View claimants"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Toggle Active / Paused */}
                          {v.status !== 'EXPIRED' && v.status !== 'EXHAUSTED' && (
                            <button
                              type="button"
                              onClick={() => handleToggle(v.id)}
                              disabled={isBusy}
                              className={`p-1 rounded-md transition-colors cursor-pointer ${
                                v.status === 'ACTIVE'
                                  ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-600 hover:text-amber-700 dark:text-amber-400'
                              }`}
                              title={v.status === 'ACTIVE' ? 'Pause voucher' : 'Activate voucher'}
                            >
                              {v.status === 'ACTIVE' ? (
                                <ToggleRight className="w-4 h-4 stroke-[2.2]" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 stroke-[2.2]" />
                              )}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setModal({ mode: 'edit', voucher: v })}
                            disabled={isBusy}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Edit voucher"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id, v.code)}
                            disabled={isBusy}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                            title="Delete voucher"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.mode === 'bulk' && (
        <BulkVoucherModal
          planOptions={dynamicPlanOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchData();
            showToast('Batch plan vouchers generated successfully.');
          }}
        />
      )}

      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <VoucherModal
          initial={modal.mode === 'edit' ? modal.voucher : null}
          planOptions={dynamicPlanOptions}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchData();
            showToast('Plan voucher saved successfully.');
          }}
        />
      )}

      {/* Claimants History Modal */}
      {viewHistoryVoucher && (
        <RedemptionsModal
          voucher={viewHistoryVoucher}
          onClose={() => setViewHistoryVoucher(null)}
        />
      )}

      {/* Quick Redeem Plan Modal */}
      {quickRedeemVoucher && (
        <QuickRedeemModal
          voucher={quickRedeemVoucher}
          onClose={() => setQuickRedeemVoucher(null)}
          onRedeemed={() => {
            setQuickRedeemVoucher(null);
            fetchData();
            showToast('Plan voucher redeemed and activated successfully!');
          }}
        />
      )}
    </div>
  );
}
