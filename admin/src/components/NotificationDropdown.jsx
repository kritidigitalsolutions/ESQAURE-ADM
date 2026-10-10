import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clapperboard,
  Sparkles,
  Server,
  Send,
  CreditCard,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  Volume2,
  BellOff
} from 'lucide-react';

const STORAGE_KEY = 'e2_admin_notifications_v2';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    category: 'content',
    title: 'Transcoding Complete',
    message: '10 new episodes for "Billionaire\'s Secret Heir" (Ep 21–30) have finished 1080p HLS processing and are ready to publish.',
    time: '4m ago',
    unread: true,
    targetTab: 'dramas',
    actionLabel: 'Review Episodes'
  },
  {
    id: 'notif-2',
    category: 'monetization',
    title: 'Subscription Surge',
    message: '34 viewers purchased the Annual Pass in the last hour (+142% vs daily average). Total revenue: ₹6,766.',
    time: '28m ago',
    unread: true,
    targetTab: 'subscribers',
    actionLabel: 'View Subscribers'
  },
  {
    id: 'notif-3',
    category: 'system',
    title: 'Stream CDN Edge Latency Alert',
    message: 'Mumbai AP-South edge cache hit ratio dipped to 91.2%. Routing auto-failover to Hyderabad secondary POP initiated.',
    time: '1h ago',
    unread: true,
    targetTab: 'app_notifications',
    actionLabel: 'System Status'
  },
  {
    id: 'notif-4',
    category: 'campaign',
    title: 'Push Campaign Delivered',
    message: '"Weekend Binge: Ep 1-5 Free Unlocked" broadcast completed to 58,400 active viewers with a 21.6% open rate.',
    time: '3h ago',
    unread: false,
    targetTab: 'notifications',
    actionLabel: 'Campaign Stats'
  },
  {
    id: 'notif-5',
    category: 'monetization',
    title: 'Mega Coin Pack Recharge',
    message: 'User @karan_v purchased "Mega 1,200 Coins Pack" via PhonePe UPI (TXN #ESQ-994821).',
    time: '5h ago',
    unread: false,
    targetTab: 'subscriptions',
    actionLabel: 'Transaction Log'
  }
];

export default function NotificationDropdown({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const dropdownRef = useRef(null);
  const panelRef = useRef(null);
  const listRef = useRef(null);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not save notifications to localStorage', e);
    }
  }, [notifications]);

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

  // Prevent background page from scrolling when scrolling over or inside notification dropdown
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const handleWheel = (e) => {
      const list = listRef.current;
      if (!list) {
        e.preventDefault();
        return;
      }

      // If wheel is over header, filter tabs, footer, or padding (outside the scrollable list)
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
    if (activeFilter === 'system') return n.category === 'system' || n.category === 'campaign';
    return true; // 'all'
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleToggleRead = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
    );
  };

  const handleDeleteItem = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleResetDemo = () => {
    setNotifications(DEFAULT_NOTIFICATIONS);
    setActiveFilter('all');
  };

  const handleItemClick = (notification) => {
    // Mark clicked item as read
    if (notification.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n))
      );
    }
    // Navigate if targetTab provided
    if (notification.targetTab && onNavigate) {
      onNavigate(notification.targetTab);
      setIsOpen(false);
    }
  };

  const getCategoryIcon = (category) => {
    const renderIcon = () => {
      switch (category) {
        case 'content':
          return <Clapperboard className="w-3.5 h-3.5 text-slate-900 dark:text-amber-300" strokeWidth={2.2} />;
        case 'monetization':
          return <Sparkles className="w-3.5 h-3.5 text-slate-900 dark:text-amber-300" strokeWidth={2.2} />;
        case 'campaign':
          return <Send className="w-3.5 h-3.5 text-slate-900 dark:text-amber-300" strokeWidth={2.2} />;
        case 'system':
        default:
          return <Server className="w-3.5 h-3.5 text-slate-900 dark:text-amber-300" strokeWidth={2.2} />;
      }
    };

    return (
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-transform shadow-xs">
        {renderIcon()}
      </div>
    );
  };

  return (
    <div className="relative font-urbanist" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={`group relative p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
        }`}
      >
        <Bell
          className="w-4 h-4 bell-hover-ring transition-transform"
          strokeWidth={2}
        />

        {/* Unread Indicator Dot */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-2 ring-white dark:ring-[#0A0A0C]" />
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[330px] sm:w-[350px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#18181E] border border-slate-200/90 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden overscroll-contain animate-in fade-in zoom-in-95 duration-150 flex flex-col font-urbanist"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/70 dark:bg-[#1E1E26]">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-500 text-white shadow-xs">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-400">
                  Caught up
                </span>
              )}
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-[#FEF08A] hover:bg-slate-200/60 dark:hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3 text-slate-600 dark:text-amber-400" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 flex items-center gap-1 overflow-x-auto scrollbar-none bg-slate-50/30 dark:bg-[#18181E]">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'content', label: 'Content' },
              { key: 'monetization', label: 'Revenue' },
              { key: 'system', label: 'System' },
            ].map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#FEF08A] text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-1 px-1 py-0.5 rounded-full text-[9px] font-bold ${
                        isActive
                          ? 'bg-black/15 text-slate-950'
                          : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scrollable Notification List */}
          <div
            ref={listRef}
            className="max-h-[320px] overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-white/[0.06]"
          >
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`group relative p-2.5 px-3 flex items-start gap-2.5 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-white/[0.04] ${
                    n.unread
                      ? 'bg-[#FEF08A]/[0.06] dark:bg-[#FEF08A]/[0.03]'
                      : 'bg-transparent'
                  }`}
                >
                  {/* Category Icon */}
                  {getCategoryIcon(n.category)}

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {n.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        )}
                        <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-white truncate">
                          {n.title}
                        </h4>
                      </div>
                      <span className="text-[9.5px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 mt-0.5">
                      {n.message}
                    </p>

                    {/* Metadata & Quick Action Pill */}
                    {n.actionLabel && (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="inline-flex items-center text-[10px] font-bold text-slate-800 dark:text-amber-300 group-hover:text-amber-600 dark:group-hover:text-amber-200 transition-colors">
                          {n.actionLabel}
                          <ChevronRight className="w-2.5 h-2.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover Quick Action Buttons */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity absolute top-2 right-2.5 bg-white/90 dark:bg-[#18181E]/95 rounded p-0.5 shadow-xs">
                    <button
                      onClick={(e) => handleToggleRead(n.id, e)}
                      title={n.unread ? 'Mark as read' : 'Mark as unread'}
                      className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteItem(n.id, e)}
                      title="Dismiss notification"
                      className="p-1 rounded text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-200/80 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty State */
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-400 dark:text-slate-500 flex items-center justify-center mb-2">
                  <BellOff className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  No notifications
                </h4>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px]">
                  {activeFilter === 'unread'
                    ? "You've read all your notifications!"
                    : 'No alerts in this category right now.'}
                </p>
                {notifications.length === 0 && (
                  <button
                    onClick={handleResetDemo}
                    className="mt-2.5 inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore Demo Alerts</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-[#121216] flex items-center justify-between text-[10.5px]">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('app_notifications');
                  setIsOpen(false);
                }
              }}
              className="inline-flex items-center space-x-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-[#FEF08A] transition-colors cursor-pointer"
            >
              <span>Manage In-App Notices</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="font-semibold text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
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
