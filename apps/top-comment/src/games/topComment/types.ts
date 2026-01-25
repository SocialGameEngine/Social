/**
 * Top Comment Frontend Types
 * Game-specific types for Top Comment
 */

// Re-export relevant types from shared types for now
export type {
  Session,
  Team,
  Answer,
  Vote,
  RoundGroup,
  RoundDefinition,
  SessionStatus,
  SessionSettings,
} from "../../shared/types";

export type TopCommentPhase = "lobby" | "answer" | "vote" | "results" | "ended";




