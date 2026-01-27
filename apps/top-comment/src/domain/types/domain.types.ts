// Domain types for pure business logic
// These types represent the core domain entities without any infrastructure concerns

export type SessionStatus = "lobby" | "category-select" | "answer" | "vote" | "results" | "ended";

export interface SessionSettings {
  answerSecs: number;
  voteSecs: number;
  resultsSecs: number;
  maxTeams: number;
  gameMode?: "classic" | "jeopardy";
  categorySelectSecs?: number;
  selectedCategories?: string[]; // Array of PromptLibraryId (string union type)
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
  code: string;
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
}

export interface Team {
  id: string;
  uid: string | null; // Nullable for teams without captains
  teamName: string;
  isHost: boolean;
  score: number;
  joinedAt: string;
  lastActiveAt?: string;
  mascotId?: number;
  team_members?: import("../../shared/types").TeamMember[];
}

export interface Answer {
  id: string;
  teamId: string;
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
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  mascotId?: number;
}

export interface GameState {
  session: Session | null;
  teams: Team[];
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
  teamCount: number;
  hasAnswers: boolean;
  hasVotes: boolean;
  currentRoundComplete: boolean;
  allRoundsComplete: boolean;
}

export interface TransitionValidation {
  canTransition: boolean;
  reason?: string;
}
