/**
 * Top Comment Game
 * Export top-level game information and components
 */

import type { GameDescriptor } from "@social/game-engine";

export const TOP_COMMENT_EVENT_DESCRIPTOR: GameDescriptor = {
  id: "top-comment-event",
  name: "Top Comment (Event)",
  mode: "event",
  description: "Host-controlled multiplayer game where teams compete to write the funniest answers",
  minPlayers: 2,
  maxPlayers: 24,
};

export const TOP_COMMENT_SOLO_DESCRIPTOR: GameDescriptor = {
  id: "top-comment-solo",
  name: "Top Comment (Solo)",
  mode: "patron",
  description: "Play Top Comment on your own, compete against previous answers",
  minPlayers: 1,
  maxPlayers: 1,
};

export * from "./types";
export * from "./components";




