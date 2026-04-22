import type { SVGProps } from "react";

export type CorrectnessState = "correct" | "wrong" | "close";

export interface CorrectnessGlyphProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  state: CorrectnessState;
  size?: number;
  title?: string;
}

/**
 * Dual-coded correctness glyph (P1-21): color AND shape so the 8% color-blind
 * audience can parse results in a dim pub.
 *
 * Shapes:
 *   correct = check (✓)
 *   wrong   = cross (✗)
 *   close   = tilde (~)
 */
export function CorrectnessGlyph({ state, size = 24, title, ...rest }: CorrectnessGlyphProps) {
  const stroke =
    state === "correct"
      ? "var(--p1-color-correct)"
      : state === "wrong"
        ? "var(--p1-color-wrong)"
        : "var(--p1-color-close)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title ?? (state === "correct" ? "Correct" : state === "wrong" ? "Incorrect" : "Partial")}
      role="img"
      {...rest}
    >
      {state === "correct" && <polyline points="5 12 10 17 19 7" />}
      {state === "wrong" && (
        <g>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </g>
      )}
      {state === "close" && <path d="M4 14 C 7 9, 10 19, 13 14 S 19 9, 20 14" />}
    </svg>
  );
}

export default CorrectnessGlyph;
