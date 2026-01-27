import { useCallback } from "react";
import { useToast as useUIToast } from "@social/ui";

export function useToast() {
  const { addToast, removeToast } = useUIToast();

  // Use new format
  const toast = useCallback((options: { title: string; variant?: "success" | "error" | "info"; description?: string }) => {
    addToast(options);
  }, [addToast]);

  return { toast, dismissToast: removeToast };
}
export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
}

export type Toast = (options: ToastOptions) => void;
