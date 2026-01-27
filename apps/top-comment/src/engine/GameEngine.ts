/**
 * Game Engine Interface
 * All games must implement this interface to be compatible with the engine
 */

import type {
  GameDescriptor,
  GameSession,
  GamePlayer,
  GameAction,
  PhaseContext,
  PlayerScore,
  LeaderboardEntry,
} from "./types";

export interface GameEngine<
  TPhaseId = string,
  TSettings = unknown,
  TState = unknown,
> {
  // Game metadata
  descriptor: GameDescriptor;

  // Lifecycle management
  createSession(
    creator: GamePlayer,
    settings: Partial<TSettings>,
  ): Promise<GameSession<TPhaseId, TSettings, TState>>;

  startSession(sessionId: string, players: GamePlayer[]): Promise<void>;

  endSession(sessionId: string): Promise<void>;

  // Phase management
  advancePhase(sessionId: string, context: PhaseContext): Promise<void>;

  canAdvancePhase(sessionId: string): Promise<boolean>;

  // Player actions
  handlePlayerAction(
    sessionId: string,
    playerId: string,
    action: GameAction,
  ): Promise<void>;

  // Scoring & results
  calculateScores(sessionId: string): Promise<PlayerScore[]>;

  getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]>;
}

// Base abstract class that games can extend
export abstract class BaseGameEngine<
  TPhaseId = string,
  TSettings = unknown,
  TState = unknown,
> implements GameEngine<TPhaseId, TSettings, TState>
{
  abstract descriptor: GameDescriptor;

  abstract createSession(
    creator: GamePlayer,
    settings: Partial<TSettings>,
  ): Promise<GameSession<TPhaseId, TSettings, TState>>;

  abstract startSession(sessionId: string, players: GamePlayer[]): Promise<void>;

  abstract endSession(sessionId: string): Promise<void>;

  abstract advancePhase(
    sessionId: string,
    context: PhaseContext,
  ): Promise<void>;

  abstract canAdvancePhase(sessionId: string): Promise<boolean>;

  abstract handlePlayerAction(
    sessionId: string,
    playerId: string,
    action: GameAction,
  ): Promise<void>;

  abstract calculateScores(sessionId: string): Promise<PlayerScore[]>;

  abstract getLeaderboard(sessionId: string): Promise<LeaderboardEntry[]>;

  // Helper methods that subclasses can use
  protected createPhase<T extends TPhaseId>(
    id: T,
    data?: unknown,
    durationSeconds?: number,
  ): { id: T; data?: unknown; endsAt?: string } {
    const phase: { id: T; data?: unknown; endsAt?: string } = { id };
    if (data !== undefined) {
      phase.data = data;
    }
    if (durationSeconds !== undefined) {
      phase.endsAt = new Date(
        Date.now() + durationSeconds * 1000,
      ).toISOString();
    }
    return phase;
  }
}




