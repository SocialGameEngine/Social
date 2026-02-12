import type { Session, RoomMembership } from '../../../shared/types';
import { LobbyDrawer } from './layout/LobbyDrawer';
import { ChatDrawer } from './layout/ChatDrawer';
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
  showLobbyDrawer: boolean;
  showChatDrawer: boolean;
  showLeaderboardDrawer: boolean;
  showHowToPlay: boolean;
  onCloseLobby: () => void;
  onCloseChat: () => void;
  onCloseLeaderboard: () => void;
  onCloseHelp: () => void;
}

export function RoomDrawers({
  memberships,
  session,
  roomId,
  userId,
  membershipId,
  displayName,
  showLobbyDrawer,
  showChatDrawer,
  showLeaderboardDrawer,
  showHowToPlay,
  onCloseLobby,
  onCloseChat,
  onCloseLeaderboard,
  onCloseHelp,
  sessionId,
}: RoomDrawersProps) {
  return (
    <>
      <LobbyDrawer
        memberships={memberships}
        isOpen={showLobbyDrawer}
        onClose={onCloseLobby}
      />
      <ChatDrawer
        isOpen={showChatDrawer}
        onClose={onCloseChat}
        roomId={roomId}
        userId={userId}
        membershipId={membershipId}
        displayName={displayName}
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
