import React from 'react';
import { motion } from 'framer-motion';
import RippleWaveLoader from './RippleWaveLoader';
import PulsatingDots from './PulsatingDots';

/**
 * PageLoader
 * Minimal, theme-compliant loader for full pages and content sections.
 * - 8-bar undulating wave in theme accent (#FEF08A dark mode, amber-400 light mode).
 * - No logos, no subtext, zero glow halos.
 * - Displays a simple, elegant "Loading..." text below the loader.
 */
export default function PageLoader({
  fullScreen = false,
  variant = 'ripple', // 'ripple' | 'dots'
  size = 'md',        // 'sm' | 'md' | 'lg'
  text = 'Loading...',
  minHeight = 'min-h-[300px]',
  className = '',
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center p-4 select-none"
    >
      {/* 8-Bar Wave Loader or Pulsating Dots */}
      <div className="mb-3">
        {variant === 'dots' ? (
          <PulsatingDots size={size} />
        ) : (
          <RippleWaveLoader size={size} count={8} />
        )}
      </div>

      {/* Clean "Loading..." Text */}
      {text && (
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide font-urbanist">
          {text}
        </span>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div
        className={`min-h-screen w-full bg-[#F3F4F7] dark:bg-[#0A0A0C] flex items-center justify-center fixed inset-0 z-50 font-urbanist selection:bg-[#FEF08A] selection:text-black ${className}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-center bg-transparent font-urbanist ${minHeight} ${className}`}
    >
      {content}
    </div>
  );
}
