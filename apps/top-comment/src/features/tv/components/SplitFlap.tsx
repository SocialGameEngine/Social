import { useEffect, useRef, useState } from "react";

export interface SplitFlapProps {
  /** Target string to display. The component animates flips to this value. */
  value: string;
  /** Fixed number of characters. Shorter values are right-padded with spaces; longer values are truncated. */
  length?: number;
  /** ms per single letter flip. */
  flipMs?: number;
  /** ms stagger between characters. */
  staggerMs?: number;
  /** Optional click-clack sound hook. Called once per landing character. */
  onLand?: (indexFromLeft: number) => void;
  /** Right-align padding (default) vs left-align. */
  align?: "left" | "right";
  /** Monospace character width in em. Controls tile spacing. */
  charWidthEm?: number;
  /** Optional override on the cycle alphabet. Defaults cover digits/upper/space + common punctuation. */
  charSet?: string;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CHARSET = " 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.,:!?+-/$&#";

function normalize(value: string, length: number, align: "left" | "right"): string[] {
  const upper = value.toUpperCase();
  const padded =
    upper.length >= length
      ? upper.slice(0, length)
      : align === "right"
        ? upper.padStart(length, " ")
        : upper.padEnd(length, " ");
  return padded.split("");
}

/**
 * A lightweight split-flap (Solari board) letter display. Each character cycles
 * through the alphabet before landing on the target letter. The cycle is CSS
 * transform-only, no external dependencies.
 */
export function SplitFlap({
  value,
  length,
  flipMs = 90,
  staggerMs = 40,
  onLand,
  align = "right",
  charWidthEm = 0.65,
  charSet = DEFAULT_CHARSET,
  className,
  style,
}: SplitFlapProps) {
  const resolvedLength = length ?? value.length;
  const target = normalize(value, resolvedLength, align);

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        gap: "0.08em",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontWeight: 900,
        letterSpacing: "0.02em",
        ...style,
      }}
      aria-label={value}
    >
      {target.map((ch, i) => (
        <SplitFlapCell
          key={i}
          target={ch}
          delayMs={i * staggerMs}
          flipMs={flipMs}
          charSet={charSet}
          widthEm={charWidthEm}
          onLand={onLand ? () => onLand(i) : undefined}
        />
      ))}
    </span>
  );
}

interface SplitFlapCellProps {
  target: string;
  delayMs: number;
  flipMs: number;
  charSet: string;
  widthEm: number;
  onLand?: () => void;
}

function SplitFlapCell({ target, delayMs, flipMs, charSet, widthEm, onLand }: SplitFlapCellProps) {
  const [displayed, setDisplayed] = useState<string>(target);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const targetIndex = charSet.indexOf(target);
    if (targetIndex < 0) {
      setDisplayed(target);
      return;
    }

    const startIndex = charSet.indexOf(displayed);
    const effectiveStart = startIndex < 0 ? 0 : startIndex;
    const distance = (targetIndex - effectiveStart + charSet.length) % charSet.length;

    const steps = distance === 0 ? 0 : distance + 6; // always pass at least half a revolution
    let currentStep = 0;

    const tick = () => {
      if (currentStep >= steps) {
        setDisplayed(target);
        onLand?.();
        return;
      }
      const nextIdx = (effectiveStart + currentStep + 1) % charSet.length;
      setDisplayed(charSet[nextIdx]);
      currentStep += 1;
      timerRef.current = window.setTimeout(tick, flipMs);
    };

    timerRef.current = window.setTimeout(tick, delayMs);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, delayMs, flipMs, charSet]);

  return (
    <span
      style={{
        display: "inline-block",
        width: `${widthEm}em`,
        textAlign: "center",
        padding: "0.1em 0.12em",
        borderRadius: "0.14em",
        background: "linear-gradient(180deg, #1a1a1a 0%, #0c0c0c 50%, #1a1a1a 50.1%, #000 100%)",
        color: "#fefefe",
        textShadow: "0 1px 0 rgba(0,0,0,0.6)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.5)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {displayed === " " ? "\u00A0" : displayed}
    </span>
  );
}

export default SplitFlap;
