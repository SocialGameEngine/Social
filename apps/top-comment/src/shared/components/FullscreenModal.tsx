import { type ReactNode } from 'react';

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'lg' | '2xl';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  isSubmitting?: boolean;
}

export function FullscreenModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'lg',
  showCloseButton = true,
  closeOnBackdropClick = true,
  isSubmitting = false
}: FullscreenModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = maxWidth === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!isSubmitting && closeOnBackdropClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className={`relative w-full h-full sm:h-auto sm:max-h-[90vh] ${maxWidthClass} overflow-y-auto shadow-2xl bg-slate-900`}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 p-3 sm:space-y-6 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export default FullscreenModal;
