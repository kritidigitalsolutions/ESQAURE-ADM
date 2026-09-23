import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import RadialTransitionOverlay from '../components/RadialTransitionOverlay';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch {}
    return false;
  });

  const [fallbackOverlay, setFallbackOverlay] = useState(null);
  const fallbackAnimRef = useRef(null);

  // Synchronize 'dark' class on <html> root element initially and on direct state change
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  // Ultra-Smooth, Continuous Radial Theme Switch Function
  const toggleTheme = useCallback(async (eventOrCoords) => {
    // 1. Resolve coordinates precisely from event or element center
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (eventOrCoords) {
      if (typeof eventOrCoords.clientX === 'number' && eventOrCoords.clientX > 0) {
        x = eventOrCoords.clientX;
        y = eventOrCoords.clientY;
      } else if (eventOrCoords.currentTarget && typeof eventOrCoords.currentTarget.getBoundingClientRect === 'function') {
        const rect = eventOrCoords.currentTarget.getBoundingClientRect();
        x = Math.round(rect.left + rect.width / 2);
        y = Math.round(rect.top + rect.height / 2);
      } else if (typeof eventOrCoords.x === 'number' && typeof eventOrCoords.y === 'number') {
        x = eventOrCoords.x;
        y = eventOrCoords.y;
      }
    }

    // 2. Compute exact diagonal radius to furthest viewport corner
    const endRadius = Math.ceil(
      Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )
    );

    const nextIsDark = !isDark;

    // 3. Check for native View Transitions API support
    const supportsViewTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (supportsViewTransition) {
      // Freeze all live CSS transitions so the snapshot is instantaneous and the wave never tears
      document.documentElement.classList.add('view-transitioning');

      const transition = document.startViewTransition(() => {
        // Synchronously toggle class on <html> inside the view transition callback
        if (nextIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        try {
          localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
        } catch {}

        flushSync(() => {
          setIsDark(nextIsDark);
        });
      });

      try {
        await transition.ready;

        const animation = document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 450,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );

        await animation.finished;
      } catch (err) {
        // Fallback gracefully
      } finally {
        document.documentElement.classList.remove('view-transitioning');
      }
    } else {
      // 4. Smooth fallback for unsupported environments
      if (fallbackAnimRef.current) {
        cancelAnimationFrame(fallbackAnimRef.current);
      }

      if (nextIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
      } catch {}

      setIsDark(nextIsDark);
    }
  }, [isDark]);

  // Global Keyboard Shortcut: Alt + T or Shift + D
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) return;

      if ((e.altKey && (e.key === 't' || e.key === 'T')) ||
          (e.shiftKey && (e.key === 'D' || e.key === 'd') && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, fallbackOverlay }}>
      {children}
      <RadialTransitionOverlay />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
