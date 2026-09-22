import React, { useState } from 'react';
import { mockNotifications, mockDramas } from '../../data/mockOttData';
import { Bell, Send, Smartphone, Sparkles, CheckCircle2, Flame, Users } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [title, setTitle] = useState('🔥 New Episode Alert: Security Guard Ki CEO GF');
  const [message, setMessage] = useState('Episode 24 is now live! Will Kabir reveal his true billionaire identity? Stream now in 1080p.');
  const [targetAudience, setTargetAudience] = useState('All Users');
  const [selectedDrama, setSelectedDrama] = useState('DRM-101');
  const [isSending, setIsSending] = useState(false);

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setIsSending(true);
    setTimeout(() => {
      const newNotif = {
        id: `NOTIF-${Date.now().toString().slice(-3)}`,
        title,
        message,
        target: targetAudience,
        sentAt: 'Just now',
        sentCount: targetAudience === 'All Users' ? '148.9k' : targetAudience === 'Subscribers Only' ? '12.4k' : '24.1k',
        openRate: '0.0%'
      };
      setNotifications([newNotif, ...notifications]);
      setIsSending(false);
      alert('Push notification broadcasted successfully via Firebase Cloud Messaging!');
    }, 600);
  };

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Top Banner */}
      <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2 text-amber-600 font-bold text-xs mb-1">
            <Bell class="w-4 h-4" />
            <span>Push Notifications</span>
          </div>
          <h2 class="text-xl font-extrabold text-slate-950">Send Notifications</h2>
          <p class="text-xs text-slate-400 mt-0.5">Send instant push notifications to users about new episodes and special offers.</p>
        </div>
        <span class="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
          Service Status: Active
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Broadcast Composer */}
        <div class="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-nodus">
          <h3 class="font-extrabold text-base text-slate-950 mb-4">Write Notification</h3>

          <form onSubmit={handleBroadcast} class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-[#FEF08A]"
              >
                <option value="All Users">All Registered Users (148,920 devices)</option>
                <option value="Subscribers Only">Active Subscribers (12,450 users)</option>
                <option value="Inactive 7+ Days">Inactive Users (24,100 users)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Target Series (Deep-Link)</label>
              <select
                value={selectedDrama}
                onChange={(e) => setSelectedDrama(e.target.value)}
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 bg-slate-50 focus:outline-none focus:border-[#FEF08A]"
              >
                {mockDramas.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Notification Title (with emojis)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                class="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 focus:outline-none focus:border-[#FEF08A]"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Message Copy</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                class="w-full p-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:outline-none focus:border-[#FEF08A]"
              ></textarea>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span class="text-slate-400 font-medium text-[11px]">Instant delivery via Firebase FCM</span>
              <button
                type="submit"
                disabled={isSending}
                class="py-2.5 px-6 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold rounded-xl flex items-center space-x-2 transition-all"
              >
                <Send class="w-4 h-4 text-black" />
                <span>{isSending ? 'Broadcasting...' : 'Send Push Broadcast'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Lockscreen Notification Preview */}
        <div class="lg:col-span-5 bg-slate-950 rounded-2xl p-6 text-white flex flex-col items-center justify-center border border-slate-800 shadow-2xl relative overflow-hidden">
          <p class="text-[10px] font-extrabold text-amber-300 uppercase tracking-widest mb-4">
            Live Notification Preview
          </p>

          {/* Smartphone Frame */}
          <div class="w-64 bg-slate-900 rounded-[2.5rem] p-3 border-4 border-slate-700 shadow-2xl relative">
            <div class="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-4"></div>

            {/* Lockscreen Wallpaper & Notification Card */}
            <div class="h-80 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden">
              <div>
                <p class="text-[10px] font-mono text-center text-slate-400">16:04 • Wednesday, Sept 16</p>

                {/* Pop-up Notification Pill */}
                <div class="mt-4 p-3 bg-white/95 backdrop-blur-md rounded-2xl text-slate-900 shadow-lg border border-white/20">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center space-x-1.5">
                      <div class="w-4 h-4 rounded bg-[#080B08] flex items-center justify-center text-[9px] font-extrabold text-[#FEF08A]">
                        E²
                      </div>
                      <span class="text-[10px] font-extrabold tracking-tight">E² STORIES</span>
                    </div>
                    <span class="text-[9px] text-slate-400">now</span>
                  </div>
                  <h5 class="text-[11px] font-extrabold text-slate-950 leading-tight mb-0.5">
                    {title || 'New Episode Alert'}
                  </h5>
                  <p class="text-[10px] text-slate-600 leading-snug line-clamp-2">
                    {message || 'Watch the latest episode now.'}
                  </p>
                </div>
              </div>

              <div class="text-center">
                <p class="text-[9px] text-slate-500 font-medium">Swipe up to stream in app</p>
              </div>
            </div>

            <div class="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3"></div>
          </div>
        </div>

      </div>

      {/* Broadcast History Table */}
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-bold text-slate-950 text-sm">Past Broadcast History</h3>
          <span class="text-xs text-slate-400">{notifications.length} alerts sent</span>
        </div>

        <div class="divide-y divide-slate-100 text-xs font-medium">
          {notifications.map((n) => (
            <div key={n.id} class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
              <div>
                <p class="font-bold text-slate-900">{n.title}</p>
                <p class="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
              </div>
              <div class="flex items-center space-x-4 text-right shrink-0">
                <div>
                  <span class="font-bold text-slate-800 block">{n.sentCount} devices</span>
                  <span class="text-[10px] text-slate-400">{n.sentAt}</span>
                </div>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                  {n.openRate} Open
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
