import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { useTheme } from "../shared/providers/ThemeProvider";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const { isDark } = useTheme();
    const inputId = id ?? props.name ?? undefined;
    const hintId = hint && inputId ? `${inputId}-hint` : undefined;
    const errorId = error && inputId ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
    return (
      <label className="flex flex-col gap-1 text-left" htmlFor={inputId}>
        <span className={`text-sm font-medium ${!isDark ? 'text-slate-700' : 'text-cyan-100'}`}>{label}</span>
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "matte-input w-full rounded-2xl border bg-transparent px-4 py-3 text-base focus:outline-none focus:ring-2",
            !isDark
              ? "border-white/40 placeholder:text-slate-500 focus:border-brand-primary focus:ring-brand-light text-slate-900"
              : "border-cyan-400/40 placeholder:text-cyan-400/60 focus:border-cyan-400 focus:ring-cyan-400/20 text-cyan-100",
            error &&
              (!isDark ? "border-rose-500 focus:border-rose-500 focus:ring-rose-200" : "border-pink-500 focus:border-pink-500 focus:ring-pink-400/20"),
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {hint ? (
          <span id={hintId} className={`text-xs ${!isDark ? 'text-slate-500' : 'text-cyan-400'}`}>
            {hint}
          </span>
        ) : null}
        {error ? (
          <span
            id={errorId}
            data-testid={errorId ? `${errorId}` : undefined}
            className={`text-xs ${!isDark ? 'text-rose-600' : 'text-pink-400'}`}
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

FormField.displayName = "FormField";

export default FormField;
