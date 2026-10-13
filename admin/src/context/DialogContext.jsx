import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import CustomDialog from '../components/common/CustomDialog';

const DialogContext = createContext(null);

let activeDispatcher = null;

/**
 * Trigger custom styled confirmation dialog:
 * const confirmed = await confirmModal({
 *   title: 'Delete Ad Campaign',
 *   message: 'Are you sure you want to delete campaign "Monster Energy"?',
 *   itemName: 'Monster Energy',
 *   confirmText: 'Delete Campaign',
 *   variant: 'danger' // 'danger' | 'warning' | 'info'
 * });
 */
export const confirmModal = (options) => {
  if (activeDispatcher?.confirm) {
    return activeDispatcher.confirm(options);
  }
  const msg = typeof options === 'string' ? options : (options?.message || options?.title || 'Are you sure?');
  return Promise.resolve(window.confirm(msg));
};

/**
 * Trigger custom styled alert dialog:
 * await alertModal({
 *   title: 'Notice',
 *   message: 'No campaigns found to export.',
 *   buttonText: 'Understood',
 *   variant: 'info' // 'info' | 'warning' | 'danger' | 'success'
 * });
 */
export const alertModal = (options) => {
  if (activeDispatcher?.alert) {
    return activeDispatcher.alert(options);
  }
  const msg = typeof options === 'string' ? options : (options?.message || options?.title || '');
  window.alert(msg);
  return Promise.resolve();
};

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    itemName: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    buttonText: 'Understood',
    variant: 'danger',
    resolve: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      setDialogState({
        isOpen: true,
        type: 'confirm',
        title: opts.title || 'Confirm Action',
        message: opts.message || opts.description || 'Are you sure you want to proceed?',
        itemName: opts.itemName || '',
        confirmText: opts.confirmText || (opts.variant === 'warning' ? 'Proceed' : 'Delete'),
        cancelText: opts.cancelText || 'Cancel',
        buttonText: opts.buttonText || 'Understood',
        variant: opts.variant || 'danger',
        resolve
      });
    });
  }, []);

  const alert = useCallback((options) => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      setDialogState({
        isOpen: true,
        type: 'alert',
        title: opts.title || 'Notice',
        message: opts.message || opts.description || '',
        itemName: opts.itemName || '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        buttonText: opts.buttonText || 'Understood',
        variant: opts.variant || 'info',
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const resolver = dialogState.resolve;
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    if (resolver) {
      resolver(true);
    }
  }, [dialogState.resolve]);

  const handleCancel = useCallback(() => {
    const resolver = dialogState.resolve;
    setDialogState((prev) => ({ ...prev, isOpen: false, resolve: null }));
    if (resolver) {
      resolver(false);
    }
  }, [dialogState.resolve]);

  useEffect(() => {
    activeDispatcher = { confirm, alert };

    // Gracefully override window.alert so even unexpected alert() calls become the custom dialog
    const originalAlert = window.alert;
    window.alert = (msg) => {
      alert({
        title: 'Notice',
        message: String(msg ?? ''),
        variant: 'info'
      });
    };

    return () => {
      activeDispatcher = null;
      window.alert = originalAlert;
    };
  }, [confirm, alert]);

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <CustomDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        itemName={dialogState.itemName}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        buttonText={dialogState.buttonText}
        variant={dialogState.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DialogContext.Provider>
  );
}

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    return {
      confirm: confirmModal,
      alert: alertModal
    };
  }
  return ctx;
};

export const useConfirm = () => {
  const { confirm } = useDialog();
  return confirm;
};

export const useAlert = () => {
  const { alert } = useDialog();
  return alert;
};

export default DialogContext;
