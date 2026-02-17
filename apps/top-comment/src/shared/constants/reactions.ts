export const REACTION_EMOJIS = ['🔥', '😂', '👏', '💀', '🎉', '😮'] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

// Throttle: max 1 reaction per player per 2 seconds
export const REACTION_THROTTLE_MS = 2000;

// Rolling window for displaying recent reactions
export const REACTION_WINDOW_MS = 5000;

// Burst threshold: if N+ of the same emoji in 2 seconds, show burst effect
export const REACTION_BURST_THRESHOLD = 5;
export const REACTION_BURST_WINDOW_MS = 2000;
