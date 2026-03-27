import type { SessionDisplayState } from '../components/PhaseController';

interface SessionDisplayCopyContext {
  joinedCount?: number;
  totalSlots?: number;
  countdown?: number | null;
  hasJoined?: boolean;
}

export function getSessionDisplayCopy(state: SessionDisplayState, ctx: SessionDisplayCopyContext = {}) {
  const joined = ctx.joinedCount ?? 0;

  switch (state) {
    case "idle":
      return {
        statusBadgeText: "LOBBY",
        headlineText: "GAME READY",
        supportText: "WAITING FOR PLAYERS",
        joinedCountText: joined > 0 ? `${joined} JOINED` : null,
      };

    case "forming":
      return {
        statusBadgeText: "FORMING NOW",
        headlineText: "JOIN GAME",
        supportText: joined > 0
          ? `${joined} PLAYERS IN • DON'T MISS ROUND 1`
          : "DON'T MISS ROUND 1",
        joinedCountText: `${joined} JOINED`,
      };

    case "waiting_on_host":
      return {
        statusBadgeText: "WAITING ON HOST",
        headlineText: "JOIN GAME",
        supportText: joined > 0 ? `${joined} PLAYERS IN` : "PLAYERS ARE JOINING",
        joinedCountText: `${joined} JOINED`,
      };

    case "countdown":
      return {
        statusBadgeText: "STARTING",
        headlineText: "JOIN NOW",
        supportText: ctx.countdown ? `STARTING IN ${ctx.countdown}` : "STARTING SOON",
        joinedCountText: `${joined} JOINED`,
      };

    case "joined":
      return {
        statusBadgeText: "YOU'RE IN",
        headlineText: "GET READY",
        supportText: "WAITING FOR ROUND 1",
        joinedCountText: `${joined} JOINED`,
      };

    case "answer":
      return {
        statusBadgeText: "ANSWER",
        headlineText: "SUBMIT NOW",
        supportText: "ROUND IS LIVE",
        joinedCountText: null,
      };

    case "vote":
      return {
        statusBadgeText: "VOTE",
        headlineText: "PICK A WINNER",
        supportText: "THE ROOM IS VOTING",
        joinedCountText: null,
      };

    case "results":
      return {
        statusBadgeText: "RESULTS",
        headlineText: "SEE WHO WON",
        supportText: "ROUND COMPLETE",
        joinedCountText: null,
      };

    case "ended":
      return {
        statusBadgeText: "ENDED",
        headlineText: "PLAY AGAIN",
        supportText: "READY FOR ANOTHER ROUND?",
        joinedCountText: null,
      };

    default:
      return {
        statusBadgeText: "LOBBY",
        headlineText: "GAME READY",
        supportText: "WAITING FOR PLAYERS",
        joinedCountText: null,
      };
  }
}
