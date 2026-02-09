// Domain types for async interactions system
// These types represent room-scoped interactions (prompts, etc.) independent of sessions

export type InteractionType = 'prompt'; // Phase 2: | 'trivia' | 'poll'
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
