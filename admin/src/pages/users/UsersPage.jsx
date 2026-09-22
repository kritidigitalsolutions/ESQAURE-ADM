import React, { useState } from 'react';
import { mockUsers } from '../../data/mockOttData';
import { Users, Search, Crown, Shield, MoreVertical, CheckCircle2, XCircle, Clock, Smartphone, Edit3 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'VIP' | 'FREE' | 'SUSPENDED'
  const [overrideUser, setOverrideUser] = useState(null);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.phone.includes(searchTerm) ||
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' ||
                          (filterType === 'VIP' && u.isVip) ||
                          (filterType === 'FREE' && !u.isVip && u.status === 'ACTIVE') ||
                          (filterType === 'SUSPENDED' && u.status === 'SUSPENDED');
    return matchesSearch && matchesFilter;
  });

  const handleGrantVip = (userId, days = 30) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isVip: true,
          plan: 'Comp VIP (Admin Grant)',
          vipExpiresAt: '16 Oct 2026',
        };
      }
      return u;
    }));
    setOverrideUser(null);
  };

  const handleRevokeVip = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          isVip: false,
          plan: 'Free Tier',
          vipExpiresAt: '—',
        };
      }
      return u;
    }));
    setOverrideUser(null);
  };

  return (
    <div class="space-y-6 font-urbanist">
      
      {/* Top Filter & Search Bar */}
      <div class="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-nodus flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div class="relative w-full sm:w-80">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by phone (+91), name, or email..."
            class="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:border-[#FEF08A] focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div class="flex items-center space-x-2 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'VIP', label: 'Subscribers Only' },
            { id: 'FREE', label: 'Free Tier' },
            { id: 'SUSPENDED', label: 'Suspended' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filterType === tab.id
                  ? 'bg-[#FEF08A] text-slate-950 font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Users Registry Table */}
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-nodus overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th class="py-3.5 px-4">User Account</th>
                <th class="py-3.5 px-4">Phone Number (+91)</th>
                <th class="py-3.5 px-4">Subscription</th>
                <th class="py-3.5 px-4">Total Watch Time</th>
                <th class="py-3.5 px-4">Last Active</th>
                <th class="py-3.5 px-4">Status</th>
                <th class="py-3.5 px-4 text-right">VIP Override</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((user) => (
                <tr key={user.id} class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3.5 px-4">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold flex items-center justify-center text-xs shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p class="font-bold text-slate-900">{user.name}</p>
                        <p class="text-[11px] text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {user.phone}
                  </td>
                  <td class="py-3.5 px-4">
                    {user.isVip ? (
                      <div>
                        <span class="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300/40">
                          <Crown class="w-3 h-3 text-amber-600" />
                          <span>VIP ({user.plan})</span>
                        </span>
                        <p class="text-[10px] text-slate-400 mt-0.5">Expires: {user.vipExpiresAt}</p>
                      </div>
                    ) : (
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                        {user.plan}
                      </span>
                    )}
                  </td>
                  <td class="py-3.5 px-4 font-bold text-slate-900">
                    {user.totalWatchTime}
                  </td>
                  <td class="py-3.5 px-4 text-slate-500 text-[11px]">
                    {user.lastActive}
                  </td>
                  <td class="py-3.5 px-4">
                    <span class={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setOverrideUser(user)}
                      class="px-2.5 py-1 bg-slate-100 hover:bg-[#FEF08A] hover:text-black rounded-lg font-bold text-xs transition-colors"
                    >
                      Override Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIP Override Modal */}
      {overrideUser && (
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <h3 class="font-extrabold text-base text-slate-950 mb-1">VIP Access Override</h3>
            <p class="text-xs text-slate-400 mb-4">
              Manually grant complimentary subscription or revoke access for <strong class="text-slate-900">{overrideUser.name}</strong>.
            </p>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1 text-xs">
              <p><span class="text-slate-400">Phone:</span> <strong class="text-slate-800">{overrideUser.phone}</strong></p>
              <p><span class="text-slate-400">Current Status:</span> <strong class="text-slate-800">{overrideUser.isVip ? 'Active VIP' : 'Free Tier'}</strong></p>
            </div>

            <div class="space-y-2">
              <button
                onClick={() => handleGrantVip(overrideUser.id, 30)}
                class="w-full py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <Crown class="w-4 h-4 text-black" />
                <span>Grant 30 Days Complimentary VIP</span>
              </button>

              {overrideUser.isVip && (
                <button
                  onClick={() => handleRevokeVip(overrideUser.id)}
                  class="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition-all"
                >
                  Revoke Subscription
                </button>
              )}

              <button
                onClick={() => setOverrideUser(null)}
                class="w-full py-2 text-slate-500 hover:bg-slate-100 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
