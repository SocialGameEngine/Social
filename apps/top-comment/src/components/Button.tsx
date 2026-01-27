import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";
import { useTheme } from "../shared/providers/ThemeProvider";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      className,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => {
    const { isDark } = useTheme();

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-brand-primary text-white shadow-lg hover:bg-brand-dark focus-visible:outline-brand-primary",
      secondary:
        "border border-brand-primary text-brand-primary hover:bg-brand-light focus-visible:outline-brand-primary",
      ghost: !isDark
        ? "text-brand-primary hover:bg-slate-100 focus-visible:outline-brand-primary"
        : "text-cyan-400 hover:bg-slate-700 focus-visible:outline-cyan-400",
      outline: !isDark
        ? "border border-slate-300 text-slate-600 hover:bg-slate-50 focus-visible:outline-slate-300"
        : "border border-cyan-400/50 text-cyan-300 hover:bg-slate-700 focus-visible:outline-cyan-400",
      danger:
        "bg-rose-600 text-white shadow-lg hover:bg-rose-700 focus-visible:outline-rose-600",
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="relative flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            <span>Loading</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
