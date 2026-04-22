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

  return (
    <motion.div
      layoutId={layoutId}
      layout
      animate={{
        scale: isLosing ? 0.6 : 1,
        opacity: isLosing ? 0.4 : 1,
      }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        padding: "1.75rem 1.25rem 1rem",
        borderRadius: "24px",
        background: `linear-gradient(180deg, ${tileColor}22 0%, ${tileColor}11 100%)`,
        border: `2px solid ${tileColor}`,
        boxShadow: isRevealed && isCorrect
          ? `0 0 0 4px ${tileColor}aa, 0 18px 32px rgba(0,0,0,0.45)`
          : `0 10px 24px rgba(0,0,0,0.4)`,
        overflow: "hidden",
        minHeight: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <ShapeGlyph shape={tileShape} color={tileColor} size={64} />
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 900,
            lineHeight: 1.1,
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

      {isLosing && (
        <XOverlay />
      )}
    </motion.div>
  );
}

function XOverlay(): ReactNode {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
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
      <line x1="15" y1="15" x2="85" y2="85" stroke="#ffffffcc" strokeWidth="6" strokeLinecap="round" />
      <line x1="85" y1="15" x2="15" y2="85" stroke="#ffffffcc" strokeWidth="6" strokeLinecap="round" />
    </motion.svg>
  );
}

export default TVAnswerTile;
