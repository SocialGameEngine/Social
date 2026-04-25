import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/providers/AuthContext';
import {
  useSubmitVote,
  useCurrentSocialite,
  useMyVotes,
  useRoundVotes,
  useSocialites,
} from '../../../features/sociale/hooks';
import { triggerHaptic } from '../../../shared/utils/sessionUtils';
import { usePhaseTimer } from '../../../shared/hooks';
import { PhaseShell } from './shell/PhaseShell';
import { SubmissionPool } from '../../tv/components/SubmissionPool';
import type { SocialeResponse } from '../../../domain/types/sociale.types';

interface SocialeVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialeId: string;
  roundId: string;
  responses: SocialeResponse[];
  onSubmit: () => void;
  prompt?: string;
  endsAt?: string | null;
  startedAt?: string | null;
  voteSeconds?: number;
  paused?: boolean;
  roundIndex?: number;
  totalRounds?: number;
  /** P1-17: require a two-step "Lock it in" confirmation before the vote is submitted. */
  requireLockIn?: boolean;
  /** P2-4: Ghost mode flag for late joiners - votes marked as practice */
  isGhostMode?: boolean;
}

const getStoredVoteKey = (socialeId: string, roundId: string, socialiteId: string) =>
  `sociale-vote-${socialeId}-${roundId}-${socialiteId}`;

function storeVoteClientSide(socialeId: string, roundId: string, socialiteId: string, responseId: string) {
  localStorage.setItem(getStoredVoteKey(socialeId, roundId, socialiteId), responseId);
}

function getStoredVoteClientSide(socialeId: string, roundId: string, socialiteId: string): string | null {
  return localStorage.getItem(getStoredVoteKey(socialeId, roundId, socialiteId));
}

function clearStoredVoteClientSide(socialeId: string, roundId: string, socialiteId: string) {
  localStorage.removeItem(getStoredVoteKey(socialeId, roundId, socialiteId));
}

export function SocialeVoteModal({
  isOpen,
  onClose,
  socialeId,
  roundId,
  responses,
  onSubmit,
  prompt,
  endsAt,
  startedAt,
  voteSeconds,
  paused,
  roundIndex,
  totalRounds,
  requireLockIn = false,
  isGhostMode = false,
}: SocialeVoteModalProps) {
  const { user } = useAuth();
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockInConfirmPending, setLockInConfirmPending] = useState(false);

  const submitVoteMutation = useSubmitVote();
  const { data: currentSocialite } = useCurrentSocialite(socialeId, user?.id);
  const { data: myVotes = [] } = useMyVotes(socialeId, currentSocialite?.id);
  const { data: roundVotes = [] } = useRoundVotes(socialeId, roundId);
  const { data: socialites = [] } = useSocialites(socialeId);

  const { totalSeconds } = usePhaseTimer({
    session: useMemo(
      () => ({
        status: 'vote',
        phaseStartedAt: startedAt ?? null,
        phaseEndsAt: endsAt ?? null,
        settings: { voteSecs: voteSeconds ?? 30 },
      }),
      [startedAt, endsAt, voteSeconds],
    ),
  });

  useEffect(() => {
    if (!isOpen || !currentSocialite) return;

    const storedVote = getStoredVoteClientSide(socialeId, roundId, currentSocialite.id);
    if (storedVote) {
      setSelectedResponseId(storedVote);
      return;
    }

    const existingVote = myVotes.find((v) => v.roundId === roundId);
    if (existingVote) {
      setSelectedResponseId(existingVote.targetResponseId);
      storeVoteClientSide(socialeId, roundId, currentSocialite.id, existingVote.targetResponseId);
    } else {
      setSelectedResponseId(null);
    }
  }, [isOpen, socialeId, roundId, currentSocialite, myVotes]);

  useEffect(() => {
    if (!currentSocialite) return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`sociale-vote-${socialeId}-`) && key.includes(currentSocialite.id)) {
        const [, , , storedRoundId] = key.split('-');
        if (storedRoundId && storedRoundId !== roundId) {
          clearStoredVoteClientSide(socialeId, storedRoundId, currentSocialite.id);
        }
      }
    });
  }, [socialeId, roundId, currentSocialite]);

  const handleSubmit = useCallback(async () => {
    if (!selectedResponseId || !user || !currentSocialite) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitVoteMutation.mutateAsync({
        socialeId,
        roundId,
        socialiteId: currentSocialite.id,
        targetResponseId: selectedResponseId,
        // P2-4: Mark as practice when in ghost mode
        isPractice: isGhostMode,
      });

      storeVoteClientSide(socialeId, roundId, currentSocialite.id, selectedResponseId);
      triggerHaptic('success');
      onSubmit();
    } catch (err) {
      triggerHaptic('error');
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedResponseId, user, currentSocialite, socialeId, roundId, onSubmit, submitVoteMutation]);

  // Submission pool — anyone who has cast a vote for this round.
  const submissionEntries = useMemo(() => {
    const votedSocialiteIds = new Set(roundVotes.map((v) => v.socialiteId));
    return socialites
      .filter((s) => s.isActive)
      .map((s) => ({
        id: s.id,
        displayName: s.displayName || 'Player',
        mascotId: s.mascotId,
        hasSubmitted: votedSocialiteIds.has(s.id),
      }));
  }, [socialites, roundVotes]);

  // Filter out the current user's own response so they can't self-vote.
  const selectableResponses = useMemo(() => {
    return responses.filter((r) => r.socialiteId !== currentSocialite?.id);
  }, [responses, currentSocialite?.id]);

  const canAdvance = !!selectedResponseId;

  const handlePrimaryClick = useCallback(() => {
    if (requireLockIn && canAdvance && !lockInConfirmPending) {
      setLockInConfirmPending(true);
      triggerHaptic('medium');
      return;
    }
    void handleSubmit();
  }, [requireLockIn, canAdvance, lockInConfirmPending, handleSubmit]);

  const existingVote = myVotes.find((v) => v.roundId === roundId);
  const hasExistingVote = !!existingVote;

  const primaryLabel = isSubmitting
    ? 'Submitting…'
    : hasExistingVote
    ? 'Update vote'
    : requireLockIn && !lockInConfirmPending
    ? 'Lock it in?'
    : 'Cast vote';

  return (
    <PhaseShell
      isOpen={isOpen}
      onClose={onClose}
      phase="vote"
      title="Voting"
      roundIndex={roundIndex != null ? roundIndex + 1 : undefined}
      totalRounds={totalRounds}
      endsAt={endsAt ?? null}
      totalSeconds={totalSeconds}
      paused={paused}
      dismissDisabled={isSubmitting}
      footer={
        submissionEntries.length > 0 ? (
          <SubmissionPool entries={submissionEntries} action="voted" />
        ) : undefined
      }
    >
      <div className="space-y-4">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="chaos-room-prompt-card"
        >
          {prompt ? (
            <p
              className="text-center text-[clamp(1.1rem,4.5vw,1.5rem)] font-black leading-tight tracking-tight"
              style={{ textShadow: '0 2px 0 rgba(255,255,255,0.15)' }}
            >
              {prompt}
            </p>
          ) : (
            <p className="text-center text-sm text-black/60">No prompt available</p>
          )}
        </motion.div>

        {/* P2-4: Ghost mode indicator for late joiners */}
        {isGhostMode && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">👻</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-100">Ghost Mode Active</p>
                <p className="text-xs text-purple-200/80">You're practicing - votes won't affect scores</p>
              </div>
            </div>
          </motion.div>
        )}

        {selectableResponses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2 }}
                  className="h-3 w-3 rounded-full bg-white/40"
                />
              ))}
            </div>
            <p className="text-sm text-white/60">
              Waiting for your mates…
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {selectableResponses.map((response) => {
                const isSelected = selectedResponseId === response.id;
                const displayName = (response as any).socialiteDisplayName || 'Anonymous';
                const responseText =
                  typeof response.value === 'string' ? response.value : 'Response';

                return (
                  <motion.button
                    key={response.id}
                    layout
                    layoutId={`vote-response-${response.id}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      if (isSubmitting || lockInConfirmPending) return;
                      setSelectedResponseId(isSelected ? null : response.id);
                      triggerHaptic('light');
                    }}
                    disabled={isSubmitting || lockInConfirmPending}
                    className="chaos-room-response-card relative w-full text-left flex items-start gap-3 p-4 rounded-2xl transition"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, rgba(192, 132, 252, 0.32), rgba(34, 211, 238, 0.22))'
                        : 'linear-gradient(135deg, rgba(192, 132, 252, 0.15), rgba(34, 211, 238, 0.08))',
                      border: `2px solid ${
                        isSelected
                          ? 'rgba(192, 132, 252, 0.85)'
                          : 'rgba(192, 132, 252, 0.28)'
                      }`,
                      boxShadow: isSelected
                        ? '0 0 0 3px rgba(192, 132, 252, 0.35), 0 10px 20px rgba(0,0,0,0.4)'
                        : '0 6px 16px rgba(0,0,0,0.3)',
                    }}
                    aria-pressed={isSelected}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-base font-black leading-snug text-white break-words"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                      >
                        {responseText}
                      </p>
                      <p className="text-xs text-white/60 mt-1 font-semibold uppercase tracking-wider">
                        by {displayName}
                      </p>
                    </div>
                    <motion.div
                      animate={{
                        scale: isSelected ? 1.15 : 1,
                        rotate: isSelected ? [0, -12, 12, 0] : 0,
                      }}
                      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                      className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
                      style={{
                        background: isSelected ? '#34d399' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#0a0118' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isSelected ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </motion.div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: [0, 0.6, 0] }}
                        transition={{ duration: 0.55 }}
                        className="pointer-events-none absolute inset-0 rounded-2xl"
                        style={{
                          boxShadow: '0 0 0 0 rgba(192, 132, 252, 0.5)',
                          background: 'radial-gradient(circle at 90% 50%, rgba(52, 211, 153, 0.35), transparent 60%)',
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence mode="wait">
          {requireLockIn && lockInConfirmPending ? (
            <motion.div
              key="lockin"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="flex gap-2"
            >
              <button
                type="button"
                onClick={() => {
                  setLockInConfirmPending(false);
                  triggerHaptic('light');
                }}
                disabled={isSubmitting}
                className="flex-1 min-h-[56px] rounded-full border border-white/15 bg-white/5 text-white font-black uppercase tracking-wider text-sm"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isSubmitting}
                className="chaos-room-cta flex-[2] px-4"
                style={{
                  ['--chaos-room-accent-rgb' as any]: '251, 191, 36',
                }}
              >
                {isSubmitting ? 'Locking…' : 'Lock it in ✓'}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="primary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              type="button"
              onClick={handlePrimaryClick}
              disabled={isSubmitting || !canAdvance}
              className="chaos-room-cta w-full px-4"
            >
              {primaryLabel}
            </motion.button>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-center text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </PhaseShell>
  );
}

export default SocialeVoteModal;
