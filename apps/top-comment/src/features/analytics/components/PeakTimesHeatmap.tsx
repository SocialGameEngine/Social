import type { PeakTimeData } from "../../../services/analyticsService";

interface PeakTimesHeatmapProps {
  peakTimes: PeakTimeData[];
  isLoading: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensity(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-slate-800";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-pink-500";
  if (ratio > 0.5) return "bg-pink-600/70";
  if (ratio > 0.25) return "bg-pink-700/50";
  return "bg-pink-900/30";
}

function formatHour(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

export function PeakTimesHeatmap({ peakTimes, isLoading }: PeakTimesHeatmapProps) {
  const lookup: Record<string, number> = {};
  let maxCount = 0;
  for (const pt of peakTimes) {
    const key = `${pt.dayOfWeek}-${pt.hourOfDay}`;
    lookup[key] = pt.sessionCount;
    if (pt.sessionCount > maxCount) maxCount = pt.sessionCount;
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
        <div className="h-4 w-24 rounded bg-slate-700 animate-pulse mb-3" />
        <div className="h-40 rounded bg-slate-700/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">Peak Times</h3>
      {peakTimes.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">No session data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {HOURS.filter((h) => h % 3 === 0).map((h) => (
                <span
                  key={h}
                  className="text-[9px] text-slate-500 font-mono w-[12.5%]"
                >
                  {formatHour(h)}
                </span>
              ))}
            </div>
            {/* Grid rows */}
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <span className="w-9 text-[10px] text-slate-400 font-semibold text-right shrink-0">{day}</span>
                <div className="flex-1 flex gap-px">
                  {HOURS.map((h) => {
                    const count = lookup[`${di}-${h}`] || 0;
                    return (
                      <div
                        key={h}
                        className={`flex-1 h-5 rounded-sm ${getIntensity(count, maxCount)} transition-colors`}
                        title={`${day} ${formatHour(h)}: ${count} session${count !== 1 ? "s" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-2 ml-10">
              <span className="text-[9px] text-slate-500">Less</span>
              <div className="w-4 h-3 rounded-sm bg-slate-800 border border-slate-700" />
              <div className="w-4 h-3 rounded-sm bg-pink-900/30" />
              <div className="w-4 h-3 rounded-sm bg-pink-700/50" />
              <div className="w-4 h-3 rounded-sm bg-pink-600/70" />
              <div className="w-4 h-3 rounded-sm bg-pink-500" />
              <span className="text-[9px] text-slate-500">More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
