import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Trash2, 
  Info, 
  CheckCircle2, 
  X,
  Loader2
} from 'lucide-react';
import ModalPortal from './ModalPortal';

export default function CustomDialog({
  isOpen,
  type = 'confirm', // 'confirm' | 'alert'
  title,
  message,
  itemName,
  confirmText,
  cancelText = 'Cancel',
  buttonText = 'Understood',
  variant = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  onConfirm,
  onCancel,
  isLoading = false
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (type === 'confirm') {
            onCancel?.();
          } else {
            onConfirm?.();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, type, onCancel, onConfirm]);

  const getIconBadge = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
            <Trash2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case 'success':
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-[#FEF08A] text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
    }
  };

  const resolvedConfirmText = confirmText || (variant === 'danger' ? 'Delete' : 'Confirm');

  return (
    <ModalPortal isOpen={isOpen}>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={type === 'confirm' ? onCancel : onConfirm}
              className="fixed inset-0 bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs cursor-pointer"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white dark:bg-[#24242E] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border border-slate-200/90 dark:border-white/15 z-10 font-urbanist overflow-hidden p-6 sm:p-7 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3.5 min-w-0">
                  {getIconBadge()}
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white tracking-tight leading-snug truncate">
                      {title || (type === 'confirm' ? 'Confirm Action' : 'Notice')}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {type === 'confirm' ? 'Please review before proceeding' : 'System notification'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={type === 'confirm' ? onCancel : onConfirm}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-transparent dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Optional Item Highlight Box */}
              {itemName && (
                <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#1A1A22] border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#FEF08A] shrink-0" />
                  <span className="truncate">{itemName}</span>
                </div>
              )}

              {/* Message */}
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words font-medium">
                {message}
              </div>

              {/* Footer Actions */}
              <div className="pt-2 flex items-center gap-3">
                {type === 'confirm' && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181E] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-2xs active:scale-95 cursor-pointer text-center disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                )}

                <button
                  ref={confirmBtnRef}
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
                    variant === 'danger' && type === 'confirm'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                      : 'bg-[#FACC15] hover:bg-[#EAB308] text-slate-950 font-bold shadow-amber-400/20'
                  }`}
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{type === 'confirm' ? resolvedConfirmText : buttonText}</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
}
