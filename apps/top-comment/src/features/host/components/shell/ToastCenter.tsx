/**
 * ToastCenter - Floating notification system for host feedback
 * 
 * Provides non-blocking feedback for:
 * - Action confirmations (kick, ban, phase advance)
 * - Undo functionality for reversible actions
 * - Error notifications
 * 
 * Features:
 * - role="status" for standard messages
 * - role="alert" for urgent notifications
 * - Auto-dismiss with configurable duration
 * - Undo button support
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ToastMessage } from '../../types/host-panel.types';

interface ToastContextValue {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastCenter() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastCenter must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastMessage = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-32 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none md:left-auto md:right-6 md:max-w-sm"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const VARIANT_STYLES = {
  success: {
    bg: 'bg-green-500/90',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-rose-500/90',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-500/90',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    bg: 'bg-cyan-500/90',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

function Toast({ toast, onDismiss }: ToastProps) {
  const styles = VARIANT_STYLES[toast.variant];
  const isUrgent = toast.variant === 'error';

  const handleUndo = () => {
    if (toast.undoAction) {
      toast.undoAction();
      onDismiss(toast.id);
    }
  };

  return (
    <div
      role={isUrgent ? 'alert' : 'status'}
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl ${styles.bg} backdrop-blur-sm shadow-lg text-white animate-slide-up`}
    >
      {/* Icon */}
      <span className="flex-shrink-0">{styles.icon}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="text-xs opacity-90 mt-0.5">{toast.description}</p>
        )}
      </div>

      {/* Undo button */}
      {toast.undoAction && (
        <button
          onClick={handleUndo}
          className="flex-shrink-0 px-3 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          Undo
        </button>
      )}

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
