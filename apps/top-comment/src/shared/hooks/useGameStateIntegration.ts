import { useGameState } from "../../application";

interface UseGameStateIntegrationProps {
  sessionId: string | undefined;
  userId?: string;
}

/**
 * Shared game state integration hook
 * Provides common game state setup across all session views
 */
export function useGameStateIntegration({ sessionId, userId }: UseGameStateIntegrationProps) {
  const gameState = useGameState({ 
    sessionId: sessionId ?? undefined, 
    userId 
  });

  // Extract data from gameState for compatibility with existing code
  const session = gameState.session;
  const teams = gameState.teams;
  const answers = gameState.answers;
  const votes = gameState.votes;
  const hasSnapshot = !gameState.isLoading;
  const sessionSnapshotReady = !gameState.isLoading;

  // Use gameState values instead of calculations
  const currentRound = gameState.currentRound;
  const roundGroups = gameState.currentGroups;
  const totalGroups = roundGroups.length;
  const activeGroup = gameState.activeVoteGroup;
  const activeGroupIndex = session?.voteGroupIndex ?? 0;

  // Use gameState voteCounts instead of calculation
  const voteCounts = gameState.voteCounts;

  // Use gameState roundSummaries with shared transformation
  const roundSummaries = gameState.roundSummaries;

  return {
    gameState,
    session,
    teams,
    answers,
    votes,
    hasSnapshot,
    sessionSnapshotReady,
    currentRound,
    roundGroups,
    totalGroups,
    activeGroup,
    activeGroupIndex,
    voteCounts,
    roundSummaries,
  };
}
