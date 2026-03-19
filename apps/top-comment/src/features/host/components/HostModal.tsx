import React from 'react';

interface HostModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  disabled?: boolean;
}

const maxWidthClasses = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md', 
  lg: 'md:max-w-lg',
  xl: 'md:max-w-xl',
  '2xl': 'md:max-w-2xl',
};

export function HostModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '2xl',
  disabled = false 
}: HostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className={`bg-slate-900 w-full h-full md:h-auto md:rounded-lg md:max-h-[90vh] ${maxWidthClasses[maxWidth]} overflow-y-auto flex flex-col`}>
        {/* Header - sticky on mobile */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 md:p-6 md:border-0 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-2"
              disabled={disabled}
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default HostModal;
