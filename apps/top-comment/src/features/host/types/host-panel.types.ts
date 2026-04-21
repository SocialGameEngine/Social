/**
 * Host Panel Types
 * 
 * Type definitions for the modern host panel architecture.
 * Based on the 2026 implementation plan for mobile and desktop host controls.
 */

import type { Session, SessionStatus, RoomMembership, Room } from '../../../shared/types';

// ============================================================================
// Session Phase & Mode Types
// ============================================================================

export type SessionPhase = SessionStatus;
export type SessionMode = 'live' | 'rehearsal';
export type MembershipRole = 'host' | 'cohost' | 'moderator' | 'speaker' | 'participant' | 'viewer';

// ============================================================================
// Connection & Status Types
// ============================================================================

export type ConnectionStatus = 'connected' | 'reconnecting' | 'offline' | 'error';

export interface HostConnectionState {
  status: ConnectionStatus;
  lastConnectedAt?: string;
  reconnectAttempts: number;
  isOfflineQueueEnabled: boolean;
}

// ============================================================================
// Host Action Types
// ============================================================================

export type HostActionType = 
  | 'advance'
  | 'pause'
  | 'resume'
  | 'end_session'
  | 'kick'
  | 'ban'
  | 'mute'
  | 'spotlight'
  | 'start_recording'
  | 'stop_recording';

export interface HostAction {
  type: HostActionType;
  targetId?: string;
  payload?: Record<string, unknown>;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  retryCount?: number;
}

// ============================================================================
// Session Metrics Types
// ============================================================================

export interface SessionMetrics {
  sessionId: string;
  activeCount: number;
  joinedCount: number;
  churnRate: number;
  msgRate: number;
  avgResponseMs: number;
  flaggedCount: number;
}

// ============================================================================
// Recording Types
// ============================================================================

export interface Recording {
  id: string;
  sessionId: string;
  status: 'idle' | 'recording' | 'paused' | 'stopped';
  startedAt?: string;
  endedAt?: string;
  retentionDays: number;
  consentPolicyVersion: string;
}

export interface RecordingConsent {
  userId: string;
  grantedAt: string;
  revokedAt?: string;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export interface AuditLog {
  id: string;
  roomId: string;
  actorId: string;
  actionType: HostActionType;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
  undoableUntil?: string;
}

// ============================================================================
// Session Template Types
// ============================================================================

export interface SessionTemplate {
  id: string;
  ownerId: string;
  name: string;
  settings: {
    gameMode?: 'classic' | 'mashup';
    totalRounds?: number;
    answerSecs?: number;
    voteSecs?: number;
    resultsSecs?: number;
    selectedLibraries?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Host Panel Component Props
// ============================================================================

export interface HostTopStatusBarProps {
  roomCode: string;
  phaseName: string;
  timer?: number;
  connectionStatus: ConnectionStatus;
  isPaused: boolean;
  isRecording?: boolean;
  mode?: SessionMode;
  onMenuOpen?: () => void;
  onSettingsOpen?: () => void;
}

export interface HostActionBarProps {
  session: Session | null;
  playerCount: number;
  isPerformingAction: boolean;
  isPausingSession: boolean;
  isEndingSession: boolean;
  hasRoom: boolean;
  onPrimaryAction: () => void;
  onPauseToggle: () => void;
  onEndSession: () => void;
  onCreateSession: () => void;
  onParticipantsOpen?: () => void;
  onModerationOpen?: () => void;
}

export interface ParticipantsPreviewRowProps {
  memberships: RoomMembership[];
  maxVisible?: number;
  onOpenSheet: () => void;
}

export interface ParticipantsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  memberships: RoomMembership[];
  room: Room | null;
  onKick: (membershipId: string) => void;
  onBan: (membershipId: string) => void;
  onMute: (membershipId: string) => void;
  onSpotlight: (membershipId: string) => void;
  onRoleChange?: (membershipId: string, role: MembershipRole) => void;
  kickingPlayerId?: string | null;
  banningPlayerId?: string | null;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  undoAction?: () => void;
}

// ============================================================================
// Host Shell Props
// ============================================================================

export interface HostMobileShellProps {
  children: React.ReactNode;
  topBar: React.ReactNode;
  actionBar: React.ReactNode;
}

export interface HostDesktopShellProps {
  controlRail: React.ReactNode;
  sessionCanvas: React.ReactNode;
  sidePanels?: React.ReactNode;
}

// ============================================================================
// Phase Action Mapping
// ============================================================================

export const PHASE_ACTION_LABELS: Record<SessionPhase, string> = {
  lobby: 'Start Game',
  answer: 'Lock Answers',
  vote: 'Lock Votes',
  results: 'Next Round',
  ended: 'New Session',
};

export const PHASE_STATUS_LABELS: Record<SessionPhase, string> = {
  lobby: 'Lobby',
  answer: 'Answering',
  vote: 'Voting',
  results: 'Results',
  ended: 'Ended',
};

// ============================================================================
// CSS Custom Properties Interface
// ============================================================================

export interface HostPanelCSSVars {
  '--safe-bottom': string;
  '--safe-top': string;
  '--vv-offset': string;
  '--action-bar-height': string;
  '--status-bar-height': string;
}

// ============================================================================
// Accessibility Settings
// ============================================================================

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  captionsEnabled: boolean;
  ttsEnabled: boolean;
  lowBandwidthMode: boolean;
}
