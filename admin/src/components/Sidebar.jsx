import React from 'react';
import {
  LayoutDashboard,
  Clapperboard,
  Upload,
  Image as ImageIcon,
  Layers,
  Users,
  BadgeCheck,
  CreditCard,
  Receipt,
  TicketPercent,
  Gift,
  BadgePercent,
  SendHorizontal,
  Bell,
  Shield,
  Settings,
  SlidersHorizontal,
  Sparkles,
  PanelLeft
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  onOpenIngestModal,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle
}) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = React.useCallback(() => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch { }
        return next;
      });
    }
  }, [controlledToggle]);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar cleanly
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCollapse]);

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
        { id: 'banners', label: 'Banners', icon: ImageIcon },
        { id: 'genres', label: 'Genres', icon: Layers },
        { id: 'category_priority', label: 'Category Priority', icon: SlidersHorizontal },
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
        { id: 'promos', label: 'Promo Codes', icon: TicketPercent },
        { id: 'vouchers', label: 'Plan Vouchers', icon: Gift },
        { id: 'admob', label: 'Google AdMob', icon: BadgePercent },
        { id: 'custom_ads', label: 'Custom Ads', icon: Sparkles },
        { id: 'ad_control', label: 'Ads Control', icon: SlidersHorizontal },
      ]
    },
    {
      title: 'ENGAGEMENT',
      items: [
        { id: 'notifications', label: 'Push Notifications', icon: SendHorizontal },
        { id: 'app_notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'legal', label: 'Legal', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    },
  ];

  return (
    <aside
      className={`${isCollapsed ? 'w-[68px]' : 'w-[240px]'
        } bg-white dark:bg-[#0D0D11] text-slate-900 dark:text-slate-100 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-200/80 dark:border-white/10 shadow-[1px_0_12px_-4px_rgba(15,23,42,0.04)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.6)] z-40 font-urbanist selection:bg-[#FEF08A] selection:text-black transition-[width] duration-200 ease-in-out will-change-[width]`}
    >
      {/* 1. Header (Logo & Collapse Toggle) */}
      <div className={`h-16 px-3.5 border-b border-slate-100 dark:border-white/10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} bg-white dark:bg-[#0D0D11] shrink-0 overflow-hidden`}>
        {isCollapsed ? (
          /* Collapsed View: Logo trigger button with expand icon on hover */
          <button
            type="button"
            onClick={toggleCollapse}
            title="Expand sidebar (Ctrl+B)"
            aria-label="Expand sidebar"
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#141419] p-1 shadow-xs border border-white/10 flex items-center justify-center transition-all duration-200 group-hover:scale-90 group-hover:opacity-15">
              <img
                src="/logo-transparent.png"
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
              <PanelLeft className="w-4 h-4 stroke-[2] text-slate-900 dark:text-white" />
            </div>
          </button>
        ) : (
          /* Expanded View: Full Brand Identity + Minimal Single Toggle Button */
          <>
            <div
              className="flex items-center space-x-3 min-w-0 cursor-pointer group"
              onClick={() => setActiveTab('summary')}
              title="E² Stories Admin Panel"
            >
              <div className="w-8 h-8 rounded-lg bg-[#141419] p-1 shadow-xs border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img
                  src="/logo-transparent.png"
                  alt="Admin Panel Logo"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                />
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <span className="font-bold text-[14.5px] text-slate-900 dark:text-white leading-tight tracking-tight truncate">
                  E² Stories
                </span>
                <span className="text-[10.5px] font-semibold text-slate-400 dark:text-white/45 leading-none mt-0.5 tracking-wide uppercase">
                  Admin Panel
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleCollapse}
              title="Collapse sidebar (Ctrl+B)"
              aria-label="Collapse sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 dark:text-white/45 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4 stroke-[1.9]" />
            </button>
          </>
        )}
      </div>

      {/* 2. Navigation Area */}
      <nav className={`flex-1 py-3 px-2.5 space-y-4 ${isCollapsed ? 'no-scrollbar' : 'custom-scrollbar'} overflow-y-auto overflow-x-hidden`}>
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {/* Section Header or Divider */}
            {isCollapsed ? (
              sIdx > 0 && <div className="h-[1px] w-6 mx-auto bg-slate-200/80 dark:bg-white/10 my-2" title={section.title} />
            ) : (
              <div className="px-3 pt-1 pb-0.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/35 uppercase tracking-[0.08em] block truncate select-none">
                  {section.title}
                </span>
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`relative flex items-center overflow-hidden transition-all duration-150 group sidebar-item-wave cursor-pointer ${isCollapsed
                        ? 'w-10 h-10 mx-auto justify-center rounded-xl'
                        : 'w-full h-9.5 px-3 rounded-xl justify-start text-[13px]'
                      } ${isActive
                        ? `bg-[#FEF08A] text-slate-950 font-bold border border-amber-300/80 shadow-xs ${isCollapsed ? 'ring-2 ring-[#FEF08A]/80 ring-offset-2 ring-offset-white dark:ring-offset-[#0D0D11]' : ''
                        }`
                        : 'text-slate-600 dark:text-white/70 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100/90 dark:hover:bg-white/[0.06] font-medium'
                      }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Consistent Fixed-Width Icon Container */}
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <Icon
                        className={`w-4 h-4 transition-colors duration-150 ${isActive
                            ? 'text-slate-950 stroke-[2.3]'
                            : 'text-slate-500 dark:text-white/45 group-hover:text-slate-950 dark:group-hover:text-white stroke-[1.8]'
                          }`}
                      />
                    </div>

                    {/* Label - Always Crisp and Left Aligned */}
                    {!isCollapsed && (
                      <span className="truncate tracking-tight ml-2.5 text-left leading-none font-semibold">
                        {item.label}
                      </span>
                    )}

                    {/* Clean Floating Tooltip in Collapsed Mode */}
                    {isCollapsed && (
                      <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-[#1E1E26] text-white text-[11.5px] font-semibold rounded-lg shadow-xl border border-white/12 opacity-0 -translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 whitespace-nowrap backdrop-blur-md">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 3. Refined Sidebar Footer Surface */}
      <div className="h-11 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-[#0A0A0E] shrink-0" />
    </aside>
  );
}
