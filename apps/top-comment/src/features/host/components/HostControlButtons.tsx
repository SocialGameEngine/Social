import { Button } from "@social/ui";
import type { Session } from "../../../shared/types";
import type { Sociale } from "../../../domain/types/sociale.types";
import { actionLabel } from "../../../shared/constants";

interface HostControlButtonsProps {
  session: Session | null;
  activeSociale: Sociale | null;
  storedRoomId: string | null;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  isUpdatingSession: boolean;
  onPrimaryClick: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateNewSession: () => void;
  onOpenEditModal: () => void;
  onJoinModal: () => void;
  onLeaveSession: () => void;
  onOpenSocialeModal: () => void;
  onJoinSocialeModal: () => void;
}

export function HostControlButtons({
  session,
  activeSociale,
  storedRoomId,
  isPerformingAction,
  isPausingSession,
  isEndingSession,
  isUpdatingSession,
  onPrimaryClick,
  onPauseToggle,
  onEndSession,
  onCreateNewSession,
  onOpenEditModal,
  onJoinModal,
  onLeaveSession,
  onOpenSocialeModal,
  onJoinSocialeModal,
}: HostControlButtonsProps) {
  // Active phase controls (answer, vote, results)
  if (session && (session.status === "answer" || session.status === "vote" || session.status === "results")) {
    return (
      <div className="flex flex-wrap gap-2">
        {/* PRIMARY ACTION: Advance to next phase */}
        <Button
          onClick={onPrimaryClick}
          disabled={isPerformingAction}
          isLoading={isPerformingAction}
        >
          {actionLabel[session.status]}
        </Button>
        <Button
          variant="ghost"
          onClick={onPauseToggle}
          disabled={isPausingSession}
        >
          {session.paused ? "Resume" : "Pause"}
        </Button>
        <Button
          variant="ghost"
          onClick={onEndSession}
          disabled={isEndingSession}
        >
          End Session
        </Button>
      </div>
    );
  }

  // Session control buttons (lobby or ended)
  if (session && (session.status === "lobby" || session.status === "ended")) {
    return (
      <div className="flex flex-wrap gap-2">
        {session.status === "lobby" ? (
          <>
            <Button
              variant="secondary"
              onClick={onCreateNewSession}
              disabled={true}
              title="End the current session before starting a new one."
            >
              New Session
            </Button>
            <Button
              variant="ghost"
              onClick={onOpenEditModal}
              disabled={isUpdatingSession}
            >
              Session Settings
            </Button>
            <Button
              variant="ghost"
              onClick={onJoinModal}
            >
              Load Session
            </Button>
            <Button
              variant="ghost"
              onClick={onEndSession}
              disabled={isEndingSession}
            >
              End Session
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={onCreateNewSession}
            >
              New Session
            </Button>
            <Button
              variant="ghost"
              onClick={onJoinModal}
            >
              Load Session
            </Button>
            <Button
              variant="ghost"
              onClick={onLeaveSession}
            >
              Leave Session
            </Button>
          </>
        )}
      </div>
    );
  }

  // Lobby controls (no session or sociale)
  if (!session && !activeSociale && storedRoomId) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={onOpenSocialeModal}
        >
          Create Sociale
        </Button>
        <Button
          variant="ghost"
          onClick={onJoinSocialeModal}
        >
          Load Sociale
        </Button>
      </div>
    );
  }

  return null;
}
