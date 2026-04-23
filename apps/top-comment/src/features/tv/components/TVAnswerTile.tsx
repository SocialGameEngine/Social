import { useMemo } from "react";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export type TVAnswerTileShape = "triangle" | "diamond" | "circle" | "square";

export interface TVAnswerTileProps {
  /** Option index 0..3 — determines default color+shape pairing. */
  optionIndex: number;
  /** Display text for the option. */
  label: string;
  /** Show vote-distribution bar underneath the tile. */
  voteCount?: number;
  totalVotes?: number;
  /** True once results have been revealed. Drives correct/incorrect styling. */
  isRevealed?: boolean;
  /** If revealed, whether this tile is the correct answer. */
  isCorrect?: boolean;
  /** Explicit shape override; otherwise derived from optionIndex. */
  shape?: TVAnswerTileShape;
  /** Explicit color override; otherwise derived from optionIndex. */
  color?: string;
  /** Optional framer `layoutId` for shared-element transitions (e.g. Wave 3 RevealSequence). */
  layoutId?: string;
}

interface TilePalette {
  color: string;
  shape: TVAnswerTileShape;
}

// Colorblind-safe quartet per P1-29 spec.
const PALETTE: TilePalette[] = [
  { color: "#ef4444", shape: "triangle" },
  { color: "#3b82f6", shape: "diamond" },
  { color: "#eab308", shape: "circle" },
  { color: "#22c55e", shape: "square" },
];

function ShapeGlyph({ shape, color, size = 48 }: { shape: TVAnswerTileShape; color: string; size?: number }) {
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
 * A single TV answer tile (P1-29). Before reveal: full-size color + shape
 * badge, label beneath. After reveal: correct tiles stay prominent; incorrect
 * tiles shrink + dim with an X overlay. A vote-distribution bar grows at the
 * bottom so the room can see how the vote split.
 */
export function TVAnswerTile({
  optionIndex,
  label,
  voteCount = 0,
  totalVotes = 0,
  isRevealed = false,
  isCorrect = false,
  shape,
  color,
  layoutId,
}: TVAnswerTileProps) {
  const palette = PALETTE[optionIndex % PALETTE.length];
  const tileShape: TVAnswerTileShape = shape ?? palette.shape;
  const tileColor = color ?? palette.color;

  const sharePct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  const isLosing = isRevealed && !isCorrect;
  const isWinning = isRevealed && isCorrect;

  // Stable style — only depends on tileColor which doesn't change per-tile.
  const baseStyle = useMemo(() => ({
    position: "relative" as const,
    display: "flex" as const,
    flexDirection: "column" as const,
    alignItems: "stretch" as const,
    justifyContent: "flex-start" as const,
    padding: "1rem 1rem 0.75rem",
    borderRadius: "20px",
    overflow: "hidden" as const,
    minHeight: 120,
  }), []);

  return (
    <motion.div
      initial={false}
      animate={{
        scale: isWinning ? 1.08 : isLosing ? 0.6 : 1,
        opacity: isLosing ? 0.35 : 1,
        background: isWinning
          ? `linear-gradient(180deg, rgba(34,197,94,0.35) 0%, rgba(34,197,94,0.15) 100%)`
          : isLosing
            ? `linear-gradient(180deg, ${tileColor}11 0%, ${tileColor}08 100%)`
            : `linear-gradient(180deg, ${tileColor}22 0%, ${tileColor}11 100%)`,
        borderColor: isWinning
          ? `rgba(34,197,94,0.9)`
          : isLosing ? tileColor + '44' : tileColor,
        boxShadow: isWinning
          ? `0 0 0 6px rgba(34,197,94,0.4), 0 0 40px rgba(34,197,94,0.5), 0 18px 40px rgba(0,0,0,0.5)`
          : `0 10px 24px rgba(0,0,0,0.4)`,
        filter: isLosing ? 'grayscale(0.6)' : 'grayscale(0)',
      }}
      transition={{
        duration: isWinning ? 0.6 : 0.5,
        ease: [0.34, 1.56, 0.64, 1],
      }}
      style={{
        ...baseStyle,
        border: `3px solid ${tileColor}`,
        zIndex: isWinning ? 10 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem" }}>
        <ShapeGlyph shape={tileShape} color={tileColor} size={44} />
        <div
          style={{
            fontSize: "1.35rem",
            fontWeight: 900,
            lineHeight: 1.15,
            color: "#ffffff",
            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            flex: 1,
            textAlign: "left",
            wordBreak: "break-word",
          }}
        >
          {label}
        </div>
      </div>

      {/* Vote distribution bar */}
      {totalVotes > 0 && (
        <div style={{ marginTop: "auto", paddingTop: "1rem" }}>
          <div
            style={{
              height: 14,
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sharePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                background: tileColor,
                boxShadow: `0 0 12px ${tileColor}aa`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#ffffffcc",
            }}
          >
            <span>{voteCount} vote{voteCount === 1 ? "" : "s"}</span>
            <span>{sharePct}%</span>
          </div>
        </div>
      )}

      {isLosing && <XOverlay />}
      {isWinning && <CheckOverlay />}
    </motion.div>
  );
}

function XOverlay(): ReactNode {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 0.7, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <line x1="15" y1="15" x2="85" y2="85" stroke="#ff4444" strokeWidth="7" strokeLinecap="round" />
      <line x1="85" y1="15" x2="15" y2="85" stroke="#ff4444" strokeWidth="7" strokeLinecap="round" />
    </motion.svg>
  );
}

function CheckOverlay(): ReactNode {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        width: 56,
        height: 56,
        pointerEvents: "none",
        filter: "drop-shadow(0 2px 8px rgba(34,197,94,0.6))",
      }}
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="45" fill="rgba(34,197,94,0.9)" />
      <motion.polyline
        points="28,52 44,68 72,34"
        fill="none"
        stroke="#fff"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export default TVAnswerTile;
