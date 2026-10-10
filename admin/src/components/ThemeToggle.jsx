import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Polished, Ultra-Clean Theme Toggle Component
 * High-end SaaS aesthetic with subtle micro-interactions and smooth icon transitions.
 */
export default function ThemeToggle({ variant = 'topbar', className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    toggleTheme(e);
  };

  // Pill variant: Used in Login Page header and Settings Page
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
          isDark
            ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600 shadow-sm'
            : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800 hover:border-slate-300 shadow-sm'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode (Alt+T)' : 'Switch to Dark Mode (Alt+T)'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span
          className={`relative flex items-center justify-center w-4 h-4 transition-transform duration-300 ${
            isDark ? 'rotate-180 text-[#FEF08A]' : 'rotate-0 text-amber-500'
          }`}
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-[#FEF08A]" strokeWidth={2.2} />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-700" strokeWidth={2.2} />
          )}
        </span>

        <span className="font-urbanist tracking-tight text-[11.5px] font-bold">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>

        {/* Status indicator badge */}
        <span
          className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-md transition-colors ${
            isDark
              ? 'bg-[#FEF08A]/15 text-[#FEF08A]'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {isDark ? 'Night' : 'Day'}
        </span>
      </button>
    );
  }

  // Default 'topbar' toggle switch variant
  return (
    <div className="relative inline-flex items-center justify-center font-urbanist">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isDark ? 'Switch to Light Mode (Alt+T)' : 'Switch to Dark Mode (Alt+T)'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className={`group relative inline-flex h-[26px] w-[48px] items-center rounded-full p-[2px] transition-all duration-300 cursor-pointer select-none border hover:scale-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF08A]/80 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ${
          isDark
            ? 'bg-[#0E0E12] border-white/[0.08] hover:border-white/[0.16] shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.65)]'
            : 'bg-slate-200/80 border-slate-300/80 hover:border-slate-400/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]'
        } ${className}`}
      >
        {/* Track ambient icons (crisp and unobtrusive) */}
        <div className="w-full flex items-center justify-between pointer-events-none px-0.5">
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <Sun
              className={`w-3 h-3 transition-all duration-300 ${
                isDark ? 'text-zinc-500/70 opacity-100 scale-85' : 'text-amber-500 opacity-0 scale-75'
              }`}
              strokeWidth={1.9}
            />
          </div>
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            <Moon
              className={`w-3 h-3 transition-all duration-300 ${
                isDark ? 'text-[#FEF08A] opacity-0 scale-75' : 'text-slate-400/80 opacity-100 scale-85'
              }`}
              strokeWidth={1.9}
            />
          </div>
        </div>

        {/* Sliding Tactile Thumb Knob */}
        <span
          className={`absolute top-[2px] left-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border ${
            isDark
              ? 'translate-x-[22px] bg-gradient-to-b from-[#2D2D38] to-[#1E1E26] border-white/[0.14] text-[#FEF08A] shadow-[0_2px_5px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]'
              : 'translate-x-0 bg-gradient-to-b from-white to-slate-50 border-slate-200/90 text-amber-500 shadow-[0_1.5px_3px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,1)]'
          }`}
        >
          {isDark ? (
            <Moon
              className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-12 drop-shadow-[0_0_4px_rgba(254,240,138,0.4)]"
              strokeWidth={2.2}
              fill="currentColor"
              fillOpacity={0.2}
            />
          ) : (
            <Sun
              className="w-3 h-3 transition-transform duration-300 group-hover:rotate-45 drop-shadow-[0_1px_1px_rgba(245,158,11,0.2)]"
              strokeWidth={2.2}
              fill="currentColor"
              fillOpacity={0.2}
            />
          )}
        </span>
      </button>

      {/* Clean Micro-Tooltip */}
      {isHovered && (
        <div className="absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap animate-fade-in">
          <div className="px-2.5 py-1 text-[11px] font-bold font-urbanist rounded-lg shadow-lg border backdrop-blur-md flex items-center gap-1.5 bg-slate-950 text-slate-100 border-slate-800">
            <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            <kbd className="px-1 py-0.2 text-[9px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700">
              Alt+T
            </kbd>
          </div>
        </div>
      )}
    </div>
  );
}
