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
        className={`group relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-all duration-300 cursor-pointer select-none border shadow-2xs hover:scale-102 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FEF08A] ${
          isDark
            ? 'bg-slate-900 border-slate-700/90 hover:border-slate-600'
            : 'bg-slate-100 border-slate-200 hover:border-slate-300'
        } ${className}`}
      >
        {/* Track ambient icons */}
        <div className="w-full flex items-center justify-between px-1 pointer-events-none">
          <Sun
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              isDark ? 'text-slate-500 opacity-60 scale-75' : 'text-amber-500 opacity-0 scale-90'
            }`}
            strokeWidth={2}
          />
          <Moon
            className={`w-3.5 h-3.5 transition-all duration-300 ${
              isDark ? 'text-[#FEF08A] opacity-0 scale-90' : 'text-slate-400 opacity-60 scale-75'
            }`}
            strokeWidth={2}
          />
        </div>

        {/* Sliding Thumb Knob */}
        <span
          className={`absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-300 ease-out border ${
            isDark
              ? 'translate-x-6 bg-[#0D0D0D] border-slate-700/80 text-[#FEF08A]'
              : 'translate-x-0 bg-white border-slate-200/90 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 transition-transform duration-300" strokeWidth={2.2} />
          ) : (
            <Sun className="w-3.5 h-3.5 transition-transform duration-300" strokeWidth={2.2} />
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
