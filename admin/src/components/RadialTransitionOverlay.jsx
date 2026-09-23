import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Fallback Radial Expansion Overlay
 * Active ONLY when the browser lacks native document.startViewTransition support.
 * Renders a clean, lightweight circular reveal with zero blur blobs or heavy borders.
 */
export default function RadialTransitionOverlay() {
  const { fallbackOverlay } = useTheme();

  if (!fallbackOverlay || !fallbackOverlay.active) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[2147483645]"
      style={{
        backgroundColor: fallbackOverlay.isDark ? '#0A0A0A' : '#F3F4F7',
        clipPath: `circle(${fallbackOverlay.progress * fallbackOverlay.radius}px at ${fallbackOverlay.x}px ${fallbackOverlay.y}px)`,
        opacity: fallbackOverlay.opacity,
      }}
      aria-hidden="true"
    />
  );
}
