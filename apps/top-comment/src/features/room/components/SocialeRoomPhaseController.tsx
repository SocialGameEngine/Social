import { useEffect } from 'react';
import {
  useSociale,
  useSocialites,
  useCurrentSocialite,
  useMyResponses,
  useMyVotes,
  useCurrentRound,
} from '../../../features/sociale/hooks';
import type { Sociale, Socialite } from '../../../domain/types/sociale.types';
import { useRoomPageContext } from '../context/RoomPageContext';
import { useActiveSocialeRoundState } from '../hooks/useActiveSocialeRoundState';
import { deriveSocialeRoomGamePhase } from '../utils/deriveSocialeRoomPhase';
import { SocialeLobbyPhaseRoom } from '../phases/SocialeLobbyPhaseRoom';
import { SocialeAnswerPhaseRoom } from '../phases/SocialeAnswerPhaseRoom';
import { SocialeVotePhaseRoom } from '../phases/SocialeVotePhaseRoom';
import { SocialeRevealPhaseRoom } from '../phases/SocialeRevealPhaseRoom';
import { SocialeResultsPhaseRoom } from '../phases/SocialeResultsPhaseRoom';
import { SocialeEndedPhaseRoom } from '../phases/SocialeEndedPhaseRoom';
import { SocialeBreakPhaseRoom } from '../phases/SocialeBreakPhaseRoom';
import { SocialeMidGameJoinCard } from '../phases/SocialeMidGameJoinCard';
import type { RoomMembership } from '../../../shared/types';
import type { GamePhase } from '../types';

function isWaitingForNextRound(sociale: Sociale, socialite: Socialite | null | undefined): boolean {
  const pending = socialite?.pendingUntilRoundIndex;
  if (pending == null) return false;
  const idx = sociale.currentRoundIndex ?? 0;
  return idx < pending;
}

function shouldOfferJoinNextRound(
  sociale: Sociale | null | undefined,
  roomPhase: GamePhase,
  userId: string | undefined,
  socialite: Socialite | null | undefined
): boolean {
  if (!sociale) return false;
  if (!userId) return false;
  if (socialite) return false;
  if (sociale.status !== 'active' && sociale.status !== 'paused') return false;
  return roomPhase === 'answer' || roomPhase === 'vote' || roomPhase === 'results';
}

interface SocialeRoomPhaseControllerProps {
  socialeId: string;
  roomId: string;
  userId: string | undefined;
  memberships: RoomMembership[] | null;
  onOpenLeaderboard: () => void;
  onOpenSelfie: () => void;
  onOpenModal?: (type: 'answer' | 'vote') => void;
  onJoinRoom?: () => void;
}

export function SocialeRoomPhaseController({
  socialeId,
  roomId,
  userId,
  memberships,
  onOpenLeaderboard,
  onOpenSelfie,
  onOpenModal,
  onJoinRoom,
}: SocialeRoomPhaseControllerProps) {
  const { dispatch, state } = useRoomPageContext();
  const { data: sociale, isLoading } = useSociale(socialeId);
  const { data: activeRoundState } = useActiveSocialeRoundState(socialeId, sociale?.status);
  const roomPhase = deriveSocialeRoomGamePhase(sociale ?? null, activeRoundState ?? null);
  // Use sociale (sociales table) as the single source of truth for all timer state.
  // Both host and room subscribe to the same sociales realtime channel, so they stay
  // in sync. Using activeRoundState for timer state caused desync because the two
  // realtime subscriptions fire independently and the Database types don't include
  // paused_remaining_seconds (column was added after types were generated).
  const isPaused = sociale?.status === 'paused';
  const phaseEndsAt = sociale?.phaseEndsAt ?? null;
  const pausedRemainingSeconds = sociale?.pausedRemainingSeconds ?? null;

  useEffect(() => {
    dispatch({ type: 'RESET_SUBMISSIONS' });
    // Only close the active modal (answer/vote), not ended modals (leaderboard/selfie)
    // Ended modals should persist across phase changes
    dispatch({ type: 'CLOSE_MODAL' });
  }, [roomPhase, dispatch]);

  const { data: socialites = [] } = useSocialites(socialeId);
  const { data: currentSocialite } = useCurrentSocialite(socialeId, userId);

  const currentRoundId =
    activeRoundState?.round_id ?? sociale?.currentRoundId ?? undefined;
  
  // Get current round data for settings
  const currentRound = useCurrentRound(socialeId, currentRoundId);

  const { data: myResponses = [] } = useMyResponses(socialeId, currentSocialite?.id);
  const { data: myVotes = [] } = useMyVotes(socialeId, currentSocialite?.id);

  const hasAnswerThisRound =
    !!currentRoundId && myResponses.some((r) => r.roundId === currentRoundId);
  const hasVoteThisRound =
    !!currentRoundId && myVotes.some((v) => v.roundId === currentRoundId);

  const hasSubmittedAnswer = state.submissionStatus.answer || hasAnswerThisRound;
  const hasSubmittedVote = state.submissionStatus.vote || hasVoteThisRound;

  const participants = socialites.map((s) => ({
    displayName: s.displayName || 'Player',
  }));

  if (isLoading || !sociale) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading Sociale…</p>
      </div>
    );
  }

  const waitingNext = isWaitingForNextRound(sociale, currentSocialite);
  const joinNext = shouldOfferJoinNextRound(sociale, roomPhase, userId, currentSocialite);

  if (waitingNext || joinNext) {
    return (
      <SocialeMidGameJoinCard
        sociale={sociale}
        roomId={roomId}
        roomPhase={roomPhase}
        memberships={memberships}
        participants={participants}
        mode={waitingNext ? 'waiting' : 'join'}
        phaseEndsAt={phaseEndsAt}
      />
    );
  }

  switch (roomPhase) {
    case 'lobby':
      return (
        <SocialeLobbyPhaseRoom sociale={sociale} roomId={roomId} memberships={memberships} onJoinRoom={onJoinRoom} />
      );
    case 'answer':
      return (
        <SocialeAnswerPhaseRoom
          sociale={sociale}
          phaseEndsAt={phaseEndsAt}
          pausedRemainingSeconds={pausedRemainingSeconds}
          isPaused={isPaused}
          hasSubmitted={hasSubmittedAnswer}
          onOpenModal={onOpenModal}
          participants={participants}
          roundSettings={currentRound?.settings}
          currentRound={currentRound}
        />
      );
    case 'vote':
      return (
        <SocialeVotePhaseRoom
          sociale={sociale}
          phaseEndsAt={phaseEndsAt}
          pausedRemainingSeconds={pausedRemainingSeconds}
          isPaused={isPaused}
          hasSubmitted={hasSubmittedVote}
          onOpenModal={onOpenModal}
          participants={participants}
          roundSettings={currentRound?.settings}
          currentRound={currentRound}
        />
      );
    case 'reveal':
      return (
        <SocialeRevealPhaseRoom
          sociale={sociale}
          participants={participants}
          phaseEndsAt={phaseEndsAt}
          pausedRemainingSeconds={pausedRemainingSeconds}
          isPaused={isPaused}
          currentRound={currentRound}
        />
      );
    case 'results':
      return (
        <SocialeResultsPhaseRoom
          sociale={sociale}
          participants={participants}
          phaseEndsAt={phaseEndsAt}
          pausedRemainingSeconds={pausedRemainingSeconds}
          isPaused={isPaused}
          onOpenLeaderboard={onOpenLeaderboard}
        />
      );
    case 'break':
      return <SocialeBreakPhaseRoom sociale={sociale} phaseEndsAt={phaseEndsAt} />;
    case 'ended':
      return (
        <SocialeEndedPhaseRoom
          sociale={sociale}
          participants={participants}
          memberships={memberships}
          onOpenLeaderboard={onOpenLeaderboard}
          onOpenSelfie={onOpenSelfie}
        />
      );
    default:
      return (
        <SocialeLobbyPhaseRoom sociale={sociale} roomId={roomId} memberships={memberships} onJoinRoom={onJoinRoom} />
      );
  }
}
