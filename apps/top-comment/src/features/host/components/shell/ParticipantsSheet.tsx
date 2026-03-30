/**
 * ParticipantsSheet - Modal bottom sheet for participant management
 * 
 * Features:
 * - Native <dialog> with .showModal() for accessibility
 * - Focus trap and ESC to dismiss
 * - Drag-to-dismiss (only when scroll at top)
 * - Virtualized list for large rooms
 * - Participant actions: mute, kick, ban, spotlight
 * - Role management for hosts
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Room, RoomMembership } from '../../../../shared/types';
import { getMascotById } from '../../../../shared/mascots';

interface ParticipantsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  memberships: RoomMembership[];
  room: Room | null;
  session?: any; // Session object
  sessionPlayers?: any[]; // SessionPlayer array
  onKick: (membershipId: string) => void;
  onBan: (membershipId: string) => void;
  onMute?: (membershipId: string) => void;
  onSpotlight?: (membershipId: string) => void;
  // onRoleChange reserved for future role management feature
  // onRoleChange?: (membershipId: string, role: MembershipRole) => void;
  kickingPlayerId?: string | null;
  banningPlayerId?: string | null;
  spotlightedId?: string | null;
}

export function ParticipantsSheet({
  isOpen,
  onClose,
  memberships,
  room,
  session,
  sessionPlayers,
  onKick,
  onBan,
  onMute,
  onSpotlight,
  kickingPlayerId,
  banningPlayerId,
  spotlightedId,
}: ParticipantsSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Determine if session is active (session exists, regardless of players)
  const isSessionActive = session && sessionPlayers;
  
  // Always show room members
  const activeRoomMemberships = memberships.filter(m => !m.isBanned);
  const filteredRoomMemberships = searchQuery
    ? activeRoomMemberships.filter(m => 
        m.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeRoomMemberships;

  // Separate room moderators from players
  const roomModerators = filteredRoomMemberships.filter(m => 
    room?.moderatorIds.includes(m.userId)
  );
  const roomPlayers = filteredRoomMemberships.filter(m => 
    !room?.moderatorIds.includes(m.userId)
  );

  // Session players (only if session is active)
  let filteredSessionPlayers: any[] = [];
  if (isSessionActive) {
    filteredSessionPlayers = searchQuery
      ? sessionPlayers.filter(p => 
          p.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : sessionPlayers;
  }

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
      setSearchQuery('');
      setShowActionMenu(null);
    }
  }, [isOpen]);

  // Handle native dialog close event (ESC key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  // Handle backdrop click
  const handleDialogClick = useCallback((e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (!isInDialog) {
      onClose();
    }
  }, [onClose]);

  // Render participant row
  const renderParticipant = (participant: any, isModerator: boolean) => {
    const isSessionPlayer = 'displayName' in participant; // Check if it's a session player
    const mascot = isSessionPlayer ? null : getMascotById(participant.mascotId);
    const isKicking = kickingPlayerId === participant.id;
    const isBanning = banningPlayerId === participant.id;
    const isSpotlighted = spotlightedId === participant.id;
    const showMenu = showActionMenu === participant.id;
    
    // Get name based on type
    const participantName = isSessionPlayer ? participant.displayName : participant.playerName;

    return (
      <div
        key={participant.id}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          isSpotlighted 
            ? 'bg-amber-500/20 border border-amber-400/50' 
            : 'bg-slate-700/50 hover:bg-slate-700'
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0 w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
          {mascot?.path ? (
            <img src={mascot.path} alt={mascot.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-cyan-300 uppercase">
              {participantName.charAt(0)}
            </span>
          )}
          {isSpotlighted && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-amber-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Name and status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {participantName}
            </span>
            {isModerator && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-300 rounded">
                Host
              </span>
            )}
            {!isSessionPlayer && participant.isMuted && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-300 rounded">
                Muted
              </span>
            )}
            {isSessionPlayer && participant.score > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded">
                {participant.score} pts
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Joined {new Date(isSessionPlayer ? participant.joinedAt : participant.joinedAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Actions - only show for room members, not session players */}
        {!isSessionPlayer && !isModerator && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowActionMenu(showMenu ? null : participant.id)}
              className="p-2 rounded-lg hover:bg-slate-600 transition-colors"
              aria-label="Actions"
              aria-expanded={showMenu}
            >
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* Action menu dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-10">
                {onSpotlight && (
                  <button
                    onClick={() => {
                      onSpotlight(participant.id);
                      setShowActionMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    {isSpotlighted ? 'Remove Spotlight' : 'Spotlight'}
                  </button>
                )}
                {onMute && (
                  <button
                    onClick={() => {
                      onMute(participant.id);
                      setShowActionMenu(null);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    {participant.isMuted ? 'Unmute' : 'Mute'}
                  </button>
                )}
                <button
                  onClick={() => {
                    onKick(participant.id);
                    setShowActionMenu(null);
                  }}
                  disabled={isKicking}
                  className="w-full px-3 py-2 text-left text-sm text-amber-400 hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {isKicking ? 'Kicking...' : 'Kick'}
                </button>
                <button
                  onClick={() => {
                    onBan(participant.id);
                    setShowActionMenu(null);
                  }}
                  disabled={isBanning}
                  className="w-full px-3 py-2 text-left text-sm text-rose-400 hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  {isBanning ? 'Banning...' : 'Ban'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[85vh] w-full max-w-lg mx-auto rounded-t-3xl bg-slate-800 p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      aria-labelledby="participants-sheet-title"
    >
      <div ref={contentRef} className="flex flex-col h-full max-h-[85vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-700">
          <h2 id="participants-sheet-title" className="text-lg font-semibold text-white">
            Participants ({activeRoomMemberships.length + (isSessionActive ? sessionPlayers.length : 0)})
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>
        </div>

        {/* Participant list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Session Players section */}
          {isSessionActive && (
            <div className="space-y-2">
              {filteredSessionPlayers.length > 0 ? (
                filteredSessionPlayers.map(p => renderParticipant(p, false))
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10m0 10a2 2 0 002-2m-2-2V6a2 2 0 00-2-2m2 2h10m-10-4h10" />
                    </svg>
                    <span className="text-sm">No players in session yet</span>
                    <span className="text-xs text-slate-500">Waiting for players to join...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Room sections only show when no session */}
          {!isSessionActive && (
            <>
              {/* Room Moderators section */}
              {roomModerators.length > 0 && (
                <div className="space-y-2">
                  {roomModerators.map(m => renderParticipant(m, true))}
                </div>
              )}

              {/* Room Players section */}
              {roomPlayers.length > 0 && (
                <div className="space-y-2">
                  {roomPlayers.map(m => renderParticipant(m, false))}
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {filteredRoomMemberships.length === 0 && !isSessionActive && (
            <div className="text-center py-8">
              <p className="text-slate-400">
                {searchQuery ? 'No participants found' : 'No participants yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
