// =============================================================================
// SOCIALE SERVICE - BARREL EXPORT
// =============================================================================
// Re-exports all Sociale service functionality from modular structure.

// Mappers
export {
  mapSociale,
  mapSocialeRound,
  mapSocialeRoundState,
  mapSocialite,
  mapSocialeResponse,
  mapSocialeVote,
} from './mappers';

// Queries
export {
  fetchSociale,
  fetchSocialesForRoom,
  fetchSocialeRounds,
  fetchSocialeRoundState,
  fetchSocialites,
  fetchSocialeResponses,
  fetchSocialeVotes,
  fetchSocialeScoreboard,
  subscribeToSociale,
  subscribeToSocialites,
  subscribeToSocialeResponses,
} from './queries';

// Mutations
export {
  createSociale,
  updateSociale,
  startSociale,
  advanceSocialePhase,
  pauseSociale,
  cancelSociale,
  endSociale,
  joinSociale,
  submitSocialeResponse,
  submitSocialeVote,
  skipSocialeRound,
  skipSocialePhase,
  returnSocialeToLobby,
  populateRoundContent,
} from './mutations';

// Service object for backward compatibility
import * as queries from './queries';
import * as mutations from './mutations';

export const socialeService = {
  // Fetch
  fetchSociale: queries.fetchSociale,
  fetchSocialesForRoom: queries.fetchSocialesForRoom,
  fetchSocialeRounds: queries.fetchSocialeRounds,
  fetchSocialeRoundState: queries.fetchSocialeRoundState,
  fetchSocialites: queries.fetchSocialites,
  fetchSocialeResponses: queries.fetchSocialeResponses,
  fetchSocialeVotes: queries.fetchSocialeVotes,
  fetchSocialeScoreboard: queries.fetchSocialeScoreboard,
  
  // Subscribe
  subscribeToSociale: queries.subscribeToSociale,
  subscribeToSocialites: queries.subscribeToSocialites,
  subscribeToSocialeResponses: queries.subscribeToSocialeResponses,
  
  // Mutations
  createSociale: mutations.createSociale,
  updateSociale: mutations.updateSociale,
  startSociale: mutations.startSociale,
  advanceSocialePhase: mutations.advanceSocialePhase,
  pauseSociale: mutations.pauseSociale,
  cancelSociale: mutations.cancelSociale,
  endSociale: mutations.endSociale,
  joinSociale: mutations.joinSociale,
  submitSocialeResponse: mutations.submitSocialeResponse,
  submitSocialeVote: mutations.submitSocialeVote,
  skipSocialeRound: mutations.skipSocialeRound,
  skipSocialePhase: mutations.skipSocialePhase,
  returnSocialeToLobby: mutations.returnSocialeToLobby,
  
  // Round content
  populateRoundContent: mutations.populateRoundContent,
};
