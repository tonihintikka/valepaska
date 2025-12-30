import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/player.js';
import type { PlayerObservation } from '../types/observation.js';
import type { Bot } from './game-engine.js';

/**
 * Bot runner for managing bot interactions
 */
export class BotRunner {
  private challengeDecisions: Map<PlayerId, boolean> = new Map();

  /**
   * Clear challenge decisions
   */
  clearChallengeDecisions(): void {
    this.challengeDecisions.clear();
  }

  /**
   * Record a challenge decision
   */
  recordChallengeDecision(playerId: PlayerId, challenge: boolean): void {
    this.challengeDecisions.set(playerId, challenge);
  }

  /**
   * Get all challenge decisions
   */
  getChallengeDecisions(): Map<PlayerId, boolean> {
    return this.challengeDecisions;
  }

  /**
   * Get willing challengers
   */
  getWillingChallengers(): PlayerId[] {
    const willing: PlayerId[] = [];
    for (const [playerId, challenge] of this.challengeDecisions) {
      if (challenge) {
        willing.push(playerId);
      }
    }
    return willing;
  }

  /**
   * Check if all bots have made challenge decisions
   */
  allBotsDecided(
    state: GameState,
    bots: Map<PlayerId, Bot>
  ): boolean {
    if (!state.lastPlay) return false;

    const accusedId = state.lastPlay.playerId;
    for (const player of state.players) {
      if (player.id === accusedId) continue; // Can't challenge own play
      if (bots.has(player.id) && !this.challengeDecisions.has(player.id)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Collect challenge decisions from bots
   */
  collectChallengeDecisions(
    state: GameState,
    bots: Map<PlayerId, Bot>,
    getObservation: (playerId: PlayerId) => PlayerObservation
  ): void {
    if (!state.lastPlay) return;

    for (const player of state.players) {
      if (player.id === state.lastPlay!.playerId) {
        continue; // Can't challenge own play
      }

      const bot = bots.get(player.id);
      if (bot && !this.challengeDecisions.has(player.id)) {
        const observation = getObservation(player.id);
        // claimRank is string in LastPlay, but shouldChallenge expects Rank
        // This is safe because claimRank should always be a valid Rank
        const shouldChallenge = bot.shouldChallenge(
          observation,
          state.lastPlay!.claimRank as import('../types/card.js').Rank,
          state.lastPlay!.claimCount
        );
        this.recordChallengeDecision(player.id, shouldChallenge);
      }
    }
  }
}

