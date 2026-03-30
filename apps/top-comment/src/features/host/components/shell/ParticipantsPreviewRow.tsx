/**
 * ParticipantsPreviewRow - Horizontal scrollable avatar preview
 * 
 * Displays up to ~5 participant avatars with overflow count.
 * Clicking opens the full ParticipantsSheet.
 * 
 * Features:
 * - 32-36px avatars with accessible labels
 * - Overflow count badge
 * - Horizontal scroll for many participants
 */

import type { RoomMembership } from '../../../../shared/types';
import { getMascotById } from '../../../../shared/mascots';

interface ParticipantsPreviewRowProps {
  memberships: RoomMembership[];
  session?: any; // Session object
  sessionPlayers?: any[]; // SessionPlayer array
  maxVisible?: number;
  onOpenSheet: () => void;
}

export function ParticipantsPreviewRow({
  memberships,
  session,
  sessionPlayers,
  maxVisible = 5,
  onOpenSheet,
}: ParticipantsPreviewRowProps) {
  // Use session players when session is active, otherwise use room members
  const isSessionActive = session && sessionPlayers && sessionPlayers.length > 0;
  
  let displayItems: any[];
  let getItemName: (item: any) => string;
  let getItemInitial: (item: any) => string;
  
  if (isSessionActive) {
    displayItems = sessionPlayers.slice(0, maxVisible);
    getItemName = (player) => player.displayName;
    getItemInitial = (player) => player.displayName.charAt(0);
  } else {
    const activeMemberships = memberships.filter(m => !m.isBanned && m.status === 'active');
    displayItems = activeMemberships.slice(0, maxVisible);
    getItemName = (member) => member.playerName;
    getItemInitial = (member) => member.playerName.charAt(0);
  }
  
  const totalCount = isSessionActive ? sessionPlayers.length : memberships.filter(m => !m.isBanned && m.status === 'active').length;
  const overflowCount = Math.max(0, totalCount - maxVisible);

  if (totalCount === 0) {
    return (
      <button
        onClick={onOpenSheet}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
        aria-label="No participants yet. Click to view participants panel."
      >
        <span className="text-sm text-slate-400">No players yet</span>
      </button>
    );
  }

  return (
    <button
      onClick={onOpenSheet}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
      aria-label={`${totalCount} participants. Click to view all.`}
    >
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {displayItems.map((item, index) => {
          const itemName = getItemName(item);
          const itemInitial = getItemInitial(item);
          const mascot = isSessionActive ? null : getMascotById(item.mascotId);
          
          return (
            <div
              key={item.id}
              className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 overflow-hidden"
              style={{ zIndex: maxVisible - index }}
              title={itemName}
            >
              {mascot?.path ? (
                <img 
                  src={mascot.path} 
                  alt={mascot.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-cyan-300 uppercase">
                  {itemInitial}
                </span>
              )}
            </div>
          );
        })}

        {/* Overflow count */}
        {overflowCount > 0 && (
          <div
            className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-600 border-2 border-slate-900 text-xs font-bold text-white"
            style={{ zIndex: 0 }}
          >
            +{overflowCount > 99 ? '99' : overflowCount}
          </div>
        )}
      </div>

      {/* Player count */}
      <span className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 transition-colors">
        {totalCount} {totalCount === 1 ? 'player' : 'players'}
      </span>

      {/* Chevron */}
      <svg 
        className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
