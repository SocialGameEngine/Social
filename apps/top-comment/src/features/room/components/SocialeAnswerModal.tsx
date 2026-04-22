import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/providers/AuthContext';
import { validateAnswer } from '../utils/validation';
import {
  useSubmitResponse,
  useCurrentSocialite,
  useMyResponses,
  useSocialites,
  useRoundResponses,
} from '../../../features/sociale/hooks';
import { enqueuePendingAnswer } from '../utils/pendingAnswerQueue';
import { triggerHaptic } from '../../../shared/utils/sessionUtils';
import { usePhaseTimer } from '../../../shared/hooks';
import { PhaseShell } from './shell/PhaseShell';
import { RoomAnswerTile } from './answer/RoomAnswerTile';
import { SubmissionPool } from '../../tv/components/SubmissionPool';
import { ComboPopup } from '../../tv/components/ComboPopup';

interface SocialeAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialeId: string;
  roundId: string;
  roundIndex: number;
  roundType?: string;
  prompt: string;
  roundSettings?: any;
  onSubmit: () => void;
  endsAt?: string | null;
  startedAt?: string | null;
  paused?: boolean;
  /** P1-17: when true, submit requires an explicit "Lock it in" confirmation step. */
  requireLockIn?: boolean;
  /** Total rounds in the sociale (for the "Round 3 of 5" eyebrow). */
  totalRounds?: number;
  /** Optional player streak — shown as a ComboPopup when they hit a streak. */
  comboCount?: number | null;
  /** Increments when the streak extends; bump it to replay the burst. */
  comboTriggerKey?: string | number | null;
}

const CHAR_LIMIT = 120;

const getStoredAnswerKey = (socialeId: string, roundId: string, socialiteId: string) =>
  `sociale-answer-${socialeId}-${roundId}-${socialiteId}`;

function storeAnswerClientSide(socialeId: string, roundId: string, socialiteId: string, answer: string) {
  localStorage.setItem(getStoredAnswerKey(socialeId, roundId, socialiteId), answer);
}

function getStoredAnswerClientSide(socialeId: string, roundId: string, socialiteId: string): string | null {
  return localStorage.getItem(getStoredAnswerKey(socialeId, roundId, socialiteId));
}

function clearStoredAnswerClientSide(socialeId: string, roundId: string, socialiteId: string) {
  localStorage.removeItem(getStoredAnswerKey(socialeId, roundId, socialiteId));
}

const SAFETY_ANSWERS = [
  'Pass — half points please',
  "The one everyone forgets",
  "I'll take the half",
  'Mystery answer',
];

export function SocialeAnswerModal({
  isOpen,
  onClose,
  socialeId,
  roundId,
  roundIndex,
  roundType,
  prompt,
  roundSettings,
  onSubmit,
  endsAt,
  startedAt,
  paused,
  requireLockIn = false,
  totalRounds,
  comboCount,
  comboTriggerKey,
}: SocialeAnswerModalProps) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockInConfirmPending, setLockInConfirmPending] = useState(false);

  const isMultipleChoice = roundSettings?.format === 'multiple_choice';
  const snapshot = roundSettings?.snapshot;
  const mcOptions = isMultipleChoice && snapshot?.multipleChoice ? snapshot.multipleChoice.options : [];

  const submitResponseMutation = useSubmitResponse();

  const { data: currentSocialite } = useCurrentSocialite(socialeId, user?.id);
  const { data: myResponses = [] } = useMyResponses(socialeId, currentSocialite?.id);
  const { data: socialites = [] } = useSocialites(socialeId);
  const { data: roundResponses = [] } = useRoundResponses(socialeId, roundId);

  const hasExistingResponse = myResponses.some((r) => r.roundId === roundId);

  // Phase duration driven by server-authoritative timestamps when available,
  // falling back to round settings so the CountdownRing always scales correctly.
  const { totalSeconds } = usePhaseTimer({
    session: useMemo(
      () => ({
        status: 'answer',
        phaseStartedAt: startedAt ?? null,
        phaseEndsAt: endsAt ?? null,
        settings: {
          answerSecs: roundSettings?.answerSecs ?? roundSettings?.duration ?? 90,
        },
      }),
      [startedAt, endsAt, roundSettings?.answerSecs, roundSettings?.duration],
    ),
  });

  // Rehydrate from localStorage / existing response when modal opens.
  useEffect(() => {
    if (!isOpen || !currentSocialite) return;

    const storedAnswer = getStoredAnswerClientSide(socialeId, roundId, currentSocialite.id);
    if (storedAnswer) {
      if (isMultipleChoice) setSelectedOption(storedAnswer);
      else setAnswer(storedAnswer);
      return;
    }

    const existingResponse = myResponses.find((r) => r.roundId === roundId);
    if (existingResponse) {
      const answerValue =
        typeof existingResponse.value === 'string'
          ? existingResponse.value
          : String(existingResponse.value);

      if (isMultipleChoice) setSelectedOption(answerValue);
      else setAnswer(answerValue);
      storeAnswerClientSide(socialeId, roundId, currentSocialite.id, answerValue);
    } else {
      setAnswer('');
      setSelectedOption(null);
    }
  }, [isOpen, socialeId, roundId, currentSocialite, myResponses, isMultipleChoice]);

  // Clean up old-round answers in localStorage.
  useEffect(() => {
    if (!currentSocialite) return;
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(`sociale-answer-${socialeId}-`) && key.includes(currentSocialite.id)) {
        const [, , , storedRoundId] = key.split('-');
        if (storedRoundId && storedRoundId !== roundId) {
          clearStoredAnswerClientSide(socialeId, storedRoundId, currentSocialite.id);
        }
      }
    });
  }, [socialeId, roundId, currentSocialite]);

  const handleSubmit = useCallback(async () => {
    if (!user || !currentSocialite) return;

    if (isMultipleChoice) {
      if (!selectedOption) {
        setError('Please select an option');
        return;
      }
    } else {
      const validation = validateAnswer(answer, roundType);
      if (!validation.valid) {
        setError(validation.error || 'Invalid answer');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    const answerType: 'multiple_choice' | 'text' = isMultipleChoice ? 'multiple_choice' : 'text';
    const answerValueRaw = isMultipleChoice ? selectedOption || '' : answer.trim();

    try {
      await submitResponseMutation.mutateAsync({
        socialeId,
        roundId,
        socialiteId: currentSocialite.id,
        type: answerType,
        value: answerValueRaw,
      });

      storeAnswerClientSide(socialeId, roundId, currentSocialite.id, answerValueRaw);
      triggerHaptic('success');
      onSubmit();
      setAnswer('');
      setSelectedOption(null);
    } catch (err) {
      enqueuePendingAnswer({
        socialeId,
        roundId,
        socialiteId: currentSocialite.id,
        type: answerType,
        value: answerValueRaw,
      });
      storeAnswerClientSide(socialeId, roundId, currentSocialite.id, answerValueRaw);
      triggerHaptic('error');
      onSubmit();
      setError(
        err instanceof Error
          ? `${err.message} — answer saved and will retry automatically.`
          : 'Failed to submit answer — answer saved and will retry automatically.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answer,
    selectedOption,
    user,
    currentSocialite,
    socialeId,
    roundId,
    onSubmit,
    submitResponseMutation,
    isMultipleChoice,
    roundType,
  ]);

  const characterCount = !isMultipleChoice ? Math.min(answer.length, CHAR_LIMIT) : 0;
  const limitReached = !isMultipleChoice && characterCount >= CHAR_LIMIT;

  // SubmissionPool entries — mark as submitted anyone who has responded to this round.
  const submissionEntries = useMemo(() => {
    const respondedSocialiteIds = new Set(roundResponses.map((r) => r.socialiteId));
    return socialites
      .filter((s) => s.isActive)
      .map((s) => ({
        id: s.id,
        displayName: s.displayName || 'Player',
        mascotId: s.mascotId,
        hasSubmitted: respondedSocialiteIds.has(s.id),
      }));
  }, [socialites, roundResponses]);

  const canAdvance =
    (isMultipleChoice && !!selectedOption) ||
    (!isMultipleChoice && answer.trim().length > 0);

  const handlePrimaryClick = useCallback(() => {
    if (requireLockIn && canAdvance && !lockInConfirmPending) {
      setLockInConfirmPending(true);
      triggerHaptic('medium');
      return;
    }
    void handleSubmit();
  }, [requireLockIn, canAdvance, lockInConfirmPending, handleSubmit]);

  const primaryLabel = isSubmitting
    ? 'Submitting…'
    : hasExistingResponse
    ? 'Update answer'
    : requireLockIn && !lockInConfirmPending
    ? 'Lock it in?'
    : isMultipleChoice
    ? 'Submit'
    : 'Submit answer';

  return (
    <>
      <PhaseShell
        isOpen={isOpen}
        onClose={onClose}
        phase="answer"
        title="Answering"
        roundIndex={roundIndex + 1}
        totalRounds={totalRounds}
        endsAt={endsAt ?? null}
        totalSeconds={totalSeconds}
        paused={paused}
        dismissDisabled={isSubmitting}
        footer={
          submissionEntries.length > 0 ? (
            <SubmissionPool entries={submissionEntries} action="answered" />
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
                className="text-center text-[clamp(1.25rem,5vw,1.75rem)] font-black leading-tight tracking-tight"
                style={{ textShadow: '0 2px 0 rgba(255,255,255,0.15)' }}
              >
                {prompt}
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm">Loading…</span>
              </div>
            )}
          </motion.div>

          {isMultipleChoice && mcOptions && mcOptions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {mcOptions.map((option: any, idx: number) => (
                <RoomAnswerTile
                  key={option.id}
                  optionIndex={idx}
                  label={option.text}
                  isSelected={selectedOption === option.id}
                  disabled={isSubmitting || lockInConfirmPending}
                  onClick={() => {
                    setSelectedOption(option.id);
                    setLockInConfirmPending(false);
                    triggerHaptic('light');
                  }}
                  layoutId={`room-answer-${roundId}-${option.id}`}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <div
                className="rounded-3xl px-4 py-3 border"
                style={{
                  background: 'rgba(10, 1, 24, 0.65)',
                  borderColor: 'rgba(var(--chaos-room-phase-answer-rgb), 0.35)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                }}
              >
                <textarea
                  className="min-h-[120px] w-full bg-transparent text-base leading-relaxed placeholder:text-white/40 focus:outline-none text-white resize-none"
                  placeholder="Type your best response"
                  value={answer.slice(0, CHAR_LIMIT)}
                  maxLength={CHAR_LIMIT}
                  onChange={(e) => {
                    setAnswer(e.target.value.slice(0, CHAR_LIMIT));
                    if (lockInConfirmPending) setLockInConfirmPending(false);
                  }}
                  disabled={isSubmitting}
                  aria-label="Your answer"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Keep it short
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      limitReached ? 'text-rose-400' : 'text-white/60'
                    }`}
                    aria-live="polite"
                  >
                    {characterCount}/{CHAR_LIMIT}
                  </span>
                </div>
              </div>

              {!isSubmitting && !hasExistingResponse && (
                <button
                  type="button"
                  onClick={() => {
                    const pick = SAFETY_ANSWERS[Math.floor(Math.random() * SAFETY_ANSWERS.length)];
                    setAnswer(pick);
                    triggerHaptic('light');
                  }}
                  className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-amber-200 hover:bg-amber-400/20 transition"
                  title="Inserts a safety answer worth half points"
                >
                  Lie for me · half points
                </button>
              )}
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
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {primaryLabel}
                  </span>
                ) : (
                  primaryLabel
                )}
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

      <ComboPopup
        playerName={currentSocialite?.displayName ?? null}
        comboCount={comboCount ?? null}
        triggerKey={comboTriggerKey ?? null}
      />
    </>
  );
}

export default SocialeAnswerModal;
