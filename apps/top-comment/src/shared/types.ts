import type { PromptLibraryId } from "./promptLibraries";

// Re-export core domain types as single source of truth
export type {
  SessionStatus,
  SessionSettings,
  RoundGroup,
  RoundDefinition,
  Session,
  Team,
  Answer,
  Vote,
  VoteCount,
  RoundSummary,
  AnswerWithVotes,
  LeaderboardEntry,
  GameState,
} from "../domain/types/domain.types";

// API Request/Response types (these stay in shared as they're infrastructure concerns)
export interface CreateSessionRequest {
  venueName?: string;
  promptLibraryId?: PromptLibraryId;
  gameMode?: "classic" | "mashup";
  selectedLibraries?: PromptLibraryId[];
  totalRounds?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  code: string;
  session: any; // Use domain Session type
}

export interface UpdateSessionRequest {
  sessionId: string;
  venueName?: string;
  gameMode?: "classic" | "mashup";
  selectedLibraries?: PromptLibraryId[];
  totalRounds?: number;
}

export interface UpdateSessionResponse {
  sessionId: string;
  code: string;
  session: any; // Use domain Session type
}

export interface JoinSessionRequest {
  code: string;
  teamName: string;
  playerName?: string;
}

export interface JoinSessionResponse {
  sessionId: string;
  team: any; // Use domain Team type
  session: any; // Use domain Session type
}

export interface StartGameRequest {
  sessionId: string;
}

export interface TransitionPhaseRequest {
  sessionId: string;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  text: string;
}

export interface SubmitAnswerResponse {
  success: boolean;
  isUpdate?: boolean;
}

export interface SubmitVoteRequest {
  sessionId: string;
  answerId: string;
}

export interface KickTeamRequest {
  sessionId: string;
  teamId: string;
}

export interface SessionAnalyticsResponse {
  analytics: SessionAnalytics;
}

// Additional shared types
export interface RoundResults {
  roundIndex: number;
  winningAnswerId?: string;
  voteCounts: Record<string, number>;
  leaderboard: TeamLeaderboardEntry[];
}

export interface TeamLeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
}

export interface SessionAnalytics {
  joinedCount: number;
  answerRate: number;
  voteRate: number;
  duration?: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  player_name?: string | null;
  is_captain: boolean;
  joined_at: string;
}

export interface SetPromptLibraryRequest {
  sessionId: string;
  promptLibraryId: PromptLibraryId;
}

export interface SetPromptLibraryResponse {
  session: any; // Use domain Session type
}

export interface PauseSessionRequest {
  sessionId: string;
  pause: boolean;
}
