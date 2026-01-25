import { useCallback, useMemo, useReducer } from "react";
import type { PropsWithChildren } from "react";
import { ToastContext, type ToastItem } from "./ToastContext";

type ToastState = ToastItem[];

type ToastAction =
  | { type: "add"; toast: ToastItem }
  | { type: "dismiss"; id: string };

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "add":
      return [
        ...state.filter((toast) => toast.id !== action.toast.id),
        action.toast,
      ];
    case "dismiss":
      return state.filter((toast) => toast.id !== action.id);
    default:
      return state;
  }
}

let idCounter = 0;

const createId = () => `toast-${++idCounter}`;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = createId();
    dispatch({ type: "add", toast: { id, ...toast } });
    if (toast.duration !== 0) {
      setTimeout(
        () => dispatch({ type: "dismiss", id }),
        toast.duration ?? 4000,
      );
    }
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: "dismiss", id });
  }, []);

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast }),
    [toasts, showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
