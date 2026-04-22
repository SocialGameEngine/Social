/**
 * P1-13: Wordle-style emoji share card generator.
 *
 * Rules for the emoji grid:
 *   · one row per round, left-to-right
 *   · 🟩 = correct / podium finish, 🟨 = partial/close, ⬛ = miss
 *
 * For the full sociale recap we render:
 *   Quiz Night @ {Venue} · Team {TeamName} {medal} {rank} place
 *   {emoji grid}
 *   Play: {joinUrl}
 */

export interface RoundResult {
  status: "correct" | "close" | "wrong";
}

export interface ShareCardInput {
  venueName?: string | null;
  teamName: string;
  /** 1-based. */
  rank: number;
  totalPlayers: number;
  score: number;
  roundResults: RoundResult[];
  /** Optional join URL for the venue. */
  joinUrl?: string;
  /** P1-13: weekly visit streak weeks (from membership). */
  streakWeeks?: number | null;
}

const medalFor = (rank: number): string => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "🎲";
};

const squareFor = (status: RoundResult["status"]): string => {
  if (status === "correct") return "🟩";
  if (status === "close") return "🟨";
  return "⬛";
};

const ordinal = (n: number): string => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

export function buildShareCardText(input: ShareCardInput): string {
  const header = input.venueName
    ? `Quiz Night @ ${input.venueName}`
    : "Quiz Night";
  const medal = medalFor(input.rank);
  const placeLine = `Team ${input.teamName} ${medal} ${ordinal(input.rank)} of ${input.totalPlayers} · ${input.score} pts`;
  const streakLine =
    input.streakWeeks != null && input.streakWeeks > 0
      ? `Streak: ${input.streakWeeks} week${input.streakWeeks === 1 ? "" : "s"} 🔥`
      : undefined;
  const grid = input.roundResults.map((r) => squareFor(r.status)).join("");
  const gridLine = grid || "⬜".repeat(5);
  const footer = input.joinUrl ? `Play: ${input.joinUrl}` : undefined;
  return [header, placeLine, streakLine, gridLine, footer].filter(Boolean).join("\n");
}

export async function shareCard(input: ShareCardInput): Promise<"native" | "clipboard" | "error"> {
  const text = buildShareCardText(input);
  const anyNav = navigator as any;
  try {
    if (typeof anyNav.share === "function") {
      await anyNav.share({ text, title: "Quiz Night recap" });
      return "native";
    }
  } catch {
    // User cancelled or share rejected — fall through to clipboard.
  }
  try {
    await navigator.clipboard.writeText(text);
    return "clipboard";
  } catch {
    return "error";
  }
}
