// =============================================================================
// SOCIALE HOOKS
// =============================================================================
// All data hooks for Sociale entities.

// Export individual hooks
export { useSociale, useSocialesByRoom, useCreateSociale, useUpdateSociale, useDeleteSociale } from './useSociale';
export { useSocialites, useCurrentSocialite, useJoinSociale, useUpdateSocialite, useLeaveSociale } from './useSocialites';
export { useSocialeResponses, useRoundResponses, useMyResponses, useSubmitResponse, useUpdateResponse, useDeleteResponse } from './useSocialeResponses';
export { useSocialeVotes, useRoundVotes, useMyVotes, useSubmitVote, useUpdateVote, useDeleteVote } from './useSocialeVotes';
export { useSocialeRounds, useCurrentRound } from './useSocialeRounds';

// Re-export for convenience
export type {
  Sociale,
  SocialeRound,
  SocialeRoundState,
  Socialite,
  SocialeResponse,
  SocialeVote,
  SocialeScoreEvent,
  SocialeScoreboardEntry,
  SocialeRoundSummary,
  SocialeMode,
  SocialeStatus,
  SocialeRoundType,
  CreateSocialeRequest,
  UpdateSocialeRequest,
  JoinSocialeRequest,
  SubmitSocialeResponseRequest,
  SubmitSocialeVoteRequest,
} from '../../domain/types/sociale.types';
