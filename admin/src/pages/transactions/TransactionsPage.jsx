import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mockTransactions } from '../../data/mockOttData';
import { Receipt, Search, X, Download, FileText, CheckCircle2, XCircle, ArrowUpRight, IndianRupee } from 'lucide-react';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [transactions, setTransactions] = useState(mockTransactions);

  const filteredTxns = transactions.filter(t => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
                          t.id.toLowerCase().includes(term) ||
                          t.user.toLowerCase().includes(term) ||
                          t.phone.includes(term) ||
                          t.orderId.toLowerCase().includes(term) ||
                          t.amount.toLowerCase().includes(term) ||
                          t.plan.toLowerCase().includes(term) ||
                          t.method.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Payment ID,Order ID,Customer Name,Phone,Plan,Gateway Method,Amount,Status,Timestamp'];
    const rows = filteredTxns.map((t) =>
      [
        `"${t.id}"`,
        `"${t.orderId}"`,
        `"${t.user}"`,
        `"${t.phone}"`,
        `"${t.plan}"`,
        `"${t.method}"`,
        `"${t.amount}"`,
        `"${t.status}"`,
        `"${t.date}"`,
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
  };

  const handleExportPDF = () => {
    try {
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
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Top Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Payment ID, phone, or name..."
            className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-slate-100/80 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-[#161616] text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-[#FEF08A] focus:outline-none transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters & Export Buttons */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {['ALL', 'SUCCESS', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-[#FEF08A] text-slate-950 font-extrabold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 active:scale-95 border border-slate-200/70 dark:border-slate-700 shadow-xs cursor-pointer"
            title="Download CSV ledger"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 active:scale-95 border border-slate-200/70 dark:border-slate-700 shadow-xs cursor-pointer"
            title="Download PDF ledger"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export PDF</span>
          </button>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161616] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Payment ID & Order</th>
                <th className="py-3.5 px-4">Customer Phone & Name</th>
                <th className="py-3.5 px-4">Plan Code</th>
                <th className="py-3.5 px-4">Payment Gateway</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Search className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No transactions match your query</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {searchTerm ? `No payments found matching "${searchTerm}".` : 'No transactions found with this status filter.'}
                      </p>
                      <button
                        onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                        className="mt-1 px-3 py-1 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-lg transition-colors"
                      >
                        Reset Transaction Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono">
                    <p className="font-bold text-slate-900 dark:text-white">{txn.id}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{txn.orderId}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900 dark:text-white">{txn.user}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{txn.phone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-extrabold text-[10px] border border-amber-200/50 dark:border-amber-800/50">
                      {txn.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">
                    {txn.method}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white">
                    {txn.amount}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      txn.status === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50' : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/60 dark:border-red-800/50'
                    }`}>
                      {txn.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                      <span>{txn.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 dark:text-slate-500 text-[11px]">
                    {txn.date}
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
