import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import { dramaService } from '../../services/dramaService';
import PageLoader from '../../components/common/PageLoader';
import PulsatingDots from '../../components/common/PulsatingDots';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import Badge from '../../components/common/Badge';
import ModalPortal from '../../components/common/ModalPortal';
import { confirmModal } from '../../context/DialogContext';
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
  ArrowUpRight,
  Zap,
  CreditCard,
  Trash2,
  Edit3,
  Clock,
  ExternalLink
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

  // ── Automated Notification Triggers State ─────────────────────────────────
  const [autoTriggers, setAutoTriggers] = useState([]);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [testingTriggerId, setTestingTriggerId] = useState(null);

  // Auto trigger modal state (Create / Edit)
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [autoFormName, setAutoFormName] = useState('');
  const [autoFormDesc, setAutoFormDesc] = useState('');
  const [autoFormCategory, setAutoFormCategory] = useState('USER');
  const [autoFormTitle, setAutoFormTitle] = useState('');
  const [autoFormBody, setAutoFormBody] = useState('');
  const [autoFormAudience, setAutoFormAudience] = useState('All Users');
  const [autoFormDeepLink, setAutoFormDeepLink] = useState('/home');
  const [autoFormDelay, setAutoFormDelay] = useState(0);
  const [autoFormEnabled, setAutoFormEnabled] = useState(true);
  const [isSubmittingAuto, setIsSubmittingAuto] = useState(false);

  // Live drama catalog from backend API
  const [availableDramas, setAvailableDramas] = useState([]);
  const [isDramasLoading, setIsDramasLoading] = useState(false);

  // Fetch real drama series list for deep-linking
  const fetchDramas = async () => {
    try {
      setIsDramasLoading(true);
      const res = await dramaService.getAdminDramas();
      if (res && Array.isArray(res.dramas)) {
        setAvailableDramas(res.dramas);
      } else if (Array.isArray(res)) {
        setAvailableDramas(res);
      }
    } catch (err) {
      console.warn('Failed to load dramas for push notifications:', err);
    } finally {
      setIsDramasLoading(false);
    }
  };

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

  // Fetch auto triggers
  const fetchAutoTriggers = async () => {
    try {
      setIsAutoLoading(true);
      const res = await notificationService.getAutoTriggers();
      if (res) {
        setAutoTriggers(res.triggers || []);
      }
    } catch (err) {
      console.warn('Failed to fetch auto triggers:', err.message);
    } finally {
      setIsAutoLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchDramas();
    fetchAutoTriggers();
  }, []);

  const handleToggleAutoTrigger = async (id) => {
    try {
      const res = await notificationService.toggleAutoTrigger(id);
      if (res && res.trigger) {
        setAutoTriggers((prev) =>
          prev.map((t) => (t.id === id || t._id === id ? { ...t, isEnabled: res.trigger.isEnabled } : t))
        );
        setFeedback({
          type: 'success',
          message: `Auto trigger "${res.trigger.name}" ${res.trigger.isEnabled ? 'activated' : 'disabled'}.`
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to toggle auto trigger'
      });
    }
  };

  const handleTestSendAuto = async (trigger) => {
    try {
      setTestingTriggerId(trigger.id || trigger._id);
      const res = await notificationService.testSendAutoTrigger(trigger.id || trigger._id);
      setFeedback({
        type: 'success',
        message: `Test push dispatched for "${trigger.name}"! Delivered to ${res.deliveredCount || 'all registered'} device(s).`
      });
      fetchAutoTriggers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch test push'
      });
    } finally {
      setTestingTriggerId(null);
    }
  };

  const handleDeleteAutoTrigger = async (trigger) => {
    const confirmed = await confirmModal({
      title: 'Delete Automated Trigger',
      message: 'Are you sure you want to permanently delete this auto notification trigger?',
      itemName: trigger.name,
      confirmText: 'Delete Trigger',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await notificationService.deleteAutoTrigger(trigger.id || trigger._id);
      setAutoTriggers((prev) => prev.filter((t) => t.id !== trigger.id && t._id !== trigger._id));
      setFeedback({
        type: 'success',
        message: `Trigger "${trigger.name}" removed.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete trigger'
      });
    }
  };

  const handleOpenAutoModal = (trigger = null) => {
    setEditingTrigger(trigger);
    if (trigger) {
      setAutoFormName(trigger.name || '');
      setAutoFormDesc(trigger.description || '');
      setAutoFormCategory(trigger.category || 'USER');
      setAutoFormTitle(trigger.title || '');
      setAutoFormBody(trigger.body || '');
      setAutoFormAudience(trigger.targetAudience || 'All Users');
      setAutoFormDeepLink(trigger.deepLink || '/home');
      setAutoFormDelay(trigger.delayMinutes || 0);
      setAutoFormEnabled(trigger.isEnabled !== false);
    } else {
      setAutoFormName('');
      setAutoFormDesc('');
      setAutoFormCategory('USER');
      setAutoFormTitle('');
      setAutoFormBody('');
      setAutoFormAudience('All Users');
      setAutoFormDeepLink('/home');
      setAutoFormDelay(0);
      setAutoFormEnabled(true);
    }
    setIsAutoModalOpen(true);
  };

  const handleSaveAutoTrigger = async (e) => {
    e.preventDefault();
    if (!autoFormName.trim() || !autoFormTitle.trim() || !autoFormBody.trim()) return;

    setIsSubmittingAuto(true);
    try {
      const payload = {
        name: autoFormName.trim(),
        description: autoFormDesc.trim(),
        category: autoFormCategory,
        title: autoFormTitle.trim(),
        body: autoFormBody.trim(),
        targetAudience: autoFormAudience,
        deepLink: autoFormDeepLink.trim() || '/home',
        delayMinutes: Number(autoFormDelay) || 0,
        isEnabled: autoFormEnabled
      };

      if (editingTrigger) {
        const res = await notificationService.updateAutoTrigger(editingTrigger.id || editingTrigger._id, payload);
        setAutoTriggers((prev) =>
          prev.map((t) => ((t.id === editingTrigger.id || t._id === editingTrigger._id) ? res.trigger : t))
        );
        setFeedback({
          type: 'success',
          message: `Auto trigger "${payload.name}" updated successfully.`
        });
      } else {
        const res = await notificationService.createAutoTrigger(payload);
        if (res && res.trigger) {
          setAutoTriggers((prev) => [...prev, res.trigger]);
          setFeedback({
            type: 'success',
            message: `New automated trigger "${payload.name}" created.`
          });
        }
      }
      setIsAutoModalOpen(false);
      fetchAutoTriggers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to save auto trigger'
      });
    } finally {
      setIsSubmittingAuto(false);
    }
  };

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

    const dramaObj = availableDramas.find(d => (d.id === selectedDrama || d._id === selectedDrama));
    const deepLink = dramaObj ? `/watch/${dramaObj.slug || dramaObj.id || dramaObj._id}` : '';

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
    return availableDramas.find(d => (d.id === selectedDrama || d._id === selectedDrama));
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

  // ── Sequential User Lifecycle Order ──────────────────────────────────────────
  const LIFECYCLE_STEPS = useMemo(() => [
    {
      key: 'WELCOME_SIGNUP',
      stepNumber: '01',
      eventLabel: 'On User Registration',
      icon: UserCheck
    },
    {
      key: 'SUBSCRIPTION_SUCCESS',
      stepNumber: '02',
      eventLabel: 'On VIP Pass Purchase',
      icon: CreditCard
    },
    {
      key: 'NEW_EPISODE_RELEASE',
      stepNumber: '03',
      eventLabel: 'On New Episode Published',
      icon: Film
    },
    {
      key: 'RENEWAL_REMINDER',
      stepNumber: '04',
      eventLabel: '3 Days Before Expiry',
      icon: Clock
    },
    {
      key: 'INACTIVE_WINBACK',
      stepNumber: '05',
      eventLabel: 'Inactive for 7+ Days',
      icon: RotateCcw
    },
    {
      key: 'PAYMENT_FAILED',
      stepNumber: '06',
      eventLabel: 'On Payment Failure',
      icon: AlertCircle
    }
  ], []);

  // Sorted perfectly sequentially along the viewer journey
  const sequentialAutoTriggers = useMemo(() => {
    const orderKeys = LIFECYCLE_STEPS.map((s) => s.key);
    return [...autoTriggers].sort((a, b) => {
      const keyA = a.triggerKey || a.triggerEvent || '';
      const keyB = b.triggerKey || b.triggerEvent || '';
      const idxA = orderKeys.indexOf(keyA);
      const idxB = orderKeys.indexOf(keyB);
      const posA = idxA !== -1 ? idxA : 999;
      const posB = idxB !== -1 ? idxB : 999;
      if (posA !== posB) return posA - posB;
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    });
  }, [autoTriggers, LIFECYCLE_STEPS]);

  return (
    <div className="space-y-3 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR (Clean, Minimal, Compact)
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#121216] rounded-xl p-3 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
            <Send className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                Push Notifications
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF08A] text-slate-950 shadow-xs border border-amber-300/50">
                <Radio className="w-2.5 h-2.5 text-slate-950 animate-pulse" />
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
            onClick={() => {
              fetchCampaigns();
              fetchDramas();
            }}
            disabled={isLoading || isDramasLoading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-all border border-slate-200/80 dark:border-white/10 cursor-pointer hover:scale-105 active:scale-90 shadow-sm shrink-0"
            title="Refresh statistics and history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(isLoading || isDramasLoading) ? 'animate-spin text-amber-500' : ''}`} />
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
          ) : activeTab === 'auto' ? (
            <button
              onClick={() => handleOpenAutoModal(null)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold text-xs transition-colors shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>New Auto Trigger</span>
            </button>
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
      {activeTab !== 'auto' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Card 1: Total Broadcasts Sent */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Send className="w-5 h-5 text-slate-950 stroke-[2.2]" />
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
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Active Logs
            </span>
          </div>
        </div>

        {/* Card 2: Device Reach (FCM) */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Smartphone className="w-5 h-5 text-slate-950 stroke-[2.2]" />
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
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              Push Enabled
            </span>
          </div>
        </div>

        {/* Card 3: VIP Subscribers Reach */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <UserCheck className="w-5 h-5 text-slate-950 stroke-[2.2]" />
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
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              VIP Tier
            </span>
          </div>
        </div>

        {/* Card 4: Inactive Re-engagement Pool */}
        <div className="bg-white dark:bg-[#121216] rounded-xl p-3 sm:p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between group select-none">
          <div>
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <RotateCcw className="w-5 h-5 text-slate-950 stroke-[2.2]" />
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
            <span className="text-slate-600 dark:text-slate-300 font-bold">
              Available
            </span>
          </div>
        </div>
      </div>
    )}

      {/* ─────────────────────────────────────────────────────────────
          3. SEGMENTED SWITCH TOGGLE TABS (Clean, Minimal, Sliding Badge UI)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-0.5 scrollbar-none">
        <div className="relative inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#14141A] border border-slate-200/80 dark:border-white/10 shadow-2xs">
          {[
            { id: 'ledger', label: 'Broadcast Ledger', count: campaigns.length },
            { id: 'compose', label: 'Compose Broadcast' },
            { id: 'auto', label: 'Automated Triggers' }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`group relative px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer select-none flex items-center space-x-2 shrink-0 outline-hidden ${
                  isSelected
                    ? 'text-slate-950'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="notificationMainTabBadge"
                    className="absolute inset-0 bg-[#FEF08A] rounded-lg shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 transition-colors duration-150">
                  {tab.label}
                </span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-black transition-colors duration-150 ${
                      isSelected
                        ? 'bg-slate-950 text-[#FEF08A] shadow-2xs'
                        : 'bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400 group-hover:bg-slate-300/80 dark:group-hover:bg-white/[0.14] group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: BROADCAST LEDGER (History, Table, Filters)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <motion.div
          key="tab-ledger"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {/* Unified Single-Row Toolbar */}
          <div className="bg-white dark:bg-[#121216] rounded-xl p-2 sm:p-2.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            
            {/* Left: Audience Filter Tabs */}
            <div className="relative inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/10 shrink-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All', count: filterCounts.all },
                { id: 'ALL_USERS', label: 'All Users', count: filterCounts.allUsers },
                { id: 'SUBSCRIBERS', label: 'Subscribers', count: filterCounts.subscribers },
                { id: 'INACTIVE', label: 'Inactive 7d+', count: filterCounts.inactive },
                { id: 'SPECIFIC', label: 'Direct User', count: filterCounts.specific },
              ].map((tab) => {
                const isSelected = historyFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setHistoryFilter(tab.id); setCurrentPage(1); }}
                    className={`relative px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer select-none outline-hidden ${
                      isSelected
                        ? 'text-slate-950 font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="notificationHistoryFilterBadge"
                        className="absolute inset-0 bg-[#FEF08A] rounded-lg shadow-2xs"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center space-x-1">
                      <span>{tab.label}</span>
                      <span className="text-[10px] font-black opacity-80">({tab.count})</span>
                    </span>
                  </button>
                );
              })}
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
                              <div className="w-6 h-6 rounded-md bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
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
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: COMPOSE PUSH BROADCAST (Minimal & Proportioned)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'compose' && (
        <motion.div
          key="tab-compose"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-3"
        >
          
          {/* Left Column: Broadcast Composer (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121216] rounded-xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3">
            
            {/* Form Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
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
                      disabled={isDramasLoading && availableDramas.length === 0}
                      className="w-full pl-3 pr-8 py-1.5 appearance-none rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A] transition-all cursor-pointer text-xs"
                    >
                      <option value="">General (App Home Feed)</option>
                      {availableDramas.map((d) => {
                        const dId = d.id || d._id;
                        const epCount = d.totalEpisodes || (Array.isArray(d.episodes) ? d.episodes.length : 0);
                        return (
                          <option key={dId} value={dId}>
                            {d.title} ({epCount} eps)
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {selectedDramaDetails ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 truncate">
                      🎬 Deep link: /watch/{selectedDramaDetails.slug || selectedDramaDetails.id || selectedDramaDetails._id}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {isDramasLoading ? 'Loading drama catalog from database...' : 'Opens mobile application home page'}
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
                        <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs font-extrabold text-xs shrink-0">
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
                                    <div className="w-6 h-6 rounded-md bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs font-black text-xs shrink-0">
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
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
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

        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: AUTOMATED TRIGGERS (Auto Send Notifications)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'auto' && (
        <motion.div
          key="tab-auto"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="font-urbanist"
        >
          {isAutoLoading && autoTriggers.length === 0 ? (
            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
              <PageLoader size="sm" text="Loading automated triggers..." minHeight="min-h-[200px]" />
            </div>
          ) : sequentialAutoTriggers.length === 0 ? (
            <div className="bg-white dark:bg-[#121216] rounded-2xl p-8 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400 space-y-2 shadow-xs">
              <Zap className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No automated triggers configured.</p>
              <button
                type="button"
                onClick={() => handleOpenAutoModal(null)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs mt-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Trigger</span>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#121216] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
              
              {/* Unified Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Zap className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-950 dark:text-white tracking-tight truncate">
                        Automated Event Triggers
                      </h3>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {autoTriggers.filter((t) => t.isEnabled).length} of {autoTriggers.length} Active
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate">
                      Real-time push dispatches triggered by user lifecycle events
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={fetchAutoTriggers}
                    disabled={isAutoLoading}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                    title="Refresh triggers"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAutoLoading ? 'animate-spin text-amber-500' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAutoModal(null)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs transition-colors shadow-2xs cursor-pointer active:scale-98"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>New Trigger</span>
                  </button>
                </div>
              </div>

              {/* Minimal Clean Triggers List */}
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {sequentialAutoTriggers.map((t) => {
                  const tId = t.id || t._id;
                  const isTesting = testingTriggerId === tId;
                  const stepMeta = LIFECYCLE_STEPS.find((s) => s.key === (t.triggerKey || t.triggerEvent));
                  const IconComponent = stepMeta?.icon || Zap;
                  const triggerTiming = stepMeta?.eventLabel || t.description || 'System Event';
                  const isEnabled = Boolean(t.isEnabled);

                  return (
                    <div
                      key={tId}
                      className="px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-slate-50/70 dark:hover:bg-[#16161C] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      {/* Left: Dynamic State Icon + Trigger Info */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Dynamic Icon Badge: Theme accent when enabled, muted when disabled */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isEnabled
                              ? 'bg-[#FEF08A] text-slate-950 shadow-2xs group-hover:scale-105'
                              : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-white/5 opacity-60'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>

                        {/* Trigger Name, Timing, Audience & Snippet */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                            <h4 className="font-extrabold text-xs sm:text-[13px] text-slate-950 dark:text-white truncate">
                              {t.name}
                            </h4>
                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                              · {triggerTiming}
                            </span>
                            <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 shrink-0">
                              {t.targetAudience}
                            </span>
                          </div>

                          {/* Minimal Clean Notification Snippet */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-2xl flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                              {t.title}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 shrink-0">—</span>
                            <span className="truncate">{t.body}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Clean Action Controls & Toggle */}
                      <div className="flex items-center justify-between md:justify-end space-x-1.5 sm:space-x-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => handleTestSendAuto(t)}
                          disabled={isTesting}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer disabled:opacity-50"
                          title="Send test push to device"
                        >
                          <Send className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-500' : ''}`} />
                          <span>{isTesting ? 'Testing...' : 'Test'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAutoModal(t)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                          title="Edit notification trigger"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {!t.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAutoTrigger(t)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Delete custom trigger"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="h-4 w-px bg-slate-200/80 dark:bg-white/10 mx-0.5" />

                        <ToggleSwitch
                          checked={isEnabled}
                          onChange={() => handleToggleAutoTrigger(tId)}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE / EDIT AUTOMATED NOTIFICATION TRIGGER
         ───────────────────────────────────────────────────────────── */}
      {isAutoModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-urbanist">
            <div className="bg-white dark:bg-[#30303D] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/15 transition-all max-h-[92vh] overflow-y-auto">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shadow-xs shrink-0">
                    <Zap className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white tracking-tight">
                      {editingTrigger ? 'Edit Automated Trigger' : 'Create Automated Trigger'}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">
                      Configure real-time auto-send rules for platform events
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAutoModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSaveAutoTrigger} className="space-y-3.5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Trigger Rule Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={autoFormName}
                      onChange={(e) => setAutoFormName(e.target.value)}
                      placeholder="e.g. Welcome to E² Stories"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Event Category
                    </label>
                    <select
                      value={autoFormCategory}
                      onChange={(e) => setAutoFormCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:outline-hidden"
                    >
                      <option value="USER">User Onboarding</option>
                      <option value="BILLING">Billing & VIP Subscription</option>
                      <option value="CONTENT">Content & Episode Drop</option>
                      <option value="ENGAGEMENT">Engagement & Win-Back</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Target Audience
                    </label>
                    <select
                      value={autoFormAudience}
                      onChange={(e) => setAutoFormAudience(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:outline-hidden"
                    >
                      <option value="All Users">All Users</option>
                      <option value="New Users">New Users Only</option>
                      <option value="Subscribers Only">Subscribers Only</option>
                      <option value="Expiring Users">Expiring Soon (VIP)</option>
                      <option value="Inactive 7+ Days">Inactive 7+ Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Deep Link Route
                    </label>
                    <input
                      type="text"
                      value={autoFormDeepLink}
                      onChange={(e) => setAutoFormDeepLink(e.target.value)}
                      placeholder="/home, /vip, /dramas"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delay (Minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={autoFormDelay}
                      onChange={(e) => setAutoFormDelay(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Notification Title *
                    </label>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-medium">Insert:</span>
                      {['{{userName}}', '{{planName}}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAutoFormTitle((prev) => `${prev} ${v}`)}
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-200/80 dark:bg-amber-400/20 text-amber-950 dark:text-amber-300 hover:opacity-80 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={autoFormTitle}
                    onChange={(e) => setAutoFormTitle(e.target.value)}
                    placeholder="e.g. 🎬 Welcome to E² Stories, {{userName}}!"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Notification Body Copy *
                    </label>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-medium">Insert:</span>
                      {['{{userName}}', '{{planName}}', '{{dramaTitle}}'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAutoFormBody((prev) => `${prev} ${v}`)}
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-200/80 dark:bg-amber-400/20 text-amber-950 dark:text-amber-300 hover:opacity-80 cursor-pointer"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={autoFormBody}
                    onChange={(e) => setAutoFormBody(e.target.value)}
                    placeholder="e.g. Dive into trending vertical web series and original micro-dramas. Start watching now!"
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-[#18181E] focus:bg-white dark:focus:bg-[#121216] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
                  />
                </div>

                {/* Mobile Notification Preview Card */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#1A1A22] border border-slate-200 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Mobile Device Notification Mockup
                  </span>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121216] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 font-black text-xs">
                      E²
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold">E² Stories</span>
                        <span>now</span>
                      </div>
                      <p className="text-xs font-black text-slate-950 dark:text-white truncate">
                        {autoFormTitle || 'Notification Title'}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight line-clamp-2">
                        {autoFormBody || 'Notification body copy preview...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-[#18181E] border border-slate-200/60 dark:border-white/5">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Enable Auto Sending</p>
                    <p className="text-[10.5px] text-slate-400">When enabled, the backend will auto-dispatch on trigger event</p>
                  </div>
                  <ToggleSwitch
                    checked={autoFormEnabled}
                    onChange={(checked) => setAutoFormEnabled(checked)}
                    size="sm"
                  />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAutoModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAuto}
                    className="px-4 py-1.5 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    {isSubmittingAuto ? 'Saving...' : editingTrigger ? 'Save Changes' : 'Create Trigger'}
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

