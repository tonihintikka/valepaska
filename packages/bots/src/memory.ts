import type { PlayerId, GameEvent, ChallengeResolvedEvent } from '@valepaska/core';
import type { PlayerReputation } from './types.js';

/**
 * Bot memory for tracking player reputations
 */
export class BotMemory {
  private reputations: Map<PlayerId, PlayerReputation>;
  private memoryLevel: 0 | 1 | 2;

  constructor(memoryLevel: 0 | 1 | 2) {
    this.reputations = new Map();
    this.memoryLevel = memoryLevel;
  }

  /**
   * Process a game event to update memory
   */
  processEvent(event: GameEvent): void {
    if (this.memoryLevel === 0) {
      return; // No memory
    }

    if (event.type === 'CHALLENGE_RESOLVED') {
      this.updateReputation(event as ChallengeResolvedEvent);
    }
  }

  /**
   * Update reputation based on challenge result
   */
  private updateReputation(event: ChallengeResolvedEvent): void {
    const playerId = event.accusedId;
    
    let rep = this.reputations.get(playerId);
    if (!rep) {
      rep = this.createReputation();
      this.reputations.set(playerId, rep);
    }

    rep.totalChallenges++;
    if (event.wasLie) {
      rep.caughtLying++;
    }
  }

  /**
   * Create a new reputation with default values
   */
  private createReputation(): PlayerReputation {
    return {
      caughtLying: 0,
      totalChallenges: 0,
      get lieRate(): number {
        if (this.totalChallenges === 0) {
          return 0.5; // Default assumption
        }
        return this.caughtLying / this.totalChallenges;
      },
    };
  }

  /**
   * Get lie rate for a player
   */
  getLieRate(playerId: PlayerId): number {
    if (this.memoryLevel === 0) {
      return 0.5; // No memory, neutral assumption
    }

    const rep = this.reputations.get(playerId);
    if (!rep) {
      return 0.5; // Unknown player, neutral assumption
    }

    // At memory level 1, use simpler calculation
    if (this.memoryLevel === 1) {
      return rep.totalChallenges >= 3 ? rep.lieRate : 0.5;
    }

    // At memory level 2, use Bayesian-like smoothing
    const smoothing = 2; // Prior observations
    const priorLies = 1; // Prior lie assumption (50%)
    
    return (rep.caughtLying + priorLies) / (rep.totalChallenges + smoothing);
  }

  /**
   * Reset memory
   */
  reset(): void {
    this.reputations.clear();
  }
}

