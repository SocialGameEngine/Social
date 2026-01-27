import type { PropsWithChildren } from "react";
import { clsx } from "clsx";
import { useTheme } from "../shared/providers/ThemeProvider";

interface CardProps {
  className?: string;
  interactive?: boolean;
  selected?: boolean;
}

export function Card({
  className,
  interactive,
  selected,
  children,
}: PropsWithChildren<CardProps>) {
  const { isDark } = useTheme();
  
  return (
    <div
      className={clsx(
        "rounded-3xl border-[3px] p-5 shadow-md transition",
        // Light mode styles
        !isDark && "border-slate-200 bg-white shadow-slate-300/40",
        // Dark mode styles - Neon Nocturne theme
        isDark && "border-slate-600 bg-[#0a0a0a]/95 shadow-fuchsia-500/20",
        interactive &&
          "cursor-pointer hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary",
        selected && "border-cyan-400 border-2 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default Card;
