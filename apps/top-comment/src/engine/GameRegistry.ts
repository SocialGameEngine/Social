/**
 * Game Registry
 * Manages registration and retrieval of available games
 */

import type { GameEngine } from "./GameEngine";
import type { GameId, GameDescriptor } from "./types";

export class GameRegistry {
  private static games = new Map<GameId, GameEngine>();

  static register(game: GameEngine): void {
    this.games.set(game.descriptor.id, game);
  }

  static get(gameId: GameId): GameEngine | undefined {
    return this.games.get(gameId);
  }

  static getAll(): GameEngine[] {
    return Array.from(this.games.values());
  }

  static getAllDescriptors(): GameDescriptor[] {
    return Array.from(this.games.values()).map((game) => game.descriptor);
  }

  static exists(gameId: GameId): boolean {
    return this.games.has(gameId);
  }

  static clear(): void {
    this.games.clear();
  }
}




