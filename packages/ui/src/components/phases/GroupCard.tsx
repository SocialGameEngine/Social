import type { RoundGroup } from "../../shared/types";

type GroupCardVariant = "host" | "presenter";

interface GroupCardProps {
  group: RoundGroup;
  index: number;
  teamLookup: Map<string, string>;
  variant?: GroupCardVariant;
  className?: string;
  isDark?: boolean;
}

export function GroupCard({
  group,
  index,
  teamLookup,
  variant = "host",
  className = "",
  isDark = false,
}: GroupCardProps) {
  const members = group.teamIds
    .map((id) => teamLookup.get(id) ?? "Unknown team")
    .join(", ");

  // Debug: log presenter view data (only log when prompt changes)
  if (variant === "presenter") {
    console.log('Presenter GroupCard - Group', index + 1, 'prompt:', group.prompt);
  }

  if (variant === "presenter") {
    return (
      <div
        className={`elevated-card p-6 ${className}`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${!isDark ? 'text-slate-600' : 'text-brand-primary'}`}>
          Group {index + 1}
        </p>
        <p className={`mt-2 text-xl font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>{group.prompt}</p>
        <p className={`mt-3 text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>{members}</p>
      </div>
    );
  }

  // Host variant (default)
  return (
    <div className={`elevated-card p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs font-semibold uppercase tracking-wide ${!isDark ? 'text-slate-500' : 'text-brand-primary'}`}>
          Group {index + 1}
        </span>
        <span className={`text-xs font-medium ${!isDark ? 'text-slate-400' : 'text-slate-300'}`}>
          {group.teamIds.length} team{group.teamIds.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className={`mt-2 text-sm font-semibold ${!isDark ? 'text-slate-900' : 'text-white'}`}>{group.prompt}</p>
      <p className={`mt-2 text-sm ${!isDark ? 'text-slate-600' : 'text-slate-300'}`}>{members}</p>
    </div>
  );
}

