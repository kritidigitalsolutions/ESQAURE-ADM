import React, { useState, useEffect, useMemo, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import { mockDramas } from '../../data/mockOttData';
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
  Smartphone
} from 'lucide-react';

const PUSH_TEMPLATES = [
  {
    label: 'Test Notification',
    emoji: '🧪',
    title: '🧪 FCM Test Broadcast: Push Delivery Check',
    message: 'This is a test notification from the E² admin console. If you are seeing this, push messaging is operating smoothly!'
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
    label: 'Subscriber Pass',
    emoji: '👑',
    title: '👑 Subscriber Exclusive: Unlock All Episodes',
    message: 'Enjoy commercial-free, unrestricted access to all original episodes. Start watching now!'
  },
  {
    label: 'Urgent Alert',
    emoji: '⚡',
    title: '⚡ Don’t Miss Out: Special Event Streaming Live',
    message: 'Exclusive special premiere is happening now on E² Stories. Tap to jump straight in!'
  }
];

export default function NotificationsPage() {
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

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('All Users');
  const [selectedDrama, setSelectedDrama] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('ALL');

  // Specific User state
  const [usersList, setUsersList] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const userPickerRef = useRef(null);

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

  // Filtered broadcast history
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch =
        !historySearchTerm ||
        (c.title && c.title.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
        (c.message && c.message.toLowerCase().includes(historySearchTerm.toLowerCase())) ||
        (c.targetAudience && c.targetAudience.toLowerCase().includes(historySearchTerm.toLowerCase()));

      const matchesFilter =
        historyFilter === 'ALL' ||
        (historyFilter === 'SUBSCRIBERS' && c.targetAudience === 'Subscribers Only') ||
        (historyFilter === 'ALL_USERS' && c.targetAudience === 'All Users') ||
        (historyFilter === 'INACTIVE' && c.targetAudience === 'Inactive 7+ Days') ||
        (historyFilter === 'SPECIFIC' && c.targetAudience.startsWith('User:'));

      return matchesSearch && matchesFilter;
    });
  }, [campaigns, historySearchTerm, historyFilter]);

  return (
    <div className="space-y-6 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Send className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Push Notifications
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Broadcast instant push alerts to registered mobile devices via Firebase Cloud Messaging (FCM).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={fetchCampaigns}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Refresh statistics and history from server"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center space-x-2 shadow-xs">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span>FCM Engine: Connected</span>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
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

      {/* 2. Main Studio: Organized 2-Column Clean Minimal Architecture (No Device Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Broadcast Composer (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/50 border border-amber-200/70 dark:border-amber-600/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-2xs">
                <Send className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white tracking-tight">
                  Compose Push Broadcast
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Send high-priority notification to targeted OTT viewers.
                </p>
              </div>
            </div>

            {(title || message || selectedDrama || selectedUser) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick-Start Template Selector Dropdown */}
          <div className="p-2.5 mb-4 rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#FEF08A]/50 border border-amber-300/40 dark:border-amber-600/30 flex items-center justify-center text-slate-950 dark:text-amber-400 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Notification Template:
              </span>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <select
                value=""
                onChange={(e) => {
                  const tmpl = PUSH_TEMPLATES.find(t => t.label === e.target.value);
                  if (tmpl) {
                    setTitle(tmpl.title);
                    setMessage(tmpl.message);
                  }
                }}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-bold appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1E241E] text-slate-800 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-600/40 focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 transition-all cursor-pointer shadow-2xs"
              >
                <option value="" disabled>✨ Load ready-made template...</option>
                {PUSH_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.label} value={tmpl.label}>
                    {tmpl.emoji} {tmpl.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            
            {/* Audience & Series Pickers in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center space-x-1.5">
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
                    className="w-full pl-3.5 pr-9 py-2.5 appearance-none rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all cursor-pointer"
                  >
                    <option value="All Users">All Registered Users ({stats.totalUsers.toLocaleString()})</option>
                    <option value="Subscribers Only">Subscribers Only ({stats.subscribers.toLocaleString()})</option>
                    <option value="Inactive 7+ Days">Inactive Users 7+ Days ({stats.inactiveUsers.toLocaleString()})</option>
                    <option value="Specific User">🎯 Specific User (Direct Delivery)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 pl-0.5">
                  {targetAudience === 'All Users' && `Reaching all registered mobile viewers (${stats.totalUsers.toLocaleString()} users)`}
                  {targetAudience === 'Subscribers Only' && `Delivering exclusively to active subscribers (${stats.subscribers.toLocaleString()} users)`}
                  {targetAudience === 'Inactive 7+ Days' && `Re-engaging viewers inactive for 7+ days (${stats.inactiveUsers.toLocaleString()} users)`}
                  {targetAudience === 'Specific User' && 'Direct personal push delivery to 1 selected recipient'}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Series (Optional Deep Link)</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedDrama}
                    onChange={(e) => setSelectedDrama(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 appearance-none rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all cursor-pointer"
                  >
                    <option value="">General (Opens Mobile App Home)</option>
                    {availableDramas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({d.totalEpisodes || 0} eps)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                {selectedDramaDetails ? (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 pl-0.5 truncate">
                    🎬 Deep-link enabled: Opens "/watch/{selectedDramaDetails.slug || selectedDramaDetails.id}" on launch
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1 pl-0.5">
                    Opens mobile app main home screen
                  </p>
                )}
              </div>
            </div>

            {/* Specific User Search & Recipient Card */}
            {targetAudience === 'Specific User' && (
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161B16] border border-slate-200/90 dark:border-white/10 space-y-3 transition-all">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5 text-xs">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>Specific Recipient User *</span>
                  </label>
                  {selectedUser ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Recipient Selected</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Required
                    </span>
                  )}
                </div>

                {selectedUser ? (
                  /* Chosen User Card */
                  <div className="p-3 bg-white dark:bg-[#1A201A] rounded-xl border border-slate-200/90 dark:border-white/15 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 font-extrabold text-xs shrink-0 shadow-2xs">
                        {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-950 dark:text-white truncate">
                            {selectedUser.name || 'Anonymous User'}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              selectedUser.isVip
                                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-white/[0.08] dark:text-slate-300'
                            }`}
                          >
                            {selectedUser.isVip ? 'Subscriber' : 'Free Tier'}
                          </span>
                          {selectedUser.fcmTokens && selectedUser.fcmTokens.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active Device
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
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
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] transition-colors cursor-pointer shrink-0 border border-slate-200/80 dark:border-white/10"
                    >
                      Change User
                    </button>
                  </div>
                ) : (
                  /* User Search Combobox */
                  <div className="relative" ref={userPickerRef}>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search user by name, phone (+91), or email..."
                        value={userSearchTerm}
                        onFocus={() => setIsUserPickerOpen(true)}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setIsUserPickerOpen(true);
                        }}
                        className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-medium text-slate-900 dark:text-white bg-white dark:bg-[#1A201A] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all text-xs"
                      />
                      {userSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setUserSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {isUserPickerOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white dark:bg-[#1E241E] border border-slate-200 dark:border-white/15 rounded-xl shadow-xl z-30 divide-y divide-slate-100 dark:divide-white/5">
                        {isUsersLoading ? (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                            <span>Loading user directory...</span>
                          </div>
                        ) : filteredUsersList.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            {usersList.length === 0
                              ? 'No registered users found in directory.'
                              : `No users found matching "${userSearchTerm}".`}
                          </div>
                        ) : (
                          filteredUsersList.map((u) => {
                            const uId = u.id || u._id;
                            const hasFcm = Array.isArray(u.fcmTokens) && u.fcmTokens.length > 0;
                            return (
                              <button
                                key={uId}
                                type="button"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setIsUserPickerOpen(false);
                                }}
                                className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center space-x-3 min-w-0 pr-2">
                                  <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/30 border border-amber-200/50 dark:border-amber-700/30 flex items-center justify-center text-slate-950 dark:text-amber-400 font-black text-xs shrink-0">
                                    {(u.name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {u.name || 'Anonymous User'}
                                      </span>
                                      {u.isVip && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                          Subscriber
                                        </span>
                                      )}
                                      {hasFcm && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                          Device Active
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                      {u.phone || u.email || uId}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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

            {/* Notification Title & Emoji Shortcut Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  <span>Notification Title *</span>
                </label>
                <span className={`text-[11px] font-semibold ${title.length > 55 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {title.length} / 65 characters
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={title}
                  maxLength={65}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. New Episode Alert: Watch Episode 12 Now!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                />
                {title && (
                  <button
                    type="button"
                    onClick={() => setTitle('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification Message Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Notification Message Copy *</span>
                </label>
                <span className={`text-[11px] font-semibold ${message.length > 150 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {message.length} / 180 characters
                </span>
              </div>
              <textarea
                value={message}
                maxLength={180}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder="Type the message description that will appear on user lockscreens and notification shade..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all leading-relaxed resize-none"
              ></textarea>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                  <Smartphone className="w-3 h-3 text-amber-500" />
                  <span>
                    {targetAudience === 'Specific User'
                      ? selectedUser ? `Direct: ${selectedUser.name || 'User'}` : 'Select 1 Recipient'
                      : `~${stats.totalUsers.toLocaleString()} Viewers`}
                  </span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSending || !title.trim() || !message.trim() || (targetAudience === 'Specific User' && !selectedUser)}
                className="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs hover:shadow active:scale-98 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 text-slate-950 stroke-[2.2]" />
                <span>
                  {isSending
                    ? 'Broadcasting Push...'
                    : targetAudience === 'Specific User'
                    ? selectedUser
                      ? `Send Push to ${selectedUser.name ? selectedUser.name.split(' ')[0] : 'User'}`
                      : 'Select a User to Send'
                    : 'Send Push Broadcast'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Clean Minimal Real-Time Preview & Delivery Infrastructure (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121612] rounded-2xl p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col justify-between space-y-6 transition-all">
          
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0">
                  <Bell className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 dark:text-white tracking-tight">
                    Live Message Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Real-time rendering of the mobile notification card.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                Card Preview
              </span>
            </div>

            {/* Clean Modern Notification Card (Elevated Level 2 Surface, No Device Mockup) */}
            <div className="p-4 bg-slate-50 dark:bg-[#161B16] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-sm relative overflow-hidden transition-all">
              
              {/* Top Meta Line: App Icon, Brand Name, Timestamp, Bell */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FEF08A] text-slate-950 font-black text-[11px] flex items-center justify-center shadow-2xs">
                    E²
                  </div>
                  <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                    E² STORIES
                  </span>
                  <span className="text-slate-300 dark:text-white/20">·</span>
                  <span className="text-[11px] text-slate-400 font-medium">Just now</span>
                </div>
                <Bell className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {/* Recipient tag if Specific User is chosen */}
              {targetAudience === 'Specific User' && (
                selectedUser ? (
                  <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span className="truncate">Direct recipient: {selectedUser.name || selectedUser.phone}</span>
                  </div>
                ) : (
                  <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-300/60 dark:border-amber-700/40 text-amber-700 dark:text-amber-300 text-[11px] font-medium flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>Awaiting user selection from directory...</span>
                  </div>
                )
              )}

              {/* Dynamic Notification Content */}
              <div className="pt-3 space-y-1.5">
                <h4 className="text-sm font-extrabold text-slate-950 dark:text-white leading-snug">
                  {title.trim() || 'Your notification title will appear here...'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                  {message.trim() || 'Notification body copy will be previewed here in real-time as you compose your push alert message.'}
                </p>
              </div>

              {/* Deep-link badge if selected */}
              {selectedDramaDetails && (
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-bold truncate">
                    <Film className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Opens: {selectedDramaDetails.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    Auto Deep-Link
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* FCM Delivery Architecture Specification Box */}
          <div className="p-4 bg-slate-50/70 dark:bg-[#141914] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
              FCM Engine Diagnostics
            </span>
            
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Protocol</span>
              <span className="font-bold text-slate-900 dark:text-white">FCM v1 REST API</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Priority Class</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">High (Direct Wake-Lock)</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Sound & Vibration</span>
              <span className="font-bold text-slate-900 dark:text-white">Default OTT Channel</span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="font-medium">Target Scope</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {targetAudience === 'Specific User'
                  ? selectedUser
                    ? `User: ${selectedUser.name}`
                    : 'Awaiting User Selection'
                  : targetAudience}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 3. Past Broadcast History Table */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-nodus overflow-hidden transition-all">
        
        {/* Table Controls Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <h3 className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight">
              Past Broadcast History
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
              {campaigns.length} total
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-[#161B16] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
              />
            </div>

            {/* Filter Selector */}
            <select
              value={historyFilter}
              onChange={(e) => setHistoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-[#161B16] focus:outline-hidden"
            >
              <option value="ALL">All Campaigns</option>
              <option value="ALL_USERS">All Users</option>
              <option value="SUBSCRIBERS">Subscribers</option>
              <option value="INACTIVE">Inactive 7+ Days</option>
              <option value="SPECIFIC">Specific User Only</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading broadcast records from database...</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="font-bold text-slate-600 dark:text-slate-400">No past push broadcasts found.</p>
            <p className="text-[11px] text-slate-400">Compose and send your first push alert above to see campaign metrics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <th className="py-3.5 px-5">Campaign & Message</th>
                  <th className="py-3.5 px-4">Audience Target</th>
                  <th className="py-3.5 px-4">Deep Link</th>
                  <th className="py-3.5 px-4 text-right">Recipients</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                {filteredCampaigns.map((n) => {
                  const id = n.id || n._id;
                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Campaign & Message */}
                      <td className="py-3.5 px-5 min-w-[220px] max-w-[340px]">
                        <p className="font-extrabold text-slate-950 dark:text-white truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {n.message}
                        </p>
                      </td>

                      {/* Audience */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            n.targetAudience && n.targetAudience.startsWith('User:')
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                          }`}
                        >
                          {n.targetAudience}
                        </span>
                      </td>

                      {/* Deep Link */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {n.deepLink ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            <Film className="w-3 h-3" />
                            <span>{n.deepLink}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">General App</span>
                        )}
                      </td>

                      {/* Recipients */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {(n.sentCount || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {n.sentCount === 1 ? 'device' : 'devices'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>{formatTimeAgo(n.createdAt)}</span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
                          {n.status || 'SENT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
