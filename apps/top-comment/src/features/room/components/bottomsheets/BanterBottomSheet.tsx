import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { BanterChannel } from '../BanterChannel';
import type { Sociale } from '../../../../domain/types/sociale.types';

interface BanterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sociale: Sociale;
  isHost?: boolean;
}

export function BanterBottomSheet({ isOpen, onClose, sociale, isHost = false }: BanterBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Banter"
      accent="lobby"
      eyebrow="Game chat"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <BanterChannel
          sociale={sociale}
          isHost={isHost}
          className="flex-1"
        />
      </div>
    </BottomSheet>
  );
}
