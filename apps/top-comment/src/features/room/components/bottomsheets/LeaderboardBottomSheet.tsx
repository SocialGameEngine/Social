import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { LeaderboardHistoryPanel } from '../layout/LeaderboardHistoryPanel';

interface LeaderboardBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | undefined;
  currentSessionId: string | null;
}

export function LeaderboardBottomSheet({
  isOpen,
  onClose,
  roomId,
  currentSessionId,
}: LeaderboardBottomSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Leaderboard">
      <div className="flex min-h-0 flex-1 flex-col">
        <LeaderboardHistoryPanel roomId={roomId} currentSessionId={currentSessionId} />
      </div>
    </BottomSheet>
  );
}
