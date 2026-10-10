import React, { useState, useEffect, useMemo, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import { mockDramas } from '../../data/mockOttData';
import PageLoader from '../../components/common/PageLoader';
import PulsatingDots from '../../components/common/PulsatingDots';
import {
  Send,
  Bell,
  CheckCircle2,
  Radio,
  AlertCircle,
  RefreshCw,
  Search,
  Film,
  RotateCcw,
  User,
  UserCheck,
  X,
  ChevronDown,
  Users,
  MessageSquare,
  Type,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  SlidersHorizontal,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const PUSH_TEMPLATES = [
  {
    label: 'Test Broadcast',
    emoji: '🧪',
    title: '🧪 FCM Test Broadcast: Push Delivery Check',
    message: 'This is a test notification from the E² admin console. Push messaging is operating smoothly!'
  },
  {
    label: 'New Episode',
    emoji: '🔥',
    title: '🔥 New Episode Alert: Watch Episode Now!',
    message: 'The brand-new episode is now streaming! Tap to watch in full HD and discover what happens next.'
  },
  {
    label: 'Weekend Binge',
    emoji: '🍿',
    title: '🍿 Weekend Watchlist: Binge Top Series!',
    message: 'Looking for your next obsession? Unwind this weekend with trending web series on E².'
  },
  {
    label: 'VIP Exclusive',
    emoji: '👑',
    title: '👑 Subscriber Exclusive: Unlock All Episodes',
    message: 'Enjoy commercial-free, unrestricted access to all original episodes. Start watching now!'
  },
  {
    label: 'Urgent Premiere',
    emoji: '⚡',
    title: '⚡ Don’t Miss Out: Special Event Streaming Live',
    message: 'Exclusive special premiere is happening now on E² Stories. Tap to jump straight in!'
  }
];

export default function NotificationsPage() {
  // Navigation & View Mode: 'ledger' (History & Analytics) | 'compose' (Create Broadcast)
  const [activeTab, setActiveTab] = useState('ledger');

  // Server Data
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    subscribers: 0,
    inactiveUsers: 0,
    registeredDeviceTokens: 0,
    totalCampaigns: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Composer State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Users');
  const [selectedDrama, setSelectedDrama] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Specific User selection state
  const [usersList, setUsersList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const userPickerRef = useRef(null);

  // Ledger Filter & Sorting State
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load series list dynamically from localStorage or fallback
  const availableDramas = useMemo(() => {
    try {
      const saved = localStorage.getItem('esquare_dramas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return mockDramas;
  }, []);

  // Fetch campaigns and audience statistics
  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getCampaigns();
      setCampaigns(data.campaigns || []);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to load campaigns from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Fetch user list when Specific User mode is activated
  useEffect(() => {
    if (targetAudience === 'Specific User' && usersList.length === 0) {
      const loadUsers = async () => {
        try {
          setIsUsersLoading(true);
          const data = await userService.getUsers({ limit: 100 });
          setUsersList(data?.users || []);
        } catch (e) {
          console.error('Failed to load user directory for notification:', e);
        } finally {
          setIsUsersLoading(false);
        }
      };
      loadUsers();
    }
  }, [targetAudience, usersList.length]);

  // Click outside to close user search dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userPickerRef.current && !userPickerRef.current.contains(e.target)) {
        setIsUserPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered users for specific user search
  const filteredUsersList = useMemo(() => {
    if (!userSearchTerm.trim()) return usersList.slice(0, 10);
    const rawTerm = userSearchTerm.trim().toLowerCase();
    const cleanDigits = rawTerm.replace(/\D/g, '');
    return usersList.filter(u => {
      const name = (u.name || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || u.phoneNumber || '').toLowerCase();
      const phoneDigits = phone.replace(/\D/g, '');
      const id = (u.id || u._id || '').toLowerCase();

      return (
        name.includes(rawTerm) ||
        email.includes(rawTerm) ||
        phone.includes(rawTerm) ||
        (cleanDigits.length >= 2 && phoneDigits.includes(cleanDigits)) ||
        id.includes(rawTerm)
      );
    }).slice(0, 15);
  }, [usersList, userSearchTerm]);

  // Handle Push Broadcast submission
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (targetAudience === 'Specific User' && !selectedUser) {
      setFeedback({
        type: 'error',
        message: 'Please select a specific recipient user from the directory.'
      });
      return;
    }

    setIsSending(true);
    setFeedback(null);

    const dramaObj = availableDramas.find(d => d.id === selectedDrama);
    const deepLink = dramaObj ? `/watch/${dramaObj.slug || dramaObj.id}` : '';

    try {
      const result = await notificationService.broadcastPush({
        title: title.trim(),
        message: message.trim(),
        targetAudience,
        targetUserId: selectedUser ? (selectedUser.id || selectedUser._id) : '',
        targetUserName: selectedUser ? (selectedUser.name || selectedUser.phone) : '',
        selectedDrama,
        deepLink
      });

      const recipientText = targetAudience === 'Specific User' && selectedUser
        ? `user "${selectedUser.name || selectedUser.phone}"`
        : `${result.recipientsCount} recipient(s)`;

      setFeedback({
        type: 'success',
        message: `Broadcast delivered! Sent to ${recipientText} (${result.fcmDevicesCount} active FCM token(s)).`
      });

      if (result.campaign) {
        setCampaigns(prev => [result.campaign, ...prev]);
        setStats(prev => ({
          ...prev,
          totalCampaigns: (prev.totalCampaigns || 0) + 1
        }));
      }

      // Reset fields to clean state
      setTitle('');
      setMessage('');
      setSelectedDrama('');
      if (targetAudience === 'Specific User') {
        setSelectedUser(null);
        setUserSearchTerm('');
      }

      // Automatically switch to ledger view to inspect newly created campaign
      setActiveTab('ledger');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to broadcast push notification'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setMessage('');
    setSelectedDrama('');
    setTargetAudience('All Users');
    setSelectedUser(null);
    setUserSearchTerm('');
    setFeedback(null);
  };

  // Duplicate / Reuse past campaign in composer
  const handleReuseCampaign = (camp) => {
    setTitle(camp.title || '');
    setMessage(camp.message || '');
    if (camp.targetAudience && camp.targetAudience.startsWith('User:')) {
      setTargetAudience('Specific User');
    } else if (['All Users', 'Subscribers Only', 'Inactive 7+ Days'].includes(camp.targetAudience)) {
      setTargetAudience(camp.targetAudience);
    } else {
      setTargetAudience('All Users');
    }
    setActiveTab('compose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy campaign text
  const handleCopyText = (camp) => {
    const id = camp.id || camp._id;
    navigator.clipboard.writeText(`${camp.title}\n\n${camp.message}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export CSV of campaigns
  const handleExportCSV = () => {
    if (filteredCampaigns.length === 0) return;
    const headers = ['Title,Message,Audience,DeepLink,SentCount,Status,CreatedAt'];
    const rows = filteredCampaigns.map(c => [
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.message || '').replace(/"/g, '""')}"`,
      `"${c.targetAudience || ''}"`,
      `"${c.deepLink || ''}"`,
      `"${c.sentCount || 0}"`,
      `"${c.status || 'SENT'}"`,
      `"${c.createdAt || ''}"`
    ].join(','));
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `push_notifications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const selectedDramaDetails = useMemo(() => {
    return availableDramas.find(d => d.id === selectedDrama);
  }, [selectedDrama, availableDramas]);

  // Filtered & Sorted broadcast history
  const filteredCampaigns = useMemo(() => {
    let list = campaigns.filter(c => {
      const q = historySearchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.message && c.message.toLowerCase().includes(q)) ||
        (c.targetAudience && c.targetAudience.toLowerCase().includes(q));

      const matchesFilter =
        historyFilter === 'ALL' ||
        (historyFilter === 'SUBSCRIBERS' && c.targetAudience === 'Subscribers Only') ||
        (historyFilter === 'ALL_USERS' && c.targetAudience === 'All Users') ||
        (historyFilter === 'INACTIVE' && c.targetAudience === 'Inactive 7+ Days') ||
        (historyFilter === 'SPECIFIC' && c.targetAudience && c.targetAudience.startsWith('User:'));

      return matchesSearch && matchesFilter;
    });

    return list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'recipients') {
        return (b.sentCount || 0) - (a.sentCount || 0);
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); // newest default
    });
  }, [campaigns, historySearchTerm, historyFilter, sortBy]);

  // Counts for tabs
  const filterCounts = useMemo(() => {
    let allUsers = 0;
    let subscribers = 0;
    let inactive = 0;
    let specific = 0;

    campaigns.forEach(c => {
      if (c.targetAudience === 'All Users') allUsers++;
      else if (c.targetAudience === 'Subscribers Only') subscribers++;
      else if (c.targetAudience === 'Inactive 7+ Days') inactive++;
      else if (c.targetAudience && c.targetAudience.startsWith('User:')) specific++;
    });

    return {
      all: campaigns.length,
      allUsers,
      subscribers,
      inactive,
      specific
    };
  }, [campaigns]);

  // Paginated list
  const totalPages = Math.ceil(filteredCampaigns.length / pageSize) || 1;
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage]);

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Clean, Minimal, Compact)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 shadow-xs">
            <Send className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Push Notifications
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF08A]/30 dark:bg-[#FEF08A]/10 text-amber-900 dark:text-amber-300 border border-amber-300/40 dark:border-amber-400/25">
                <Radio className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
                <span>FCM v1 Active</span>
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              Direct and segmented FCM push alerts to viewer mobile devices
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={fetchCampaigns}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Refresh statistics and history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          {activeTab === 'ledger' ? (
            <>
              <button
                onClick={handleExportCSV}
                disabled={filteredCampaigns.length === 0}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-lg transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer disabled:opacity-40"
                title="Export campaigns CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => setActiveTab('compose')}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>New Broadcast</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setActiveTab('ledger')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded-lg transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            >
              <span>← Back to Ledger</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-bold shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
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
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. UNIFORM COMPACT KPI STAT CARDS (4 Cards, Theme Colors)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total Broadcasts Sent */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                <Send className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Total Broadcasts
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Push Campaigns
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {stats.totalCampaigns || campaigns.length}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Delivery records
            </span>
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Active Logs
            </span>
          </div>
        </div>

        {/* Card 2: Device Reach (FCM) */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                <Smartphone className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Device Reach
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  FCM Push Tokens
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {(stats.registeredDeviceTokens || stats.totalUsers || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Audience: {stats.totalUsers.toLocaleString()} users
            </span>
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Push Enabled
            </span>
          </div>
        </div>

        {/* Card 3: VIP Subscribers Reach */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                <UserCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  VIP Subscribers
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  High-Value Target
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {(stats.subscribers || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Exclusive broadcasts
            </span>
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              VIP Tier
            </span>
          </div>
        </div>

        {/* Card 4: Inactive Re-engagement Pool */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 group-hover:scale-105 transition-all duration-300 shadow-xs shrink-0">
                <RotateCcw className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate">
                  Win-Back Pool
                </span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-medium block truncate">
                  Inactive 7+ Days
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-none group-hover:text-amber-950 dark:group-hover:text-amber-200 transition-colors">
                {(stats.inactiveUsers || 0).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] font-medium leading-normal gap-2">
            <span className="truncate text-slate-500 dark:text-slate-400">
              Re-engagement target
            </span>
            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100/60 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 font-bold">
              Available
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. NAVIGATION PILL TABS
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200/70 dark:border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast Ledger</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'ledger' ? 'bg-slate-950 text-[#FEF08A]' : 'bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300'
          }`}>
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('compose')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'compose'
              ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Compose Push Broadcast</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: BROADCAST LEDGER (History, Table, Filters)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          {/* Unified Single-Row Toolbar */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            
            {/* Left: Audience Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => { setHistoryFilter('ALL'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  historyFilter === 'ALL'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                All ({filterCounts.all})
              </button>
              <button
                onClick={() => { setHistoryFilter('ALL_USERS'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  historyFilter === 'ALL_USERS'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                All Users ({filterCounts.allUsers})
              </button>
              <button
                onClick={() => { setHistoryFilter('SUBSCRIBERS'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  historyFilter === 'SUBSCRIBERS'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                Subscribers ({filterCounts.subscribers})
              </button>
              <button
                onClick={() => { setHistoryFilter('INACTIVE'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  historyFilter === 'INACTIVE'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                Inactive 7d+ ({filterCounts.inactive})
              </button>
              <button
                onClick={() => { setHistoryFilter('SPECIFIC'); setCurrentPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  historyFilter === 'SPECIFIC'
                    ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                }`}
              >
                Direct User ({filterCounts.specific})
              </button>
            </div>

            {/* Right: Search & Sort Controls */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={historySearchTerm}
                  onChange={(e) => { setHistorySearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-8 pr-7 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                />
                {historySearchTerm && (
                  <button
                    onClick={() => { setHistorySearchTerm(''); setCurrentPage(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-2.5 pr-6 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181E] text-slate-800 dark:text-slate-200 appearance-none cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="recipients">Highest Reach</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Ledger Table Container */}
          <div className="bg-white dark:bg-[#121216] rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
            {isLoading ? (
              <PageLoader size="sm" text="Loading push broadcast history..." minHeight="min-h-[200px]" />
            ) : paginatedCampaigns.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400 space-y-2.5">
                <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                  {historySearchTerm || historyFilter !== 'ALL'
                    ? 'No broadcasts match current filters.'
                    : 'No push broadcasts sent yet.'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Compose and broadcast instant push messages to viewer mobile screens.
                </p>
                <button
                  onClick={() => setActiveTab('compose')}
                  className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
                  <span>Compose First Broadcast</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <th className="py-2 px-3">Campaign & Message</th>
                      <th className="py-2 px-3">Audience Target</th>
                      <th className="py-2 px-3">Deep Link</th>
                      <th className="py-2 px-3 text-right">Recipients</th>
                      <th className="py-2 px-3">Sent Time</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {paginatedCampaigns.map((n) => {
                      const id = n.id || n._id;
                      const isSpecific = n.targetAudience && n.targetAudience.startsWith('User:');
                      const isSub = n.targetAudience === 'Subscribers Only';

                      return (
                        <tr
                          key={id}
                          className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Campaign & Message */}
                          <td className="py-2 px-3 min-w-[220px] max-w-[320px]">
                            <div className="flex items-start space-x-2">
                              <div className="w-6 h-6 rounded-md bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0 mt-0.5">
                                <Send className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-950 dark:text-white truncate leading-snug">
                                  {n.title}
                                </p>
                                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Audience Target */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isSpecific
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                                  : isSub
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/40'
                                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                              }`}
                            >
                              <span>{n.targetAudience || 'All Users'}</span>
                            </span>
                          </td>

                          {/* Deep Link */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            {n.deepLink ? (
                              <span className="inline-flex items-center space-x-1 text-[10.5px] text-amber-600 dark:text-amber-400 font-bold max-w-[140px] truncate">
                                <Film className="w-3 h-3 shrink-0" />
                                <span className="truncate">{n.deepLink}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10.5px]">Home Feed</span>
                            )}
                          </td>

                          {/* Recipients */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {(n.sentCount || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              {n.sentCount === 1 ? 'device' : 'dev'}
                            </span>
                          </td>

                          {/* Sent Time */}
                          <td className="py-2 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]" title={n.createdAt}>
                            {formatTimeAgo(n.createdAt)}
                          </td>

                          {/* Status */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                              {n.status || 'SENT'}
                            </span>
                          </td>

                          {/* Quick Actions */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => handleReuseCampaign(n)}
                                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                                title="Reuse / Duplicate in composer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCopyText(n)}
                                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                                title="Copy title and message"
                              >
                                {copiedId === id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
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

            {/* Pagination Row */}
            {filteredCampaigns.length > pageSize && (
              <div className="p-2.5 px-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-white/[0.02]">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
                </span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-200">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/[0.05] cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: COMPOSE PUSH BROADCAST (Minimal & Proportioned)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          
          {/* Left Column: Broadcast Composer (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            
            {/* Form Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                    Compose Broadcast
                  </h3>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                    Send high-priority push notification to mobile viewers
                  </p>
                </div>
              </div>

              {(title || message || selectedDrama || selectedUser) && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 text-[11px] font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Quick Template Selector Chips */}
            <div>
              <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Fill Templates:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {PUSH_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => {
                      setTitle(tmpl.title);
                      setMessage(tmpl.message);
                    }}
                    className="px-2 py-1 rounded-lg text-[10.5px] font-bold border border-slate-200/80 dark:border-white/10 bg-slate-50 hover:bg-amber-50 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-amber-300/50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                  >
                    <span>{tmpl.emoji} {tmpl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
              
              {/* Audience & Series Pickers in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Audience</span>
                  </label>
                  <div className="relative">
                    <select
                      value={targetAudience}
                      onChange={(e) => {
                        setTargetAudience(e.target.value);
                        if (e.target.value !== 'Specific User') {
                          setSelectedUser(null);
                          setUserSearchTerm('');
                        }
                      }}
                      className="w-full pl-3 pr-8 py-1.5 appearance-none rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all cursor-pointer text-xs"
                    >
                      <option value="All Users">All Registered Users ({stats.totalUsers.toLocaleString()})</option>
                      <option value="Subscribers Only">Subscribers Only ({stats.subscribers.toLocaleString()})</option>
                      <option value="Inactive 7+ Days">Inactive Users 7+ Days ({stats.inactiveUsers.toLocaleString()})</option>
                      <option value="Specific User">🎯 Specific User (Direct Delivery)</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {targetAudience === 'All Users' && `Reaching all registered mobile viewers (${stats.totalUsers.toLocaleString()} users)`}
                    {targetAudience === 'Subscribers Only' && `Delivering exclusively to subscribers (${stats.subscribers.toLocaleString()} users)`}
                    {targetAudience === 'Inactive 7+ Days' && `Re-engaging inactive viewers (${stats.inactiveUsers.toLocaleString()} users)`}
                    {targetAudience === 'Specific User' && 'Direct personal push delivery to 1 selected recipient'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center space-x-1.5 text-[11px]">
                    <Film className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Series (Deep Link)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDrama}
                      onChange={(e) => setSelectedDrama(e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 appearance-none rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all cursor-pointer text-xs"
                    >
                      <option value="">General (App Home Feed)</option>
                      {availableDramas.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.title} ({d.totalEpisodes || 0} eps)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {selectedDramaDetails ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">
                      🎬 Deep link: /watch/{selectedDramaDetails.slug || selectedDramaDetails.id}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Opens mobile application home page
                    </p>
                  )}
                </div>
              </div>

              {/* Specific User Search & Recipient Card */}
              {targetAudience === 'Specific User' && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#18181E] border border-slate-200/90 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                      <User className="w-3 h-3 text-amber-500" />
                      <span>Specific Recipient User</span>
                    </span>
                    {selectedUser ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Recipient Chosen</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        Selection Required
                      </span>
                    )}
                  </div>

                  {selectedUser ? (
                    <div className="p-2 bg-white dark:bg-[#1E1E26] rounded-lg border border-slate-200/90 dark:border-white/15 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 font-extrabold text-xs shrink-0">
                          {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-xs text-slate-950 dark:text-white truncate">
                              {selectedUser.name || 'Anonymous User'}
                            </span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300">
                              {selectedUser.isVip ? 'Subscriber' : 'Free Tier'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedUser.phone || selectedUser.email || selectedUser.id}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearchTerm('');
                          setIsUserPickerOpen(true);
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer shrink-0 border border-slate-200/80 dark:border-white/10"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={userPickerRef}>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search user by name, phone (+91), or email..."
                          value={userSearchTerm}
                          onFocus={() => setIsUserPickerOpen(true)}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value);
                            setIsUserPickerOpen(true);
                          }}
                          className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 font-medium text-slate-900 dark:text-white bg-white dark:bg-[#1E1E26] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                        />
                        {userSearchTerm && (
                          <button
                            type="button"
                            onClick={() => setUserSearchTerm('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {isUserPickerOpen && (
                        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#1E1E26] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl z-30 divide-y divide-slate-100 dark:divide-white/5">
                          {isUsersLoading ? (
                            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                              <PulsatingDots size="sm" />
                              <span className="font-semibold text-slate-500 dark:text-slate-400">Loading directory...</span>
                            </div>
                          ) : filteredUsersList.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              {usersList.length === 0
                                ? 'No registered users in directory.'
                                : `No users match "${userSearchTerm}".`}
                            </div>
                          ) : (
                            filteredUsersList.map((u) => {
                              const uId = u.id || u._id;
                              return (
                                <button
                                  key={uId}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsUserPickerOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                                >
                                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                                    <div className="w-6 h-6 rounded-md bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 font-black text-xs shrink-0">
                                      {(u.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                          {u.name || 'Anonymous User'}
                                        </span>
                                        {u.isVip && (
                                          <span className="px-1 py-0.2 rounded text-[8.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                            Subscriber
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 truncate">
                                        {u.phone || u.email || uId}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    Select →
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Notification Title */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-[11px]">
                    <Type className="w-3.5 h-3.5 text-slate-400" />
                    <span>Notification Title *</span>
                  </label>
                  <span className={`text-[10.5px] font-semibold ${title.length > 55 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {title.length} / 65
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    maxLength={65}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. 🔥 New Episode Alert: Watch Episode 12 Now!"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all text-xs"
                  />
                  {title && (
                    <button
                      type="button"
                      onClick={() => setTitle('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification Message Copy */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-[11px]">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Notification Body Copy *</span>
                  </label>
                  <span className={`text-[10.5px] font-semibold ${message.length > 150 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {message.length} / 180
                  </span>
                </div>
                <textarea
                  value={message}
                  maxLength={180}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  required
                  placeholder="Notification body description appearing on user mobile lockscreens..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all leading-relaxed resize-none text-xs"
                ></textarea>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                  <Smartphone className="w-3 h-3 text-amber-500" />
                  <span>
                    {targetAudience === 'Specific User'
                      ? selectedUser ? `Direct: ${selectedUser.name || 'User'}` : 'Select 1 Recipient'
                      : `~${stats.totalUsers.toLocaleString()} Viewer Devices`}
                  </span>
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ledger')}
                    className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !title.trim() || !message.trim() || (targetAudience === 'Specific User' && !selectedUser)}
                    className="py-1.5 px-4 bg-[#FACC15] hover:bg-[#EAB308] disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs hover:shadow active:scale-98 cursor-pointer text-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-950 stroke-[2.2]" />
                    <span>
                      {isSending
                        ? 'Broadcasting...'
                        : targetAudience === 'Specific User'
                        ? selectedUser
                          ? `Send to ${selectedUser.name ? selectedUser.name.split(' ')[0] : 'User'}`
                          : 'Select Recipient'
                        : 'Send Push Broadcast'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Live Mobile Notification Preview (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 dark:bg-amber-400/10 border border-amber-200/60 dark:border-amber-400/30 flex items-center justify-center text-slate-950 dark:text-amber-300 shrink-0">
                    <Bell className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-slate-950 dark:text-white tracking-tight">
                      Live Push Preview
                    </h3>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                      Real-time mobile lockscreen notification appearance
                    </p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                  Preview
                </span>
              </div>

              {/* Clean Modern Notification Card */}
              <div className="p-3 bg-slate-50 dark:bg-[#18181E] rounded-xl border border-slate-200/90 dark:border-white/10 shadow-xs relative overflow-hidden transition-all">
                {/* Top Meta Line: App Icon, Brand Name, Timestamp, Bell */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4.5 h-4.5 rounded bg-[#FEF08A] text-slate-950 font-black text-[9px] flex items-center justify-center shadow-2xs">
                      E²
                    </div>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight">
                      E² STORIES
                    </span>
                    <span className="text-slate-300 dark:text-white/20">·</span>
                    <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                  </div>
                  <Bell className="w-3 h-3 text-slate-400" />
                </div>

                {/* Recipient tag if Specific User is chosen */}
                {targetAudience === 'Specific User' && (
                  selectedUser ? (
                    <div className="mt-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center space-x-1">
                      <UserCheck className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                      <span className="truncate">Direct: {selectedUser.name || selectedUser.phone}</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-300/60 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 text-[10px] font-medium flex items-center space-x-1">
                      <User className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                      <span>Awaiting user selection from directory...</span>
                    </div>
                  )
                )}

                {/* Dynamic Notification Content */}
                <div className="pt-2 space-y-0.5">
                  <h4 className="text-xs font-extrabold text-slate-950 dark:text-white leading-snug">
                    {title.trim() || 'Your notification title will appear here...'}
                  </h4>
                  <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                    {message.trim() || 'Notification body copy will be previewed here in real-time as you compose your push alert message.'}
                  </p>
                </div>

                {/* Deep-link badge if selected */}
                {selectedDramaDetails && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold truncate">
                      <Film className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">Opens: {selectedDramaDetails.title}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium shrink-0">
                      Auto Deep-Link
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* FCM Delivery Architecture Diagnostics Box */}
            <div className="p-2.5 bg-slate-50/70 dark:bg-[#141419] rounded-xl border border-slate-200/80 dark:border-white/10 space-y-1.5 text-xs">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                FCM Engine Diagnostics
              </span>
              
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
                <span className="font-medium">Protocol</span>
                <span className="font-bold text-slate-900 dark:text-white">FCM v1 REST API</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
                <span className="font-medium">Priority</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">High (Wake-Lock)</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[10.5px]">
                <span className="font-medium">Target Scope</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                  {targetAudience === 'Specific User'
                    ? selectedUser
                      ? `User: ${selectedUser.name}`
                      : 'Awaiting User'
                    : targetAudience}
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
