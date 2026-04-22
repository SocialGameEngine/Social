import { useState } from 'react';
import type { RoomMembership } from '../../../../shared/types';
import { BottomSheet } from '../../../../shared/components/BottomSheet';
import { ChatPanel } from '../layout/ChatPanel';
import { LobbyPanel } from '../layout/LobbyPanel';

interface ChatLobbyBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  memberships: RoomMembership[] | null;
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
  myMembershipId?: string;
  blockPlayer?: (membershipId: string) => Promise<void>;
  onChallengePlayer?: (membershipId: string, playerName: string) => void;
}

export function ChatLobbyBottomSheet({
  isOpen,
  onClose,
  memberships,
  roomId,
  userId,
  membershipId,
  displayName,
  myMembershipId,
  blockPlayer,
  onChallengePlayer,
}: ChatLobbyBottomSheetProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'lobby'>('chat');

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Chat & Lobby"
      accent="lobby"
      eyebrow="Talk with your table"
      count={memberships?.length ?? null}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 border-b border-slate-700/50">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'border-b-2 border-cyan-500 bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'lobby'
                ? 'border-b-2 border-cyan-500 bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lobby
          </button>
        </div>

        <div className="min-h-0 flex-1">
          {activeTab === 'chat' ? (
            <ChatPanel
              roomId={roomId}
              userId={userId}
              membershipId={membershipId}
              displayName={displayName}
            />
          ) : (
            <LobbyPanel
              memberships={memberships}
              roomId={roomId}
              myMembershipId={myMembershipId}
              blockPlayer={blockPlayer}
              onChallengePlayer={onChallengePlayer}
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
