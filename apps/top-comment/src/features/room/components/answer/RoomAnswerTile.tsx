import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type RoomAnswerTileShape = "triangle" | "diamond" | "circle" | "square";

export interface RoomAnswerTileProps {
  /** Option index 0..3 — drives the default color+shape pairing. */
  optionIndex: number;
  /** Display text. */
  label: string;
  /** Whether the current user has selected this option. */
  isSelected?: boolean;
  /** Tap handler. */
  onClick?: () => void;
  /** When true, the whole tile is non-interactive. */
  disabled?: boolean;
  /** Optional framer `layoutId` — pairs with TVAnswerTile for room/tv coherence. */
  layoutId?: string;
  /** Reveal state — when true, correctness overrides selection styling. */
  isRevealed?: boolean;
  /** If revealed, whether this option is the correct answer. */
  isCorrect?: boolean;
}

interface TilePalette {
  color: string;
  rgb: string;
  shape: RoomAnswerTileShape;
  name: string;
}

// Matches TVAnswerTile so the room and TV feel like the same quartet.
const PALETTE: TilePalette[] = [
  { color: "#ef4444", rgb: "239, 68, 68", shape: "triangle", name: "Red triangle" },
  { color: "#3b82f6", rgb: "59, 130, 246", shape: "diamond", name: "Blue diamond" },
  { color: "#eab308", rgb: "234, 179, 8", shape: "circle", name: "Yellow circle" },
  { color: "#22c55e", rgb: "34, 197, 94", shape: "square", name: "Green square" },
];

function ShapeGlyph({ shape, color, size = 28 }: { shape: RoomAnswerTileShape; color: string; size?: number }): ReactNode {
  const common = { width: size, height: size, viewBox: "0 0 100 100", "aria-hidden": true as const };
  switch (shape) {
    case "triangle":
      return (
        <svg {...common}>
          <polygon points="50,10 92,90 8,90" fill={color} />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <polygon points="50,8 92,50 50,92 8,50" fill={color} />
        </svg>
      );
    case "circle":
      return (
        <svg {...common}>
          <circle cx="50" cy="50" r="42" fill={color} />
        </svg>
      );
    case "square":
      return (
        <svg {...common}>
          <rect x="10" y="10" width="80" height="80" rx="6" fill={color} />
        </svg>
      );
  }
}

/**
 * Mobile sibling of TVAnswerTile (P1-29). Dual-coded via color + shape so
 * colorblind players can still disambiguate. Smaller footprint than the TV
 * tile (two-column grid friendly) and no vote-distribution bar during the
 * answer phase. Reveal styling mirrors the TV reveal sequence.
 */
export function RoomAnswerTile({
  optionIndex,
  label,
  isSelected = false,
  onClick,
  disabled = false,
  layoutId,
  isRevealed = false,
  isCorrect = false,
}: RoomAnswerTileProps) {
  const palette = PALETTE[optionIndex % PALETTE.length];
  const isLosing = isRevealed && !isCorrect;
  const isWinning = isRevealed && isCorrect;

  const borderColor = isLosing
    ? "rgba(239, 68, 68, 0.5)"
    : isWinning
    ? "rgba(34, 197, 94, 0.85)"
    : isSelected
    ? palette.color
    : `rgba(${palette.rgb}, 0.4)`;

  const bg = isLosing
    ? "linear-gradient(180deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.04))"
    : isWinning
    ? "linear-gradient(180deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))"
    : isSelected
    ? `linear-gradient(180deg, rgba(${palette.rgb}, 0.32), rgba(${palette.rgb}, 0.14))`
    : `linear-gradient(180deg, rgba(${palette.rgb}, 0.15), rgba(${palette.rgb}, 0.05))`;

  return (
    <motion.button
      layoutId={layoutId}
      layout
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isSelected}
      aria-label={`Option ${palette.name}: ${label}`}
      animate={{
        scale: isLosing ? 0.95 : isWinning ? 1.02 : isSelected ? 1.02 : 1,
        opacity: isLosing ? 0.55 : 1,
      }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="relative w-full min-h-[88px] p-3 rounded-2xl text-left text-white overflow-hidden disabled:cursor-not-allowed"
      style={{
        background: bg,
        border: `2px solid ${borderColor}`,
        boxShadow: isSelected
          ? `0 0 0 3px rgba(${palette.rgb}, 0.35), 0 10px 20px rgba(0,0,0,0.4)`
          : "0 6px 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <ShapeGlyph shape={palette.shape} color={palette.color} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-base font-black leading-tight break-words"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
          >
            {label}
          </p>
        </div>
        {isSelected && !isRevealed && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
            style={{ background: palette.color, color: "#0a0118" }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" fill="none">
              <polyline points="5 12 10 17 19 7" />
            </svg>
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

export default RoomAnswerTile;
