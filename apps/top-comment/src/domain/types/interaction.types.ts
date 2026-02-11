// Domain types for async interactions system
// These types represent room-scoped interactions (prompts, etc.) independent of sessions

export type InteractionType = 'prompt' | 'headline_fibbage'; // Phase 2: | 'trivia' | 'poll'
export type InteractionStatus = 'active' | 'voting' | 'results' | 'closed';

export interface Interaction {
  id: string;
  roomId: string;
  createdBy: string;        // auth user ID
  type: InteractionType;
  status: InteractionStatus;
  question: string;
  description?: string | null;
  settings: Record<string, unknown>;
  responseCount: number;
  voteCount: number;
  answerEndsAt?: string | null;
  answerSeconds?: number;
  votingEndsAt?: string | null;
  votingSeconds?: number;
  createdAt: string;
  closedAt?: string | null;
}

export interface InteractionResponse {
  id: string;
  interactionId: string;
  membershipId: string;     // room_memberships.id
  text: string;
  createdAt: string;
  // Joined fields (from room_memberships)
  playerName?: string;
  mascotId?: number;
}

export interface InteractionVote {
  id: string;
  interactionId: string;
  membershipId: string;
  responseId: string;
  createdAt: string;
}

// Headline Fibbage specific types
export interface HeadlineFibbageSettings {
  mode: 'headline_fibbage';
  headlineId: string;
  headlineBlank: string; // e.g. "Tech CEO sues former employee over leaked ____"
  sourceName: string;
  publishedAt: string; // ISO
  answerMaxLen?: number; // e.g. 40
  profanityFilter?: 'none' | 'basic';
}

export interface VotingOption {
  optionId: string;
  text: string;
  isReal?: boolean; // Only returned in results phase
  authorMembershipId?: string | null;
}

export interface HeadlineResults {
  realAnswer: string;
  options: Array<
    VotingOption & {
      voteCount: number;
      fooledTeams: number;
    }
  >;
}
