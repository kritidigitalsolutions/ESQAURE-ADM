import React, { useState } from 'react';
import { Bell, Plus, MessageSquare, Sparkles, CheckCircle2, Shield, Info, AlertTriangle, Trash2 } from 'lucide-react';

export default function AppNotificationsPage() {
  const [notices, setNotices] = useState([
    {
      id: 'NOTC-101',
      title: 'Scheduled Stream CDN Maintenance',
      category: 'SYSTEM',
      body: 'Our playback servers will undergo a 10-minute routine optimization on Sunday at 3:00 AM IST. Minor buffer delays may occur.',
      target: 'All Active Users',
      priority: 'High',
      date: 'Today, 09:30 AM',
      isActive: true
    },
    {
      id: 'NOTC-102',
      title: 'Welcome 50 Bonus Coins Added!',
      category: 'OFFER',
      body: 'Thank you for installing E² Stories! 50 bonus unlock coins have been deposited into your mobile wallet to enjoy episode unlocks.',
      target: 'New Users (Last 7 Days)',
      priority: 'Normal',
      date: 'Yesterday',
      isActive: true
    },
    {
      id: 'NOTC-103',
      title: 'Auto-Pay Payment Receipt Verified',
      category: 'BILLING',
      body: 'Your Monthly VIP Pass (₹199) was renewed successfully via Razorpay. Receipt #REC-8849 is available for download.',
      target: 'VIP Subscribers Only',
      priority: 'Normal',
      date: '15 Sep 2026',
      isActive: true
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [target, setTarget] = useState('All Active Users');

  const handleCreateNotice = (e) => {
    e.preventDefault();
    if (!title || !body) return;
    const newNotice = {
      id: `NOTC-${Date.now().toString().slice(-4)}`,
      title,
      body,
      category,
      target,
      priority: 'Normal',
      date: 'Just now',
      isActive: true
    };
    setNotices([newNotice, ...notices]);
    setIsModalOpen(false);
    setTitle('');
    setBody('');
  };

  const handleDelete = (id) => {
    setNotices(notices.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 font-urbanist">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">In-App Notifications</h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Broadcast system announcements, account receipts, and special notices directly into the user app inbox.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold transition-all shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Notice</span>
        </button>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex items-start justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start space-x-3.5 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                notice.category === 'SYSTEM'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : notice.category === 'OFFER'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {notice.category === 'SYSTEM' ? (
                  <Info className="w-5 h-5" />
                ) : notice.category === 'OFFER' ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-black">{notice.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                    {notice.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notice.body}</p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1 font-medium">
                  <span>Target: <strong className="text-slate-700">{notice.target}</strong></span>
                  <span>•</span>
                  <span>{notice.date}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDelete(notice.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
              title="Delete notice"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-950">Publish In-App Notice</h3>
            
            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Upgrade Completed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="SYSTEM">System Announcement</option>
                    <option value="OFFER">Coin / Promo Offer</option>
                    <option value="BILLING">Billing & Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Target Audience</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="All Active Users">All Active Users</option>
                    <option value="VIP Subscribers Only">VIP Subscribers Only</option>
                    <option value="New Users (Last 7 Days)">New Users (Last 7 Days)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Notice Content Message *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write the message that will appear in users' notification tray..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold shadow-xs"
                >
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
