import { z } from "zod";

export const joinSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Room code must be 6 characters")
    .regex(/^[A-Z0-9]{6}$/i, "Use letters and numbers only"),
  teamName: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(15, "Team name must be 15 characters or fewer"),
});

export const answerSchema = z
  .string()
  .trim()
  .min(1, "Answer cannot be empty")
  .max(120, "Keep it to 120 characters");

export const createSessionSchema = z.object({
  venueName: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
