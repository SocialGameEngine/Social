import { useEffect } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { useTheme } from "../shared/providers/ThemeProvider";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  footer,
  children,
}: PropsWithChildren<ModalProps>) {
  const { isDark } = useTheme();

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
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 ${!isDark ? 'bg-slate-950/50' : 'bg-slate-950/70'}`}>
      <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${!isDark ? 'bg-white' : 'bg-slate-800'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex justify-center">
            <h2 className={`text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-pink-400'}`}>{title}</h2>
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
        <div className={`mt-4 space-y-3 text-sm ${!isDark ? 'text-slate-600' : 'text-cyan-300'}`}>{children}</div>
        {footer ? <div className="mt-6 flex justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
