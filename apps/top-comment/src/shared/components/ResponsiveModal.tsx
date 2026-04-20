import type { PropsWithChildren, ReactNode } from 'react';
import { useResponsiveLayout } from '../../features/room/hooks/useResponsiveLayout';
import { BottomSheet } from './BottomSheet';
import { Modal } from '../../components/Modal';

interface ResponsiveModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  /** BottomSheet snap point when on mobile. Default: 'full' */
  snapPoint?: 'full' | 'half';
}

export function ResponsiveModal({
  open,
  title,
  onClose,
  footer,
  snapPoint = 'full',
  children,
}: PropsWithChildren<ResponsiveModalProps>) {
  const { isMobile } = useResponsiveLayout();

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={open}
        onClose={onClose}
        title={title}
        initialSnap={snapPoint}
      >
        <div className="px-4 pb-4 space-y-3">
          {children}
          {footer && <div className="mt-4 flex justify-end">{footer}</div>}
        </div>
      </BottomSheet>
    );
  }

  return (
    <Modal open={open} title={title} onClose={onClose} footer={footer}>
      {children}
    </Modal>
  );
}
