/**
 * Prompt Library Type Definitions
 * 
 * PURPOSE: TypeScript interfaces for the prompt library system - simple text-based
 * icebreakers and discussion starters used during hosted game sessions.
 * 
 * TABLE RELATIONSHIPS:
 * - prompt_libraries (1) → prompts (many)
 * 
 * PROMPT CONCEPT:
 * Unlike trivia questions with right/wrong answers, prompts are open-ended
 * discussion starters. Players submit creative responses, then the room votes
 * on their favorites. Examples: "What's your most unpopular opinion?",
 * "Share a story that would surprise your coworkers"
 * 
 * USAGE IN GAMES:
 * During "Topic" rounds or icebreaker phases, a random prompt from the
 * selected library is displayed. Players have 60-90 seconds to submit their
 * most creative or honest answer, then everyone votes.
 * 
 * ANALYTICS FIELDS:
 * - times_shown: How many times this prompt appeared in games
 * - times_answered: How many players submitted responses
 * - avg_answer_time_ms: Average response time (identifies hard prompts)
 * - thumbs_up/down: Player feedback on prompt quality
 * 
 * These metrics help curate the best prompts and identify duds.
 * 
 * VARIANTS:
 * Some prompts have seasonal or contextual variants:
 * "What's your favorite holiday tradition?" could have variants for
 * Christmas, Halloween, Thanksgiving, etc.
 */

/** Container for organizing prompts by theme, occasion, or venue */
export interface PromptLibrary {
  id: string;
  name: string;
  emoji: string;
  description: string;
  sort_order: number;
  /** Only active libraries appear in game creation dropdowns */
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Individual icebreaker prompt with optional analytics tracking */
export interface Prompt {
  id: string;
  library_id: string;
  /** The actual prompt text shown to players */
  text: string;
  /** Optional seasonal/contextual variant (e.g., "christmas", "halloween") */
  variant?: string | null;
  sort_order: number;
  /** Inactive prompts are never shown but preserved for analytics */
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  /** Analytics: times this prompt appeared in games */
  times_shown?: number;
  /** Analytics: total responses submitted for this prompt */
  times_answered?: number;
  /** Analytics: average response time in ms (identifies difficult prompts) */
  avg_answer_time_ms?: number | null;
  /** Analytics: player quality rating (thumbs up) */
  thumbs_up_count?: number;
  /** Analytics: player quality rating (thumbs down) */
  thumbs_down_count?: number;
}

/** Library with computed prompt count for UI badges */
export interface LibraryWithCounts extends PromptLibrary {
  promptCount: number;
}
