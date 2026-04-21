import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { FullscreenModal } from '../../../../shared/components/FullscreenModal';
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
  /** If true, detail view opens in fullscreen modal instead of inline */
  useFullscreenDetail?: boolean;
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
  useFullscreenDetail = true, // Default to fullscreen modal for better UX
}: InteractionListBottomSheetProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  // Track if sheet should stay minimized while modal is open
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    setSelectedItem(null);
    setIsDetailModalOpen(false);
  }, []);

  const handleSelectItem = useCallback((item: T) => {
    setSelectedItem(item);
    if (useFullscreenDetail) {
      setIsDetailModalOpen(true);
    }
  }, [useFullscreenDetail]);

  // When using fullscreen detail, the sheet stays open showing the list
  // and the detail opens in a separate fullscreen modal on top
  if (useFullscreenDetail) {
    return (
      <>
        <BottomSheet 
          isOpen={isOpen && !isDetailModalOpen} 
          onClose={handleClose} 
          title={title} 
          showCloseButton={true}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-h-0 flex-1 flex-col"
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
        </BottomSheet>

        {/* Fullscreen modal for detail view */}
        <FullscreenModal
          isOpen={isDetailModalOpen && selectedItem !== null}
          onClose={handleBack}
          title={title}
          maxWidth="2xl"
        >
          {selectedItem && renderDetailView(selectedItem, handleBack)}
        </FullscreenModal>
      </>
    );
  }

  // Legacy inline detail view (kept for backwards compatibility)
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
            className="flex min-h-0 flex-1 flex-col"
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
            className="flex min-h-0 flex-1 flex-col"
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
