// Domain types for async interactions system
// These types represent room-scoped interactions (prompts, etc.) independent of sessions

export type InteractionType = 'prompt'; // Phase 2: | 'trivia' | 'poll'
export type InteractionStatus = 'active' | 'closed';

export interface Interaction {
  id: string;
  roomId: string;
  createdBy: string;        // auth user ID
  type: InteractionType;
  status: InteractionStatus;
  question: string;
  description?: string;
  settings: Record<string, unknown>;
  responseCount: number;
  createdAt: string;
  closedAt?: string;
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
