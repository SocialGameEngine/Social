/**
 * HostPanel - Modern host panel with three-layer mobile layout
 * 
 * This component demonstrates the full integration of the new host panel
 * architecture from the 2026 implementation plan.
 * 
 * Features:
 * - Three-layer mobile layout (status bar, canvas, action bar)
 * - Session state machine integration
 * - Connection status monitoring
 * - Offline resilience
 * - WCAG 2.2 compliant touch targets
 */

import { useState, useCallback, useMemo } from 'react';
import { useResponsiveLayout } from '../../room/hooks/useResponsiveLayout';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useSessionMachine } from '../state/sessionMachine';
import { useHostGame } from '../context/HostGameContext';
import {
  HostMobileShell,
  HostTopStatusBar,
  HostActionBar,
  ConfirmDialog,
  ToastProvider,
  OfflineBanner,
  ParticipantsSheet,
} from './shell';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { PHASE_STATUS_LABELS } from '../types/host-panel.types';
import type { Session, Room, RoomMembership } from '../../../shared/types';
import type { Sociale, Socialite } from '../../../domain/types/sociale.types';
import type { SessionPlayer } from '../../../services/sessionPlayerService';

interface HostPanelProps {
  timer?: number;
  onPrimaryAction: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateSession: () => void;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  children?: React.ReactNode;
}

export function HostPanel({
  timer,
  onPrimaryAction,
  onPauseToggle,
  onEndSession,
  onCreateSession,
  onOpenSettings,
  onOpenCommandPalette,
  isPerformingAction,
  isPausingSession,
  isEndingSession,
  children,
}: HostPanelProps) {
  // Get data from context instead of props
  const {
    session,
    room,
    roomMemberships: memberships,
    roomCode,
    activeSociale: sociale,
    sessionPlayers,
    socialites,
    playerCount: propPlayerCount,
  } = useHostGame();
  const { isMobile } = useResponsiveLayout();
  const [showParticipantsSheet, setShowParticipantsSheet] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  
  // Session state machine
  const memberCount = useMemo(() => memberships.length, [memberships.length]);
  const sessionMachine = useSessionMachine(session, memberCount);
  
  // Mock handlers for participant actions (to be implemented)
  const handleKick = useCallback((membershipId: string) => {
    // TODO: Implement kick logic
  }, []);
  
  const handleBan = useCallback((membershipId: string) => {
    // TODO: Implement ban logic
  }, []);
  
  const handleMute = useCallback((membershipId: string) => {
    // TODO: Implement mute logic
  }, []);
  
  const handleSpotlight = useCallback((membershipId: string) => {
    // TODO: Implement spotlight logic
  }, []);

  // Connection status monitoring
  const connectionStatus = useConnectionStatus({
    onStatusChange: (status) => {
      // Could integrate with session machine here
    },
  });

  // Use passed playerCount or compute from memberships (for participants list)
  const computedPlayerCount = useMemo(() => {
    if (!room) return 0;
    return memberships.filter(
      (m) => !m.isBanned && 
             m.status === 'active' && 
             !room.moderatorIds.includes(m.userId)
    ).length;
  }, [memberships, room]);

  // Use passed playerCount for display, computed for internal logic
  const displayPlayerCount = propPlayerCount ?? computedPlayerCount;

  // Phase name for display - check Sociale first, then Session
  const phaseName = useMemo(() => {
    if (sociale) {
      // Sociale status mapping
      switch (sociale.status) {
        case 'draft': return 'Draft';
        case 'lobby': return 'Lobby';
        case 'active': return sociale.currentPhase ? `${sociale.currentPhase.charAt(0).toUpperCase()}${sociale.currentPhase.slice(1)}` : 'Active';
        case 'paused': return 'Paused';
        case 'completed': return 'Completed';
        case 'cancelled': return 'Cancelled';
        default: return sociale.status;
      }
    }
    if (session) {
      return PHASE_STATUS_LABELS[session.status] || session.status;
    }
    return 'No Game';
  }, [session, sociale]);

  // Handle end session with confirmation
  const handleEndSessionClick = useCallback(() => {
    setShowEndSessionConfirm(true);
  }, []);

  const handleConfirmEndSession = useCallback(() => {
    setShowEndSessionConfirm(false);
    onEndSession();
  }, [onEndSession]);

  // Render mobile layout
  if (isMobile) {
    return (
      <ToastProvider>
        {/* Offline banner */}
        <OfflineBanner
          status={connectionStatus.status}
          retryCount={connectionStatus.retryCount}
          onRetry={connectionStatus.retry}
        />

        <HostMobileShell
          topBar={
            <HostTopStatusBar
              roomCode={roomCode}
              phaseName={phaseName}
                            connectionStatus={connectionStatus.status}
              isPaused={session?.paused ?? sociale?.status === 'paused'}
              roundIndex={sociale?.currentRoundIndex ?? session?.roundIndex}
              totalRounds={sociale?.totalRounds ?? session?.settings?.totalRounds}
              onSettingsOpen={onOpenSettings}
            />
          }
          actionBar={
            <HostActionBar
              session={session}
              sociale={sociale}
              playerCount={session ? (sessionPlayers?.length || 0) : (sociale ? (socialites?.filter(s => s.isActive && !s.isBanned).length || 0) : displayPlayerCount)}
              isPerformingAction={isPerformingAction || sessionMachine.isPerformingAction}
              isPausingSociale={isPausingSession}
              isEndingSociale={isEndingSession}
              hasRoom={!!room}
              timer={timer}
              onPrimaryAction={onPrimaryAction}
              onPauseToggle={onPauseToggle}
              onEndSociale={handleEndSessionClick}
              onCreateSociale={onCreateSession}
              onParticipantsOpen={() => setShowParticipantsSheet(true)}
            />
          }
        >
          {/* Session Canvas Content */}
          <div className="space-y-4">
            {/* Main content passed as children */}
            {children}
          </div>
        </HostMobileShell>

        {/* Participants Sheet */}
        <ParticipantsSheet
          isOpen={showParticipantsSheet}
          onClose={() => setShowParticipantsSheet(false)}
          memberships={memberships}
          room={room}
          session={session}
          sessionPlayers={sessionPlayers}
          sociale={sociale}
          socialites={socialites}
          onKick={handleKick}
          onBan={handleBan}
          onMute={handleMute}
          onSpotlight={handleSpotlight}
        />

        {/* End Game Confirmation */}
        <ConfirmDialog
          isOpen={showEndSessionConfirm}
          onClose={() => setShowEndSessionConfirm(false)}
          onConfirm={handleConfirmEndSession}
          title={sociale ? "End Sociale?" : "End Session?"}
          description={sociale ? "This will end the current Sociale for all players. This action cannot be undone." : "This will end the current session for all players. This action cannot be undone."}
          confirmLabel={sociale ? "End Sociale" : "End Session"}
          cancelLabel="Keep Playing"
          variant="danger"
          isLoading={isEndingSession}
        />
      </ToastProvider>
    );
  }

  // Desktop layout (simplified for now - full implementation in Phase 3)
  return (
    <ToastProvider>
      {/* Offline banner */}
      <OfflineBanner
        status={connectionStatus.status}
        retryCount={connectionStatus.retryCount}
        onRetry={connectionStatus.retry}
      />

      <div className="min-h-screen bg-slate-900">
        {/* Desktop header */}
        <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-cyan-400/20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <HostTopStatusBar
                  roomCode={roomCode}
                  phaseName={phaseName}
                  connectionStatus={connectionStatus.status}
                  isPaused={session?.paused ?? (sociale?.status === 'paused')}
                  roundIndex={sociale?.currentRoundIndex ?? session?.roundIndex}
                  totalRounds={sociale?.totalRounds ?? session?.settings?.totalRounds}
                  onSettingsOpen={onOpenSettings}
                />
              </div>
              {onOpenCommandPalette && (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  title="Command Palette (⌘K)"
                  aria-label="Open command palette"
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>⌘K</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Desktop main content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Sociale Controls */}
            <aside className="lg:col-span-1 space-y-4">
              <div className="bg-slate-800 rounded-2xl p-4 border border-cyan-400/20">
                <h2 className="text-lg font-semibold text-white mb-4">Sociale Controls</h2>
                <HostActionBar
                  session={session}
                  sociale={sociale}
                  playerCount={session ? (sessionPlayers?.length || 0) : (sociale ? (socialites?.filter(s => s.isActive && !s.isBanned).length || 0) : displayPlayerCount)}
                  isPerformingAction={isPerformingAction || sessionMachine.isPerformingAction}
                  isPausingSociale={isPausingSession}
                  isEndingSociale={isEndingSession}
                  hasRoom={!!room}
                  timer={timer}
                  onPrimaryAction={onPrimaryAction}
                  onPauseToggle={onPauseToggle}
                  onEndSociale={handleEndSessionClick}
                  onCreateSociale={onCreateSession}
                  onParticipantsOpen={() => setShowParticipantsSheet(true)}
                />
                <KeyboardShortcutsHelp />
              </div>

              
                          </aside>

            {/* Center column - Session Canvas */}
            <div className="lg:col-span-2">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Participants Sheet */}
      <ParticipantsSheet
        isOpen={showParticipantsSheet}
        onClose={() => setShowParticipantsSheet(false)}
        memberships={memberships}
        room={room}
        session={session}
        sessionPlayers={sessionPlayers}
        sociale={sociale}
        socialites={socialites}
        onKick={handleKick}
        onBan={handleBan}
        onMute={handleMute}
        onSpotlight={handleSpotlight}
      />

      {/* End Game Confirmation */}
      <ConfirmDialog
        isOpen={showEndSessionConfirm}
        onClose={() => setShowEndSessionConfirm(false)}
        onConfirm={handleConfirmEndSession}
        title={sociale ? "End Sociale?" : "End Session?"}
        description={sociale ? "This will end the current Sociale for all players. This action cannot be undone." : "This will end the current session for all players. This action cannot be undone."}
        confirmLabel={sociale ? "End Sociale" : "End Session"}
        cancelLabel="Keep Playing"
        variant="danger"
        isLoading={isEndingSession}
      />
    </ToastProvider>
  );
}
