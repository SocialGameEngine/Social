import { FullscreenModal } from '../../../shared/components/FullscreenModal';
import { CommunityFeed } from './CommunityFeed';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  membershipId?: string;
  displayName: string;
  isMember: boolean;
  onJoinRoom?: () => void;
}

export function CommunityModal({
  isOpen,
  onClose,
  roomId,
  membershipId,
  displayName,
  isMember,
  onJoinRoom,
}: CommunityModalProps) {
  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Wall"
      showCloseButton={true}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <CommunityFeed
            roomId={roomId}
            membershipId={membershipId}
            displayName={displayName}
            isMember={isMember}
            onJoinRoom={onJoinRoom}
          />
        </div>
      </div>
    </FullscreenModal>
  );
}
