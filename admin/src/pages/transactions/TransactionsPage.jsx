import React, { useState } from 'react';
import { mockTransactions } from '../../data/mockOttData';
import { Receipt, Search, Download, CheckCircle2, XCircle, ArrowUpRight, IndianRupee } from 'lucide-react';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isExporting, setIsExporting] = useState(false);

  const filteredTxns = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Transaction ledger exported to CSV successfully!');
    }, 800);
  };

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Top Filter & Search Bar */}
      <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Payment ID, phone, or name..."
            class="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#FEF08A] focus:outline-none transition-colors"
          />
        </div>

        {/* Status Filters & Export */}
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            class="py-2 px-3.5 bg-slate-100 hover:bg-[#FEF08A] hover:text-black text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <Download class="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>

      </div>

      {/* Transactions Table */}
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-4">Payment ID & Order</th>
                <th class="py-3.5 px-4">Customer Phone & Name</th>
                <th class="py-3.5 px-4">Plan Code</th>
                <th class="py-3.5 px-4">Payment Gateway</th>
                <th class="py-3.5 px-4">Amount</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              {filteredTxns.map((txn) => (
                <tr key={txn.id} class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4 font-mono">
                    <p class="font-bold text-slate-900">{txn.id}</p>
                    <p class="text-[10px] text-slate-400">{txn.orderId}</p>
                  </td>
                  <td class="py-3.5 px-4">
                    <p class="font-bold text-slate-900">{txn.user}</p>
                    <p class="text-[11px] text-slate-400 font-mono">{txn.phone}</p>
                  </td>
                  <td class="py-3.5 px-4">
                    <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                      {txn.plan}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-slate-600 font-medium">
                    {txn.method}
                  </td>
                  <td class="py-3.5 px-4 font-extrabold text-slate-900">
                    {txn.amount}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      txn.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {txn.status === 'SUCCESS' ? <CheckCircle2 class="w-3 h-3 mr-0.5" /> : <XCircle class="w-3 h-3 mr-0.5" />}
                      <span>{txn.status}</span>
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                    {txn.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
