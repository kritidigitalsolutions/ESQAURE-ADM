import React, { useState, useEffect, useRef } from 'react';
import { User, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import GlobalSearchBar from './GlobalSearchBar';
import NotificationDropdown from './NotificationDropdown';
import Badge from './common/Badge';

function FullscreenToggleIcon({ isFullscreen }) {
  if (isFullscreen) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px] overflow-visible text-current transition-colors"
      >
        {/* Top-Left: pulls inward cleanly */}
        <path d="M8 3v3a2 2 0 0 1-2 2H3" className="fs-min-tl" />
        {/* Top-Right: pulls inward cleanly */}
        <path d="M21 8h-3a2 2 0 0 1-2-2V3" className="fs-min-tr" />
        {/* Bottom-Left: pulls inward cleanly */}
        <path d="M3 16h3a2 2 0 0 1 2 2v3" className="fs-min-bl" />
        {/* Bottom-Right: pulls inward cleanly */}
        <path d="M16 21v-3a2 2 0 0 1 2-2h3" className="fs-min-br" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[18px] h-[18px] overflow-visible text-current transition-colors"
    >
      {/* Top-Left: glides outward cleanly */}
      <path d="M8 3H5a2 2 0 0 0-2 2v3" className="fs-corner-tl" />
      {/* Top-Right: glides outward cleanly */}
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" className="fs-corner-tr" />
      {/* Bottom-Left: glides outward cleanly */}
      <path d="M3 16v3a2 2 0 0 0 2 2h3" className="fs-corner-bl" />
      {/* Bottom-Right: glides outward cleanly */}
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" className="fs-corner-br" />
    </svg>
  );
}

export default function Topbar({
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
  const [isFsHovered, setIsFsHovered] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
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
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => { });
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => { });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
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
      } catch { }
    };

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('admin_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('admin_profile_updated', handleProfileUpdate);
    };
  }, []);

  return (
    <header className="bg-white/95 dark:bg-[#141419]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 sticky top-0 z-30 px-6 py-3 shadow-xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] font-urbanist shrink-0">
      <div className="flex items-center justify-between gap-4">

        {/* Left: Page Title & Subtitle */}
        <div className="flex items-center min-w-0">
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
          <div className="relative inline-flex items-center justify-center font-urbanist group">
            <button
              onClick={toggleFullscreen}
              onMouseEnter={() => setIsFsHovered(true)}
              onMouseLeave={() => setIsFsHovered(false)}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 border ${
                isFullscreen
                  ? 'bg-[#FEF08A]/15 text-slate-950 dark:text-[#FEF08A] border-[#FEF08A]/35 dark:border-[#FEF08A]/25 shadow-[0_0_12px_rgba(254,240,138,0.2)]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-200/80 dark:hover:border-white/10'
              }`}
            >
              <FullscreenToggleIcon isFullscreen={isFullscreen} />

              {/* Active Fullscreen Glowing Indicator Dot */}
              {isFullscreen && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FEF08A] shadow-[0_0_8px_rgba(254,240,138,0.9)] ring-1 ring-black/20 animate-pulse" />
              )}
            </button>

            {/* Clean Micro-Tooltip */}
            <div className={`absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap transition-all duration-200 ${
              isFsHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
            }`}>
              <div className="px-2.5 py-1 text-[11px] font-bold font-urbanist rounded-lg shadow-lg border backdrop-blur-md flex items-center gap-1.5 bg-slate-950 text-slate-100 border-slate-800">
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
                <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {isFullscreen ? 'Esc' : 'F11'}
                </kbd>
              </div>
            </div>
          </div>

          {/* Radical Theme Switch Toggle */}
          <ThemeToggle variant="topbar" />

          {/* Notification Bell Dropdown */}
          <NotificationDropdown onNavigate={onNavigate} />

          {/* Profile Avatar Dropdown */}
          <div className="relative pl-2.5 border-l border-slate-200 dark:border-white/10 group" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              onMouseEnter={() => setIsProfileHovered(true)}
              onMouseLeave={() => setIsProfileHovered(false)}
              aria-label="Admin Profile"
              className="relative flex items-center justify-center cursor-pointer hover:opacity-95 transition-all active:scale-95"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1E1E26] text-slate-700 dark:text-slate-200 flex items-center justify-center border border-slate-200/90 dark:border-white/10 shadow-xs group-hover:bg-slate-200/80 dark:group-hover:bg-[#24242E] group-hover:border-slate-300 dark:group-hover:border-white/20 group-hover:scale-105 transition-all duration-200">
                <User className="w-4 h-4 text-slate-700 dark:text-slate-300 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#141419] rounded-full shadow-xs"></span>
            </button>

            {/* Profile Micro-Tooltip */}
            {!isProfileOpen && (
              <div className={`absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap transition-all duration-200 ${
                isProfileHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0'
              }`}>
                <div className="px-2.5 py-1 text-[11px] font-bold font-urbanist rounded-lg shadow-lg border backdrop-blur-md flex items-center gap-1.5 bg-slate-950 text-slate-100 border-slate-800">
                  <span>Administrator</span>
                </div>
              </div>
            )}

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1E1E26] border border-slate-200 dark:border-white/12 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
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
