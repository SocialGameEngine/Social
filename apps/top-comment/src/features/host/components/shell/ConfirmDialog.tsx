/**
 * ConfirmDialog - Generic confirmation modal for destructive actions
 * 
 * Used for:
 * - End session confirmation
 * - Kick/ban player confirmation
 * - Other destructive actions
 * 
 * Features:
 * - Uses native <dialog> element for accessibility
 * - Focus trap and ESC to dismiss
 * - Auto-focus on confirm button
 * - Returns focus to opener on close
 */

import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@social/ui';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

const VARIANT_STYLES = {
  danger: {
    icon: 'text-rose-400',
    iconBg: 'bg-rose-500/20',
    button: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500',
  },
  warning: {
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/20',
    button: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500',
  },
  default: {
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/20',
    button: 'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);

  const styles = VARIANT_STYLES[variant];

  // Store the element that opened the dialog
  useEffect(() => {
    if (isOpen) {
      openerRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // Focus confirm button after a brief delay for animation
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
    } else {
      dialog.close();
      // Return focus to opener
      if (openerRef.current instanceof HTMLElement) {
        openerRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle ESC key and backdrop click
  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Check if click was on backdrop (outside dialog content)
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (!isInDialog) {
      onClose();
    }
  }, [onClose]);

  // Handle native dialog close event (ESC key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="fixed inset-0 z-50 m-auto max-w-md w-[calc(100%-2rem)] rounded-2xl bg-slate-800 p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="p-6">
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
          {variant === 'danger' ? (
            <svg className={`h-6 w-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : variant === 'warning' ? (
            <svg className={`h-6 w-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className={`h-6 w-6 ${styles.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2 
          id="confirm-dialog-title" 
          className="text-lg font-semibold text-white text-center mb-2"
        >
          {title}
        </h2>

        {/* Description */}
        <p 
          id="confirm-dialog-description" 
          className="text-sm text-slate-300 text-center mb-6"
        >
          {description}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </dialog>
  );
}
