import type { SessionDisplayState } from '../PhaseController';

interface SessionButtonProps {
  displayState: SessionDisplayState;
  statusBadgeText: string;
  headlineText: string;
  supportText: string;
  joinedCountText?: string;
  isMainEventMode?: boolean;
  isJoining?: boolean;
  joinSuccess?: boolean;
  showPlayerStack?: boolean;
  playerInitials?: string[];
  extraPlayers?: number;
  phase?: string;
  onClick: () => void;
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function SessionButton({
  displayState,
  statusBadgeText,
  headlineText,
  supportText,
  joinedCountText,
  isMainEventMode = false,
  isJoining = false,
  joinSuccess = false,
  showPlayerStack = false,
  playerInitials = [],
  extraPlayers = 0,
  phase,
  onClick,
}: SessionButtonProps) {
  return (
    <button
      className={cn(
        "chaos-session-button",
        isMainEventMode && "chaos-session-button--main-event",
        displayState === "forming" && "chaos-session-button--forming",
        displayState === "countdown" && "chaos-session-button--starting",
        displayState === "joined" && "chaos-session-button--joined",
        !isMainEventMode && "chaos-session-button--quiet",
        (isJoining || joinSuccess) && "chaos-session-feedback-pop"
      )}
      data-phase={phase}
      onClick={onClick}
    >
      <div className="chaos-session-inner">
        <div className="chaos-session-topline">
          <div
            className={cn(
              "chaos-session-badge",
              displayState === "forming" && "chaos-session-badge--forming",
              displayState === "waiting_on_host" && "chaos-session-badge--forming",
              displayState === "countdown" && "chaos-session-badge--starting",
              displayState === "joined" && "chaos-session-badge--joined",
              displayState === "idle" && "chaos-session-badge--quiet",
              (displayState === "answer" || displayState === "vote" || displayState === "results") &&
                "chaos-session-badge--live"
            )}
          >
            {(displayState === "forming" || displayState === "countdown" || displayState === "joined") && (
              <span
                className={cn(
                  "chaos-live-dot",
                  displayState === "joined" && "chaos-live-dot--green",
                  displayState !== "joined" && displayState !== "countdown" && "chaos-live-dot--yellow"
                )}
              />
            )}
            <span>{statusBadgeText}</span>
          </div>
        </div>

        <div className="chaos-session-mainline">
          <div className="chaos-session-copy">
            <h2 className="chaos-session-headline">{headlineText}</h2>
            <p
              className={cn(
                "chaos-session-support",
                joinSuccess && "chaos-session-support--success"
              )}
            >
              {supportText}
            </p>
          </div>

          <div className="chaos-session-arrow" aria-hidden="true">
            ▶
          </div>
        </div>

        {(showPlayerStack || joinedCountText) && (
          <div className="chaos-session-footer">
            {showPlayerStack ? (
              <div className="chaos-player-stack" aria-hidden="true">
                {playerInitials.slice(0, 3).map((initials, index) => (
                  <span key={index} className="chaos-player-token">
                    {initials}
                  </span>
                ))}
                {extraPlayers > 0 && (
                  <span className="chaos-player-stack-more">+{extraPlayers}</span>
                )}
              </div>
            ) : (
              <span />
            )}

            {joinedCountText ? (
              <div className="chaos-session-meta-chip">{joinedCountText}</div>
            ) : null}
          </div>
        )}
      </div>
    </button>
  );
}
