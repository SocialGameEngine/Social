import { type ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CountdownRing } from "../../../tv/components/CountdownRing";
import { SplitFlap } from "../../../tv/components/SplitFlap";
import { useTimerWarning } from "../../../../shared/hooks/useTimerWarning";
import { useReducedMotion } from "../../../../shared/hooks/useReducedMotion";

export type PhaseShellPhase = "lobby" | "answer" | "vote" | "reveal" | "results" | "ended";

export interface PhaseShellProps {
  /** Controls visibility + mounts the shell through <AnimatePresence>. */
  isOpen: boolean;
  /** Close callback. Usually wired to dispatch(CLOSE_SOCIALE_MODAL). */
  onClose: () => void;
  /** Phase drives the accent colour (maps to CSS data-phase attribute). */
  phase: PhaseShellPhase;
  /** 1-indexed round number; omit in lobby/ended. */
  roundIndex?: number;
  /** Total rounds in the sociale (for "Round 3 of 5"). */
  totalRounds?: number;
  /** Short phase title shown inside the eyebrow pill. */
  title: string;
  /** ISO phase-end timestamp for the CountdownRing + warning pulse. */
  endsAt?: string | null;
  /** Server-authoritative total phase duration. */
  totalSeconds?: number;
  /** Whether the sociale is paused. When true, we freeze the ring + show "Paused". */
  paused?: boolean;
  /** Body content (form, response list, podium, etc.). */
  children: ReactNode;
  /** Optional footer slot (SubmissionPool, share card, etc.). */
  footer?: ReactNode;
  /** Rendered after the shell contents but still inside the modal — use sparingly. */
  overlays?: ReactNode;
  /** Disable close button + backdrop (e.g. while submitting). */
  dismissDisabled?: boolean;
}

/**
 * Shared mobile modal chrome for every Sociale phase. Wraps content with:
 *  - a phase-tinted shell (chaos-room-shell + data-phase),
 *  - a sticky top bar with close, phase eyebrow, and thumb-sized CountdownRing,
 *  - border pulse + haptic when the timer enters the warning window,
 *  - an AnimatePresence mount/unmount crossfade.
 *
 * The shell is intentionally layout-only: all phase-specific content goes in
 * the `children` slot. The footer slot is the canonical home for the compact
 * SubmissionPool, share buttons, and "Lie for me" style safety affordances.
 */
export function PhaseShell({
  isOpen,
  onClose,
  phase,
  roundIndex,
  totalRounds,
  title,
  endsAt,
  totalSeconds = 0,
  paused = false,
  children,
  footer,
  overlays,
  dismissDisabled = false,
}: PhaseShellProps) {
  const { isWarning, isUrgent, secondsLeft } = useTimerWarning(paused ? null : endsAt);
  const reduceMotion = useReducedMotion();

  // Lock body scroll while open on mobile.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={dismissDisabled ? undefined : onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-phase={phase}
            className={[
              "chaos-room-shell",
              // Full-bleed on mobile (using dvh so iOS address-bar collapse
              // doesn't clip the footer), then becomes a centred card on tablet+.
              "relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg",
              // Scrolling happens on the inner content area, not the shell
              // itself, so the sticky header + footer stay glued to the frame.
              "overflow-hidden rounded-none sm:rounded-[28px]",
              "flex flex-col",
              isWarning ? "is-timer-warning" : "",
              isUrgent ? "is-timer-urgent" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            initial={reduceMotion ? { opacity: 0 } : { y: 40, scale: 0.98, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 20, scale: 0.98, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 360, damping: 28 }
            }
            style={{
              // Respect iOS safe areas on both ends so the header clears the
              // Dynamic Island / notch and the footer clears the home indicator.
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            {/* P1-20 — thin 2-3px round cursor above the header so players can
                glance at how far through the sociale they are. */}
            {roundIndex != null && totalRounds != null && totalRounds > 0 && (
              <div
                className="relative h-[3px] w-full shrink-0 bg-white/5"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={totalRounds}
                aria-valuenow={roundIndex}
                aria-label={`Round ${roundIndex} of ${totalRounds}`}
              >
                <div
                  className="h-full bg-cyan-400 transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, (roundIndex / totalRounds) * 100))}%`,
                    boxShadow: '0 0 8px rgba(34,211,238,0.55)',
                  }}
                />
              </div>
            )}

            <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={dismissDisabled}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-white/80 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
                aria-label="Close"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <span
                  className="chaos-room-eyebrow"
                  aria-label={`${title}${roundIndex ? `, round ${roundIndex}` : ""}`}
                >
                  {roundIndex != null ? (
                    <>
                      <span>{title}</span>
                      <span className="opacity-60">·</span>
                      <span className="flex items-center gap-1">
                        <span className="opacity-80">R</span>
                        <SplitFlap
                          value={String(roundIndex)}
                          length={String(totalRounds ?? roundIndex).length}
                          flipMs={60}
                          staggerMs={30}
                          charWidthEm={0.55}
                          style={{ fontSize: "11px" }}
                        />
                        {totalRounds != null && (
                          <span className="opacity-60">/{totalRounds}</span>
                        )}
                      </span>
                    </>
                  ) : (
                    <span>{title}</span>
                  )}
                </span>
              </div>

              <div className="relative flex h-11 w-11 items-center justify-center" aria-live="polite">
                {endsAt && totalSeconds > 0 && !paused ? (
                  <CountdownRing
                    endTime={endsAt}
                    totalSeconds={totalSeconds}
                    size={44}
                    strokeWidth={4}
                    hideWhenIdle={false}
                  />
                ) : paused ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Paused
                  </span>
                ) : null}
                {/* Screen-reader only current-time readout so a11y users get a count. */}
                <span className="sr-only">{Math.ceil(secondsLeft)} seconds remaining</span>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 sm:px-5 sm:pb-5">
              {children}
            </div>

            {footer && (
              <footer className="shrink-0 px-4 pt-3 pb-5 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
                {footer}
              </footer>
            )}

            {overlays}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PhaseShell;
