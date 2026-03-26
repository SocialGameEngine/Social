// Domain types for async interactions system
// These types represent room-scoped interactions (prompts, etc.) independent of sessions

export type InteractionType = 'prompt' | 'headline_fibbage' | 'challenge' | 'directed_reaction' | 'audience_question' | 'topic' | 'poll' | 'trivia';
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

// Trivia specific types
export type TriviaFormat = 'multiple_choice' | 'written_answer';
export type TriviaPhase = 'collecting' | 'grading' | 'revealed' | 'closed';

// Global interaction status mapping for trivia:
// active → collecting
// results → revealed  
// closed → closed
// (No voting phase for trivia)

export interface TriviaInteractionSettings {
  format: TriviaFormat;

  // Question source tracking
  questionId?: string;
  questionPackId?: string;

  // Immutable snapshot at launch (prevents historical games from changing)
  snapshot: {
    prompt: string;
    categoryKey: string;
    difficulty: 'easy' | 'medium' | 'hard';
    explanation?: string;
    hint?: string;

    media?: {
      imageUrl?: string;
      audioUrl?: string;
    };

    multipleChoice?: {
      options: Array<{
        id: string;  // Stable option IDs, not indexes
        text: string;
      }>;
      correctOptionId: string; // Server-only until reveal
      shuffleOptions: boolean;
    };

    writtenAnswer?: {
      acceptedAliases: string[]; // Server-only until reveal
      normalization: 'standard' | 'strict';
      allowTypos: boolean;
      allowWordOrderVariation: boolean;
      maxLength?: number;
    };
  };

  scoring: {
    pointsCorrect: number;
    pointsPartial: number;
    speedBonusEnabled: boolean;
    maxSpeedBonus?: number;
  };

  timing: {
    opensAt: string;
    closesAt: string;
    revealsAt?: string;
  };

  policy: {
    allowAnswerChangeUntilClose: boolean;
    lateSubmissions: 'reject' | 'mark_late';
    showCorrectAnswerAtReveal: boolean;
    showExplanationAtReveal: boolean;
  };
}

// Separate submission model (don't overload generic "response" pattern)
export interface TriviaSubmission {
  id: string;
  interactionId: string;
  roomId: string;
  memberId: string;
  submittedAt: string;
  latencyMs?: number;
  payload:
    | { format: 'multiple_choice'; selectedOptionId: string }
    | { format: 'written_answer'; rawText: string; normalizedText?: string };
  status: 'accepted' | 'replaced' | 'late' | 'rejected';
}

// Separate evaluation model (preserves auditability, allows re-grading)
export interface TriviaEvaluation {
  id: string;
  submissionId: string;
  interactionId: string;
  roomId: string;
  memberId: string;
  result: 'correct' | 'partial' | 'incorrect' | 'needs_review';
  pointsAwarded: number;
  method: 'exact' | 'alias' | 'fuzzy' | 'host_override';
  confidence?: number;
  matchedAlias?: string;
  reasoningShort?: string;
  graderVersion: string;
  judgedAt: string;
}

// Reveal summary (persisted or constructed server-side)
export interface TriviaReveal {
  interactionId: string;
  correctAnswer: string;
  explanation: string;
  statistics: {
    totalResponses: number;
    correctResponses: number;
    averageResponseTime: number;
    distribution: Record<string, number>; // Answer distribution
  };
  leaderboardDelta: {
    topPlayers: Array<{
      memberId: string;
      playerName: string;
      points: number;
      rank: number;
      rankChange: number;
    }>;
    personalDelta?: {
      points: number;
      rankChange: number;
      newPosition: number;
    };
  };
}
