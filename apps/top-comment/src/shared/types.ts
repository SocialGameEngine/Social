import type {
  SessionStatus,
  SessionSettings,
  RoundGroup,
  RoundDefinition,
  Session,
  Answer,
  Vote,
  VoteCount,
  RoundSummary,
  AnswerWithVotes,
  LeaderboardEntry,
  GameState,
} from "../domain/types/domain.types";
import type { 
  Room, 
  RoomSettings, 
  RoomMembership, 
  RoomAnalytics
} from "../domain/types/room.types";
import type {
  InteractionType,
  InteractionStatus,
  Interaction,
  InteractionResponse,
  InteractionVote,
} from "../domain/types/interaction.types";

// Re-export core domain types as single source of truth
export type {
  SessionStatus,
  SessionSettings,
  RoundGroup,
  RoundDefinition,
  Session,
  Answer,
  Vote,
  VoteCount,
  RoundSummary,
  AnswerWithVotes,
  LeaderboardEntry,
  GameState,
};

// Re-export room domain types
export type { 
  Room, 
  RoomSettings, 
  RoomMembership, 
  RoomAnalytics
};

// Re-export interaction domain types
export type {
  InteractionType,
  InteractionStatus,
  Interaction,
  InteractionResponse,
  InteractionVote,
};

// Session analytics type
export interface SessionAnalytics {
  sessionId: string;
  totalParticipants: number;
  activeMemberships: number; // Replaces activeTeams
  roundsCompleted: number;
  averageAnswerTime: number;
  engagementScore: number;
  startTime: string;
  endTime?: string;
  joinedCount?: number; // Optional for compatibility
  answerRate?: number; // Optional for compatibility
  voteRate?: number; // Optional for compatibility
  duration?: number; // Optional for compatibility (in seconds)
}

// Session API types
export interface CreateSessionRequest {
  roomId?: string;
  settings?: Partial<SessionSettings>;
  venueName?: string; // Optional for compatibility
  gameMode?: string; // Optional for compatibility
  selectedLibraries?: string[]; // Optional for compatibility
  totalRounds?: number; // Optional for compatibility
}

export interface CreateSessionResponse {
  session: Session;
  sessionId?: string; // Optional for compatibility
  code?: string; // Optional for compatibility
}

export interface UpdateSessionRequest {
  sessionId: string;
  settings?: Partial<SessionSettings>;
  venueName?: string; // Optional for compatibility
  gameMode?: string; // Optional for compatibility
  selectedLibraries?: string[]; // Optional for compatibility
  totalRounds?: number; // Optional for compatibility
}

export interface UpdateSessionResponse {
  session: Session;
  sessionId?: string; // Optional for compatibility
  code?: string; // Optional for compatibility
}

export interface JoinSessionRequest {
  sessionId?: string; // Optional - either sessionId or code required
  playerName: string;
  mascotId?: number;
  code?: string; // Optional - either sessionId or code required
}

export interface JoinSessionResponse {
  session: Session;
  membership: RoomMembership; // Replaces team
  sessionId?: string; // Optional for compatibility
}

export interface SessionAnalyticsResponse {
  analytics: SessionAnalytics;
}

export interface StartGameRequest {
  sessionId: string;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  membershipId?: string; // Replaces teamId - can be inferred from context
  answer?: string; // Optional for compatibility
  text?: string; // Optional for compatibility
}

export interface SubmitAnswerResponse {
  success: boolean;
  points?: number;
  isUpdate?: boolean; // Optional for compatibility
}

export interface SubmitVoteRequest {
  sessionId: string;
  membershipId?: string; // Replaces teamId - can be inferred from context
  votedForMembershipId?: string; // Replaces votedForTeamId - Optional for compatibility
  answerId?: string; // Optional for compatibility
}

export interface TransitionPhaseRequest {
  sessionId: string;
  targetPhase: string;
}

export interface SetPromptLibraryRequest {
  sessionId: string;
  promptLibraryId: string;
}

export interface SetPromptLibraryResponse {
  session: Session;
}

// API Request/Response types for room operations
export interface CreateRoomRequest {
  name?: string;
  description?: string;
  maxPlayers?: number;
  settings?: Partial<RoomSettings>;
}

export interface CreateRoomResponse {
  room: Room;
  membership: RoomMembership;
}

export interface JoinRoomRequest {
  code: string;
  playerName: string;
  mascotId?: number;
}

export interface JoinRoomResponse {
  room: Room;
  membership: RoomMembership;
  requiresApproval: boolean;
}

export interface UpdateRoomRequest {
  roomId: string;
  name?: string;
  description?: string;
  settings?: Partial<RoomSettings>;
}

export interface UpdateRoomResponse {
  room: Room;
}

export interface GetRoomRequest {
  roomId?: string;
  code?: string;
}

export interface GetRoomResponse {
  room: Room;
}

export interface LeaveRoomRequest {
  roomId: string;
  userId: string;
}

export interface LeaveRoomResponse {
  success: boolean;
}

export interface GetRoomMembersRequest {
  roomId: string;
}

export interface GetRoomMembersResponse {
  members: RoomMembership[];
}

export interface KickMemberRequest {
  roomId: string;
  userId: string;
  reason?: string;
}

export interface KickMemberResponse {
  success: boolean;
}

export interface BanMemberRequest {
  roomId: string;
  userId: string;
  reason?: string;
}

export interface BanMemberResponse {
  success: boolean;
}

export interface ApproveMemberRequest {
  roomId: string;
  userId: string;
}

export interface ApproveMemberResponse {
  success: boolean;
}

export interface RejectMemberRequest {
  roomId: string;
  userId: string;
  reason?: string;
}

export interface RejectMemberResponse {
  success: boolean;
}

export interface GetRoomAnalyticsRequest {
  roomId: string;
}

export interface GetRoomAnalyticsResponse {
  analytics: RoomAnalytics;
}

export interface StartSessionInRoomRequest {
  roomId: string;
  sessionSettings?: Partial<SessionSettings>;
}

export interface StartSessionInRoomResponse {
  session: Session;
  room: Room;
}

export interface EndSessionInRoomRequest {
  roomId: string;
  sessionId: string;
}

export interface EndSessionInRoomResponse {
  session: Session;
  room: Room;
}
