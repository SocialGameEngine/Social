import { useState } from 'react';

interface ReportButtonProps {
  onReport: () => void;
  size?: 'sm' | 'md';
}

export function ReportButton({ onReport, size = 'sm' }: ReportButtonProps) {
  const [hovered, setHovered] = useState(false);
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onReport();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-1 rounded transition-colors ${
        hovered
          ? 'bg-rose-500/20 text-rose-400'
          : 'text-slate-500 hover:text-rose-400'
      }`}
      title="Report"
      aria-label="Report"
    >
      <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z"
        />
      </svg>
    </button>
  );
}
