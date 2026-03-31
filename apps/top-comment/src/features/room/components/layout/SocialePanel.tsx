import { SocialeRoomPhaseController } from '../SocialeRoomPhaseController';
import type { RoomMembership } from '../../../../shared/types';

interface SocialePanelProps {
  socialeId: string | null;
  roomId: string;
  userId?: string;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard?: () => void;
  onOpenSelfie?: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  isSticky?: boolean;
}

export function SocialePanel({
  socialeId,
  roomId,
  userId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  isSticky = false,
}: SocialePanelProps) {
  return (
    <div
      className={`relative z-10 w-full max-w-2xl mx-auto ${
        isSticky ? 'sticky top-0 backdrop-blur-sm' : ''
      }`}
    >
      <div className="px-4 pb-4 pt-0 sm:p-4">
        {socialeId ? (
          <SocialeRoomPhaseController
            socialeId={socialeId}
            roomId={roomId}
            userId={userId}
            memberships={memberships}
            onOpenLeaderboard={onOpenLeaderboard ?? (() => {})}
            onOpenSelfie={onOpenSelfie ?? (() => {})}
            onOpenModal={onOpenModal}
          />
        ) : (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2">No Active Sociale</h3>
            <p className="text-sm text-slate-300">
              The host will start a Sociale to begin the social game
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
