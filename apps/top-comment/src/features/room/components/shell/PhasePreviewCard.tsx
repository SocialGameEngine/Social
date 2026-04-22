import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CountdownRing } from '../../../tv/components/CountdownRing';
import { SplitFlap } from '../../../tv/components/SplitFlap';
import { useTimerWarning } from '../../../../shared/hooks/useTimerWarning';
import type { PhaseShellPhase } from './PhaseShell';

export interface PhasePreviewCardProps {
  /** Phase drives the accent colour + eyebrow. */
  phase: PhaseShellPhase;
  /** Short phase label (e.g. "Answering", "Voting"). */
  title: string;
  /** Short 1-line CTA verb (e.g. "Tap to answer"). */
  ctaLabel: string;
  /** Optional prompt preview (first 60 chars of the round prompt). */
  promptPreview?: string | null;
  /** 1-indexed round number. */
  roundIndex?: number;
  /** Total rounds in the sociale. */
  totalRounds?: number;
  /** ISO phase end timestamp — drives the CountdownRing. */
  endsAt?: string | null;
  /** Total seconds in the phase. */
  totalSeconds?: number;
  /** Paused state — freezes the ring + shows "Paused". */
  paused?: boolean;
  /** Live submitted count ("3 of 10 answered"). */
  submittedCount?: number;
  /** Total participants for the denominator. */
  totalCount?: number;
  /** Whether the local user has already taken the phase action. */
  hasSubmitted?: boolean;
  /** Tap handler for the CTA. Usually opens the phase modal. */
  onClick?: () => void;
  /** Optional extra content slot (e.g. "Lie for me" preview). */
  children?: ReactNode;
  /** Disabled when the CTA is non-interactive (e.g. paused, ended). */
  disabled?: boolean;
}

const ACTION_LABEL: Record<string, string> = {
  answered: 'answered',
  voted: 'voted',
};

/**
 * Mobile pre-modal card for every Sociale phase. Presents the countdown,
 * round info, prompt preview, and a big tappable CTA. Designed for the
 * in-room panel — once a player taps in, they land in a PhaseShell modal
 * that owns the detailed interaction.
 */
export function PhasePreviewCard({
  phase,
  title,
  ctaLabel,
  promptPreview,
  roundIndex,
  totalRounds,
  endsAt,
  totalSeconds = 0,
  paused = false,
  submittedCount,
  totalCount,
  hasSubmitted,
  onClick,
  children,
  disabled = false,
}: PhasePreviewCardProps) {
  const { isWarning, isUrgent } = useTimerWarning(paused ? null : endsAt);

  const countLabel =
    submittedCount != null && totalCount != null
      ? `${submittedCount} of ${totalCount} ${ACTION_LABEL[phase + 'ed'] ?? 'in'}`
      : null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      data-phase={phase}
      className={[
        'chaos-room-panel',
        'relative w-full text-left',
        'p-4 sm:p-5 space-y-3',
        isWarning ? 'is-timer-warning' : '',
        isUrgent ? 'is-timer-urgent' : '',
        disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={`${title} phase. ${ctaLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <span className="chaos-room-eyebrow">
            {roundIndex != null ? (
              <>
                <span>{title}</span>
                <span className="opacity-60">·</span>
                <span className="flex items-center gap-1">
                  <span className="opacity-80">R</span>
                  <SplitFlap
                    value={String(roundIndex)}
                    length={String(totalRounds ?? roundIndex).length}
                    flipMs={55}
                    staggerMs={25}
                    charWidthEm={0.55}
                    style={{ fontSize: '11px' }}
                  />
                  {totalRounds != null && <span className="opacity-60">/{totalRounds}</span>}
                </span>
              </>
            ) : (
              <span>{title}</span>
            )}
          </span>
          {promptPreview && (
            <p
              className="text-sm font-bold leading-snug line-clamp-2"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {promptPreview}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 flex h-[60px] w-[60px] items-center justify-center">
          {endsAt && totalSeconds > 0 && !paused ? (
            <CountdownRing
              endTime={endsAt}
              totalSeconds={totalSeconds}
              size={60}
              strokeWidth={6}
              hideWhenIdle={false}
            />
          ) : paused ? (
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Paused
            </span>
          ) : null}
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
        style={{
          background:
            'linear-gradient(135deg, rgb(var(--chaos-room-accent-rgb)) 0%, rgba(var(--chaos-room-accent-rgb), 0.75) 100%)',
          color: '#0a0118',
          boxShadow: '0 8px 0 rgba(0,0,0,0.85)',
          border: '2px solid rgba(0,0,0,0.85)',
        }}
      >
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-widest opacity-70">
            {hasSubmitted ? 'Tap to update' : 'Tap to play'}
          </span>
          <span className="text-lg font-black leading-tight">{ctaLabel}</span>
        </div>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5l8 7-8 7V5z" />
        </svg>
      </div>

      {countLabel && (
        <p className="text-xs font-bold uppercase tracking-widest text-white/60" aria-live="polite">
          {countLabel}
        </p>
      )}

      {children}
    </motion.button>
  );
}

export default PhasePreviewCard;
