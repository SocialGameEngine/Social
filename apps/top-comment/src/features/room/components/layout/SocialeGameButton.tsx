import { motion } from 'framer-motion';
import type { SessionDisplayState } from '../../utils/sessionPhase';
import { getSocialeDisplayCopy } from '../../utils/socialeDisplayCopy';
import { PlayerStack } from './PlayerStack';
import {
  primaryButtonStateClass,
  type PrimaryButtonState,
} from '../../hooks/usePrimaryButtonState';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Shared layoutId so the button morphs (not cuts) as it moves between phases. */
export const PRIMARY_ACTION_LAYOUT_ID = 'room-primary-action';

export interface SocialeGameParticipant {
  displayName: string;
}

type SocialeGameCopyOverride = Partial<{
  statusBadgeText: string;
  headlineText: string;
  supportText: string;
  joinedCountText: string | null;
}>;

interface SocialeGameButtonProps {
  displayState: SessionDisplayState;
  participants: SocialeGameParticipant[];
  isMainEventMode?: boolean;
  isJoining?: boolean;
  joinSuccess?: boolean;
  /** When `joinSuccess`, replaces default “Joined successfully!” */
  successSupportText?: string;
  /** Merges over `getSocialeDisplayCopy` (omit keys to keep defaults) */
  copyOverride?: SocialeGameCopyOverride | null;
  /** Non-interactive card (e.g. waiting for next round) */
  interactionDisabled?: boolean;
  phase?: string;
  /** P1-32: applies the 5-state button class. Pass alongside `layoutId`
   *  so the button morphs smoothly across phase transitions. */
  primaryState?: PrimaryButtonState;
  /** Framer layoutId override. Defaults to PRIMARY_ACTION_LAYOUT_ID. */
  layoutId?: string;
  onClick: () => void;
}

function mergeSocialeGameCopy(
  base: ReturnType<typeof getSocialeDisplayCopy>,
  override?: SocialeGameCopyOverride | null
): ReturnType<typeof getSocialeDisplayCopy> {
  if (!override) return base;
  const next = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v !== undefined) (next as Record<string, unknown>)[k] = v;
  }
  return next;
}

export function SocialeGameButton({
  displayState,
  participants,
  isMainEventMode = false,
  isJoining = false,
  joinSuccess = false,
  successSupportText,
  copyOverride = null,
  interactionDisabled = false,
  phase,
  primaryState,
  layoutId = PRIMARY_ACTION_LAYOUT_ID,
  onClick,
}: SocialeGameButtonProps) {
  const joined = participants.length;
  const displayCopy = mergeSocialeGameCopy(
    getSocialeDisplayCopy(displayState, {
      joinedCount: joined,
      totalSlots: joined,
      hasJoined: displayState === 'joined',
    }),
    copyOverride
  );

  const playerInitials =
    participants.slice(0, 3).map((p) =>
      p.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    ) || [];
  const extraPlayers = Math.max(0, participants.length - 3);

  return (
    <div className="pt-2">
      <motion.div
        layout
        layoutId={primaryState ? layoutId : undefined}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="relative rounded-[28px] p-3 overflow-visible"
      >
        <button
          type="button"
          className={cn(
            'w-full chaos-session-button',
            isMainEventMode && 'chaos-session-button--main-event',
            displayState === 'forming' && 'chaos-session-button--forming',
            displayState === 'countdown' && 'chaos-session-button--starting',
            displayState === 'joined' && 'chaos-session-button--joined',
            !isMainEventMode && 'chaos-session-button--quiet',
            (isJoining || joinSuccess) && 'chaos-session-feedback-pop',
            interactionDisabled && 'opacity-95 pointer-events-none cursor-default',
            primaryState && primaryButtonStateClass(primaryState)
          )}
          data-phase={phase}
          disabled={interactionDisabled}
          aria-disabled={interactionDisabled || undefined}
          onClick={(e) => {
            if (interactionDisabled) return;
            e.stopPropagation();
            onClick();
          }}
        >
          <div className="chaos-session-inner">
            <div className="chaos-session-topline">
              <div
                className={cn(
                  'chaos-session-badge',
                  displayState === 'forming' && 'chaos-session-badge--forming',
                  displayState === 'waiting_on_host' && 'chaos-session-badge--forming',
                  displayState === 'countdown' && 'chaos-session-badge--starting',
                  displayState === 'joined' && 'chaos-session-badge--joined',
                  displayState === 'idle' && 'chaos-session-badge--quiet',
                  (displayState === 'answer' ||
                    displayState === 'answered' ||
                    displayState === 'vote' ||
                    displayState === 'voted' ||
                    displayState === 'results') &&
                    'chaos-session-badge--live'
                )}
              >
                {(displayState === 'forming' ||
                  displayState === 'countdown' ||
                  displayState === 'joined') && (
                  <span
                    className={cn(
                      'chaos-live-dot',
                      displayState === 'joined' && 'chaos-live-dot--green',
                      displayState !== 'joined' &&
                        displayState !== 'countdown' &&
                        'chaos-live-dot--yellow'
                    )}
                  />
                )}
                <span>{displayCopy.statusBadgeText}</span>
              </div>
            </div>

            <div className="chaos-session-mainline">
              <div className="chaos-session-copy">
                <h2 className="chaos-session-headline">{displayCopy.headlineText}</h2>
                <p
                  className={cn(
                    'chaos-session-support',
                    joinSuccess && 'chaos-session-support--success'
                  )}
                >
                  {joinSuccess
                    ? successSupportText ?? 'Joined successfully!'
                    : displayCopy.supportText}
                </p>
              </div>

              <div className="chaos-session-arrow" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5l8 7-8 7V5z" />
                </svg>
              </div>
            </div>

            {participants.length > 0 && (
              <div className="chaos-session-footer">
                <PlayerStack playerInitials={playerInitials} extraPlayers={extraPlayers} />
                {displayCopy.joinedCountText && (
                  <div className="chaos-session-meta-chip">{displayCopy.joinedCountText}</div>
                )}
              </div>
            )}

            {(displayState === 'forming' || displayState === 'countdown') && (
              <div className="chaos-session-tap-hint">TAP ANYWHERE TO JOIN</div>
            )}
          </div>
        </button>
      </motion.div>
    </div>
  );
}
