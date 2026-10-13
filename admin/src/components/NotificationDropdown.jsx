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
  const [isHovered, setIsHovered] = useState(false);
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

  // Listen for external updates (e.g. from Notifications page)
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

  // Fetch real system alerts that came to admin
  const fetchLiveAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await notificationService.getAllAdminAlerts({ limit: 25 });
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
    if (activeFilter === 'users') return n.category === 'USER';
    if (activeFilter === 'monetization') return n.category === 'BILLING' || n.category === 'monetization';
    if (activeFilter === 'system') return n.category === 'ANNOUNCEMENT' || n.category === 'CONTENT' || n.category === 'system';
    return true; // 'all'
  });

  const handleMarkAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    setTimeout(() => {
      window.dispatchEvent(new Event('admin_notifications_updated'));
    }, 50);
  };

  const handleMarkSingleRead = (id, e) => {
    e?.stopPropagation();
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      window.dispatchEvent(new Event('admin_notifications_updated'));
    }, 50);
  };

  const handleClearAll = () => {
    setClearedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    setTimeout(() => {
      window.dispatchEvent(new Event('admin_notifications_updated'));
    }, 50);
  };

  const handleItemClick = (n) => {
    handleMarkSingleRead(n.id);
    setIsOpen(false);
    if (n.targetTab && onNavigate) {
      onNavigate(n.targetTab);
    }
  };

  return (
    <div className="relative font-urbanist group" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchLiveAlerts();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Notifications"
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 border ${
          isOpen
            ? 'bg-slate-200/90 dark:bg-white/[0.14] text-slate-950 dark:text-white border-slate-300/80 dark:border-white/20 shadow-xs'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-200/80 dark:hover:border-white/10 hover:scale-105'
        }`}
      >
        <Bell className="w-[18px] h-[18px] stroke-[1.9] bell-hover-ring transition-all duration-200 group-hover:text-slate-950 dark:group-hover:text-white" />
        
        {/* Razor-Sharp High-Precision Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold font-sans leading-none flex items-center justify-center border-2 border-white dark:border-[#141419] shadow-xs tabular-nums select-none pointer-events-none antialiased transition-all duration-200 group-hover:scale-115 group-hover:-translate-y-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Clean Micro-Tooltip */}
      {!isOpen && (
        <div className={`absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap transition-all duration-200 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
        }`}>
          <div className="px-2.5 py-1 text-[11px] font-bold font-urbanist rounded-lg shadow-lg border backdrop-blur-md flex items-center gap-1.5 bg-slate-950 text-slate-100 border-slate-800">
            <span>Notifications</span>
            {unreadCount > 0 ? (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-600 text-white rounded-full">
                {unreadCount} new
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-normal">All caught up</span>
            )}
          </div>
        </div>
      )}

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
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold font-sans tabular-nums leading-none bg-[#FEF08A] text-slate-950 shadow-2xs">
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
              { id: 'users', label: 'Users', count: notifications.filter((n) => n.category === 'USER').length },
              { id: 'monetization', label: 'Billing', count: notifications.filter((n) => n.category === 'BILLING' || n.category === 'monetization').length },
              { id: 'system', label: 'Notices', count: notifications.filter((n) => n.category === 'ANNOUNCEMENT' || n.category === 'CONTENT').length },
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

          {/* Footer (Minimalist & Direct Navigation to Notifications Page) */}
          <div className="py-2.5 px-3 bg-slate-50/70 dark:bg-[#181820]/80 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigate) onNavigate('app_notifications');
              }}
              className="text-amber-600 hover:text-amber-700 dark:text-[#FEF08A] dark:hover:text-yellow-300 font-extrabold transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>View all notifications</span>
              <span>→</span>
            </button>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 font-semibold transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
