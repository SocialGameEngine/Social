import { useCountdown } from "../shared/hooks/useCountdown";
import { clsx } from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TimerProps {
  endTime?: string;
  label?: ReactNode;
  size?: "sm" | "md" | "lg";
  isDark?: boolean;
  paused?: boolean;
  pausedSeconds?: number;
  position?: "fixed" | "inline";
  /**
   * Legacy name (kept for back-compat): when true, the timer renders an
   * attention-grabbing urgency indicator in the final 30s of a phase.
   * It is no longer a top-of-screen bar — see `criticalStyle`.
   */
  showCriticalBar?: boolean;
  /**
   * Visual style for the urgency indicator.
   *  - "vignette": full-screen edge glow that escalates from amber to red,
   *    plus a centred stadium-digit (5…4…3…2…1) in the final five seconds.
   *    Designed for pub TVs where a thin top bar is invisible at distance.
   *  - "bar": legacy top-of-screen progress bar.
   * Default: "vignette".
   */
  criticalStyle?: "vignette" | "bar";
}

export function Timer({
  endTime,
  label,
  size = "lg",
  isDark: _isDark = false,
  paused = false,
  pausedSeconds,
  position = "fixed",
  showCriticalBar = true,
  criticalStyle = "vignette",
}: TimerProps) {
  // SSR/test guard for the portal target — overlays mount on document.body so
  // they escape any ancestor with `transform` / `filter` / `perspective`
  // (e.g. .chaos-tv-timer-wrap rotates 2deg, which would otherwise turn our
  // `position: fixed` vignette into a containing-block-relative element and
  // pin it inside the timer pill).
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof document !== "undefined") setPortalTarget(document.body);
  }, []);
  const countdown = useCountdown(paused ? undefined : endTime);
  // When paused, ALWAYS use pausedSeconds to prevent background countdown
  const secondsLeft = paused
    ? (pausedSeconds ?? 0)
    : Math.max(0, Math.ceil(countdown.milliseconds / 1000));
  // Only show "Paused" if explicitly paused AND we have valid pausedSeconds
  const secondsDisplay = paused && pausedSeconds != null ? "Paused" : secondsLeft;
  const isCritical = !paused && secondsLeft > 0 && secondsLeft <= 10;
  const shouldShowUrgency =
    showCriticalBar && !paused && secondsLeft > 0 && secondsLeft <= 30;
  const isDone = !paused && secondsLeft <= 0;

  // Three tiers so whatever urgency affordance is rendered ramps cleanly
  // from "heads up" to "final seconds":
  //  30–11s: calm amber    ·  10–6s: hot orange (warn)  ·  5–0s: red (urgent).
  const severity: "calm" | "warn" | "urgent" =
    secondsLeft <= 5 ? "urgent" : secondsLeft <= 10 ? "warn" : "calm";

  // --- Vignette urgency style ------------------------------------------------
  // A thin coloured edge glow pulses the whole screen frame, with intensity and
  // tempo ramping with severity. In the final five seconds a giant centred
  // digit (5…4…3…2…1) appears so the countdown is readable from across a pub.
  const vignetteRgb =
    severity === "urgent" ? "255, 48, 60" : severity === "warn" ? "255, 138, 0" : "255, 204, 51";
  const vignetteInset =
    severity === "urgent"
      ? `inset 0 0 160px rgba(${vignetteRgb}, 0.55), inset 0 0 60px rgba(${vignetteRgb}, 0.75)`
      : severity === "warn"
        ? `inset 0 0 120px rgba(${vignetteRgb}, 0.4), inset 0 0 40px rgba(${vignetteRgb}, 0.55)`
        : `inset 0 0 80px rgba(${vignetteRgb}, 0.22), inset 0 0 24px rgba(${vignetteRgb}, 0.3)`;
  const vignetteAnimation =
    severity === "urgent"
      ? "social-vignette-flicker 0.48s ease-in-out infinite"
      : severity === "warn"
        ? "social-vignette-pulse 0.9s ease-in-out infinite"
        : "social-vignette-pulse 1.8s ease-in-out infinite";
  const isFinalFive = severity === "urgent";

  const sizeClass = clsx(
    size === "sm" && "text-xs",
    size === "md" && "text-sm",
    size === "lg" && "text-base",
  );

  const labelSizeClass = clsx(
    size === "sm" && "text-[0.65rem]",
    size === "md" && "text-[0.7rem]",
    size === "lg" && "text-[0.75rem]",
  );

  return (
    <>
      <style>{`
        @keyframes social-timer-tick {
          0%, 100% { transform: scale(1.4); }
          50% { transform: scale(1.55); }
        }
        @keyframes social-vignette-pulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        @keyframes social-vignette-flicker {
          0%, 100% { opacity: 0.95; }
          45% { opacity: 1; }
          50% { opacity: 0.6; }
          55% { opacity: 1; }
        }
        @keyframes social-stadium-pop {
          0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; filter: blur(14px); }
          35% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; filter: blur(0); }
          70% { transform: translate(-50%, -50%) scale(1); opacity: 1; filter: blur(0); }
          100% { transform: translate(-50%, -50%) scale(1.35); opacity: 0; filter: blur(4px); }
        }
      `}</style>

      {shouldShowUrgency && criticalStyle === "vignette" && portalTarget
        ? createPortal(
            <>
              <div
                className="fixed inset-0 pointer-events-none"
                style={{
                  zIndex: 2147483000,
                  boxShadow: vignetteInset,
                  animation: vignetteAnimation,
                  mixBlendMode: "screen",
                }}
                aria-hidden="true"
              />
              {isFinalFive ? (
                <div
                  key={secondsLeft}
                  className="fixed left-1/2 top-1/2 pointer-events-none select-none"
                  style={{
                    zIndex: 2147483001,
                    color: `rgb(${vignetteRgb})`,
                    fontWeight: 900,
                    fontSize: "clamp(14rem, 36vmin, 42rem)",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                    textShadow: `0 0 80px rgba(${vignetteRgb}, 0.9), 0 0 28px rgba(${vignetteRgb}, 1)`,
                    WebkitTextStroke: `3px rgba(${vignetteRgb}, 0.7)`,
                    animation:
                      "social-stadium-pop 1s cubic-bezier(0.22, 1.4, 0.36, 1) forwards",
                    transform: "translate(-50%, -50%)",
                  }}
                  aria-hidden="true"
                >
                  {secondsLeft}
                </div>
              ) : null}
            </>,
            portalTarget,
          )
        : null}

      {shouldShowUrgency && criticalStyle === "bar" && portalTarget
        ? createPortal(
            <div
              className="fixed left-0 right-0 top-0 pointer-events-none"
              style={{ zIndex: 2147483000 }}
            >
              <div
                className="w-full overflow-hidden"
                style={{
                  height: severity === "urgent" ? 22 : severity === "warn" ? 18 : 14,
                  background: "rgba(0,0,0,0.35)",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="h-full"
                  style={{
                    width: `${Math.min(1, Math.max(0, secondsLeft / 30)) * 100}%`,
                    background:
                      severity === "urgent"
                        ? "linear-gradient(90deg, #ff0040 0%, #ff3b3b 55%, #ff7a00 100%)"
                        : severity === "warn"
                          ? "linear-gradient(90deg, #ff7a00 0%, #ffaa00 100%)"
                          : "linear-gradient(90deg, #ffcc33 0%, #ffe46b 100%)",
                    boxShadow: `0 0 24px rgba(${vignetteRgb}, 0.75)`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>,
            portalTarget,
          )
        : null}

      <div
        className={clsx(
          position === "fixed"
            ? "fixed right-5 top-4 z-50 flex flex-col items-end gap-1 text-right uppercase tracking-[0.08em] pointer-events-none transition-opacity duration-150"
            : "flex flex-col items-center gap-1 text-center uppercase tracking-[0.08em] transition-opacity duration-150",
          sizeClass,
          isCritical
            ? "opacity-100 text-red-500 animate-[social-timer-tick_1s_steps(1)_infinite]"
            : "opacity-60 text-white",
          isDone && "opacity-40",
          paused && "opacity-60",
        )}
        role="timer"
        aria-live="assertive"
      >
        {label ? (
          <span className={clsx("font-extrabold", labelSizeClass)}>
            {label}
          </span>
        ) : null}
        <span
          className="font-black leading-none"
          style={{
            fontVariantNumeric: "tabular-nums",
            minWidth: "3ch",
            display: "inline-block",
            textAlign: "right",
          }}
        >
          {typeof secondsDisplay === "string" ? secondsDisplay : `${secondsDisplay}s`}
        </span>
      </div>
    </>
  );
}

export default Timer;
