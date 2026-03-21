// Domain types for room-based architecture
// These types represent the core room entities without any infrastructure concerns

export type RoomStatus = "active" | "archived" | "suspended";

export interface RoomSettings {
  maxPlayers: number;
  allowPlayerChat: boolean;
  autoStartSession: boolean;
  defaultSessionSettings: Partial<any>; // Will be typed properly when SessionSettings is available
  requireApproval: boolean; // Moderator must approve players joining
  allowAnonymous: boolean; // Allow anonymous players
  profanityFilter?: 'strict' | 'moderate' | 'off';
  slowMode?: boolean;
}

export interface Room {
  id: string;
  code: string; // 6-character room code
  moderatorIds: string[]; // Array of user IDs who have moderator privileges
  creatorId: string; // Original room creator (for reference only)
  name: string; // Optional room name
  description?: string;
  status: RoomStatus;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  settings: RoomSettings;
  currentSessionId?: string;
  totalSessionsPlayed: number;
}

export interface RoomMembership {
  id: string;
  roomId: string;
  userId: string; // Required - all users have UUID (auth or anonymous)
  playerName: string; // Updated from teamName to playerName
  mascotId?: number;
  joinedAt: string;
  lastActiveAt: string;
  isBanned: boolean;
  banReason?: string;
  bannedAt?: string;
  bannedBy?: string;
  status: 'pending' | 'approved' | 'active'; // For approval workflow
  isMuted?: boolean;
  mutedAt?: string;
  muteExpiresAt?: string;
}

// Domain events for room operations
export interface RoomCreatedEvent {
  type: 'room.created';
  roomId: string;
  hostUid: string;
  roomCode: string;
  timestamp: string;
}

export interface RoomMemberJoinedEvent {
  type: 'room.member_joined';
  roomId: string;
  userId: string;
  playerName: string;
  timestamp: string;
}

export interface RoomMemberLeftEvent {
  type: 'room.member_left';
  roomId: string;
  userId: string;
  timestamp: string;
}

export interface RoomSessionStartedEvent {
  type: 'room.session_started';
  roomId: string;
  sessionId: string;
  participantCount: number;
  timestamp: string;
}

export interface RoomSessionEndedEvent {
  type: 'room.session_ended';
  roomId: string;
  sessionId: string;
  finalParticipantCount: number;
  timestamp: string;
}

export type RoomEvent = 
  | RoomCreatedEvent
  | RoomMemberJoinedEvent
  | RoomMemberLeftEvent
  | RoomSessionStartedEvent
  | RoomSessionEndedEvent;

// Room validation rules
export interface RoomValidationRules {
  maxRoomNameLength: number;
  maxRoomDescriptionLength: number;
  maxPlayerNameLength: number;
  minRoomCodeLength: number;
  maxRoomCodeLength: number;
  maxPlayersPerRoom: number;
  minPlayersPerRoom: number;
}

export const DEFAULT_ROOM_VALIDATION_RULES: RoomValidationRules = {
  maxRoomNameLength: 100,
  maxRoomDescriptionLength: 500,
  maxPlayerNameLength: 50,
  minRoomCodeLength: 6,
  maxRoomCodeLength: 6,
  maxPlayersPerRoom: 100,
  minPlayersPerRoom: 1,
};

// Room aggregation types for analytics
export interface RoomAnalytics {
  roomId: string;
  totalSessionsPlayed: number;
  totalUniquePlayers: number;
  averageSessionDuration: number; // in minutes
  mostActivePlayers: string[]; // User IDs
  lastActivityAt: string;
}

export interface RoomSessionSummary {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  participantCount: number;
  finalScores: Array<{
    playerName: string;
    score: number;
    rank: number;
  }>;
}

// Room state management
export interface RoomState {
  room: Room | null;
  memberships: RoomMembership[];
  currentSession: any; // Will be typed as Session when available
  isLoading: boolean;
  error: string | null;
}

export interface RoomContext {
  roomState: RoomState;
  isHost: boolean;
  currentMembership: RoomMembership | null;
  createRoom: (data: CreateRoomRequest) => Promise<void>;
  joinRoom: (code: string, playerName: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateRoomSettings: (settings: Partial<RoomSettings>) => Promise<void>;
  startSession: (settings: any) => Promise<void>; // Will be typed as SessionSettings when available
  endSession: () => Promise<void>;
  kickMember: (userId: string) => Promise<void>;
  banMember: (userId: string, reason?: string) => Promise<void>;
  approveMember: (userId: string) => Promise<void>;
  rejectMember: (userId: string) => Promise<void>;
}

// Request types (these will be moved to shared/types.ts for API layer)
export interface CreateRoomRequest {
  name?: string;
  description?: string;
  maxPlayers?: number;
  settings?: Partial<RoomSettings>;
}

export interface JoinRoomRequest {
  code: string;
  playerName: string;
  mascotId?: number;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  settings?: Partial<RoomSettings>;
}

// Validation result types
export interface RoomValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RoomCodeValidationResult {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}
