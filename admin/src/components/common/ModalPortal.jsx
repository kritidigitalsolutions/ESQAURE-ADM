import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal
 * Portals modals and overlays directly into document.body to prevent
 * stacking context traps, clipping by overflow containers, and unblurred
 * topbars/headers when backdrop-blur is active.
 */
export default function ModalPortal({ children, isOpen = true }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
}
