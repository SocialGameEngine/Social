import type { Session, RoomMembership } from '../../../shared/types';
import { ChatLobbyDrawer } from './layout/ChatLobbyDrawer';
import { LeaderboardHistoryDrawer } from './layout/LeaderboardHistoryDrawer';
import { HelpDrawer } from './layout/HelpDrawer';

interface RoomDrawersProps {
  memberships: RoomMembership[] | null;
  session: Session | null;
  sessionId: string | null;
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string;
  showChatLobbyDrawer: boolean;
  showLeaderboardDrawer: boolean;
  showHowToPlay: boolean;
  onCloseChatLobby: () => void;
  onCloseLeaderboard: () => void;
  onCloseHelp: () => void;
  blockPlayer?: (membershipId: string) => Promise<void>;
  onChallengePlayer?: (membershipId: string, playerName: string) => void;
}

export function RoomDrawers({
  memberships,
  session,
  roomId,
  userId,
  membershipId,
  displayName,
  showChatLobbyDrawer,
  showLeaderboardDrawer,
  showHowToPlay,
  onCloseChatLobby,
  onCloseLeaderboard,
  onCloseHelp,
  sessionId,
  blockPlayer,
  onChallengePlayer,
}: RoomDrawersProps) {
  return (
    <>
      <ChatLobbyDrawer
        memberships={memberships}
        isOpen={showChatLobbyDrawer}
        onClose={onCloseChatLobby}
        roomId={roomId}
        userId={userId}
        membershipId={membershipId}
        displayName={displayName}
        myMembershipId={membershipId}
        blockPlayer={blockPlayer}
        onChallengePlayer={onChallengePlayer}
      />
      <LeaderboardHistoryDrawer
        isOpen={showLeaderboardDrawer}
        onClose={onCloseLeaderboard}
        roomId={roomId}
        currentSessionId={sessionId}
      />
      <HelpDrawer
        isOpen={showHowToPlay}
        onClose={onCloseHelp}
        initialPhase={session?.status}
      />
    </>
  );
}
