import { useEffect } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  isDark?: boolean;
  titleColor?: string;
}

export function Modal({
  open,
  onClose,
  title,
  footer,
  isDark = false,
  titleColor,
  children,
}: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop">
      <div className={`modal-content ${isDark ? 'modal-content-dark' : 'modal-content-light'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex justify-center">
            <h2 className={`modal-title text-xl font-semibold ${titleColor || ''}`}>{title}</h2>
          </div>
          <Button
            variant="ghost"
            className="-mr-2 h-10 w-10 rounded-full p-0 text-xl flex-shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            X
          </Button>
        </div>
        <div className="modal-body mt-4 space-y-3 text-sm">{children}</div>
        {footer ? <div className="mt-6 flex justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
