// =============================================================================
// HOST HANDLER TYPES
// =============================================================================
// Type definitions for host handler parameters and state.

import type { SessionPlayer } from '../../../services/sessionPlayerService';
import type { Session, RoomMembership, Answer } from '../../../shared/types';
import type { LeaderboardEntry, RoundSummary } from '../../../domain/types/domain.types';

/**
 * Vote group structure
 */
export interface VoteGroup {
  id: string;
  answers: Answer[];
  [key: string]: unknown;
}

/**
 * Create session form data
 */
export interface CreateSessionForm {
  venueName: string;
  gameMode: 'classic' | 'mashup';
  selectedLibraries: string[];
  totalRounds: number;
}

/**
 * Create session form errors
 */
export interface CreateSessionErrors {
  venueName?: string;
  gameMode?: string;
  selectedLibraries?: string;
  totalRounds?: string;
}

/**
 * Analytics data for session
 */
export interface SessionAnalytics {
  totalPlayers: number;
  totalRounds: number;
  averageScore: number;
  topScorer?: SessionPlayer;
  [key: string]: unknown;
}

/**
 * Host group votes mapping
 */
export type HostGroupVotes = Record<string, string>;

/**
 * Active vote group
 */
export type ActiveVoteGroup = VoteGroup | null;

/**
 * Game state from useGameState hook
 */
export interface GameStateData {
  session: Session | null;
  memberships: RoomMembership[];
  answers: Answer[];
  currentGroups: VoteGroup[];
  activeVoteGroup: VoteGroup | null;
  voteCounts: Record<string, number>;
  leaderboard: LeaderboardEntry[];
  roundSummaries: RoundSummary[];
  isLoading: boolean;
  error: Error | null;
}
