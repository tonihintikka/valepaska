import type {
  Bot,
  PlayerObservation,
  PlayMove,
  Rank,
  GameEvent,
  BotDifficulty,
  PlayerId,
} from '@valepaska/core';
import { createPlayMove, createRng, SeededRng } from '@valepaska/core';
import type { BotConfig } from './types.js';
import { BOT_PRESETS } from './types.js';
import { BotMemory } from './memory.js';
import { generateCandidateMoves, selectBestMove } from './move-generator.js';
import { scoreMoves } from './move-scorer.js';
import { shouldChallenge } from './challenge-evaluator.js';

/**
 * Rule-based AI bot for Valepaska
 */
export class RuleBot implements Bot {
  private readonly playerId: PlayerId;
  private readonly config: BotConfig;
  private readonly memory: BotMemory;
  private readonly rng: SeededRng;

  constructor(playerId: PlayerId, difficulty: BotDifficulty, seed?: number) {
    this.playerId = playerId;
    this.config = BOT_PRESETS[difficulty];
    this.memory = new BotMemory(this.config.memoryLevel);
    this.rng = createRng(seed ?? Date.now());
  }

  /**
   * Create a bot with custom config
   */
  static withConfig(playerId: PlayerId, config: BotConfig, seed?: number): RuleBot {
    const bot = new RuleBot(playerId, 'Normal', seed);
    (bot as { config: BotConfig }).config = config;
    return bot;
  }

  /**
   * Choose a move to play
   */
  chooseMove(observation: PlayerObservation): PlayMove {
    // Fallback check first
    if (observation.hand.length === 0 || observation.validClaimRanks.length === 0) {
      throw new Error('No valid moves available');
    }

    // Generate candidate moves
    const candidates = generateCandidateMoves(observation, this.config, this.rng);

    // Score all candidates
    const scored = scoreMoves(candidates, observation, this.config);

    // Select best move
    const best = selectBestMove(scored);

    if (!best) {
      // Fallback: play first card with first valid rank (as a bluff if needed)
      const card = observation.hand[0]!;
      const rank = observation.validClaimRanks[0]!;
      return createPlayMove(this.playerId, [card.id], rank, 1);
    }

    return createPlayMove(
      this.playerId,
      best.cardIds,
      best.claimRank as Rank,
      best.claimCount
    );
  }

  /**
   * Decide whether to challenge a claim
   */
  shouldChallenge(
    observation: PlayerObservation,
    claimRank: Rank,
    claimCount: number
  ): boolean {
    // Find who made the claim
    const lastClaim = observation.lastClaim;
    if (!lastClaim) {
      return false;
    }

    const accusedId = lastClaim.playerId;

    return shouldChallenge(
      observation,
      claimRank,
      claimCount,
      accusedId,
      this.config,
      this.memory
    );
  }

  /**
   * Process a game event for memory updates
   */
  onEvent(event: GameEvent): void {
    this.memory.processEvent(event);
  }

  /**
   * Get the bot's configuration
   */
  getConfig(): BotConfig {
    return this.config;
  }

  /**
   * Reset the bot's memory
   */
  resetMemory(): void {
    this.memory.reset();
  }
}

