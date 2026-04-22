import type { SessionDisplayState } from './sessionPhase';

interface SocialeDisplayCopyContext {
  joinedCount?: number;
  totalSlots?: number;
  countdown?: number | null;
  hasJoined?: boolean;
}

interface SocialeDisplayCopy {
  statusBadgeText: string;
  headlineText: string;
  supportText: string;
  joinedCountText: string | null;
}

/**
 * Wave R7: self-contained copy helper for the room's `SocialeGameButton`.
 * Previously composed by `getSessionDisplayCopy` + a vocabulary swap; since
 * sessions were deprecated, the logic is inlined here so the file is the
 * single source of truth for Sociale button copy.
 */
export function getSocialeDisplayCopy(
  state: SessionDisplayState,
  ctx: SocialeDisplayCopyContext = {},
): SocialeDisplayCopy {
  const { joinedCount = 0, totalSlots = 0, countdown = null, hasJoined = false } = ctx;
  const joinedCountText =
    totalSlots > 0 ? `${joinedCount}/${totalSlots} joined` : joinedCount > 0 ? `${joinedCount} joined` : null;

  switch (state) {
    case 'forming':
      return {
        statusBadgeText: 'FORMING',
        headlineText: 'New Sociale forming',
        supportText: hasJoined ? "You're in — waiting for others." : 'Tap to join.',
        joinedCountText,
      };
    case 'waiting_on_host':
      return {
        statusBadgeText: 'WAITING',
        headlineText: 'Waiting on host',
        supportText: "We'll kick off as soon as the host's ready.",
        joinedCountText,
      };
    case 'countdown':
      return {
        statusBadgeText: 'STARTING',
        headlineText: countdown != null ? `Starting in ${countdown}…` : 'Starting soon',
        supportText: 'Get ready — the Sociale is about to begin.',
        joinedCountText,
      };
    case 'joined':
      return {
        statusBadgeText: 'JOINED',
        headlineText: "You're in!",
        supportText: 'Hold tight — the first round is spinning up.',
        joinedCountText,
      };
    case 'answer':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Answer the prompt',
        supportText: 'Tap to open the answer sheet.',
        joinedCountText,
      };
    case 'answered':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Answer locked in',
        supportText: 'Waiting for your mates to finish.',
        joinedCountText,
      };
    case 'vote':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Vote for the best answer',
        supportText: 'Tap to open voting.',
        joinedCountText,
      };
    case 'voted':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Vote locked in',
        supportText: 'Hang tight while the rest catch up.',
        joinedCountText,
      };
    case 'reveal':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Look up!',
        supportText: "The reveal is on the TV.",
        joinedCountText,
      };
    case 'results':
      return {
        statusBadgeText: 'LIVE',
        headlineText: 'Round results',
        supportText: 'Check out who scored.',
        joinedCountText,
      };
    case 'ended':
      return {
        statusBadgeText: 'ENDED',
        headlineText: 'Sociale complete',
        supportText: 'Grab a selfie and share the leaderboard.',
        joinedCountText,
      };
    case 'idle':
    default:
      return {
        statusBadgeText: 'IDLE',
        headlineText: 'Next Sociale',
        supportText: "We'll let you know when something new is ready.",
        joinedCountText,
      };
  }
}
