import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { EmptyState } from '../../../../shared/components/EmptyState';
import type { ReactNode } from 'react';

interface InteractionListBottomSheetProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  emptyIcon: ReactNode;
  emptyTitle: string;
  emptyDescription?: string;
  items: T[];
  renderListItem: (item: T, onSelect: () => void) => ReactNode;
  renderDetailView: (item: T, onBack: () => void) => ReactNode;
  getItemId: (item: T) => string;
}

export function InteractionListBottomSheet<T>({
  isOpen,
  onClose,
  title,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  items,
  renderListItem,
  renderDetailView,
  getItemId,
}: InteractionListBottomSheetProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleClose = () => {
    setSelectedItem(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const handleSelectItem = (item: T) => {
    setSelectedItem(item);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={title} showCloseButton={!selectedItem} disableDrag={!!selectedItem}>
      <AnimatePresence mode="wait">
        {!selectedItem ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <div className="px-6 pt-4 pb-6">
              {items.length === 0 ? (
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={getItemId(item)}>
                      {renderListItem(item, () => handleSelectItem(item))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full flex flex-col"
          >
            {/* Explicit back button header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to {title}</span>
              </button>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label={`Close ${title}`}
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Full-height content */}
            <div className="flex-1 overflow-y-auto">
              {renderDetailView(selectedItem, handleBack)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
