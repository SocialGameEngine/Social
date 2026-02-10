import { useState } from 'react';
import { LobbyPanel } from './LobbyPanel';
import { ChatPanel } from './ChatPanel';
import type { RoomMembership } from '../../../../shared/types';

type SidebarTab = 'lobby' | 'chat';

interface RoomSidebarProps {
  memberships: RoomMembership[] | null;
  isCollapsed: boolean;
  onToggle: () => void;
  roomId: string | undefined;
  userId: string | undefined;
  membershipId: string | undefined;
  displayName: string | undefined;
}

function TabBar({ activeTab, setActiveTab }: { activeTab: SidebarTab; setActiveTab: (tab: SidebarTab) => void }) {
  return (
    <div className="flex border-b border-slate-700/50 shrink-0">
      <button
        onClick={() => setActiveTab('lobby')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          activeTab === 'lobby'
            ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Lobby
      </button>
      <button
        onClick={() => setActiveTab('chat')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          activeTab === 'chat'
            ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Chat
      </button>
    </div>
  );
}

export function RoomSidebar({ memberships, isCollapsed, onToggle, roomId, userId, membershipId, displayName }: RoomSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('lobby');

  return (
    <aside
      className={`hidden sm:flex flex-col border-l border-slate-700/50 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 relative z-10 ${
        isCollapsed ? 'w-12' : 'w-72'
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center p-3 text-slate-400 hover:text-white transition-colors border-b border-slate-700/50"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <>
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
          {activeTab === 'lobby' ? (
            <LobbyPanel memberships={memberships} />
          ) : (
            <ChatPanel roomId={roomId} userId={userId} membershipId={membershipId} displayName={displayName} />
          )}
        </>
      )}
    </aside>
  );
}

