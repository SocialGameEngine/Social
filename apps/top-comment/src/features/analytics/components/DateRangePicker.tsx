interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  setDateRange: (from: Date, to: Date) => void;
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: 365 * 5 },
];

export function DateRangePicker({ dateRange, setDateRange }: DateRangePickerProps) {
  const activeDays = Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (24 * 60 * 60 * 1000));

  return (
    <div className="flex items-center gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => setDateRange(new Date(Date.now() - p.days * 24 * 60 * 60 * 1000), new Date())}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            Math.abs(activeDays - p.days) < 2
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/40"
              : "text-slate-400 hover:text-cyan-300 border border-slate-700 hover:border-slate-600"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
