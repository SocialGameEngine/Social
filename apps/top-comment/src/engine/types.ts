/**
 * Core Game Engine Types
 * These types define the foundation for all games in the system
 */

// Game registry and identification
export type GameId = string; // e.g., "top-comment-event", "top-comment-solo"
export type GameMode = "event" | "patron";

// Game descriptor - metadata about a game
export interface GameDescriptor {
  id: GameId;
  name: string;
  mode: GameMode;
  description: string;
  minPlayers?: number;
  maxPlayers?: number;
  icon?: string;
}

// Phase system - games define their own phases
export interface GamePhase<TPhaseId = string, TData = unknown> {
  id: TPhaseId;
  data?: TData;
  endsAt?: string; // ISO timestamp for timed phases
}

// Generic session that any game can use
export interface GameSession<
  TPhaseId = string,
  TSettings = unknown,
  TState = unknown,
> {
  id: string;
  gameId: GameId;
  code?: string; // Only for event mode
  hostUid?: string; // Only for event mode
  phase: GamePhase<TPhaseId>;
  settings: TSettings;
  state: TState; // Game-specific state
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// Player/Team representation
export interface GamePlayer {
  id: string;
  uid: string;
  name: string;
  score: number;
  isHost?: boolean;
  joinedAt: string;
  lastActiveAt?: string;
  metadata?: Record<string, unknown>; // Game-specific player data
}

// Scoring
export interface PlayerScore {
  playerId: string;
  score: number;
  rank: number;
  metadata?: Record<string, unknown>;
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
  metadata?: Record<string, unknown>;
}

// Actions
export interface GameAction<TType = string, TPayload = unknown> {
  type: TType;
  payload: TPayload;
}

// Context for phase transitions
export interface PhaseContext {
  currentPhase: GamePhase;
  players: GamePlayer[];
  timestamp: string;
}

// Session creation request
export interface CreateSessionRequest {
  gameId: GameId;
  creatorName: string;
  venueName?: string;
  settings?: Record<string, unknown>;
}

export interface CreateSessionResponse<TSession = GameSession> {
  sessionId: string;
  code?: string;
  session: TSession;
  player: GamePlayer;
}

// Join session request
export interface JoinSessionRequest {
  code: string;
  playerName: string;
}

export interface JoinSessionResponse<TSession = GameSession> {
  sessionId: string;
  session: TSession;
  player: GamePlayer;
}




