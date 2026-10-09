import React from 'react';
import { motion } from 'framer-motion';

/**
 * PulsatingDots
 * 3 rhythmic pulsating dots matching the E² Stories Admin theme.
 * - Ideal for inline indicators, button loading, and compact cards.
 * - Adaptive colors: Light pastel yellow (#FEF08A) in dark mode, warm amber in light mode.
 * - Free of glowing halos or blur artifacts.
 */
export default function PulsatingDots({
  size = 'md', // 'sm' | 'md' | 'lg'
  color,
  className = '',
  dotClassName = '',
}) {
  const sizeConfig = {
    sm: {
      dot: 'h-2 w-2 rounded-full',
      spacing: 'space-x-1.5',
    },
    md: {
      dot: 'h-3 w-3 rounded-full',
      spacing: 'space-x-2',
    },
    lg: {
      dot: 'h-4 w-4 rounded-full',
      spacing: 'space-x-2.5',
    },
  }[size] || {
    dot: 'h-3 w-3 rounded-full',
    spacing: 'space-x-2',
  };

  const defaultColor = color || 'bg-amber-400 dark:bg-[#FEF08A]';

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${sizeConfig.spacing} ${className}`}
    >
      {[0, 1, 2].map((idx) => (
        <motion.div
          key={idx}
          className={`${sizeConfig.dot} ${defaultColor} ${dotClassName}`}
          animate={{
            scale: [1, 1.45, 1],
            opacity: [0.45, 1, 0.45],
          }}
          transition={{
            duration: 1,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: idx * 0.25,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
