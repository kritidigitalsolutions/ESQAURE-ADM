import React from 'react';
import { motion } from 'framer-motion';

/**
 * RippleWaveLoader
 * 7-bar vertical undulating wave loader matching the E² Stories Admin theme.
 * - Perfectly adapted for OTT audio/video streaming atmosphere.
 * - Theme-compliant: Uses light pastel yellow (#FEF08A) in dark mode, warm amber in light mode.
 * - Strictly without any neon glow or blurred halos.
 */
export default function RippleWaveLoader({
  size = 'md', // 'sm' | 'md' | 'lg'
  color,
  count = 8,
  className = '',
  barClassName = '',
}) {
  const sizeConfig = {
    sm: {
      bar: 'h-5 w-1 rounded-full',
      spacing: 'space-x-1',
    },
    md: {
      bar: 'h-8 w-1.5 sm:w-2 rounded-full',
      spacing: 'space-x-1 sm:space-x-1.5',
    },
    lg: {
      bar: 'h-11 w-2 sm:w-2.5 rounded-full',
      spacing: 'space-x-1.5 sm:space-x-2',
    },
  }[size] || {
    bar: 'h-8 w-1.5 sm:w-2 rounded-full',
    spacing: 'space-x-1 sm:space-x-1.5',
  };

  const defaultColor = color || 'bg-amber-400 dark:bg-[#FEF08A]';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${sizeConfig.spacing} ${className}`}
    >
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          className={`${sizeConfig.bar} ${defaultColor} ${barClassName}`}
          animate={{
            scaleY: [0.5, 1.5, 0.5],
            scaleX: [1, 0.85, 1],
            translateY: ['0%', '-15%', '0%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.1,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
