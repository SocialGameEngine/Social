import { SessionPanel } from './SessionPanel';
import { SocialePanel } from './SocialePanel';
import { useSocialesByRoom } from '../../../../features/sociale';
import type { Session } from '../../../../shared/types';
import type { RoomMembership } from '../../../../shared/types';

interface RoomMainEventPanelProps {
  roomId: string | undefined;
  userId: string | undefined;
  session: Session | null;
  sessionId: string | null;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  isSticky?: boolean;
  /**
   * Canonical pointer to the active Sociale for this room (from rooms.current_sociale_id).
   * When provided, this takes precedence over list ordering.
   */
  currentSocialeId?: string | null;
}

/**
 * Picks the room's latest Sociale (same ordering as host SocialesPanel) when it should be
 * the main in-room experience; otherwise shows the legacy Session panel.
 */
export function RoomMainEventPanel({
  roomId,
  userId,
  session,
  sessionId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  isSticky = false,
  currentSocialeId,
}: RoomMainEventPanelProps) {
  const { data: roomSociales = [], isLoading } = useSocialesByRoom(roomId);
  const primary =
    (currentSocialeId && roomSociales.find(s => s.id === currentSocialeId)) ||
    roomSociales[0];

  const showSociale =
    !!roomId &&
    !isLoading &&
    !!primary &&
    primary.status !== 'completed' &&
    primary.status !== 'cancelled';

  if (roomId && isLoading) {
    return (
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pb-4 pt-0 sm:p-4">
        <div className="min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/40">
          <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading game…</p>
        </div>
      </div>
    );
  }

  if (showSociale) {
    return (
      <SocialePanel
        socialeId={primary.id}
        roomId={roomId || ''}
        userId={userId}
        memberships={memberships}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenSelfie={onOpenSelfie}
        onOpenModal={onOpenModal}
        isSticky={isSticky}
      />
    );
  }

  return (
    <SessionPanel
      session={session}
      sessionId={sessionId}
      memberships={memberships}
      onOpenLeaderboard={onOpenLeaderboard}
      onOpenSelfie={onOpenSelfie}
      onOpenModal={onOpenModal}
      isSticky={isSticky}
    />
  );
}
