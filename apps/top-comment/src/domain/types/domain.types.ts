// Domain types for pure business logic
// These types represent the core domain entities without any infrastructure concerns

export type SessionStatus = "lobby" | "answer" | "vote" | "results" | "ended";

export interface SessionSettings {
  answerSecs: number;
  voteSecs: number;
  resultsSecs: number;
  maxTeams: number;
  gameMode?: "classic" | "mashup";
  librarySetupSecs?: number; // Time for the Mashup library transition
  totalRounds?: number;
}

export interface RoundGroup {
  id: string;
  prompt: string;
  teamIds: string[];
  promptLibraryId?: string;
  selectingTeamId?: string;
  selectedBonus?: {
    bonusType: 'points' | 'multiplier';
    bonusValue: number;
  };
}

export interface RoundDefinition {
  prompt?: string;
  groups: RoundGroup[];
}

export interface Session {
  id: string;
  roomId?: string; // Link to parent room (optional for backward compatibility)
  code: string; // Keep for compatibility, but may be deprecated
  hostUid: string;
  status: SessionStatus;
  roundIndex: number;
  rounds: RoundDefinition[];
  voteGroupIndex: number | null;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  endsAt?: string;
  settings: SessionSettings;
  venueName?: string;
  promptLibraryId?: string;
  paused?: boolean;
  pausedAt?: string;
  totalPausedMs?: number;
  endedByHost?: boolean;
  categoryGrid?: any; // CategoryGrid type from shared/utils/categoryGrid
  autoAssignedPlayers: string[]; // RoomMembership IDs
  selectedLibraries?: string[]; // For mashup mode
  currentLibraryIndex?: number; // For mashup mode
}

export interface Answer {
  id: string;
  membershipId: string; // Replaces teamId - references RoomMembership
  roundIndex: number;
  groupId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  masked?: boolean;
}

export interface Vote {
  id: string;
  voterId: string;
  roundIndex: number;
  groupId: string;
  answerId: string;
  createdAt: string;
}

export interface VoteCount {
  answerId: string;
  count: number;
}

export interface RoundSummary {
  roundIndex: number;
  groupId: string;
  answers: AnswerWithVotes[];
  winners: AnswerWithVotes[];
}

export interface AnswerWithVotes {
  answer: Answer;
  voteCount: number;
  isWinner: boolean;
  points: number;
}

export interface LeaderboardEntry {
  membershipId: string; // Replaces teamId
  playerName: string; // Replaces teamName - from RoomMembership.playerName
  score: number;
  rank: number;
  mascotId?: number;
}

export interface GameState {
  session: Session | null;
  memberships: import("../types/room.types").RoomMembership[]; // Replaces teams
  answers: Answer[];
  votes: Vote[];
  voteCounts: Map<string, number>;
  leaderboard: LeaderboardEntry[];
  roundSummaries: RoundSummary[];
  currentRound: RoundDefinition | null;
  currentGroups: RoundGroup[];
  activeVoteGroup: RoundGroup | null;
}

export interface StateMachineContext {
  playerCount: number;
  hasAnswers: boolean;
  hasVotes: boolean;
  currentRoundComplete: boolean;
  allRoundsComplete: boolean;
}

export interface TransitionValidation {
  canTransition: boolean;
  reason?: string;
}
