import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Bell,
  RefreshCw,
  Loader2,
  BellOff
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { subscriptionService } from '../services/subscriptionService';
import { dramaService } from '../services/dramaService';

const READ_STORAGE_KEY = 'e2_admin_read_notif_ids_v1';
const CLEARED_STORAGE_KEY = 'e2_admin_cleared_notif_ids_v1';

function formatTimeAgo(dateStr) {
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
}

export default function NotificationDropdown({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [rawItems, setRawItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const dropdownRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);

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

  // Fetch real system alerts from backend (excluding push notifications)
  const fetchLiveAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [announcementsRes, txRes, dramasRes] = await Promise.allSettled([
        notificationService.getAnnouncements(),
        subscriptionService.getTransactions({ limit: 6 }),
        dramaService.getAdminDramas()
      ]);

      const items = [];

      // 1. Live In-App Notices
      if (announcementsRes.status === 'fulfilled' && announcementsRes.value?.announcements) {
        announcementsRes.value.announcements.slice(0, 4).forEach((a) => {
          const id = `ann-${a._id || a.id}`;
          items.push({
            id,
            category: 'system',
            title: a.title || 'System Announcement',
            message: a.body || 'In-app notification sent to viewer inboxes.',
            createdAt: a.createdAt,
            targetTab: 'app_notifications',
            actionLabel: 'View Notices'
          });
        });
      }

      // 3. Live Transactions
      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        txRes.value.transactions.slice(0, 6).forEach((t) => {
          const id = `tx-${t.id || t._id}`;
          items.push({
            id,
            category: 'monetization',
            title: t.status === 'SUCCESS' ? 'Subscription Payment Success' : `Payment Status: ${t.status || 'Pending'}`,
            message: `${t.user || 'Viewer'} purchased ${t.plan || 'Plan'} (${t.amount}) via ${t.method || 'UPI'}.`,
            createdAt: t.createdAt,
            targetTab: 'transactions',
            actionLabel: 'View Transaction'
          });
        });
      }

      // 4. Live Dramas Updated
      if (dramasRes.status === 'fulfilled' && dramasRes.value?.dramas) {
        dramasRes.value.dramas.slice(0, 3).forEach((d) => {
          const id = `drm-${d._id || d.id}`;
          items.push({
            id,
            category: 'content',
            title: `Series: ${d.title}`,
            message: `Catalog status: ${d.status || 'PUBLISHED'} with ${d.totalEpisodes || (d.episodes ? d.episodes.length : 0)} episodes.`,
            createdAt: d.updatedAt || d.createdAt,
            targetTab: 'dramas',
            actionLabel: 'Open Library'
          });
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setRawItems(items);
    } catch (err) {
      console.warn('Failed to fetch live notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveAlerts();
  }, [fetchLiveAlerts]);

  // Filter out cleared items and compute dynamic properties
  const notifications = useMemo(() => {
    return rawItems
      .filter((item) => !clearedIds.has(item.id))
      .map((item) => ({
        ...item,
        time: formatTimeAgo(item.createdAt),
        unread: !readIds.has(item.id)
      }));
  }, [rawItems, clearedIds, readIds]);

  // Handle click outside and Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Prevent background page from scrolling when inside notification dropdown
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const handleWheel = (e) => {
      const list = listRef.current;
      if (!list) {
        e.preventDefault();
        return;
      }

      if (!list.contains(e.target)) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = list;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        e.preventDefault();
        return;
      }

      const deltaY = e.deltaY;
      const isAtTop = scrollTop <= 0 && deltaY < 0;
      const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight && deltaY > 0;

      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      panel.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return n.unread;
    if (activeFilter === 'content') return n.category === 'content';
    if (activeFilter === 'monetization') return n.category === 'monetization';
    if (activeFilter === 'system') return n.category === 'system';
    return true; // 'all'
  });

  const handleMarkAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  const handleMarkSingleRead = (id, e) => {
    e?.stopPropagation();
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };


  const handleClearAll = () => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  const handleItemClick = (n) => {
    handleMarkSingleRead(n.id);
    setIsOpen(false);
    if (n.targetTab && onNavigate) {
      onNavigate(n.targetTab);
    }
  };

  return (
    <div className="relative font-urbanist" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveAlerts();
        }}
        title="Notifications"
        aria-label="Notifications"
        className={`relative p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-slate-200/80 dark:bg-white/[0.12] text-slate-950 dark:text-white'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
        }`}
      >
        <Bell className="w-4 h-4 stroke-[2]" />
        
        {/* Sleek Minimalist Unread Dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1E1E26] shadow-xs" />
        )}
      </button>

      {/* Floating Dropdown Panel (Compact 330px, Minimalist, Smooth Entrance) */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-[320px] sm:w-[340px] bg-white/95 dark:bg-[#1E1E26]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.85)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-[#181820]/60">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs text-slate-950 dark:text-white tracking-tight">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#FEF08A]/60 dark:bg-amber-400/15 text-slate-950 border border-amber-300/40 dark:border-amber-400/25">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={fetchLiveAlerts}
                disabled={isLoading}
                title="Refresh"
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.08] rounded-md transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Minimalist Filter Tabs (No bulky buttons) */}
          <div className="px-2.5 py-1.5 bg-slate-50/30 dark:bg-[#1A1A22]/40 border-b border-slate-100 dark:border-white/5 flex items-center space-x-1 text-[10px]">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'monetization', label: 'Billing', count: notifications.filter((n) => n.category === 'monetization').length },
              { id: 'system', label: 'Notices', count: notifications.filter((n) => n.category === 'system').length },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-[#FEF08A] dark:text-slate-950 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05]'
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[9px] opacity-70">({f.count})</span>
              </button>
            ))}
          </div>

          {/* List Area */}
          <div ref={listRef} className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
            {isLoading && notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-amber-500" />
                <p className="text-[11px] font-semibold text-slate-400">Loading live alerts...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-400 flex items-center justify-center mx-auto">
                  <BellOff className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No notifications</p>
                <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto">
                  Live payment transactions and system updates will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`px-3.5 py-2.5 transition-all duration-150 cursor-pointer group flex items-start justify-between gap-2.5 ${
                    n.unread
                      ? 'bg-amber-500/[0.04] dark:bg-amber-400/[0.05] hover:bg-amber-500/[0.08] dark:hover:bg-amber-400/[0.09]'
                      : 'hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Clean Text Content */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate transition-colors ${
                          n.unread
                            ? 'font-extrabold text-slate-950 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-950 dark:group-hover:text-white'
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                      {n.message}
                    </p>
                  </div>

                  {/* Minimalist Unread Dot */}
                  {n.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-2xs" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer (Minimalist) */}
          {notifications.length > 0 && (
            <div className="py-2 px-3 bg-slate-50/60 dark:bg-[#181820]/70 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 font-medium">
                {notifications.length} notification{notifications.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-bold transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
