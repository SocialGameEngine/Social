export const RATE_LIMITS = {
  chat: { maxActions: 5, windowMs: 10_000 },
  reaction: { maxActions: 1, windowMs: 2_000 },
  response: { maxActions: 3, windowMs: 30_000 },
  vote: { maxActions: 2, windowMs: 10_000 },
  join: { maxActions: 3, windowMs: 60_000 },
  report: { maxActions: 3, windowMs: 300_000 },
} as const;
