// Domain types for async interactions system
// These types represent room-scoped interactions (prompts, etc.) independent of sessions

export type InteractionType = 'prompt' | 'headline_fibbage' | 'challenge' | 'directed_reaction' | 'audience_question' | 'topic' | 'poll';
export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type TargetType = 'broadcast' | 'player' | 'challenge';
export type InteractionStatus = 'active' | 'voting' | 'results' | 'closed';
export type TopicSortBy = 'newest' | 'upvotes';

// Database types for new tables
export interface Database {
  public: {
    topic_upvotes: {
      id: string;
      response_id: string;
      membership_id: string;
      created_at: string;
    };
    poll_votes: {
      id: string;
      interaction_id: string;
      membership_id: string;
      selected_option: number;
      created_at: string;
      updated_at: string;
    };
  };
}

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
  // Cross-player targeting fields
  targetType?: TargetType;
  targetMembershipId?: string | null;
  sourceMembershipId?: string | null;
  challengeStatus?: ChallengeStatus | null;
  challengeExpiresAt?: string | null;
  pointsWager?: number;
  // Topic and Poll specific fields
  pollOptions?: string[];
  sortBy?: TopicSortBy;
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
      fooledCount: number;
    }
  >;
}

// Topic specific types
export interface TopicUpvote {
  id: string;
  responseId: string;
  membershipId: string;
  createdAt: string;
}

export interface TopicResponseWithUpvotes extends InteractionResponse {
  upvoteCount: number;
  hasUpvoted: boolean;
}

// Poll specific types
export interface PollVote {
  id: string;
  interactionId: string;
  membershipId: string;
  selectedOption: number;
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  text: string;
  voteCount: number;
  percentage: number;
  isSelected?: boolean;
}

export interface PollResults {
  options: PollOption[];
  totalVotes: number;
  userVote?: number;
}
