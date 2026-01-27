import type { Session } from "./types";

export const phaseCopy: Record<Session["status"], string> = {
  lobby: "Gather your teams and share the code.",
  "category-select": "Teams are selecting categories.",
  answer: "Teams are writing their responses.",
  vote: "Votes are coming in.",
  results: "Review the winning answer.",
  ended: "Session complete.",
};

export const actionLabel: Record<Session["status"], string> = {
  lobby: "Start Game",
  "category-select": "Skip to Answers",
  answer: "Lock Answers",
  vote: "Lock Votes",
  results: "Next Round",
  ended: "Session Ended",
};

// Dynamic prompt library functions (loads from database with fallback to static)
export {
  getPromptLibraries,
  getPromptLibrary,
  getDefaultPromptLibrary,
  getDefaultPromptLibraryId,
} from "./dynamicPromptLibraries";

export function formatCode(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export const statusHeadline: Record<Session["status"], string> = {
  lobby: "Waiting for the host to start...",
  "category-select": "Choose a category!",
  answer: "Answer the prompt!",
  vote: "Time to vote!",
  results: "Round results are in",
  ended: "Game over - thanks for playing!",
};

export const phaseHeadline: Record<Session["status"], string> = {
  lobby: "Scan the QR to join",
  "category-select": "Category Selection",
  answer: "Answer the prompt",
  vote: "Vote for your favorite idea",
  results: "Round results",
  ended: "Final leaderboard",
};

export const phaseSubtitle: Record<Session["status"], string> = {
  lobby: "Or visit event.playnow.social/play and enter the room code.",
  "category-select": "Random teams are choosing prompt categories for this round.",
  answer: "Type fast! You have 90 seconds to drop your best answer.",
  vote: "Pick the funniest or boldest idea. No voting for your own team.",
  results: "Celebrate the winner! Next round starts soon.",
  ended: "Thanks for playing. Ask your host for the next code.",
};
