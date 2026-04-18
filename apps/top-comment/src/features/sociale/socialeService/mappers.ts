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
import type {
  SocialeRow,
  SocialeRoundRow,
  SocialeRoundStateRow,
  SocialiteRow,
  SocialeResponseRow,
  SocialeVoteRow,
} from './types';

/**
 * Map database row to Sociale domain object
 */
export function mapSociale(data: SocialeRow | null): Sociale | null {
  if (!data) return null;
  
  return {
    id: data.id,
    roomId: data.room_id,
    createdBy: data.created_by,
    title: data.title || '',
    description: data.description ?? undefined,
    mode: data.mode as any,
    status: data.status as any,
    currentRoundIndex: data.current_round_index,
    currentRoundId: data.current_round_id ?? undefined,
    currentPhase: data.current_phase ?? undefined,
    phaseStartedAt: data.phase_started_at ?? undefined,
    phaseEndsAt: data.phase_ends_at ?? undefined,
    pausedRemainingSeconds: data.paused_remaining_seconds,
    totalRounds: data.total_rounds,
    settings: (data.settings as any) ?? {},
    scoreboard: (data.scoreboard as any) ?? {},
    runtimeState: data.runtime_state as any,
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
export function mapSocialeRound(data: SocialeRoundRow | null): SocialeRound | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    orderIndex: data.order_index,
    type: data.type as any,
    title: data.title ?? undefined,
    content: data.content ?? undefined,
    settings: (data.settings as Record<string, unknown>) ?? {},
    phaseSequence: data.phase_sequence ?? [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeRoundState domain object
 */
export function mapSocialeRoundState(data: SocialeRoundStateRow | null): SocialeRoundState | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    status: data.status as any,
    phase: data.phase,
    startedAt: data.started_at ?? undefined,
    endedAt: data.ended_at ?? undefined,
    phaseStartedAt: data.phase_started_at ?? undefined,
    phaseEndsAt: data.phase_ends_at ?? undefined,
    answerEndsAt: data.answer_ends_at ?? undefined,
    votingEndsAt: data.voting_ends_at ?? undefined,
    revealEndsAt: data.reveal_ends_at ?? undefined,
    resultsEndsAt: data.results_ends_at ?? undefined,
    derivedState: (data.derived_state as Record<string, unknown>) ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to Socialite domain object
 */
export function mapSocialite(data: SocialiteRow | null): Socialite | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roomId: data.room_id,
    userId: data.user_id ?? undefined,
    membershipId: data.membership_id || '',
    displayName: data.display_name,
    mascotId: data.mascot_id ?? undefined,
    isHost: data.is_host,
    isActive: data.is_active,
    isBanned: data.is_banned,
    score: data.score,
    joinedAt: data.joined_at,
    lastSeenAt: data.last_seen_at ?? undefined,
    pendingUntilRoundIndex: data.pending_until_round_index ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeResponse domain object
 */
export function mapSocialeResponse(data: SocialeResponseRow | null): SocialeResponse | null {
  if (!data) return null;
  
  return {
    id: data.id,
    socialeId: data.sociale_id,
    roundId: data.round_id,
    socialiteId: data.socialite_id,
    type: data.type as any,
    value: data.value as string | number | boolean | Record<string, unknown>,
    isCorrect: data.is_correct ?? undefined,
    scoreAwarded: data.score_awarded ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Map database row to SocialeVote domain object
 */
export function mapSocialeVote(data: SocialeVoteRow | null): SocialeVote | null {
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
