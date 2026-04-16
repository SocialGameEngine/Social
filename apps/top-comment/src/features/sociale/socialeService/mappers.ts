// =============================================================================
// SOCIALE MAPPERS
// =============================================================================
// Database row to domain object mappers for Sociale entities.

import type {
  Sociale,
  SocialeRound,
  SocialeRoundState,
  Socialite,
  SocialeResponse,
  SocialeVote,
} from '../../../domain/types/sociale.types';

/**
 * Map database row to Sociale domain object
 */
export function mapSociale(data: any): Sociale | null {
  if (!data) return null;
  
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    title: data.title,
    description: data.description,
    mode: data.mode,
    status: data.status,
    currentRoundIndex: data.current_round_index,
    currentRoundId: data.current_round_id,
    currentPhase: data.current_phase,
    phaseStartedAt: data.phase_started_at,
    phaseEndsAt: data.phase_ends_at,
    pausedRemainingSeconds: data.paused_remaining_seconds,
    totalRounds: data.total_rounds,
    settings: data.settings ?? {},
    scoreboard: data.scoreboard ?? {},
    runtimeState: data.runtime_state,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    legacySessionId: data.legacy_session_id,
    
    // Prompt library fields (from Sessions)
    promptLibraryId: data.prompt_library_id,
    selectedLibraries: data.selected_libraries,
    currentLibraryIndex: data.current_library_index,
  };
}

/**
 * Map database row to SocialeRound domain object
 */
export function mapSocialeRound(data: any): SocialeRound | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    orderIndex: data.order_index,
    type: data.type,
    title: data.title,
    content: data.content,
    settings: data.settings ?? {},
    phaseSequence: data.phase_sequence,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeRoundState domain object
 */
export function mapSocialeRoundState(data: any): SocialeRoundState | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    status: data.status,
    phase: data.phase,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    phaseStartedAt: data.phase_started_at,
    phaseEndsAt: data.phase_ends_at,
    answerEndsAt: data.answer_ends_at,
    votingEndsAt: data.voting_ends_at,
    revealEndsAt: data.reveal_ends_at,
    resultsEndsAt: data.results_ends_at,
    derivedState: data.derived_state ?? {},
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to Socialite domain object
 */
export function mapSocialite(data: any): Socialite | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roomId: data.room_id,
    userId: data.user_id,
    membershipId: data.membership_id,
    displayName: data.display_name,
    mascotId: data.mascot_id,
    isHost: data.is_host,
    isActive: data.is_active,
    isBanned: data.is_banned,
    score: data.score,
    joinedAt: data.joined_at,
    lastSeenAt: data.last_seen_at,
    pendingUntilRoundIndex: data.pending_until_round_index ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeResponse domain object
 */
export function mapSocialeResponse(data: any): SocialeResponse | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    socialiteId: data.socialite_id,
    type: data.type,
    value: data.value,
    isCorrect: data.is_correct,
    scoreAwarded: data.score_awarded,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeVote domain object
 */
export function mapSocialeVote(data: any): SocialeVote | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    socialiteId: data.socialite_id,
    targetResponseId: data.target_response_id,
    createdAt: data.created_at,
  };
}
