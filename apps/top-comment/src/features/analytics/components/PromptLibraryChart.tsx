import type { LibraryUsage } from "../../../services/analyticsService";

interface PromptLibraryChartProps {
  libraries: LibraryUsage[];
  isLoading: boolean;
}

export function PromptLibraryChart({ libraries, isLoading }: PromptLibraryChartProps) {
  const maxCount = libraries.length > 0 ? Math.max(...libraries.map((l) => l.sessionCount)) : 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
        <div className="h-4 w-36 rounded bg-slate-700 animate-pulse mb-3" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-6 rounded bg-slate-700/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">Popular Prompt Packs</h3>
      {libraries.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">No prompt library data yet</p>
      ) : (
        <div className="space-y-2">
          {libraries.slice(0, 8).map((lib) => (
            <div key={lib.promptLibraryId} className="flex items-center gap-3">
              <span className="text-xs text-cyan-100 w-28 truncate shrink-0" title={lib.promptLibraryId}>
                {lib.promptLibraryId}
              </span>
              <div className="flex-1 h-5 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded-full transition-all"
                  style={{ width: `${maxCount > 0 ? (lib.sessionCount / maxCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-8 text-right shrink-0">{lib.sessionCount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
