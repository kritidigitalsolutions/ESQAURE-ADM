import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TicketPercent,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Search,
  X,
  Download,
  Tag,
  Calendar,
  Check,
  CheckCircle2,
  Percent,
  Pencil,
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import promoService from '../../services/promoService';
import { subscriptionService } from '../../services/subscriptionService';
import { confirmModal } from '../../context/DialogContext';
import PageLoader from '../../components/common/PageLoader';
import ModalPortal from '../../components/common/ModalPortal';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge, { cleanPlanName } from '../../components/common/Badge';

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatDiscount = (type, value) => {
  if (type === 'PERCENTAGE') return `${value}% Off`;
  if (type === 'FLAT') return `₹${value} Off`;
  return `${value}`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const EMPTY_FORM = {
  code: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  applicablePlan: 'ALL',
  maxUses: 500,
  expiryDate: '',
  description: ''
};

// ─── Promo Modal (Create / Edit) ──────────────────────────────────────────────
function PromoModal({ initial, plans = [], onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(
    isEdit
      ? {
          code: initial.code,
          discountType: initial.discountType === 'FLAT' ? 'FLAT' : 'PERCENTAGE',
          discountValue: initial.discountValue,
          applicablePlan: initial.applicablePlan || 'ALL',
          maxUses: initial.maxUses || 500,
          expiryDate: initial.expiryDate
            ? new Date(initial.expiryDate).toISOString().split('T')[0]
            : '',
          description: initial.description || ''
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const generateCode = () => {
    const prefixes = ['SAVE', 'DISC', 'OTT', 'FEST', 'VIP'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 89);
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    set('code', `${p}${num}${rnd}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.discountValue || !form.expiryDate) {
      setError('Promo code, discount value, and expiry date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        discountValue: Number(form.discountValue),
        maxUses: Number(form.maxUses) || 500
      };
      if (isEdit) {
        await promoService.updatePromo(initial.id, payload);
      } else {
        await promoService.createPromo(payload);
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
        <div className="bg-white dark:bg-[#24242E] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <TicketPercent className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  {isEdit ? 'Edit Promo Discount Code' : 'Create Promo Discount Code'}
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  Configure discount rate, plan scope & redemption quota
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5 border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Promo Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Promo Discount Code *
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
                placeholder="e.g. WELCOME20, FESTIVAL50"
                className="w-full px-3 py-2 font-mono text-xs font-bold uppercase rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] transition-colors disabled:opacity-60"
                required
              />
            </div>

            {/* Discount Type & Value Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Type *
                </label>
                <select
                  value={form.discountType}
                  onChange={(e) => set('discountType', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="PERCENTAGE">Percentage (% Off)</option>
                  <option value="FLAT">Flat Rate (₹ Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {form.discountType === 'PERCENTAGE' ? 'Discount % *' : 'Discount ₹ *'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={form.discountType === 'PERCENTAGE' ? '100' : '9999'}
                  value={form.discountValue}
                  onChange={(e) => set('discountValue', e.target.value)}
                  placeholder={form.discountType === 'PERCENTAGE' ? '20' : '50'}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
                  required
                />
              </div>
            </div>

            {/* Applicable Plan & Usage Quota */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Plan
                </label>
                <select
                  value={form.applicablePlan}
                  onChange={(e) => set('applicablePlan', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="ALL">All Subscription Plans</option>
                  {plans.map((p) => (
                    <option key={p.id || p.code} value={p.code}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                  {plans.length === 0 && (
                    <>
                      <option value="PLAN_1M">1 Month Pass (₹99)</option>
                      <option value="PLAN_6M">6 Month Pass (₹499)</option>
                      <option value="PLAN_12M">12 Month Annual Pass (₹899)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Redemptions
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => set('maxUses', e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
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
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                required
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Promo Code'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Bulk Generate Promo Modal ────────────────────────────────────────────────
function BulkPromoModal({ plans = [], onClose, onSaved }) {
  const [prefix, setPrefix] = useState('FEST');
  const [count, setCount] = useState(5);
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(20);
  const [applicablePlan, setApplicablePlan] = useState('ALL');
  const [maxUses, setMaxUses] = useState(100);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!prefix.trim() || !count || !discountValue || !expiryDate) {
      setError('Prefix, count, discount value, and expiry date are required.');
      return;
    }
    setSaving(true);
    try {
      await promoService.bulkGeneratePromos({
        prefix: prefix.toUpperCase().trim(),
        count: Number(count),
        discountType,
        discountValue: Number(discountValue),
        applicablePlan,
        maxUses: Number(maxUses) || 100,
        expiryDate,
        description: description.trim() || `Batch generated under ${prefix.toUpperCase().trim()}`
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to bulk generate promos.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white dark:bg-[#24242E] rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-3.5 border border-slate-200 dark:border-white/15 font-urbanist animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-tight">
                  Bulk Generate Promo Codes
                </h3>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                  Create a batch of unique discount codes instantly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl p-2.5 border border-rose-200 dark:border-rose-800/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prefix (e.g. DIWALI) *
                </label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="DIWALI"
                  className="w-full px-3 py-2 font-mono text-xs font-bold uppercase rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
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
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discount Type *
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="PERCENTAGE">Percentage (% Off)</option>
                  <option value="FLAT">Flat Rate (₹ Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {discountType === 'PERCENTAGE' ? 'Discount % *' : 'Discount ₹ *'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'PERCENTAGE' ? '100' : '9999'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Applicable Plan
                </label>
                <select
                  value={applicablePlan}
                  onChange={(e) => setApplicablePlan(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                >
                  <option value="ALL">All Subscription Plans</option>
                  {plans.map((p) => (
                    <option key={p.id || p.code} value={p.code}>
                      {p.name} (₹{p.price})
                    </option>
                  ))}
                  {plans.length === 0 && (
                    <>
                      <option value="PLAN_1M">1 Month Pass (₹99)</option>
                      <option value="PLAN_6M">6 Month Pass (₹499)</option>
                      <option value="PLAN_12M">12 Month Annual Pass (₹899)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max Uses Each
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A]"
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
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/50 focus:border-[#FEF08A] cursor-pointer"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Generating...' : `Generate ${count} Codes`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

// ─── Main Promo Codes Page ───────────────────────────────────────────────────
export default function PromosPage() {
  const [promos, setPromos] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ activeCount: 0, expiredCount: 0, totalUses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [modal, setModal] = useState(null); // null | { mode: 'create' } | { mode: 'edit', promo: p } | { mode: 'bulk' }
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
      console.warn('Failed to load plans for promos:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await promoService.getAdminPromos({ limit: 100 });
      if (res?.success) {
        setPromos(res.data?.promos || []);
        if (res.data?.stats) setStats(res.data.stats);
      } else {
        setError(res?.message || 'Failed to fetch promo codes');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Network error fetching promos');
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
      const res = await promoService.togglePromoStatus(id);
      if (res?.success) {
        setPromos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: res.data.status } : p))
        );
        showToast('Promo status updated successfully');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to toggle promo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id, code) => {
    const confirmed = await confirmModal({
      title: 'Delete Promo Code',
      message: `Are you sure you want to delete promo code "${code}"? Customers will no longer be able to apply this discount at checkout.`,
      itemName: code,
      confirmText: 'Delete Promo',
      variant: 'danger'
    });
    if (!confirmed) return;

    setActionLoadingId(id);
    try {
      const res = await promoService.deletePromo(id);
      if (res?.success) {
        setPromos((prev) => prev.filter((p) => p.id !== id));
        showToast(`Promo "${code}" deleted successfully`);
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete promo');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleExportCSV = () => {
    if (!promos.length) return;
    const headers = ['Code', 'Type', 'Value', 'Applicable Plan', 'Current Uses', 'Max Uses', 'Expiry Date', 'Status', 'Description'];
    const rows = filteredPromos.map((p) => [
      p.code,
      p.discountType,
      p.discountValue,
      p.applicablePlan,
      p.currentUses || 0,
      p.maxUses,
      formatDate(p.expiryDate),
      p.status,
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `promo_codes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Promo codes exported to CSV.');
  };

  // Filter & Sort
  const filteredPromos = useMemo(() => {
    let result = [...promos];

    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.applicablePlan.toLowerCase().includes(q)
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
  }, [promos, statusFilter, searchTerm, sortBy]);

  const pausedCount = promos.filter((p) => p.status === 'PAUSED').length;

  return (
    <div className="space-y-3 sm:space-y-3.5 font-urbanist text-slate-900 dark:text-slate-100 pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#18181E] text-[#FEF08A] border border-amber-400/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Top Header & Primary Action Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Promo Codes & Discounts
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A] text-slate-950 border border-amber-300/50 shadow-2xs">
              {promos.length} Codes
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Create, track, and manage promotional discount coupons for subscription checkout.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-full transition-all cursor-pointer active:scale-90 hover:scale-105 shadow-sm shrink-0"
            title="Refresh promo codes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Bulk Generate */}
          <button
            type="button"
            onClick={() => setModal({ mode: 'bulk' })}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Generate batch of promo codes"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bulk</span>
          </button>

          {/* New Promo Code Button */}
          <button
            type="button"
            onClick={() => setModal({ mode: 'create' })}
            className="py-1.5 px-3.5 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Code</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Overview Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Active Codes */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <TicketPercent className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Active Promos
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Ready at Checkout
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
            <span className="text-slate-500 dark:text-slate-400">Campaigns live</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
          </div>
        </div>

        {/* Metric 2: Total Redemptions */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Tag className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Discounts Claimed
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Total Redemptions
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {(stats.totalUses || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">Customer savings</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Redeemed</span>
          </div>
        </div>

        {/* Metric 3: Total Promos Created */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Percent className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Total Promo Codes
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  All Records
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {promos.length}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">{pausedCount} paused codes</span>
            <span className="text-slate-600 dark:text-slate-300 font-bold">Catalog</span>
          </div>
        </div>

        {/* Metric 4: Promo Availability Rate */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Calendar className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Active Ratio
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Campaign Rate
                </span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight leading-none">
                {promos.length > 0 ? `${Math.round((stats.activeCount / promos.length) * 100)}%` : '100%'}
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium">
            <span className="text-slate-500 dark:text-slate-400">{stats.expiredCount} expired codes</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Healthy</span>
          </div>
        </div>
      </div>

      {/* ─── Unified Filter & Search Toolbar ─── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${promos.length})` },
            { id: 'ACTIVE', label: `Active (${stats.activeCount})` },
            { id: 'PAUSED', label: `Paused (${pausedCount})` },
            { id: 'EXPIRED', label: `Expired (${stats.expiredCount})` }
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

        {/* Right: Search Box + Sort Dropdown */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search code, description, plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:border-[#FEF08A] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
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
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#FEF08A] cursor-pointer transition-colors"
            >
              <option value="newest" className="dark:bg-[#1E1E26]">Recent First</option>
              <option value="uses" className="dark:bg-[#1E1E26]">Most Redemptions</option>
              <option value="expiry" className="dark:bg-[#1E1E26]">Expiry (Soonest)</option>
              <option value="code" className="dark:bg-[#1E1E26]">Code (A - Z)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Matches Counter */}
          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden xl:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredPromos.length}</strong> matches
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2 border border-rose-200 dark:border-rose-800/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Promo Codes Table Container ─── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-colors">
        {loading && promos.length === 0 ? (
          <div className="py-10">
            <PageLoader size="sm" text="Loading promo code directory..." minHeight="min-h-[200px]" />
          </div>
        ) : filteredPromos.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 shadow-2xs">
              <TicketPercent className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No promo codes found
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
              {searchTerm
                ? `No codes match "${searchTerm}". Try another keyword or clear filters.`
                : 'No promo codes in this view tier. Create a new campaign to get started.'}
            </p>
            {!searchTerm && statusFilter === 'ALL' && (
              <button
                type="button"
                onClick={() => setModal({ mode: 'create' })}
                className="mt-2 py-1.5 px-3 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Create Promo Code
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-[#18181E] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3 min-w-[190px]">Promo Code</th>
                  <th className="py-2.5 px-3 w-36">Discount Rate</th>
                  <th className="py-2.5 px-3 w-40">Applicable Plan</th>
                  <th className="py-2.5 px-3 w-44">Redemption Quota</th>
                  <th className="py-2.5 px-3 w-32">Expiry Date</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  <th className="py-2.5 px-3 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-900 dark:text-slate-100">
                {filteredPromos.map((p) => {
                  const pct = Math.round(((p.currentUses || 0) / (p.maxUses || 1)) * 100);
                  const isBusy = actionLoadingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Code + Description */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#FEF08A]/35 dark:bg-[#FEF08A]/15 font-mono font-bold text-xs text-slate-950 dark:text-[#FEF08A] border border-amber-300/40 dark:border-amber-400/25">
                            {p.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.code)}
                            className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === p.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Benefit */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge
                          variant={p.discountType === 'PERCENTAGE' ? 'discount-percent' : 'discount-flat'}
                          label={formatDiscount(p.discountType, p.discountValue)}
                          size="xs"
                        />
                      </td>

                      {/* Plan Scope */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <Badge
                          plan={cleanPlanName(
                            p.applicablePlan === 'ALL' || !p.applicablePlan
                              ? 'All Subscription Plans'
                              : (plans.find((pl) => pl.code === p.applicablePlan)?.name || p.applicablePlan)
                          )}
                          size="xs"
                        />
                      </td>

                      {/* Usage Progress */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400">
                            <span>{(p.currentUses || 0).toLocaleString()} / {p.maxUses.toLocaleString()}</span>
                            <span className="text-[9.5px] font-bold text-slate-400">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-[#18181E] rounded-full h-1.5 overflow-hidden border border-slate-200/40 dark:border-white/5">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-400' : 'bg-[#FACC15]'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expiry Date */}
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">
                        {formatDate(p.expiryDate)}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <Badge
                          variant={p.status === 'ACTIVE' ? 'active' : p.status === 'PAUSED' ? 'paused' : 'inactive'}
                          label={p.status || 'EXPIRED'}
                          size="xs"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {p.status !== 'EXPIRED' && (
                            <div className="inline-flex items-center" title={p.status === 'ACTIVE' ? 'Pause promo' : 'Activate promo'}>
                              <ToggleSwitch
                                checked={p.status === 'ACTIVE'}
                                onChange={() => handleToggle(p.id)}
                                disabled={isBusy}
                                size="sm"
                              />
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setModal({ mode: 'edit', promo: p })}
                            disabled={isBusy}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Edit promo code"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.code)}
                            disabled={isBusy}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                            title="Delete promo"
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

      {/* ─── Modals ─── */}
      {modal?.mode === 'bulk' && (
        <BulkPromoModal
          plans={plans}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchData();
            showToast('Batch promo codes generated successfully.');
          }}
        />
      )}

      {(modal?.mode === 'create' || modal?.mode === 'edit') && (
        <PromoModal
          initial={modal.mode === 'edit' ? modal.promo : null}
          plans={plans}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            fetchData();
            showToast('Promo code saved successfully.');
          }}
        />
      )}
    </div>
  );
}
