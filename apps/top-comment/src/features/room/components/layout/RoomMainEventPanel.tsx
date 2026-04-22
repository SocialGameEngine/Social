import { SocialePanel } from './SocialePanel';
import { useSociale, useSocialesByRoom } from '../../../../features/sociale';
import type { RoomMembership } from '../../../../shared/types';

interface RoomMainEventPanelProps {
  roomId: string | undefined;
  userId: string | undefined;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  onJoinRoom?: () => void;
  isSticky?: boolean;
  /**
   * Canonical pointer to the active Sociale for this room (from rooms.current_sociale_id).
   * When provided, this takes precedence over list ordering.
   */
  currentSocialeId?: string | null;
}

/**
 * Picks the room's latest Sociale as the main in-room experience. Wave R7 removed
 * the legacy session-mode fallback; when there is no active Sociale we render a
 * friendly empty state.
 */
export function RoomMainEventPanel({
  roomId,
  userId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  onJoinRoom,
  isSticky = false,
  currentSocialeId,
}: RoomMainEventPanelProps) {
  const { data: roomSociales = [], isLoading: isLoadingList } = useSocialesByRoom(roomId);
  
  // RACE CONDITION FIX: Directly fetch the Sociale by ID when currentSocialeId is set.
  // This eliminates dependency on the list subscription which may arrive later than
  // the room UPDATE event that sets currentSocialeId.
  const { data: directSociale, isLoading: isLoadingDirect } = useSociale(currentSocialeId ?? undefined);
  
  // Use direct fetch result first (most reliable), then fallback to list
  const primary = directSociale ?? 
    (currentSocialeId ? roomSociales.find(s => s.id === currentSocialeId) : null) ??
    roomSociales[0];
  
  const isLoading = currentSocialeId ? isLoadingDirect : isLoadingList;

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
        onJoinRoom={onJoinRoom}
        isSticky={isSticky}
      />
    );
  }

  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pb-4 pt-0 sm:p-4">
      <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 text-center px-6">
        <div className="text-3xl" aria-hidden="true">🎲</div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">
          No active game
        </p>
        <p className="text-xs text-white/60 max-w-sm">
          The host hasn't started a round yet. Hang tight — things will kick off soon.
        </p>
      </div>
    </div>
  );
}
