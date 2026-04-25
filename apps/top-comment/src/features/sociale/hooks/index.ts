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
export { 
  useSocialeBanter, 
  useApprovedSocialeBanter, 
  usePendingSocialeBanter,
  useUserBanterUpvotes,
  useBanterUpvoteStatus,
  useSubmitBanter,
  useUpvoteBanter,
  useRemoveBanterUpvote,
  useModerateBanter 
} from './useSocialeBanter';

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
  SocialeRoundType,
  CreateSocialeRequest,
  UpdateSocialeRequest,
  JoinSocialeRequest,
  SubmitSocialeResponseRequest,
  SubmitSocialeVoteRequest,
  // P2-5: Banter types
  SocialeBanter,
  SocialeBanterUpvote,
  SocialeBanterStatus,
  SubmitSocialeBanterRequest,
  SubmitSocialeBanterUpvoteRequest,
  ModerateSocialeBanterRequest,
} from '../../../domain/types/sociale.types';

// Export SocialeStatus type separately to avoid conflict with component
export type { SocialeStatus } from '../../../domain/types/sociale.types';
