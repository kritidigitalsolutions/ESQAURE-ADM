import React from 'react';
import {
  LayoutDashboard,
  Clapperboard,
  Upload,
  Layers,
  Users,
  BadgeCheck,
  CreditCard,
  Receipt,
  TicketPercent,
  BadgePercent,
  SendHorizontal,
  Bell,
  Clock,
  Shield,
  Settings
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenIngestModal,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle
}) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = controlledToggle || (() => setInternalCollapsed(prev => !prev));

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'summary', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { id: 'dramas', label: 'Content Library', icon: Clapperboard },
        { id: 'upload', label: 'Upload Content', icon: Upload },
        { id: 'genres', label: 'Genres', icon: Layers },
      ]
    },
    {
      title: 'AUDIENCE',
      items: [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'subscribers', label: 'Subscribers', icon: BadgeCheck },
      ]
    },
    {
      title: 'MONETIZATION',
      items: [
        { id: 'subscriptions', label: 'Subscription Plans', icon: CreditCard },
        { id: 'transactions', label: 'Transactions', icon: Receipt },
        { id: 'promos', label: 'Promos & Vouchers', icon: TicketPercent },
        { id: 'admob', label: 'AdMob', icon: BadgePercent },
      ]
    },
    {
      title: 'ENGAGEMENT',
      items: [
        { id: 'notifications', label: 'Push Notifications', icon: SendHorizontal },
        { id: 'app_notifications', label: 'In-App Notices', icon: Bell },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'auditlog', label: 'Activity Log', icon: Clock },
        { id: 'legal', label: 'Legal', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[76px]' : 'w-64'
      } bg-white dark:bg-[#141914] text-slate-900 dark:text-slate-100 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-200/90 dark:border-white/10 shadow-[1px_0_12px_-4px_rgba(15,23,42,0.04)] dark:shadow-[1px_0_12px_-4px_rgba(0,0,0,0.5)] z-40 font-urbanist selection:bg-[#FEF08A] selection:text-black transition-[width] duration-300 ease-in-out`}
    >
      
      {/* 1. Header & Brand Identity */}
      <div className={`p-4 border-b border-slate-100 dark:border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} bg-white dark:bg-[#141914] shrink-0`}>
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} cursor-pointer group min-w-0 w-full`}
          onClick={() => setActiveTab('summary')}
          title="E² Stories Admin Panel"
        >
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 p-1.5 shadow-sm border border-slate-800/80 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
            <img
              src="/logo-transparent.png"
              alt="Admin Panel Logo"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#141914] rounded-full"></span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold tracking-tight text-black dark:text-white text-[18.5px] font-urbanist leading-none truncate">
                  E² Stories
                </span>
              </div>
              <p className="text-[12.5px] font-semibold text-slate-600 dark:text-slate-400 truncate mt-0.5">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Navigation Links Area */}
      <nav className={`flex-1 ${isCollapsed ? 'p-2 space-y-2.5' : 'p-3 space-y-2'} overflow-y-auto overflow-x-hidden custom-scrollbar`}>
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={isCollapsed ? 'space-y-1' : 'space-y-0.5'}>
            {isCollapsed ? (
              sIdx > 0 && <div className="my-2 mx-auto w-6 border-t border-slate-200/80 dark:border-white/10" title={section.title} />
            ) : (
              <div className={`px-3 ${sIdx === 0 ? 'pb-1' : 'pt-2 pb-1'} flex items-center justify-between`}>
                <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                  {section.title}
                </span>
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center transition-all duration-150 group sidebar-item-wave ${
                    isCollapsed
                      ? `w-10 h-10 mx-auto justify-center rounded-xl ${
                          isActive
                            ? 'bg-[#FEF08A] text-black shadow-xs ring-1 ring-amber-300/80 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-white/[0.06]'
                        }`
                      : `w-full justify-between px-3 py-2 rounded-xl text-[13.5px] ${
                          isActive
                            ? 'bg-[#FEF08A] text-black shadow-xs border border-amber-300/60 font-bold'
                            : 'text-slate-800 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-white/[0.06] font-semibold'
                        }`
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  {/* Left Active Accent Indicator Bar */}
                  {!isCollapsed && isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-black rounded-r-full" />
                  )}

                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5 min-w-0'}`}>
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 transition-all duration-150 group-hover:scale-105 ${
                        isActive
                          ? 'text-black stroke-[2.2]'
                          : 'text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white stroke-[1.8]'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate tracking-tight font-semibold">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Collapsed Tooltip */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-900 text-[12px] font-semibold rounded-lg shadow-xl border border-slate-800 dark:border-slate-200 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-slate-950 dark:border-r-slate-100" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

    </aside>
  );
}
