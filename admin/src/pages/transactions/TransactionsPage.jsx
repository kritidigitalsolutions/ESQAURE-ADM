import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { subscriptionService } from '../../services/subscriptionService';
import PageLoader from '../../components/common/PageLoader';
import {
  Receipt,
  Search,
  X,
  Download,
  FileText,
  CheckCircle2,
  RefreshCw,
  CreditCard
} from 'lucide-react';

/**
 * Clean & Minimalist Financial Transactions & Revenue Ledger for ESQUARE Admin.
 * Strictly adheres to #FEF08A / #FACC15 brand guidelines, Material Dark hierarchy,
 * compact density, and unified single-row toolbars.
 */
export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'amount-high' | 'amount-low' | 'name'
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadTransactions = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await subscriptionService.getTransactions({ limit: 100 });
      if (res?.transactions && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.warn('Transactions load fallback:', err);
    } finally {
      if (showLoading) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTransactions(true);
  }, []);

  const parseAmount = (amt) => {
    if (typeof amt === 'number') return amt;
    if (!amt) return 0;
    const num = parseFloat(String(amt).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // 4 Core Financial Metrics
  const stats = useMemo(() => {
    let totalGross = 0;
    let successCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    transactions.forEach((t) => {
      const val = parseAmount(t.amount);
      if (t.status === 'SUCCESS') {
        successCount++;
        totalGross += val;
      } else if (t.status === 'PENDING') {
        pendingCount++;
      } else if (t.status === 'FAILED') {
        failedCount++;
      }
    });

    const totalCount = transactions.length;
    const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100';

    return {
      totalGross: `₹${totalGross.toLocaleString('en-IN')}`,
      successRate: `${successRate}%`,
      totalCount,
      successCount,
      pendingCount,
      failedCount,
    };
  }, [transactions]);

  // Filter & Sort
  const filteredTxns = useMemo(() => {
    const list = transactions.filter((t) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (t.id && t.id.toLowerCase().includes(term)) ||
        (t.user && t.user.toLowerCase().includes(term)) ||
        (t.phone && t.phone.includes(term)) ||
        (t.orderId && t.orderId.toLowerCase().includes(term)) ||
        (t.amount && String(t.amount).toLowerCase().includes(term)) ||
        (t.plan && t.plan.toLowerCase().includes(term)) ||
        (t.method && t.method.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return list.sort((a, b) => {
      if (sortBy === 'amount-high') {
        return parseAmount(b.amount) - parseAmount(a.amount);
      }
      if (sortBy === 'amount-low') {
        return parseAmount(a.amount) - parseAmount(b.amount);
      }
      if (sortBy === 'name') {
        return (a.user || '').localeCompare(b.user || '');
      }
      return 0; // Default newest
    });
  }, [transactions, searchTerm, statusFilter, sortBy]);

  const handleExportCSV = () => {
    if (filteredTxns.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['Payment ID,Order ID,Customer Name,Phone,Plan,Gateway Method,Amount,Status,Timestamp'];
    const rows = filteredTxns.map((t) =>
      [
        `"${t.id || ''}"`,
        `"${t.orderId || ''}"`,
        `"${t.user || 'Viewer'}"`,
        `"${t.phone || ''}"`,
        `"${t.plan || ''}"`,
        `"${t.method || ''}"`,
        `"${t.amount || ''}"`,
        `"${t.status || ''}"`,
        `"${t.date || ''}"`,
      ].join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `esquare_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Transactions CSV exported successfully.');
  };

  const handleExportPDF = () => {
    try {
      if (filteredTxns.length === 0) {
        alert('No transactions to export.');
        return;
      }
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: 'a4',
      });

      const todayStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      // Brand Top Bar (#FEF08A)
      doc.setFillColor(254, 240, 138);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 6, 'F');

      // Title & Subtitle
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ESQUARE OTT — Transactions & Revenue Ledger', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const searchInfo = searchTerm ? ` | Search: "${searchTerm}"` : '';
      doc.text(
        `Generated: ${todayStr} | Status: ${statusFilter}${searchInfo} | Total Records: ${filteredTxns.length}`,
        40,
        52
      );

      const tableColumns = [
        { header: '#', dataKey: 'index' },
        { header: 'Payment ID', dataKey: 'id' },
        { header: 'Order ID', dataKey: 'orderId' },
        { header: 'Customer', dataKey: 'user' },
        { header: 'Phone', dataKey: 'phone' },
        { header: 'Plan', dataKey: 'plan' },
        { header: 'Gateway / Method', dataKey: 'method' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Date & Time', dataKey: 'date' },
      ];

      const tableRows = filteredTxns.map((t, idx) => ({
        index: idx + 1,
        id: t.id,
        orderId: t.orderId,
        user: t.user,
        phone: t.phone,
        plan: t.plan,
        method: t.method,
        amount: t.amount,
        status: t.status,
        date: t.date,
      }));

      autoTable(doc, {
        columns: tableColumns,
        body: tableRows,
        startY: 65,
        theme: 'striped',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 8.5,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 6,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          cellPadding: 5.5,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          index: { cellWidth: 25, halign: 'center' },
          id: { cellWidth: 75, fontStyle: 'bold' },
          orderId: { cellWidth: 75 },
          user: { cellWidth: 95, fontStyle: 'bold' },
          phone: { cellWidth: 85 },
          plan: { cellWidth: 95 },
          method: { cellWidth: 100 },
          amount: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
          status: { cellWidth: 65, halign: 'center' },
          date: { cellWidth: 95, halign: 'right' },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.dataKey === 'status') {
            if (data.cell.raw === 'SUCCESS') {
              data.cell.styles.textColor = [16, 185, 129];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'FAILED') {
              data.cell.styles.textColor = [239, 68, 68];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();
          const pageWidth = pageSize.width || pageSize.getWidth();

          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(
            'ESQUARE Admin Portal • Financial Transactions Confidential',
            40,
            pageHeight - 20
          );
          doc.text(
            `Page ${doc.internal.getNumberOfPages()}`,
            pageWidth - 65,
            pageHeight - 20
          );
        },
        margin: { left: 40, right: 40, top: 65, bottom: 35 },
      });

      doc.save(`esquare_transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Transactions PDF exported successfully.');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  const cleanPlanName = (raw) => {
    if (!raw) return 'Membership';
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



      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight">
              Transactions & Revenue Ledger
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/40 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-300/50">
              {filteredTxns.length} Records
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Audit gateway payment confirmations, customer receipts, and reconciliation statuses.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => loadTransactions(false)}
            disabled={isRefreshing}
            className="p-1.5 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/90 dark:border-white/10 rounded-xl transition-all cursor-pointer active:scale-95 shrink-0"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
            title="Download CSV ledger"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="py-1.5 px-3 bg-white dark:bg-[#121216] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-200/90 dark:border-white/10 shadow-2xs cursor-pointer active:scale-95"
            title="Download PDF report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Unified Single-Row Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:px-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-0.5 bg-slate-100 dark:bg-[#18181E] rounded-lg border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: `All (${transactions.length})` },
            { id: 'SUCCESS', label: `Success (${stats.successCount})` },
            { id: 'PENDING', label: `Pending (${stats.pendingCount})` },
            { id: 'FAILED', label: `Failed (${stats.failedCount})` }
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

        {/* Right: Search + Sort Dropdown */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Payment ID, order, phone..."
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
          <div className="flex items-center space-x-1.5 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-lg font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#FEF08A] cursor-pointer"
            >
              <option value="newest">Recent First</option>
              <option value="amount-high">Amount (High to Low)</option>
              <option value="amount-low">Amount (Low to High)</option>
              <option value="name">Customer (A - Z)</option>
            </select>
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden lg:inline">
            <strong className="text-slate-900 dark:text-white font-bold">{filteredTxns.length}</strong> items
          </span>
        </div>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#18181E] border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10.5px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Payment & Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Subscription Plan</th>
                <th className="py-2.5 px-3">Gateway / Method</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-900 dark:text-slate-100">
              {isLoading && transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10">
                    <PageLoader size="sm" text="Loading transaction ledger..." minHeight="min-h-[200px]" />
                  </td>
                </tr>
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No transactions found
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {searchTerm ? `No records found matching "${searchTerm}".` : 'No transactions recorded under this status filter.'}
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                        }}
                        className="mt-1 px-3 py-1 bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn) => {
                  const isSuccess = txn.status === 'SUCCESS';
                  const isPending = txn.status === 'PENDING';
                  const isFailed = txn.status === 'FAILED';

                  return (
                    <tr
                      key={txn.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      {/* Payment ID & Order ID */}
                      <td className="py-2 px-3 font-mono">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">
                          {txn.id}
                        </span>
                        {txn.orderId && txn.orderId !== 'N/A' && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate max-w-[140px]">
                            {txn.orderId}
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-2 px-3">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate max-w-[150px]">
                          {txn.user || 'Viewer'}
                        </span>
                        {txn.phone && txn.phone !== 'N/A' && (
                          <span className="text-[10.5px] font-mono text-slate-400 dark:text-slate-500 block">
                            {txn.phone}
                          </span>
                        )}
                      </td>

                      {/* Subscription Plan */}
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#FEF08A]/35 dark:bg-[#FEF08A]/15 text-slate-950 dark:text-[#FEF08A] border border-amber-300/40 dark:border-amber-400/25">
                          {cleanPlanName(txn.plan)}
                        </span>
                      </td>

                      {/* Gateway / Method */}
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40">
                          <CreditCard className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                          <span>{txn.method || 'Razorpay UPI'}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-2 px-3 font-black text-xs text-slate-950 dark:text-white">
                        {typeof txn.amount === 'number'
                          ? `₹${txn.amount}`
                          : txn.amount?.startsWith('₹')
                          ? txn.amount
                          : `₹${txn.amount || '0'}`}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                              : isPending
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess
                                ? 'bg-emerald-500 animate-pulse'
                                : isPending
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{txn.status || 'SUCCESS'}</span>
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-2 px-3 text-right text-slate-400 dark:text-slate-400 text-[10.5px] whitespace-nowrap">
                        {txn.date || '—'}
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
            Showing <strong className="text-slate-900 dark:text-white">{filteredTxns.length}</strong> of {transactions.length} transactions
          </span>
          <div className="flex flex-wrap items-center gap-3 text-[10.5px] font-medium">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Settled Volume: <strong className="text-slate-700 dark:text-slate-200">{stats.totalGross}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Success Count: <strong className="text-slate-700 dark:text-slate-200">{stats.successCount}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Conversion: <strong className="text-slate-700 dark:text-slate-200">{stats.successRate}</strong>
            </span>
            {stats.failedCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Failed: <strong className="text-slate-700 dark:text-slate-200">{stats.failedCount}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
