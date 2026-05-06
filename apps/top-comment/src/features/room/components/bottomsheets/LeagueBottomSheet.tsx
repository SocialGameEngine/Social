import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { LeaguePage } from '../../../../features/seasons/pages/LeaguePage';

interface LeagueBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  membershipId?: string | null;
}

export function LeagueBottomSheet({ isOpen, onClose, membershipId }: LeagueBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="League"
      eyebrow="Seasonal standings"
    >
      <LeaguePage membershipId={membershipId} />
    </BottomSheet>
  );
}
