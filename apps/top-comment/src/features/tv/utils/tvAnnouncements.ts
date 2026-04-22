/**
 * P1-16: canonical TV announcer copy.
 *
 * Design principles:
 *   1. Warm, pub-landlord energy — not robotic scheduler voice.
 *   2. Phase transitions earn a one-liner; rounds earn framing.
 *   3. Final round gets a distinct urgency beat ("last chance, 2× points").
 *   4. Roles, counts and mascots are substituted via {token} placeholders.
 *
 * We expose two APIs:
 *   - `getPhaseAnnouncement(ctx)` → string for phase-change moments.
 *   - `getRoundIntroAnnouncement(ctx)` → string spoken at the start of a
 *     round (before/alongside the round intro splash).
 */

export type AnnouncementRoundType =
  | "prompt"
  | "trivia"
  | "fibbage"
  | "topic"
  | string
  | null
  | undefined;

export interface PhaseAnnouncementContext {
  phase: string;
  roundType?: AnnouncementRoundType;
  roundIndex?: number | null;
  totalRounds?: number | null;
  isFinalRound?: boolean;
  isResume?: boolean;
  playerCount?: number;
}

export interface RoundIntroContext {
  roundIndex: number; // 0-based
  totalRounds: number;
  title?: string | null;
  roundType?: AnnouncementRoundType;
  isFinalRound?: boolean;
}

const LOBBY_LINES = [
  "Grab a seat, scan the code, and let's get this night started.",
  "Welcome in. Scan the code on screen to join the board.",
  "If you're here, you're playing. Scan to join.",
];

const ANSWER_LINES_TRIVIA = [
  "Lock in your answer. Fastest fingers get bonus points.",
  "Pick wisely. The clock's ticking.",
  "Answer on your phone now.",
];

const ANSWER_LINES_PROMPT = [
  "Your moment. Type the best answer you've got.",
  "Write your response — the funnier the better.",
  "Phones out, get your answer in.",
];

const ANSWER_LINES_FIBBAGE = [
  "Write a lie good enough to fool the whole room.",
  "Time to bluff. Make it convincing.",
];

const VOTE_LINES = [
  "Eyes on the screen — vote for the best.",
  "Pick a winner. Loyalty to friends is optional.",
  "Cast your vote now.",
];

const RESULTS_LINES = [
  "Let's see how you did.",
  "Drum roll — results incoming.",
  "The truth is on screen.",
];

const ENDED_LINES = [
  "That's the game. Thanks for playing — same time next week?",
  "Game over. Podium photos strongly encouraged.",
  "And scene. Brilliant effort, all of you.",
];

const FINAL_ROUND_OPENER = [
  "Final round. Double points. No pressure.",
  "Last one — and it's worth double.",
  "This is it. Two-times points, finalé time.",
];

const REVEAL_LINES = [
  "Eyes on the board — here comes the truth.",
  "Drum roll… revealing.",
];

const BREAK_LINES = [
  "Quick break — grab a drink, we'll be back.",
  "Intermission. Stretch, sip, and be ready.",
];

const pick = (lines: readonly string[], seed?: number): string => {
  const idx = seed != null ? Math.abs(seed) % lines.length : Math.floor(Math.random() * lines.length);
  return lines[idx];
};

export function getPhaseAnnouncement(ctx: PhaseAnnouncementContext): string {
  const seed = ctx.roundIndex ?? 0;
  switch (ctx.phase) {
    case "lobby":
      if (ctx.playerCount && ctx.playerCount > 0) {
        return `${ctx.playerCount} in — we'll go again when the host's ready.`;
      }
      return pick(LOBBY_LINES, seed);
    case "answer":
      if (ctx.roundType === "trivia") return pick(ANSWER_LINES_TRIVIA, seed);
      if (ctx.roundType === "fibbage") return pick(ANSWER_LINES_FIBBAGE, seed);
      return pick(ANSWER_LINES_PROMPT, seed);
    case "vote":
      return pick(VOTE_LINES, seed);
    case "results":
      return pick(RESULTS_LINES, seed);
    case "reveal":
      return pick(REVEAL_LINES, seed);
    case "break":
    case "intermission":
      return pick(BREAK_LINES, seed);
    case "ended":
      return pick(ENDED_LINES, seed);
    case "paused":
      return "Taking a breather. Back in a moment.";
    default:
      return "";
  }
}

/** i18n placeholder — returns key as-is until P3-9. */
export function t(id: string, fallback: string): string {
  return fallback;
}

const TIMER_WARN_30 = [
  "Thirty seconds on the clock.",
  "Half a minute left — lock something in.",
];
const TIMER_WARN_10 = [
  "Final ten seconds.",
  "Ten seconds — last chance.",
];
const TIMER_UP = ["Time's up.", "Pencils down, phones up."];

export function getTimerWarningAnnouncement(secondsLeft: number): string {
  if (secondsLeft <= 0) return pick(TIMER_UP);
  if (secondsLeft <= 10) return pick(TIMER_WARN_10);
  if (secondsLeft <= 30) return pick(TIMER_WARN_30);
  return "";
}

export interface ScoreDeltaContext {
  playerName: string;
  delta: number;
  rank?: number | null;
}

export function getScoreDeltaAnnouncement(ctx: ScoreDeltaContext): string {
  if (ctx.delta > 0) {
    return `${ctx.playerName} climbs ${ctx.delta} points${ctx.rank ? ` — now sitting ${ctx.rank}` : ""}.`;
  }
  if (ctx.delta < 0) {
    return `Tough break for ${ctx.playerName}.`;
  }
  return `${ctx.playerName} holds steady.`;
}

export interface VenueSponsorContext {
  venueName?: string | null;
  sponsorMessages?: string[];
}

export function getVenueSponsorAnnouncement(ctx: VenueSponsorContext): string {
  const venue = ctx.venueName?.trim();
  const sponsor = ctx.sponsorMessages?.find((s) => s?.trim());
  if (venue && sponsor) {
    return t("ann.venue_sponsor", `You're playing at ${venue}. ${sponsor}`);
  }
  if (venue) return t("ann.venue", `You're playing at ${venue}.`);
  if (sponsor) return sponsor;
  return "";
}

export function getRevealAnnouncement(seed?: number): string {
  return pick(REVEAL_LINES, seed);
}

export function getBreakAnnouncement(seed?: number): string {
  return pick(BREAK_LINES, seed);
}

export function getRoundIntroAnnouncement(ctx: RoundIntroContext): string {
  const num = ctx.roundIndex + 1;
  const title = (ctx.title ?? "").trim();
  const finalPrefix = ctx.isFinalRound ? pick(FINAL_ROUND_OPENER, ctx.roundIndex) + " " : "";

  if (title) {
    return `${finalPrefix}Round ${num} of ${ctx.totalRounds}: ${title}.`;
  }
  if (ctx.roundType === "trivia") {
    return `${finalPrefix}Round ${num} of ${ctx.totalRounds}. Trivia on the clock.`;
  }
  if (ctx.roundType === "fibbage") {
    return `${finalPrefix}Round ${num} of ${ctx.totalRounds}. Lies welcome.`;
  }
  return `${finalPrefix}Round ${num} of ${ctx.totalRounds}.`;
}
