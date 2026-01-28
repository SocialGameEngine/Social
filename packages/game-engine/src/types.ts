/**
 * Game Engine Types for Supabase
 * Database-agnostic types for the modular game engine
 */

// Game registry and identification
export type GameId = string;
export type GameMode = 'event' | 'patron';

// Game descriptor - metadata about a game
export interface GameDescriptor {
  id: GameId;
  name: string;
  mode: GameMode;
  description: string;
  minPlayers?: number;
  maxPlayers?: number;
}

// Phase system - games define their own phases
export interface GamePhase<TPhaseId = string, TData = unknown> {
  id: TPhaseId;
  data?: TData;
  endsAt?: string | null; // ISO timestamp
}

// Generic session document that any game can use
export interface GameSessionDoc<
  TPhaseId = string,
  TSettings = unknown,
  TState = unknown,
> {
  id: string;
  gameId: GameId;
  mode: GameMode;
  code?: string; // Only for event mode
  hostId?: string; // Only for event mode
  phase: GamePhase<TPhaseId>;
  settings: TSettings;
  state: TState; // Game-specific state
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

// Player/Team document
export interface GamePlayerDoc {
  id: string;
  sessionId: string;
  userId: string;
  displayName: string;
  teamName?: string;
  score: number;
  isActive: boolean;
  joinedAt: string;
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
  players: GamePlayerDoc[];
  timestamp: string; // ISO timestamp
}

// Request/Response types for API
export interface CreateSessionRequest {
  gameId: GameId;
  creatorName: string;
  venueName?: string;
  settings?: Record<string, unknown>;
}

export interface JoinSessionRequest {
  code: string;
  playerName: string;
}

export interface SessionActionRequest {
  sessionId: string;
}

export interface PlayerActionRequest {
  sessionId: string;
  action: GameAction;
}

// Plugin definition for games
export interface GamePluginDefinition {
  id: GameId;
  name: string;
  description?: string;
  EventMode?: any; // Will be properly typed later
  PatronMode?: any;
  components: {
    HostView?: React.ComponentType<any>;
    PlayerView?: React.ComponentType<any>;
    TVDisplay?: React.ComponentType<any>;
    PatronView?: React.ComponentType<any>;
  };
  settings: any; // Game-specific settings schema
}

