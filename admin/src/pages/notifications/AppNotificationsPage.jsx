import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { notificationService } from '../../services/notificationService';
import PageLoader from '../../components/common/PageLoader';
import ModalPortal from '../../components/common/ModalPortal';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import { confirmModal } from '../../context/DialogContext';
import {
  Plus,
  Sparkles,
  CheckCircle2,
  Info,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Megaphone,
  Search,
  Bell,
  CreditCard,
  Clapperboard,
  Users,
  ArrowUpRight,
  CheckCheck,
  Eye,
  SlidersHorizontal,
  Inbox
} from 'lucide-react';

const READ_STORAGE_KEY = 'e2_admin_read_notif_ids_v1';
const CLEARED_STORAGE_KEY = 'e2_admin_cleared_notif_ids_v1';

export default function AppNotificationsPage({ onNavigate }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read IDs set from localStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Cleared IDs set from localStorage
  const [clearedIds, setClearedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(CLEARED_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'READ'

  // Modal & Form state for creating in-app announcements
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [target, setTarget] = useState('All Active Users');
  const [priority, setPriority] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Save readIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readIds]));
    } catch (e) {
      console.warn('Could not save readIds to localStorage', e);
    }
  }, [readIds]);

  // Save clearedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CLEARED_STORAGE_KEY, JSON.stringify([...clearedIds]));
    } catch (e) {
      console.warn('Could not save clearedIds to localStorage', e);
    }
  }, [clearedIds]);

  // Synchronize with external updates (e.g. from topbar notification dropdown)
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const savedRead = localStorage.getItem(READ_STORAGE_KEY);
        if (savedRead) setReadIds(new Set(JSON.parse(savedRead)));
        const savedCleared = localStorage.getItem(CLEARED_STORAGE_KEY);
        if (savedCleared) setClearedIds(new Set(JSON.parse(savedCleared)));
      } catch {}
    };

    window.addEventListener('admin_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('admin_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Fetch unified real-time notifications that came to the admin
  const fetchAllNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await notificationService.getAllAdminAlerts({ limit: 50 });
      setAlerts(items);
    } catch (err) {
      setError(err.message || 'Failed to load notifications from server');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNotifications();
  }, [fetchAllNotifications]);

  const notifyChange = () => {
    setTimeout(() => {
      window.dispatchEvent(new Event('admin_notifications_updated'));
    }, 50);
  };

  const handleMarkAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      alerts.forEach((a) => next.add(a.id));
      return next;
    });
    notifyChange();
  };

  const handleToggleRead = (id) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    notifyChange();
  };

  const handleMarkSingleRead = (id) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    notifyChange();
  };

  const handleDismissAlert = (id) => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    notifyChange();
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await notificationService.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        category,
        target,
        priority
      });

      setFeedback({
        type: 'success',
        message: `Notice published successfully! Broadcasted to ${result.recipientsCount || 'all'} active user inbox(es).`
      });

      setIsModalOpen(false);
      setTitle('');
      setBody('');
      setCategory('SYSTEM');
      setTarget('All Active Users');
      setPriority('Normal');
      
      fetchAllNotifications();
      notifyChange();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to publish in-app notice'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id, rawId, title) => {
    const confirmed = await confirmModal({
      title: 'Delete Announcement',
      message: 'Are you sure you want to delete this in-app announcement? It will be removed from viewer inboxes.',
      itemName: title || 'In-App Announcement',
      confirmText: 'Delete Notice',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await notificationService.deleteAnnouncement(rawId || id.replace('ann-', ''));
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      setFeedback({
        type: 'success',
        message: 'Announcement removed successfully.'
      });
      notifyChange();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete notice'
      });
    }
  };

  const handleToggleAnnouncementActive = async (id, rawId) => {
    try {
      const result = await notificationService.toggleAnnouncement(rawId || id.replace('ann-', ''));
      if (result.announcement) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, isActive: result.announcement.isActive } : a))
        );
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to toggle notice status'
      });
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  // Process visible notifications with read/cleared state
  const activeAlerts = useMemo(() => {
    return alerts
      .filter((a) => !clearedIds.has(a.id))
      .map((a) => ({
        ...a,
        isUnread: !readIds.has(a.id),
        timeAgo: formatTimeAgo(a.createdAt)
      }));
  }, [alerts, clearedIds, readIds]);

  // Filtered notifications
  const filteredAlerts = useMemo(() => {
    return activeAlerts.filter((a) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.message && a.message.toLowerCase().includes(q)) ||
        (a.user && a.user.toLowerCase().includes(q)) ||
        (a.target && a.target.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'ALL' ||
        a.category === selectedCategory ||
        (selectedCategory === 'SYSTEM' && (a.category === 'ANNOUNCEMENT' || a.category === 'SYSTEM'));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNREAD' && a.isUnread) ||
        (statusFilter === 'READ' && !a.isUnread);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [activeAlerts, searchTerm, selectedCategory, statusFilter]);

  // Statistics for KPI Cards
  const totalCount = activeAlerts.length;
  const unreadCount = activeAlerts.filter((a) => a.isUnread).length;
  const usersCount = activeAlerts.filter((a) => a.category === 'USER').length;
  const billingCount = activeAlerts.filter((a) => a.category === 'BILLING').length;

  return (
    <div className="space-y-4 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
                System & Admin Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white shadow-xs">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Live incoming user signups, subscription payments, catalog releases, and admin notices.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchAllNotifications}
            disabled={isLoading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all border border-slate-200/80 dark:border-white/10 cursor-pointer hover:scale-105 active:scale-90 shadow-sm shrink-0"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white text-xs font-bold transition-all border border-slate-200 dark:border-white/10 cursor-pointer active:scale-98"
            >
              <CheckCheck className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New In-App Notice</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Overview (Standard Uniform #FEF08A Icon Badges per Project Rules) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/45 uppercase tracking-wider">Total Alerts</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mt-1">{totalCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Inbox className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-2">
            Incoming platform & viewer events
          </p>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/45 uppercase tracking-wider">Unread Alerts</p>
              <h3 className="text-xl font-extrabold text-amber-500 dark:text-amber-400 mt-1">{unreadCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-2">
            Pending administrator review
          </p>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/45 uppercase tracking-wider">New Users</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mt-1">{usersCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-2">
            Recent viewer registrations
          </p>
        </div>

        <div className="bg-white dark:bg-[#121216] p-4 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-white/45 uppercase tracking-wider">Billing Alerts</p>
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white mt-1">{billingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
              <CreditCard className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>
          <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400 mt-2">
            Subscription purchases & UPI payments
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-bold shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Notifications', count: activeAlerts.length },
            { id: 'USER', label: 'New Users', count: activeAlerts.filter((a) => a.category === 'USER').length },
            { id: 'BILLING', label: 'Billing & Payments', count: activeAlerts.filter((a) => a.category === 'BILLING').length },
            { id: 'CONTENT', label: 'Content & Series', count: activeAlerts.filter((a) => a.category === 'CONTENT').length },
            { id: 'ANNOUNCEMENT', label: 'Announcements', count: activeAlerts.filter((a) => a.category === 'ANNOUNCEMENT').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedCategory === tab.id
                  ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75 font-black">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#18181E] focus:outline-hidden"
          >
            <option value="ALL">All Status</option>
            <option value="UNREAD">Unread Only</option>
            <option value="READ">Read Only</option>
          </select>
        </div>
      </div>

      {/* 4. Compact & Minimalist Notifications List */}
      <div className="space-y-1.5">
        {isLoading ? (
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden">
            <PageLoader size="sm" text="Loading real-time notifications..." minHeight="min-h-[180px]" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-[#121216] rounded-xl p-8 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400 space-y-1.5">
            <Megaphone className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">No notifications found.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Real-time payment transactions, catalog updates, and in-app notices will automatically appear in this inbox.
            </p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isUnread = item.isUnread;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isUnread) {
                    handleMarkSingleRead(item.id);
                  }
                }}
                className={`group rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all duration-150 flex items-center justify-between gap-3 sm:gap-4 ${
                  isUnread
                    ? 'bg-slate-50/80 dark:bg-[#16161E] border-slate-200/90 dark:border-white/12 hover:border-slate-300 dark:hover:border-white/25 shadow-2xs'
                    : 'bg-white dark:bg-[#111116] border-slate-200/60 dark:border-white/[0.06] opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-white/15'
                }`}
              >
                {/* Left: Icon Badge + Content */}
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                  {/* Compact #FEF08A Icon Badge */}
                  <div className="w-8 h-8 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    {item.category === 'USER' ? (
                      <Users className="w-4 h-4 stroke-[2.2]" />
                    ) : item.category === 'BILLING' ? (
                      <CreditCard className="w-4 h-4 stroke-[2.2]" />
                    ) : item.category === 'CONTENT' ? (
                      <Clapperboard className="w-4 h-4 stroke-[2.2]" />
                    ) : (
                      <Megaphone className="w-4 h-4 stroke-[2.2]" />
                    )}
                  </div>

                  {/* Main Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Row 1: Title, Unread Dot, Badges */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                      <span className={`text-xs sm:text-[13px] truncate ${
                        isUnread ? 'font-black text-slate-950 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-300'
                      }`}>
                        {item.title}
                      </span>

                      {/* Subtle unread dot */}
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-2xs" title="Unread" />
                      )}

                      {/* Universal Admin Panel Pill Badges */}
                      {item.category === 'USER' ? (
                        <Badge variant="active" size="xs">New User</Badge>
                      ) : item.category === 'BILLING' ? (
                        <Badge variant="razorpay" size="xs">Billing</Badge>
                      ) : item.category === 'CONTENT' ? (
                        <Badge variant="content-manager" size="xs">Catalog</Badge>
                      ) : (
                        <Badge variant="content-partner" size="xs">Notice</Badge>
                      )}

                      {item.priority === 'High' && (
                        <Badge variant="offline" size="xs">High</Badge>
                      )}
                    </div>

                    {/* Row 2: Message preview snippet without target clutter */}
                    <p className="truncate font-medium text-slate-600 dark:text-slate-400 text-[11px]">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right: Aligned Columns (Time, Action, Dismiss) */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
                  {/* 1. Timestamp Column (Fixed width: w-16 sm:w-20, right-aligned) */}
                  <div className="w-16 sm:w-20 shrink-0 text-right">
                    <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {item.timeAgo}
                    </span>
                  </div>

                  {/* 2. Action Link Column (Fixed width: w-28 sm:w-32, justify-end) */}
                  <div className="w-28 sm:w-32 shrink-0 flex items-center justify-end">
                    {item.type === 'ANNOUNCEMENT' ? (
                      <div className="inline-flex items-center gap-1.5" title={item.isActive ? 'Active Notice' : 'Inactive Notice'}>
                        <span className="text-[10px] font-bold text-slate-400 hidden xl:inline">
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <ToggleSwitch
                          checked={Boolean(item.isActive)}
                          onChange={() => handleToggleAnnouncementActive(item.id, item.rawId)}
                          size="sm"
                        />
                      </div>
                    ) : item.targetTab && onNavigate ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkSingleRead(item.id);
                          onNavigate(item.targetTab);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 hover:text-amber-700 dark:text-[#FEF08A] dark:hover:text-yellow-300 transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-amber-400/10 active:scale-95 whitespace-nowrap"
                      >
                        <span>{item.actionLabel || 'View'}</span>
                        <ArrowUpRight className="w-3 h-3 stroke-[2.4]" />
                      </button>
                    ) : null}
                  </div>

                  {/* 4. Dismiss / Trash Button */}
                  <div className="w-7 shrink-0 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.type === 'ANNOUNCEMENT') {
                          handleDeleteAnnouncement(item.id, item.rawId, item.title);
                        } else {
                          handleDismissAlert(item.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center justify-center cursor-pointer active:scale-90"
                      title="Dismiss notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      {/* 5. Modal - Level 24dp Elevated Dialog for Publishing In-App Notice */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-urbanist">
            <div className="bg-white dark:bg-[#30303D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/15 transition-all">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                    Publish In-App Notice
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled Maintenance Notice"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                    >
                      <option value="SYSTEM">SYSTEM</option>
                      <option value="OFFER">OFFER</option>
                      <option value="BILLING">BILLING</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                  >
                    <option value="All Active Users">All Active Users</option>
                    <option value="Subscribers Only">Subscribers Only</option>
                    <option value="New Users (Last 7 Days)">New Users (Last 7 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Notification Body Copy *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Type the message description that will appear in user mobile inboxes..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-medium bg-slate-50 dark:bg-[#18181E] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all leading-relaxed"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !body.trim()}
                    className="px-5 py-2 bg-[#FACC15] hover:bg-[#EAB308] disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Notification'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
}
