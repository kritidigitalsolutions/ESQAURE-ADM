import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mockUsers } from '../../data/mockOttData';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import {
  Users,
  Search,
  X,
  Flame,
  ShieldCheck,
  PlayCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Smartphone,
  Mail,
  Calendar,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Crown,
  Eye,
  Pencil,
  Trash2,
  Ban,
  Tag,
  UserCheck,
  Clock,
  Copy,
} from 'lucide-react';

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    name: 'VIP Monthly Pass',
    price: '₹199 / mo',
    days: 30,
    planTitle: 'Monthly Pass (₹199)',
    isVip: true,
  },
  {
    id: 'annual',
    name: 'VIP Annual Pass',
    price: '₹1,499 / yr',
    days: 365,
    planTitle: 'Yearly All-Access (₹1,499)',
    isVip: true,
  },
  {
    id: 'trial',
    name: '7-Day VIP Trial',
    price: 'Free (7 Days)',
    days: 7,
    planTitle: '7-Day VIP Trial',
    isVip: true,
  },
  {
    id: 'free',
    name: 'Free Tier',
    price: '₹0 (Cancel VIP)',
    days: 0,
    planTitle: 'Free Tier',
    isVip: false,
  },
];

export default function UsersPage({ onNavigate }) {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'VIP' | 'FREE' | 'SUSPENDED'
  const [overrideUser, setOverrideUser] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [toastMessage, setToastMessage] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const planDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (planDropdownRef.current && !planDropdownRef.current.contains(e.target)) {
        setIsPlanDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (overrideUser || viewUser) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewUser) setViewUser(null);
        if (overrideUser) setOverrideUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [overrideUser, viewUser]);

  const handleOpenEditUser = (user) => {
    setOverrideUser(user);
    const nameParts = (user.name || '').trim().split(' ');
    const firstName = user.firstName || nameParts[0] || '';
    const lastName = user.lastName || nameParts.slice(1).join(' ') || '';
    setEditForm({
      firstName,
      lastName,
      phone: user.phone || '',
      email: user.email || '',
    });
    setPromoCode('');
    setIsPlanDropdownOpen(false);
  };

  const handleSaveUser = (e) => {
    if (e) e.preventDefault();
    if (!overrideUser) return;
    const fullName = `${editForm.firstName.trim()} ${editForm.lastName.trim()}`.trim() || overrideUser.name;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === overrideUser.id) {
          return {
            ...u,
            name: fullName,
            firstName: editForm.firstName.trim(),
            lastName: editForm.lastName.trim(),
            phone: editForm.phone.trim() || u.phone,
            email: editForm.email.trim() || u.email,
          };
        }
        return u;
      })
    );
    showToast(`Updated details for ${fullName}`);
    setOverrideUser(null);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Helper for dynamic expiration date string
  const calculateExpiryDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filtered users matching search and active tab
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.phone.includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term) ||
        u.plan.toLowerCase().includes(term);

      const matchesFilter =
        filterType === 'ALL' ||
        (filterType === 'VIP' && u.isVip) ||
        (filterType === 'FREE' && !u.isVip && u.status === 'ACTIVE') ||
        (filterType === 'SUSPENDED' && u.status === 'SUSPENDED');

      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterType]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: users.length,
      vip: users.filter((u) => u.isVip).length,
      free: users.filter((u) => !u.isVip && u.status === 'ACTIVE').length,
      suspended: users.filter((u) => u.status === 'SUSPENDED').length,
    };
  }, [users]);

  // VIP Grant Action
  const handleGrantVip = (userId, days = 30, planTitle = 'Monthly Pass (₹199)') => {
    const expiresAt = calculateExpiryDate(days);
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isVip: true,
            plan: planTitle,
            vipExpiresAt: expiresAt,
          };
        }
        return u;
      })
    );
    if (overrideUser && overrideUser.id === userId) {
      setOverrideUser((prev) => ({
        ...prev,
        isVip: true,
        plan: planTitle,
        vipExpiresAt: expiresAt,
      }));
    }
    showToast(`Granted ${days} days VIP access to ${overrideUser?.name || 'user'}`);
  };

  const currentPlanItem = useMemo(() => {
    if (!overrideUser) return SUBSCRIPTION_PLANS[0];
    if (!overrideUser.isVip) {
      return SUBSCRIPTION_PLANS.find((p) => !p.isVip) || SUBSCRIPTION_PLANS[3];
    }
    const pStr = (overrideUser.plan || '').toLowerCase();
    if (pStr.includes('1,499') || pStr.includes('annual') || pStr.includes('year')) {
      return SUBSCRIPTION_PLANS.find((p) => p.id === 'annual');
    }
    if (pStr.includes('trial') || pStr.includes('7')) {
      return SUBSCRIPTION_PLANS.find((p) => p.id === 'trial');
    }
    return SUBSCRIPTION_PLANS.find((p) => p.id === 'monthly') || SUBSCRIPTION_PLANS[0];
  }, [overrideUser]);

  const handleSelectPlan = (plan) => {
    if (!overrideUser) return;
    if (plan.isVip) {
      handleGrantVip(overrideUser.id, plan.days, plan.planTitle);
    } else {
      handleRevokeVip(overrideUser.id);
    }
    setIsPlanDropdownOpen(false);
  };

  // VIP Revoke Action
  const handleRevokeVip = (userId) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isVip: false,
            plan: 'Free Tier',
            vipExpiresAt: '—',
          };
        }
        return u;
      })
    );
    if (overrideUser && overrideUser.id === userId) {
      setOverrideUser((prev) => ({
        ...prev,
        isVip: false,
        plan: 'Free Tier',
        vipExpiresAt: '—',
      }));
    }
    showToast(`Subscription revoked. Reverted to Free Tier.`);
  };

  // Toggle user active / suspended status
  const handleToggleUserStatus = (userId) => {
    let newStatus = 'ACTIVE';
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          newStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
          return {
            ...u,
            status: newStatus,
          };
        }
        return u;
      })
    );
    if (overrideUser && overrideUser.id === userId) {
      setOverrideUser((prev) => ({
        ...prev,
        status: prev.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
      }));
    }
    if (viewUser && viewUser.id === userId) {
      setViewUser((prev) => ({
        ...prev,
        status: prev.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
      }));
    }
    showToast(`Account status updated to ${newStatus}`);
  };

  // Switch from View modal to Edit modal
  const handleSwitchToEdit = (user) => {
    setViewUser(null);
    handleOpenEditUser(user);
  };

  // Clipboard copy helper
  const handleCopyText = (text, label) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    showToast(`Copied ${label} to clipboard`);
  };

  // Delete user confirmation
  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to remove user "${userName}" (${userId})?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`User ${userName} has been removed.`);
      if (viewUser && viewUser.id === userId) setViewUser(null);
      if (overrideUser && overrideUser.id === userId) setOverrideUser(null);
    }
  };

  // Export filtered users to CSV
  const handleExportCSV = () => {
    const headers = ['User ID,Name,Phone,Email,Plan,VIP Status,Expires At,Total Watch Time,Last Active,Status'];
    const rows = filteredUsers.map((u) =>
      [
        `"${u.id}"`,
        `"${u.name}"`,
        `"${u.phone}"`,
        `"${u.email}"`,
        `"${u.plan}"`,
        `"${u.isVip ? 'VIP' : 'FREE'}"`,
        `"${u.vipExpiresAt}"`,
        `"${u.totalWatchTime}"`,
        `"${u.lastActive}"`,
        `"${u.status}"`,
      ].join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `esquare_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported filtered user registry to CSV');
  };

  // Export filtered users to PDF
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

      // Top brand accent stripe (#FEF08A)
      doc.setFillColor(254, 240, 138);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 6, 'F');

      // Title & Header info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      doc.text('ESQUARE OTT — User Directory Report', 40, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const activeFilterLabel =
        filterType === 'VIP'
          ? 'Subscribed (VIP)'
          : filterType === 'FREE'
          ? 'Free Tier'
          : filterType === 'SUSPENDED'
          ? 'Suspended'
          : 'All Users';
      const searchInfo = searchTerm ? ` | Search: "${searchTerm}"` : '';
      doc.text(
        `Generated: ${todayStr} | Filter: ${activeFilterLabel}${searchInfo} | Total Records: ${filteredUsers.length}`,
        40,
        52
      );

      // Table columns & rows
      const tableColumns = [
        { header: '#', dataKey: 'index' },
        { header: 'User ID', dataKey: 'id' },
        { header: 'Name', dataKey: 'name' },
        { header: 'Phone', dataKey: 'phone' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Plan', dataKey: 'plan' },
        { header: 'VIP Status', dataKey: 'isVip' },
        { header: 'Expires At', dataKey: 'vipExpiresAt' },
        { header: 'Watch Time', dataKey: 'totalWatchTime' },
        { header: 'Status', dataKey: 'status' },
      ];

      const tableRows = filteredUsers.map((u, idx) => ({
        index: idx + 1,
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        plan: u.plan,
        isVip: u.isVip ? 'VIP' : 'FREE',
        vipExpiresAt: u.vipExpiresAt || '—',
        totalWatchTime: u.totalWatchTime || '0h',
        status: u.status,
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
          id: { cellWidth: 55, fontStyle: 'bold' },
          name: { cellWidth: 105, fontStyle: 'bold' },
          phone: { cellWidth: 80 },
          email: { cellWidth: 130 },
          plan: { cellWidth: 90 },
          isVip: { cellWidth: 55, halign: 'center' },
          vipExpiresAt: { cellWidth: 70 },
          totalWatchTime: { cellWidth: 65 },
          status: { cellWidth: 65, halign: 'center' },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            if (data.column.dataKey === 'isVip') {
              if (data.cell.raw === 'VIP') {
                data.cell.styles.textColor = [180, 83, 9];
                data.cell.styles.fontStyle = 'bold';
              } else {
                data.cell.styles.textColor = [100, 116, 139];
              }
            }
            if (data.column.dataKey === 'status') {
              if (data.cell.raw === 'ACTIVE') {
                data.cell.styles.textColor = [16, 185, 129];
                data.cell.styles.fontStyle = 'bold';
              } else if (data.cell.raw === 'SUSPENDED') {
                data.cell.styles.textColor = [239, 68, 68];
                data.cell.styles.fontStyle = 'bold';
              }
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
            'ESQUARE Admin Portal • Confidential Internal Document',
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

      doc.save(`esquare_users_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('Exported filtered user registry to PDF');
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      showToast('Error generating PDF report. Please try again.');
    }
  };

  return (
    <div className="space-y-6 font-urbanist">

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold border border-slate-800 dark:border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 Core OTT User KPI Metric Cards (Dashboard Aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Metric 1: Total Registered Base */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                  <Users className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block">
                    Total Users
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    Registered Base
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3 h-3" /> +18.2%
              </span>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                <AnimatedNumber value="148,920" />
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>12,450 paid subscribers</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">8.4% conversion</span>
          </div>
        </div>

        {/* Metric 2: Paid VIP Subscribers */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block">
                    Subscribers
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    Active Subscriptions
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3 h-3" /> +24.1%
              </span>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                <AnimatedNumber value="12,450" />
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>₹199 avg monthly plan</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">94.6% retention</span>
          </div>
        </div>

        {/* Metric 3: Daily Active Users (DAU) */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                  <Flame className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block">
                    Active Today
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    Daily Sessions (DAU)
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3 h-3" /> +12.4%
              </span>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                <AnimatedNumber value="64,800" />
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>72% active stream viewers</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">4.2 sessions/u</span>
          </div>
        </div>

        {/* Metric 4: Average Watch Time */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus relative overflow-hidden group transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs">
                  <PlayCircle className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider block">
                    Avg Watch Time
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                    Monthly Engagement
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-xs">
                <ArrowUpRight className="w-3 h-3" /> +9.6%
              </span>
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                <AnimatedNumber value="78.4" />
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                hrs / user
              </span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>Peak: 140.8 hrs (Subscribers)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+4.1 hrs vs mo</span>
          </div>
        </div>

      </div>

      {/* Unified User Directory Control Panel */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-nodus space-y-5">
        
        {/* Top Header Row: Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <Users className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
            User Directory & Access Control
          </h2>
        </div>

        {/* Unified Controls Toolbar: Filter Pills (Left) & Search + Export (Right) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Segmented Sliding Toggle Track (Compact & Sleek) */}
          <div className="relative bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 shadow-2xs w-full sm:w-[420px]">
            {/* Smooth Sliding Active Indicator Pill */}
            <span
              className="absolute top-1 bottom-1 left-1 rounded-lg bg-[#FEF08A] shadow-xs transition-transform duration-300 ease-out pointer-events-none border border-amber-300/70"
              style={{
                width: 'calc((100% - 8px) / 4)',
                transform: `translateX(${
                  filterType === 'ALL'
                    ? '0%'
                    : filterType === 'VIP'
                    ? '100%'
                    : filterType === 'FREE'
                    ? '200%'
                    : '300%'
                })`,
              }}
            />

            {/* 4 Equal Column Buttons */}
            <div className="grid grid-cols-4 relative z-10 w-full items-center">
              {[
                { id: 'ALL', label: 'All Users' },
                { id: 'VIP', label: 'Subscribed' },
                { id: 'FREE', label: 'Free Tier' },
                { id: 'SUSPENDED', label: 'Suspended' },
              ].map((tab) => {
                const isSelected = filterType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterType(tab.id)}
                    className={`py-1.5 text-xs font-bold text-center flex items-center justify-center transition-colors duration-200 select-none cursor-pointer ${
                      isSelected
                        ? 'text-slate-950 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Export Actions */}
          <div className="flex items-center space-x-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by phone, name, email..."
                className="w-full pl-8 pr-7 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 active:scale-95 border border-slate-200/70 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Download CSV report"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export CSV</span>
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="py-2 px-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shrink-0 active:scale-95 border border-slate-200/70 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Download PDF report"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export PDF</span>
            </button>
          </div>

        </div>

      </div>

      {/* Users Registry Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-nodus overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User Account</th>
                <th className="py-3.5 px-4">Phone & Email</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Joined</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        No users match your filter criteria
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
                        {searchTerm
                          ? `No user accounts found matching "${searchTerm}". Try a different phone or name.`
                          : 'No user accounts found in this category.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('ALL');
                        }}
                        className="mt-2 px-3.5 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isVip = user.isVip;
                  const isActive = user.status === 'ACTIVE';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* User Account */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <button
                          type="button"
                          onClick={() => setViewUser(user)}
                          className="flex items-center space-x-3 text-left group/user cursor-pointer"
                        >
                          {/* Monogram Avatar */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs border bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover/user:border-amber-300 transition-colors"
                          >
                            {user.name.charAt(0)}
                          </div>

                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate group-hover/user:text-amber-500 transition-colors">
                            {user.name}
                          </span>
                        </button>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{user.phone}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">{user.email}</span>
                        </div>
                      </td>

                      {/* Subscription Plan */}
                      <td className="py-3.5 px-4">
                        {isVip ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                              <span>{user.plan}</span>
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>Expires: {user.vipExpiresAt}</span>
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                            {user.plan}
                          </span>
                        )}
                      </td>



                      {/* Joined Date */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0" />
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{user.joinedAt || '—'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors shrink-0 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center justify-end gap-1">

                          {/* View Profile */}
                          <button
                            type="button"
                            title="View Profile"
                            onClick={() => setViewUser(user)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-400 dark:text-slate-400 transition-all active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User & Grant Access */}
                          <button
                            type="button"
                            title="Edit User & Access"
                            onClick={() => handleOpenEditUser(user)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#FEF08A] hover:text-slate-950 text-slate-400 dark:text-slate-400 transition-all active:scale-95 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Block */}
                          <button
                            type="button"
                            title={isActive ? 'Suspend User' : 'Unblock User'}
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95 cursor-pointer ${
                              isActive
                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-slate-400 hover:text-orange-500'
                                : 'bg-orange-100 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-200'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete User"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Edit User & Access Control Modal */}
      {overrideUser && createPortal(
        <div className="fixed inset-0 z-[1000] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Pencil className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white leading-tight">
                    Edit User & Access Control
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Modify profile details, grant subscriptions, or adjust account status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverrideUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Edit User Form */}
            <form onSubmit={handleSaveUser} className="space-y-3 mt-3.5">

              {/* First Name & Last Name (as per mobile app registration) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter First name"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter Last name"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number & Email Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91..."
                    className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              {/* Current Plan & Subscription Badge */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Current Plan
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {overrideUser.plan}
                  </span>
                  {overrideUser.vipExpiresAt && overrideUser.vipExpiresAt !== '—' && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Expires: {overrideUser.vipExpiresAt}
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                    overrideUser.isVip
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {overrideUser.isVip ? 'SUBSCRIBED' : 'FREE TIER'}
                </span>
              </div>

              {/* Promo / Voucher Code */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher / Promo Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ESQVIP30, WELCOME99"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-[#FEF08A] focus:outline-none text-slate-900 dark:text-slate-100 transition-colors placeholder:font-normal placeholder:text-slate-400 uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (promoCode.trim()) {
                        showToast(`Promo code "${promoCode}" applied for ${editForm.name || overrideUser.name}`);
                        setPromoCode('');
                      }
                    }}
                    className="px-3.5 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Membership Plan Selection (In-flow, simple, stays inside card) */}
              <div className="space-y-1.5" ref={planDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Change Subscription Plan
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Click to switch or revoke
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs transition-all">
                  {/* Selected Plan Header (Click to toggle) */}
                  <button
                    type="button"
                    onClick={() => setIsPlanDropdownOpen((prev) => !prev)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentPlanItem.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white font-urbanist">
                        {currentPlanItem.price}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          isPlanDropdownOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Options (In-flow inside card, never overflows!) */}
                  {isPlanDropdownOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/60 dark:bg-slate-950/40">
                      {SUBSCRIPTION_PLANS.map((plan) => {
                        const isSelected = currentPlanItem.id === plan.id;
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => handleSelectPlan(plan)}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between cursor-pointer text-left transition-colors ${
                              isSelected
                                ? 'bg-[#FEF08A]/35 dark:bg-[#FEF08A]/10 text-slate-950 dark:text-amber-300 font-bold'
                                : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className={`text-xs ${isSelected ? 'font-black text-slate-950 dark:text-white' : 'font-medium'}`}>
                              {plan.name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-urbanist ${isSelected ? 'font-black text-slate-950 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-400'}`}>
                                {plan.price}
                              </span>
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 dark:bg-amber-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status Switch */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Account Status
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {overrideUser.status === 'ACTIVE'
                      ? 'User can stream episodes & login normally'
                      : 'Account is suspended from streaming'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(overrideUser.id)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    overrideUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      overrideUser.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOverrideUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* Sleek Minimal User Profile Right Slide-Over Drawer */}
      {viewUser && createPortal(
        <div className="fixed inset-0 z-[1000] flex justify-end">
          {/* Subtle Dark Backdrop with smooth blur */}
          <div
            onClick={() => setViewUser(null)}
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300 cursor-pointer"
          />

          {/* Right-Side Slide-Over Panel */}
          <div className="relative w-full max-w-md h-full bg-white dark:bg-[#111111] shadow-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out font-urbanist">
            
            {/* Top Bar Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Eye className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white tracking-tight">
                    User Profile
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Account identity & activity overview
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewUser(null)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Minimal Hero User Identity */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#FEF08A] text-slate-950 font-black text-2xl flex items-center justify-center shadow-xs border border-amber-300/80">
                      {viewUser.name.charAt(0)}
                    </div>
                    {viewUser.isVip && (
                      <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border-2 border-white dark:border-[#111111]" title="VIP Subscriber">
                        <Crown className="w-3 h-3 fill-slate-950 stroke-none" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-950 dark:text-white tracking-tight leading-tight">
                      {viewUser.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {viewUser.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          viewUser.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            viewUser.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        {viewUser.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                      Joined {viewUser.joinedAt || '2025'}
                    </p>
                  </div>
                </div>
              </div>

              {/* KPI Metric Cards (Uniform #FEF08A styling) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 group">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs mb-2">
                    <PlayCircle className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Watch Time</span>
                  <span className="text-sm font-black text-slate-950 dark:text-white mt-0.5 block">
                    {viewUser.totalWatchTime || '0.0 hrs'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 group">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs mb-2">
                    <Clock className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Active</span>
                  <span className="text-sm font-black text-slate-950 dark:text-white mt-0.5 block truncate">
                    {viewUser.lastActive || 'Today'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 group">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 group-hover:scale-105 transition-transform shadow-xs mb-2">
                    <ShieldCheck className="w-5 h-5 text-slate-950 dark:text-amber-400 stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security</span>
                  <span className="text-sm font-black text-slate-950 dark:text-white mt-0.5 block">
                    Verified
                  </span>
                </div>
              </div>

              {/* Contact Information Cards (Clean, Full-width, Minimal) */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Contact Information
                </span>

                {/* Phone */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Phone Number
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 block">
                        {viewUser.phone}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(viewUser.phone, 'Phone number')}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Copy Phone"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Email */}
                <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Mail className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Email Address
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block break-all">
                        {viewUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(viewUser.email, 'Email address')}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="Copy Email"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subscription & Entitlement Overview */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Membership & Entitlement
                </span>

                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Access Level
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        viewUser.isVip
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/50'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {viewUser.isVip ? 'VIP PASS' : 'FREE TIER'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Plan Name</span>
                      <span className="text-sm font-extrabold text-slate-950 dark:text-white block mt-0.5">
                        {viewUser.plan}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Valid Until</span>
                      <span className="text-sm font-extrabold text-slate-950 dark:text-white block mt-0.5">
                        {viewUser.vipExpiresAt || '—'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Quality Ladder</span>
                    <span className="font-bold text-slate-900 dark:text-white">1080p Full HD</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Sticky Bottom Action Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-sm sticky bottom-0 z-20 flex items-center justify-between gap-3">
              {/* Suspend / Unblock Button */}
              <button
                type="button"
                onClick={() => handleToggleUserStatus(viewUser.id)}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5 ${
                  viewUser.status === 'ACTIVE'
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{viewUser.status === 'ACTIVE' ? 'Suspend User' : 'Unblock User'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchToEdit(viewUser)}
                  className="px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit User</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
