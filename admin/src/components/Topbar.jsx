import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronLeft, ChevronRight, Maximize, Minimize, User, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import GlobalSearchBar from './GlobalSearchBar';
import NotificationDropdown from './NotificationDropdown';
import Badge from './common/Badge';

export default function Topbar({
  onOpenMobileDrawer,
  title,
  subtitle,
  isSidebarCollapsed,
  onToggleSidebar,
  onLogout,
  onNavigate,
  onSelectDrama,
  onOpenIngestModal
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const [adminName, setAdminName] = useState(() => {
    try {
      return localStorage.getItem('admin_user_name') || 'Administrator';
    } catch {
      return 'Administrator';
    }
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    try {
      return localStorage.getItem('admin_user_email') || 'admin@e2stories.com';
    } catch {
      return 'admin@e2stories.com';
    }
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        setAdminName(localStorage.getItem('admin_user_name') || 'Administrator');
        setAdminEmail(localStorage.getItem('admin_user_email') || 'admin@e2stories.com');
      } catch {}
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('admin_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('admin_profile_updated', handleProfileUpdate);
    };
  }, []);

  return (
    <header className="bg-white/95 dark:bg-[#141914]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 sticky top-0 z-30 px-6 py-3 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] font-urbanist shrink-0">
      <div className="flex items-center justify-between gap-4">

        {/* Left: Sidebar Toggle + Page Title & Subtitle */}
        <div className="flex items-center space-x-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={2.2} />
              ) : (
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" strokeWidth={2.2} />
              )}
            </button>
          )}

          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white font-urbanist leading-tight truncate">
              {title || 'Dashboard Overview'}
            </h1>
          </div>
        </div>

        {/* Right: Search Bar + Fullscreen + Dark Mode + Bell + Profile */}
        <div className="flex items-center space-x-3 shrink-0">

          {/* Global Search Bar */}
          <GlobalSearchBar
            onNavigate={onNavigate}
            onSelectDrama={onSelectDrama}
            onOpenIngestModal={onOpenIngestModal}
          />

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-full transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Radical Theme Switch Toggle */}
          <ThemeToggle variant="topbar" />

          {/* Notification Bell Dropdown */}
          <NotificationDropdown onNavigate={onNavigate} />

          {/* Profile Avatar Dropdown */}
          <div className="relative pl-2.5 border-l border-slate-200 dark:border-white/10" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title="Admin Profile"
              className="relative flex items-center justify-center cursor-pointer hover:opacity-95 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1A201A] text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200/90 dark:border-white/10 shadow-xs group-hover:bg-slate-200/80 dark:group-hover:bg-[#202620] group-hover:border-slate-300 dark:group-hover:border-white/20 transition-all duration-200">
                <User className="w-4 h-4 text-slate-700 dark:text-slate-300" strokeWidth={2} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#141914] rounded-full shadow-xs"></span>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1C221C] border border-slate-200 dark:border-white/12 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {adminName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {adminEmail}
                    </p>
                  </div>
                  <Badge variant="admin" size="xs">Admin</Badge>
                </div>
                <div className="p-1">
                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
