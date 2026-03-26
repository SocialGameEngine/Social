import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatPanel } from './ChatPanel';
import { LobbyPanel } from './LobbyPanel';
import type { RoomMembership } from '../../../../shared/types';

interface ChatLobbyDrawerProps {
  memberships: RoomMembership[] | null;
  isOpen: boolean;
  onClose: () => void;
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
  myMembershipId?: string;
  blockPlayer?: (membershipId: string) => Promise<void>;
  onChallengePlayer?: (membershipId: string, playerName: string) => void;
}

export function ChatLobbyDrawer({ 
  memberships, 
  isOpen, 
  onClose, 
  roomId, 
  userId, 
  membershipId, 
  displayName,
  myMembershipId,
  blockPlayer,
  onChallengePlayer 
}: ChatLobbyDrawerProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'lobby'>('chat');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer - slides up from bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[85vh] max-h-[85vh] flex flex-col bg-slate-900 border-t border-slate-700/50 rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header with close */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          <h2 className="text-sm font-semibold text-slate-300">Chat & Lobby</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/50 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-white bg-slate-800 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('lobby')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'lobby'
                ? 'text-white bg-slate-800 border-b-2 border-cyan-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Lobby
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col">
              <ChatPanel 
                roomId={roomId} 
                userId={userId} 
                membershipId={membershipId} 
                displayName={displayName} 
              />
            </div>
          )}
          
          {activeTab === 'lobby' && (
            <div className="h-full flex flex-col">
              <LobbyPanel 
                memberships={memberships} 
                roomId={roomId}
                myMembershipId={myMembershipId}
                blockPlayer={blockPlayer}
                onChallengePlayer={onChallengePlayer}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
