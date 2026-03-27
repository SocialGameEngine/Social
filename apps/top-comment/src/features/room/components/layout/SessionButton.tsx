import type { SessionDisplayState } from '../PhaseController';
import { getSessionDisplayCopy } from '../../utils/sessionDisplayCopy';
import { PlayerStack } from './PlayerStack';
import { useSessionPlayers } from '../../../host/hooks/useSessionPlayers';
import type { Session } from '../../../../shared/types';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface SessionButtonProps {
  displayState: SessionDisplayState;
  session: Session;
  isMainEventMode?: boolean;
  isJoining?: boolean;
  joinSuccess?: boolean;
  phase?: string;
  onClick: () => void;
}

export function SessionButton({
  displayState,
  session,
  isMainEventMode = false,
  isJoining = false,
  joinSuccess = false,
  phase,
  onClick,
}: SessionButtonProps) {
  // Get actual session participants
  const { players: sessionPlayers } = useSessionPlayers(session?.id || null);
  
  // Get display copy based on session state
  const displayCopy = getSessionDisplayCopy(displayState, {
    joinedCount: sessionPlayers.length,
    totalSlots: sessionPlayers.length, // Use session participants as total
    hasJoined: displayState === "joined"
  });
  
  // Extract player initials for social proof (from session participants)
  const playerInitials = sessionPlayers.slice(0, 3).map(p => 
    p.displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  ) || [];
  
  const extraPlayers = Math.max(0, sessionPlayers.length - 3);
  return (
    <div className="pt-2">
      <div className="relative rounded-[28px] p-3 overflow-visible">
        <button
      className={cn(
        "w-full chaos-session-button",
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
            <span>{displayCopy.statusBadgeText}</span>
          </div>
        </div>

        <div className="chaos-session-mainline">
          <div className="chaos-session-copy">
            <h2 className="chaos-session-headline">{displayCopy.headlineText}</h2>
            <p
              className={cn(
                "chaos-session-support",
                joinSuccess && "chaos-session-support--success"
              )}
            >
              {joinSuccess ? "Joined successfully!" : displayCopy.supportText}
            </p>
          </div>

          <div className="chaos-session-arrow" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5l8 7-8 7V5z"/>
            </svg>
          </div>
        </div>

        {(sessionPlayers && sessionPlayers.length > 0) && (
          <div className="chaos-session-footer">
            <PlayerStack 
              playerInitials={playerInitials} 
              extraPlayers={extraPlayers}
            />
            {displayCopy.joinedCountText && (
              <div className="chaos-session-meta-chip">{displayCopy.joinedCountText}</div>
            )}
          </div>
        )}

        {/* Tap hint for mega-button affordance */}
        {(displayState === "forming" || displayState === "countdown") && (
          <div className="chaos-session-tap-hint">
            TAP ANYWHERE TO JOIN
          </div>
        )}
      </div>
    </button>
    </div>
  </div>
  );
}
