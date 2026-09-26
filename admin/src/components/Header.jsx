import React from 'react';
import { Plus, Bell, ChevronDown, User, Shield, Sparkles } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenIngestModal }) {
  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'dramas', label: 'Series' },
    { id: 'episodes', label: 'Episodes' },
    { id: 'users', label: 'Users' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header class="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm font-urbanist">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          {/* Transparent E² Stories Logo */}
          <div class="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('summary')}>
            <img
              src="/logo-transparent.png"
              alt="E² Stories Logo"
              class="h-10 w-auto object-contain drop-shadow-sm"
            />
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-extrabold tracking-tight text-slate-900 text-base font-urbanist">E² STORIES</span>
                <span class="px-1.5 py-0.5 text-[10px] font-extrabold bg-amber-100 text-slate-950 rounded-md">OTT ADMIN</span>
              </div>
              <p class="text-[11px] text-slate-400 font-medium">Short-Video OTT Platform</p>
            </div>
          </div>

          {/* Centered Navigation Pills */}
          <nav class="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-full border border-slate-200/70">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  class={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-[#FEF08A] text-slate-950 font-extrabold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div class="flex items-center space-x-3">
            <button
              onClick={onOpenIngestModal}
              class="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-[#FEF08A] hover:bg-[#FDE047] rounded-full transition-all"
            >
              <Plus class="w-3.5 h-3.5 text-black" />
              <span>Upload Content</span>
            </button>

            <button class="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full relative transition-colors">
              <Bell class="w-4 h-4" />
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>

            <button title="Admin Profile" className="relative flex items-center justify-center cursor-pointer hover:opacity-95 transition-all pl-3 border-l border-slate-200 group">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs group-hover:bg-slate-200/80 transition-all duration-200">
                <User className="w-4 h-4 text-slate-700" strokeWidth={2} />
              </div>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
