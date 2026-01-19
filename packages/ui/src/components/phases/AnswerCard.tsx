import type { Answer } from "../../shared/types";

type AnswerCardVariant = "team" | "host" | "presenter";

interface AnswerCardProps {
  answer: Answer;
  voteCount: number;
  isWinner?: boolean;
  authorName?: string;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showSummary?: boolean;
  variant?: AnswerCardVariant;
  className?: string;
  isDark?: boolean;
}

export function AnswerCard({
  answer,
  voteCount,
  isWinner = false,
  authorName,
  isSelected = false,
  onClick,
  disabled = false,
  showSummary = false,
  variant = "team",
  className = "",
  isDark = false,
}: AnswerCardProps) {
  const points = voteCount * 100 + (isWinner ? 1000 : 0);

  if (variant === "presenter") {
    return (
      <div
        className={`relative rounded-2xl px-4 py-4 text-left text-xl font-semibold shadow-md ${!isDark ? 'bg-white' : 'bg-slate-800'} ${className}`}
      >
        {showSummary ? (
          <span className="absolute -top-3 right-4 rounded-full bg-cyan-400 px-4 py-1 text-xs font-semibold text-slate-900 shadow-lg shadow-cyan-400/50">
            +{points}
          </span>
        ) : null}
        <p className={`${!isDark ? 'text-slate-900' : 'text-white'}`}>{answer.text}</p>
        {showSummary ? (
          <>
            {authorName && (
              <p className={`mt-2 text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>— {authorName}</p>
            )}
            <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {voteCount} vote{voteCount === 1 ? "" : "s"}
            </p>
          </>
        ) : null}
      </div>
    );
  }

  if (variant === "host") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`rounded-3xl border-2 p-5 text-left shadow-sm transition hover:border-brand-primary ${
          !isDark ? 'bg-white' : 'bg-slate-800'
        } ${
          isSelected
            ? "border-brand-primary shadow-md"
            : "border-transparent"
        } ${className}`}
      >
        <p className={`text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>{answer.text}</p>
        <p className={`mt-2 text-sm ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          {voteCount} vote{voteCount === 1 ? "" : "s"}
        </p>
      </button>
    );
  }

  // Team variant (default)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl px-4 py-3 text-left transition shadow-md ${
        !isDark ? 'bg-white' : 'bg-slate-800'
      } ${
        isSelected
          ? "ring-2 ring-brand-primary"
          : "ring-1 ring-white/40"
      } ${disabled ? "opacity-70" : "hover:ring-brand-primary/60"} ${className}`}
    >
      <p className={`break-words overflow-wrap-anywhere text-lg font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>{answer.text}</p>
      {showSummary ? (
        <>
          {authorName && (
            <p className={`mt-1 text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>— {authorName}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-brand-primary">
            +{points}
          </p>
          <p className={`text-xs ${!isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {voteCount} vote{voteCount === 1 ? "" : "s"}
          </p>
        </>
      ) : null}
    </button>
  );
}
