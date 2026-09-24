import React, { useState, useEffect, useMemo } from 'react';
import { notificationService } from '../../services/notificationService';
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
  Search
} from 'lucide-react';

export default function AppNotificationsPage() {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal & Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [target, setTarget] = useState('All Active Users');
  const [priority, setPriority] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getAnnouncements();
      setNotices(data.announcements || []);
    } catch (err) {
      setError(err.message || 'Failed to load in-app announcements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

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

      if (result.announcement) {
        setNotices(prev => [result.announcement, ...prev]);
      }

      setFeedback({
        type: 'success',
        message: `Notice published successfully! Delivered to ${result.recipientsCount} active user inbox(es).`
      });

      setIsModalOpen(false);
      setTitle('');
      setBody('');
      setCategory('SYSTEM');
      setTarget('All Active Users');
      setPriority('Normal');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to publish in-app notice'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this in-app notice?')) return;

    try {
      await notificationService.deleteAnnouncement(id);
      setNotices(prev => prev.filter(n => (n.id || n._id) !== id));
      setFeedback({
        type: 'success',
        message: 'Notice removed successfully.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete notice'
      });
    }
  };

  const handleToggle = async (id) => {
    try {
      const result = await notificationService.toggleAnnouncement(id);
      if (result.announcement) {
        setNotices(prev =>
          prev.map(n => ((n.id || n._id) === id ? result.announcement : n))
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



  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter(n => {
      const matchesSearch =
        !searchTerm ||
        (n.title && n.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.body && n.body.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.target && n.target.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'ALL' || n.category === selectedCategory;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && n.isActive) ||
        (statusFilter === 'INACTIVE' && !n.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [notices, searchTerm, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6 font-urbanist selection:bg-[#FEF08A] selection:text-black">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
            <Megaphone className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              In-App Notifications
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Broadcast system notices, updates, and offers directly into the user mobile inbox.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={fetchNotices}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors border border-slate-200/80 dark:border-white/10 cursor-pointer"
            title="Refresh from server"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 text-xs font-bold transition-all shadow-xs shrink-0 active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Notice</span>
          </button>
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

      {/* 3. Controls & Filter Bar */}
      <div className="bg-white dark:bg-[#121612] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/10 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'SYSTEM', label: 'System' },
            { id: 'OFFER', label: 'Offers' },
            { id: 'BILLING', label: 'Billing' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === tab.id
                  ? 'bg-[#FEF08A] text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/[0.1]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Status Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#161B16] focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-1 focus:ring-[#FEF08A]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#161B16] focus:outline-hidden"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. Notices List / Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
            <span>Loading announcements from database...</span>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white dark:bg-[#121612] rounded-2xl p-12 border border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-400 space-y-2">
            <Megaphone className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 stroke-[1.5]" />
            <p className="font-bold text-slate-600 dark:text-slate-400">No in-app notices match your filters.</p>
            <p className="text-[11px] text-slate-400">Click "New Notice" to publish an in-app announcement to user inboxes.</p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const id = notice.id || notice._id;
            return (
              <div
                key={id}
                className="bg-white dark:bg-[#121612] rounded-2xl p-5 border border-slate-200/80 dark:border-white/10 shadow-nodus flex items-start justify-between gap-4 hover:border-slate-300 dark:hover:border-white/20 transition-all"
              >
                <div className="flex items-start space-x-3.5 min-w-0">
                  {/* Uniform #FEF08A Icon Badge */}
                  <div className="w-10 h-10 rounded-xl bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400 shrink-0 shadow-xs">
                    {notice.category === 'SYSTEM' ? (
                      <Info className="w-5 h-5 stroke-[2.2]" />
                    ) : notice.category === 'OFFER' ? (
                      <Sparkles className="w-5 h-5 stroke-[2.2]" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-extrabold text-sm text-slate-950 dark:text-white">
                        {notice.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                        {notice.category}
                      </span>
                      {notice.priority === 'High' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                      {notice.body}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 dark:text-slate-500 pt-1 font-medium flex-wrap gap-y-1">
                      <span>Target: <strong className="text-slate-700 dark:text-slate-200">{notice.target}</strong></span>
                      <span>•</span>
                      <span>{formatTimeAgo(notice.createdAt)}</span>
                      <span>•</span>
                      <button
                        onClick={() => handleToggle(id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          notice.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-200/80 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {notice.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(id)}
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0 cursor-pointer"
                  title="Delete notice"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Modal - Level 24dp Elevated Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#282E28] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-white/15 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#FEF08A]/40 border border-amber-200/60 dark:border-amber-700/40 flex items-center justify-center text-slate-950 dark:text-amber-400">
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
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Maintenance Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
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
                    className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
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
                    className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
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
                  className="w-full px-3.5 py-2.5 font-bold bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all"
                >
                  <option value="All Active Users">All Active Users</option>
                  <option value="Subscribers Only">Subscribers Only</option>
                  <option value="New Users (Last 7 Days)">New Users (Last 7 Days)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Notice Body Copy *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the message description that will appear in user mobile inboxes..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-medium bg-slate-50 dark:bg-[#161B16] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#121612] focus:outline-hidden focus:ring-2 focus:ring-[#FEF08A]/60 focus:border-[#FEF08A] transition-all leading-relaxed"
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
                  className="px-5 py-2 bg-[#FEF08A] hover:bg-[#FDE047] disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
