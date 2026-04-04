// =============================================================================
// SOCIALE DOMAIN TYPES
// =============================================================================
// This file defines all domain types for the Sociale system.
// It follows the extensible pattern from interaction.types.ts
// and is designed to replace session-based types.

// =============================================================================
// ENUMS & UNION TYPES
// =============================================================================

/**
 * Sociale lifecycle status
 */
export type SocialeStatus = 
  | 'draft'      // Being configured, not visible to players
  | 'lobby'      // Open for players to join
  | 'active'     // Currently running rounds
  | 'paused'     // Temporarily paused
  | 'completed'  // All rounds finished
  | 'cancelled'; // Ended early without completion

/**
 * Preset modes for quick Sociale creation
 */
export type SocialeMode = 
  | 'topics_only'   // All topic rounds
  | 'trivia_only'   // All trivia rounds
  | 'alternating'   // Alternating topic/trivia
  | 'custom';       // Fully custom round sequence

/**
 * Round types - extensible union
 * Add new round types here as the system grows
 */
export type SocialeRoundType = 
  | 'prompt'   // Classic prompt-based round (backward compat with sessions)
  | 'trivia'   // Trivia question round
  | 'topic'    // Topic discussion round
  | 'poll'     // Poll/voting round
  | 'custom';  // Custom round type

/**
 * Round lifecycle status
 */
export type SocialeRoundStatus = 
  | 'pending'    // Not yet started
  | 'active'     // Currently running
  | 'completed'  // Finished
  | 'skipped';   // Skipped by host

/**
 * Response types for different round types
 */
export type SocialeResponseType = 
  | 'text'           // Free text response
  | 'multiple_choice' // Selected option
  | 'upvote'         // Upvote action
  | 'custom';        // Custom response type

// =============================================================================
// SETTINGS INTERFACES
// =============================================================================

/**
 * Global Sociale settings
 */
export interface SocialeSettings {
  // Timing defaults (can be overridden per round)
  answerSeconds: number;
  votingSeconds: number;
  resultsSeconds: number;
  revealSeconds: number;
  
  // Features
  leaderboardEnabled: boolean;
  autoAdvance: boolean;
  showInterRoundLeaderboard: boolean;
  allowLateJoin: boolean;
  
  // Extensible
  [key: string]: unknown;
}

/**
 * Default settings factory
 */
export const DEFAULT_SOCIALE_SETTINGS: SocialeSettings = {
  answerSeconds: 90,
  votingSeconds: 30,
  resultsSeconds: 12,
  revealSeconds: 15,
  leaderboardEnabled: true,
  autoAdvance: true,
  showInterRoundLeaderboard: true,
  allowLateJoin: true,
};

// =============================================================================
// ROUND-SPECIFIC SETTINGS
// =============================================================================

/**
 * Base settings shared by all round types
 */
export interface BaseRoundSettings {
  answerSeconds?: number;
  votingSeconds?: number;
  resultsSeconds?: number;
}

/**
 * Prompt round settings (backward compat with sessions)
 */
export interface PromptRoundSettings extends BaseRoundSettings {
  promptLibraryId?: string;
  prompt?: string;
  maxAnswerLength?: number;
  profanityFilter?: 'strict' | 'moderate' | 'off';
}

/**
 * Trivia round settings
 */
export interface TriviaRoundSettings extends BaseRoundSettings {
  questionId?: string;
  questionPackId?: string;
  format: 'multiple_choice' | 'written_answer';
  difficulty?: 'easy' | 'medium' | 'hard';
  categoryKey?: string;
  
  // Scoring
  pointsCorrect: number;
  pointsPartial: number;
  speedBonusEnabled: boolean;
  maxSpeedBonus?: number;
  
  // Snapshot (immutable at launch) — format-specific
  snapshot?: TriviaSnapshotMultipleChoice | TriviaSnapshotWrittenAnswer;
}

/**
 * Snapshot for multiple-choice trivia
 */
export interface TriviaSnapshotMultipleChoice {
  prompt: string;
  explanation?: string | null;
  multipleChoice: {
    options: Array<{ id: string; text: string }>;
    correctOptionId: string;
  };
}

/**
 * Snapshot for written-answer trivia
 */
export interface TriviaSnapshotWrittenAnswer {
  prompt: string;
  explanation?: string | null;
  writtenAnswer: {
    acceptedAnswers: string[];
    correctAnswer: string;
  };
}

/**
 * Topic round settings
 */
export interface TopicRoundSettings extends BaseRoundSettings {
  topic?: string;
  promptLibraryId?: string;
  sortBy?: 'newest' | 'upvotes';
  allowUpvotes?: boolean;
  maxResponses?: number;
}

/**
 * Poll round settings
 */
export interface PollRoundSettings extends BaseRoundSettings {
  question: string;
  options: string[];
  allowMultiple?: boolean;
  showResultsLive?: boolean;
}

/**
 * Custom round settings (extensible)
 */
export interface CustomRoundSettings extends BaseRoundSettings {
  [key: string]: unknown;
}

/**
 * Union type for all round settings
 */
export type SocialeRoundSettings = 
  | PromptRoundSettings 
  | TriviaRoundSettings 
  | TopicRoundSettings 
  | PollRoundSettings 
  | CustomRoundSettings;

// =============================================================================
// CORE DOMAIN ENTITIES
// =============================================================================

/**
 * Sociale - The main orchestrated experience
 * Replaces Session as the canonical multi-round experience model
 */
export interface Sociale {
  id: string;
  roomId: string;
  createdBy: string;
  
  // Identity / Setup
  title?: string;
  description?: string;
  mode: SocialeMode;
  
  // Lifecycle
  status: SocialeStatus;
  
  // Orchestration ownership
  currentRoundIndex?: number | null;
  currentRoundId?: string | null;
  currentPhase?: string | null;
  phaseStartedAt?: string | null;
  phaseEndsAt?: string | null;
  
  // Round sequence metadata
  totalRounds?: number;
  
  // Settings
  settings: SocialeSettings;
  
  // Scoreboard / aggregate runtime state
  scoreboard: Record<string, any>;
  runtimeState?: Record<string, any>;
  
  // Timing
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  
  // Migration support
  legacySessionId?: string | null;
  
  // Prompt library fields (from Sessions)
  promptLibraryId?: string | null;
  selectedLibraries?: string[] | null;
  currentLibraryIndex?: number | null;
}

/**
 * SocialeRound - A single round definition within a Sociale
 */
export interface SocialeRound {
  id: string;
  socialeId: string;
  orderIndex: number;
  
  // Round identity
  type: SocialeRoundType;
  title?: string;
  content?: string;
  
  // Type-specific config
  settings: SocialeRoundSettings;
  
  // Optional explicit phase override
  phaseSequence?: string[];
  
  // Bookkeeping
  createdAt: string;
  updatedAt: string;
}

/**
 * SocialeRoundState - Mutable runtime state for a round instance
 */
export interface SocialeRoundState {
  id: string;
  socialeId: string;
  roundId: string;
  
  // Lifecycle
  status: SocialeRoundStatus;
  phase: string;
  
  // Timing
  startedAt?: string;
  endedAt?: string;
  phaseStartedAt?: string;
  phaseEndsAt?: string;
  answerEndsAt?: string;
  votingEndsAt?: string;
  revealEndsAt?: string;
  resultsEndsAt?: string;
  
  // Runtime-derived / round-type-specific state
  derivedState: Record<string, unknown>;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * Socialite - A participant in a Sociale
 * Links to room membership but tracks Sociale-specific state
 */
export interface Socialite {
  id: string;
  socialeId: string;
  roomId: string;
  userId?: string;
  membershipId?: string;
  
  // Identity shown in gameplay
  displayName: string;
  mascotId?: number;
  
  // Role / permissions
  isHost: boolean;
  isActive: boolean;
  isBanned: boolean;
  
  // Scoring / participation
  score: number;
  
  // Timing
  joinedAt: string;
  lastSeenAt?: string;
  
  // Mid-game join state
  pendingUntilRoundIndex?: number | null;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * SocialeResponse - A submission for a round
 */
export interface SocialeResponse {
  id: string;
  socialeId: string;
  roundId: string;
  socialiteId: string;
  
  // Response data
  type: SocialeResponseType;
  value: Record<string, unknown> | string | number | boolean;
  
  // Evaluation
  isCorrect?: boolean;
  scoreAwarded?: number;
  
  createdAt: string;
  updatedAt: string;
}

/**
 * SocialeVote - A vote for a response
 */
export interface SocialeVote {
  id: string;
  socialeId: string;
  roundId: string;
  socialiteId: string;
  targetResponseId: string;
  
  createdAt: string;
}

/**
 * SocialeScoreEvent - Normalized score event for auditing
 */
export interface SocialeScoreEvent {
  id: string;
  socialeId: string;
  roundId?: string;
  socialiteId: string;
  
  reason: string;
  points: number;
  metadata?: Record<string, unknown>;
  
  createdAt: string;
}

/**
 * SocialeAnalyticsRow - Analytics data point
 */
export interface SocialeAnalyticsRow {
  id: string;
  socialeId: string;
  roundId?: string;
  
  category: string;
  metric: string;
  value: number | string | boolean;
  metadata?: Record<string, unknown>;
  
  createdAt: string;
}

// =============================================================================
// COMPUTED / DERIVED TYPES
// =============================================================================

/**
 * Scoreboard entry for display
 */
export interface SocialeScoreboardEntry {
  socialiteId: string;
  displayName: string;
  mascotId?: number;
  score: number;
  rank: number;
}

/**
 * Round summary after completion
 */
export interface SocialeRoundSummary {
  roundId: string;
  roundIndex: number;
  type: SocialeRoundType;
  responseCount: number;
  voteCount: number;
  topResponses: Array<{
    responseId: string;
    socialiteId: string;
    displayName: string;
    value: unknown;
    voteCount: number;
    scoreAwarded: number;
  }>;
}

/**
 * Full Sociale state for UI consumption
 */
export interface SocialeGameState {
  sociale: Sociale | null;
  rounds: SocialeRound[];
  currentRound: SocialeRound | null;
  currentRoundState: SocialeRoundState | null;
  socialites: Socialite[];
  responses: SocialeResponse[];
  votes: SocialeVote[];
  scoreboard: SocialeScoreboardEntry[];
  roundSummaries: SocialeRoundSummary[];
  
  // Computed UI state
  isLoading: boolean;
  error: string | null;
  
  // Phase-specific state
  canAdvancePhase: boolean;
  canPauseSociale: boolean;
  canResumeSociale: boolean;
  
  // Timer state
  timeRemaining: number | null;
  isTimedPhase: boolean;
  
  // Progress tracking
  roundProgress: number; // 0-1
  phaseProgress: number; // 0-1
  
  // User-specific state
  currentSocialite: Socialite | null;
}

// =============================================================================
// STATE MACHINE TYPES
// =============================================================================

/**
 * Context for state machine decisions
 */
export interface SocialeStateMachineContext {
  socialeId: string;
  currentRoundType: SocialeRoundType;
  currentPhase: string;
  socialiteCount: number;
  hasResponses: boolean;
  hasVotes: boolean;
  currentRoundComplete: boolean;
  allRoundsComplete: boolean;
  isPaused: boolean;
  currentRoundIndex: number | null;
}

/**
 * Transition validation result
 */
export interface SocialeTransitionValidation {
  canTransition: boolean;
  reason?: string;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Create Sociale request
 */
export interface CreateSocialeRequest {
  roomId: string;
  title?: string;
  description?: string;
  mode: SocialeMode;
  totalRounds?: number;
  settings?: Partial<SocialeSettings>;
  
  // Prompt library fields (from Sessions)
  promptLibraryId?: string;
  selectedLibraries?: string[];
  
  rounds?: Array<{
    type: SocialeRoundType;
    title?: string;
    content?: string;
    settings?: SocialeRoundSettings;
  }>;
  
  // Preview questions for exact order matching
  previewQuestions?: Array<{
    roundIndex: number;
    prompt: string;
    format: 'multiple_choice' | 'written_answer';
    questionId: string;
    options?: Array<{
      id: string;
      text: string;
      is_correct: boolean;
    }>;
  }>;
}

/**
 * Create Sociale response
 */
export interface CreateSocialeResponse {
  sociale: Sociale;
  rounds: SocialeRound[];
}

/**
 * Update Sociale request
 */
export interface UpdateSocialeRequest {
  socialeId: string;
  title?: string;
  description?: string;
  mode?: SocialeMode;
  totalRounds?: number;
  settings?: Partial<SocialeSettings>;
}

/**
 * Start Sociale request
 */
export interface StartSocialeRequest {
  socialeId: string;
}

/**
 * Advance phase request
 */
export interface AdvanceSocialePhaseRequest {
  socialeId: string;
  targetPhase?: string; // Optional - defaults to next phase
}

/**
 * Advance Sociale response
 */
export interface AdvanceSocialeResponse {
  sociale: Sociale;
  advanced: boolean;
  nextPhase: string;
}

/**
 * Pause Sociale request
 */
export interface PauseSocialeRequest {
  socialeId: string;
  pause: boolean;
}

/**
 * Pause Sociale response
 */
export interface PauseSocialeResponse {
  sociale: Sociale;
}

/**
 * Submit response request
 */
export interface SubmitSocialeResponseRequest {
  socialeId: string;
  roundId: string;
  socialiteId: string;
  type: SocialeResponseType;
  value: unknown;
}

/**
 * Submit vote request
 */
export interface SubmitSocialeVoteRequest {
  socialeId: string;
  roundId: string;
  targetResponseId: string;
}

/**
 * Join Sociale request
 */
export interface JoinSocialeRequest {
  socialeId: string;
  roomId: string;
  userId: string;
  displayName?: string;
  mascotId?: number;
  joinNextRound?: boolean;
}

/**
 * Join Sociale response
 */
export interface JoinSocialeResponse {
  socialite: Socialite;
  sociale: Sociale;
}

// =============================================================================
// REALTIME EVENT TYPES
// =============================================================================

/**
 * Realtime event types for Sociale channel
 */
export type SocialeRealtimeEventType =
  | 'sociale.started'
  | 'sociale.paused'
  | 'sociale.resumed'
  | 'sociale.completed'
  | 'round.started'
  | 'round.completed'
  | 'phase.changed'
  | 'scoreboard.updated'
  | 'socialite.joined'
  | 'socialite.left'
  | 'response.submitted'
  | 'vote.submitted';

/**
 * Base realtime event
 */
export interface SocialeRealtimeEvent {
  type: SocialeRealtimeEventType;
  socialeId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

/**
 * Phase changed event
 */
export interface PhaseChangedEvent extends SocialeRealtimeEvent {
  type: 'phase.changed';
  payload: {
    roundId: string;
    roundIndex: number;
    previousPhase: string;
    currentPhase: string;
    phaseEndsAt?: string;
  };
}

/**
 * Scoreboard updated event
 */
export interface ScoreboardUpdatedEvent extends SocialeRealtimeEvent {
  type: 'scoreboard.updated';
  payload: {
    scoreboard: SocialeScoreboardEntry[];
    changedSocialiteIds: string[];
  };
}
