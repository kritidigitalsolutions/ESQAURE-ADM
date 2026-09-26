import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket, Plus, Copy, CheckCircle2, Trash2,
  RefreshCw, Loader2, AlertCircle, ToggleLeft, ToggleRight, Pencil
} from 'lucide-react';
import promoService from '../../services/promoService';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDiscount = (type, value) => {
  if (type === 'PERCENTAGE') return `${value}% Off`;
  if (type === 'FLAT')       return `Flat ₹${value} Off`;
  if (type === 'FREE_DAYS')  return `${value} Days Free`;
  return `${value}`;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EMPTY_FORM = {
  code: '', discountType: 'PERCENTAGE', discountValue: '',
  applicablePlan: 'ALL', maxUses: 1000, expiryDate: '', description: ''
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ACTIVE:  'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    PAUSED:  'bg-amber-100   dark:bg-amber-950/60   text-amber-800   dark:text-amber-300   border-amber-200   dark:border-amber-800/60',
    EXPIRED: 'bg-slate-100   dark:bg-[#161B16]       text-slate-500   dark:text-slate-400   border-slate-200   dark:border-white/10',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${map[status] || map.EXPIRED}`}>
      {status}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function PromoModal({ initial, onClose, onSaved }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(
    isEdit
      ? {
          code:          initial.code,
          discountType:  initial.discountType,
          discountValue: initial.discountValue,
          applicablePlan: initial.applicablePlan,
          maxUses:       initial.maxUses,
          expiryDate:    initial.expiryDate
            ? new Date(initial.expiryDate).toISOString().split('T')[0]
            : '',
          description:   initial.description || ''
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.code || !form.discountValue || !form.expiryDate) {
      setError('Code, discount value and expiry date are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        maxUses:       Number(form.maxUses)
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#202620] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/15">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center shrink-0">
            <Ticket className="w-4 h-4 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
          </div>
          <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
            {isEdit ? 'Edit Promo' : 'Create Promo Voucher'}
          </h3>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl px-3 py-2.5 border border-rose-200 dark:border-rose-800/40">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Code */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Promo Code *
            </label>
            <input
              type="text"
              required
              disabled={isEdit}
              placeholder="e.g. FLASH50"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Discount Type + Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Discount Type</label>
              <select
                value={form.discountType}
                onChange={e => set('discountType', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat Rupee (₹)</option>
                <option value="FREE_DAYS">Free Days</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {form.discountType === 'PERCENTAGE' ? 'Percent (%)' :
                 form.discountType === 'FLAT' ? 'Amount (₹)' : 'Days'}
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder={form.discountType === 'PERCENTAGE' ? '50' : form.discountType === 'FLAT' ? '20' : '7'}
                value={form.discountValue}
                onChange={e => set('discountValue', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
          </div>

          {/* Applicable Plan */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Applicable Plan</label>
            <select
              value={form.applicablePlan}
              onChange={e => set('applicablePlan', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
            >
              <option value="ALL">All Plans</option>
              <option value="PLAN_1M">1 Month Pass</option>
              <option value="PLAN_6M">6 Month Pass</option>
              <option value="PLAN_12M">12 Month Annual Pass</option>
            </select>
          </div>

          {/* Max Uses + Expiry */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Max Uses</label>
              <input
                type="number"
                min={1}
                value={form.maxUses}
                onChange={e => set('maxUses', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={e => set('expiryDate', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Description (optional)</label>
            <input
              type="text"
              placeholder="Internal note about this promo"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
            />
          </div>

          <div className="pt-1 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold shadow-xs active:scale-98 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save & Activate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PromosPage() {
  const [promos,  setPromos]  = useState([]);
  const [stats,   setStats]   = useState({ activeCount: 0, expiredCount: 0, totalUses: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const [modal,   setModal]   = useState(null);   // null | { mode:'create'|'edit', promo }
  const [copiedCode, setCopiedCode] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await promoService.getAdminPromos({ limit: 100 });
      const { promos: list = [], stats: s = {} } = res?.data || {};
      setPromos(list);
      setStats(s);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load promos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Copy ───────────────────────────────────────────────────────────────────
  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete promo "${code}"?`)) return;
    setActionLoadingId(id);
    try {
      await promoService.deletePromo(id);
      setPromos(p => p.filter(x => x.id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    setActionLoadingId(id);
    try {
      const res = await promoService.togglePromoStatus(id);
      const { status } = res?.data || {};
      setPromos(p => p.map(x => x.id === id ? { ...x, status } : x));
    } catch (err) {
      alert(err?.response?.data?.message || 'Toggle failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 font-urbanist">

      {/* Header */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Ticket className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Promos & Vouchers</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Create and manage discount codes for subscriptions.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Promo</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Promos',     value: stats.activeCount,  sub: `${stats.expiredCount} expired` },
          { label: 'Total Redemptions', value: (stats.totalUses || 0).toLocaleString('en-IN'), sub: 'Across all codes' },
          { label: 'Total Codes',       value: promos.length, sub: 'In the database' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
            <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">{value}</h3>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 rounded-xl px-4 py-3 border border-rose-200 dark:border-rose-800/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-20 space-x-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">Loading promos…</span>
          </div>
        ) : promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
            <Ticket className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">No promos yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#161B16] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-5">Code</th>
                  <th className="py-3.5 px-4">Benefit</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Usage</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-900 dark:text-slate-100">
                {promos.map((v) => {
                  const pct = Math.round((v.currentUses / v.maxUses) * 100);
                  const busy = actionLoadingId === v.id;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#161B16] font-mono font-bold text-slate-950 dark:text-[#FEF08A] border border-slate-200 dark:border-white/10">
                            {v.code}
                          </span>
                          <button
                            onClick={() => handleCopy(v.code)}
                            className="p-1 text-slate-400 hover:text-black dark:hover:text-white rounded transition-colors"
                            title="Copy Code"
                          >
                            {copiedCode === v.code
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Benefit */}
                      <td className="py-3.5 px-4 font-bold text-black dark:text-white">
                        {formatDiscount(v.discountType, v.discountValue)}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {v.applicablePlan === 'ALL' ? 'All Plans' : v.applicablePlan}
                      </td>

                      {/* Usage */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 w-32">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{(v.currentUses || 0).toLocaleString()}</span>
                            <span>{v.maxUses.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-[#161B16] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 100 ? 'bg-slate-400 dark:bg-slate-600' : 'bg-[#FEF08A]'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {formatDate(v.expiryDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={v.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Toggle */}
                          {v.status !== 'EXPIRED' && (
                            <button
                              onClick={() => handleToggle(v.id)}
                              disabled={busy}
                              className="p-1.5 text-slate-400 hover:text-[#FEF08A] rounded transition-colors disabled:opacity-40"
                              title={v.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                            >
                              {busy
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : v.status === 'ACTIVE'
                                  ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                                  : <ToggleLeft className="w-4 h-4" />}
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => setModal({ mode: 'edit', promo: v })}
                            disabled={busy}
                            className="p-1.5 text-slate-400 hover:text-white rounded transition-colors disabled:opacity-40"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(v.id, v.code)}
                            disabled={busy}
                            className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-colors disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {modal && (
        <PromoModal
          initial={modal.mode === 'edit' ? modal.promo : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchData(); }}
        />
      )}
    </div>
  );
}
