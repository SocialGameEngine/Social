// =============================================================================
// SOCIALE FEATURE MODULE
// =============================================================================
// Central export point for all Sociale-related functionality.

// Service layer
export * from './socialeService';

// Data hooks - export everything except the conflicting SocialeStatus type
export { 
  useSociale, useSocialesByRoom, useCreateSociale, useUpdateSociale, useDeleteSociale,
  useSocialites, useCurrentSocialite, useJoinSociale, useUpdateSocialite, useLeaveSociale,
  useSocialeResponses, useRoundResponses, useMyResponses, useSubmitResponse, useUpdateResponse, useDeleteResponse,
  useSocialeVotes, useRoundVotes, useMyVotes, useSubmitVote, useUpdateVote, useDeleteVote,
  useSocialeRounds, useCurrentRound
} from './hooks';

// Export types from hooks
export type {
  Sociale, SocialeRound, SocialeRoundState, Socialite, SocialeResponse, SocialeVote,
  SocialeScoreEvent, SocialeScoreboardEntry, SocialeRoundSummary, SocialeMode, SocialeRoundType,
  CreateSocialeRequest, UpdateSocialeRequest, JoinSocialeRequest,
  SubmitSocialeResponseRequest, SubmitSocialeVoteRequest, SocialeStatus
} from './hooks';

// Presets
export * from './presets';

// Components
export * from './components';
