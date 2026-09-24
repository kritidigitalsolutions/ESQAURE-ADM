import React, { useState } from 'react';
import { Ticket, Plus, Tag, Copy, CheckCircle2, Percent, Calendar, Sparkles, Trash2 } from 'lucide-react';

export default function PromosPage() {
  const [vouchers, setVouchers] = useState([
    {
      id: 'VOUCH-1',
      code: 'WELCOME50',
      discountType: 'PERCENTAGE',
      discountValue: '50%',
      targetPlan: 'Monthly Pass (₹199)',
      maxUses: 10000,
      currentUses: 6420,
      expiryDate: '31 Dec 2026',
      status: 'ACTIVE'
    },
    {
      id: 'VOUCH-2',
      code: 'DIWALI99',
      discountType: 'FLAT',
      discountValue: 'Flat ₹99',
      targetPlan: 'Monthly Pass (₹199)',
      maxUses: 5000,
      currentUses: 4890,
      expiryDate: '15 Nov 2026',
      status: 'ACTIVE'
    },
    {
      id: 'VOUCH-3',
      code: 'SUBFREE7',
      discountType: 'FREE_DAYS',
      discountValue: '7 Days Free',
      targetPlan: 'All Subscription Plans',
      maxUses: 20000,
      currentUses: 14200,
      expiryDate: '28 Feb 2027',
      status: 'ACTIVE'
    },
    {
      id: 'VOUCH-4',
      code: 'EARLYBIRD',
      discountType: 'PERCENTAGE',
      discountValue: '30%',
      targetPlan: 'Yearly Pass (₹1,499)',
      maxUses: 1000,
      currentUses: 1000,
      expiryDate: '31 Aug 2026',
      status: 'EXPIRED'
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [discountType, setDiscountType] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('20%');
  const [targetPlan, setTargetPlan] = useState('Monthly Pass (₹199)');
  const [maxUses, setMaxUses] = useState(1000);
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!newCode) return;
    const newVoucher = {
      id: `VOUCH-${Date.now().toString().slice(-4)}`,
      code: newCode.toUpperCase(),
      discountType,
      discountValue,
      targetPlan,
      maxUses: Number(maxUses),
      currentUses: 0,
      expiryDate: '31 Dec 2026',
      status: 'ACTIVE'
    };
    setVouchers([newVoucher, ...vouchers]);
    setIsModalOpen(false);
    setNewCode('');
  };

  const handleDelete = (id) => {
    setVouchers(vouchers.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Top Banner with Action Button */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/90 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Ticket className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Promos & Vouchers</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Create coupon discount codes, referral vouchers, and subscription trial promotions.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Promo</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Promos</span>
          <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">3 Active</h3>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">1 expired campaign</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Redemptions</span>
          <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">26,510</h3>
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">+2,140 this week</p>
        </div>

        <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/90 dark:border-white/10 shadow-nodus transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Discount Value Driven</span>
          <h3 className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">₹8.94 Lakh</h3>
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">Customer acquisition incentive</p>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-nodus overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161B16] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Promo Code</th>
                <th className="py-3.5 px-4">Benefit</th>
                <th className="py-3.5 px-4">Applicable Plan</th>
                <th className="py-3.5 px-4">Usage Progress</th>
                <th className="py-3.5 px-4">Expiration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-semibold text-slate-900 dark:text-slate-100">
              {vouchers.map((v) => {
                const percentUsed = Math.round((v.currentUses / v.maxUses) * 100);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors">
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
                          {copiedCode === v.code ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-black dark:text-white">
                      {v.discountValue}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {v.targetPlan}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{v.currentUses.toLocaleString()}</span>
                          <span>{v.maxUses.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#161B16] rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percentUsed >= 100 ? 'bg-slate-400 dark:bg-slate-600' : 'bg-[#FEF08A]'}`}
                            style={{ width: `${Math.min(percentUsed, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {v.expiryDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-100 dark:bg-[#161B16] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                      }`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        title="Delete code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promo Modal - Level 24dp */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202620] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/15 transition-colors">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">Create Promo Voucher</h3>
            
            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Promo Code Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH50"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 font-mono font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-none focus:border-[#FEF08A] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Rupee (₹)</option>
                    <option value="FREE_DAYS">Free Subscription Days</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50% or ₹50"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Target Plan</label>
                <select
                  value={targetPlan}
                  onChange={(e) => setTargetPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                >
                  <option value="Monthly Pass (₹199)">Monthly Pass (₹199)</option>
                  <option value="Yearly Pass (₹1,499)">Yearly Pass (₹1,499)</option>
                  <option value="All Subscription Plans">All Subscription Plans</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Maximum Usage Limit</label>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#FEF08A] transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold shadow-xs active:scale-98 transition-colors"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
