import type { BotDifficulty } from '@valepaska/core';

/**
 * Bot configuration parameters
 */
export interface BotConfig {
  /** Probability of bluffing (0-1) */
  readonly bluffRate: number;

  /** Probability of attempting burn bluffs (10/A) on large piles (0-1) */
  readonly burnBluffRate: number;

  /** Maximum cards to play in a single move (1-4) */
  readonly maxCardsToPlay: number;

  /** Suspicion score threshold for challenging */
  readonly challengeThreshold: number;

  /** Fear factor for large table piles (reduces challenge willingness) */
  readonly pileFearFactor: number;

  /** Aggression multiplier in endgame */
  readonly endgameAggro: number;

  /** Memory level: 0=none, 1=basic, 2=full */
  readonly memoryLevel: 0 | 1 | 2;
}

/**
 * Preset configurations for each difficulty level
 */
export const BOT_PRESETS: Record<BotDifficulty, BotConfig> = {
  Easy: {
    bluffRate: 0.05,
    burnBluffRate: 0.0,
    maxCardsToPlay: 4,
    challengeThreshold: 3.4,
    pileFearFactor: 1.2,
    endgameAggro: 0.3,
    memoryLevel: 0,
  },
  Normal: {
    bluffRate: 0.2,
    burnBluffRate: 0.05,
    maxCardsToPlay: 4,
    challengeThreshold: 2.7,
    pileFearFactor: 1.0,
    endgameAggro: 0.6,
    memoryLevel: 1,
  },
  Hard: {
    bluffRate: 0.35,
    burnBluffRate: 0.15,
    maxCardsToPlay: 4,
    challengeThreshold: 2.2,
    pileFearFactor: 0.8,
    endgameAggro: 0.9,
    memoryLevel: 2,
  },
  Pro: {
    bluffRate: 0.45,
    burnBluffRate: 0.25,
    maxCardsToPlay: 4,
    challengeThreshold: 1.9,
    pileFearFactor: 0.7,
    endgameAggro: 1.2,
    memoryLevel: 2,
  },
} as const;

/**
 * Player reputation tracking
 */
export interface PlayerReputation {
  /** Number of times caught lying */
  caughtLying: number;

  /** Total challenges against this player */
  totalChallenges: number;

  /** Calculated lie rate (0-1) */
  readonly lieRate: number;
}

/**
 * Candidate move for evaluation
 */
export interface CandidateMove {
  readonly cardIds: readonly string[];
  readonly claimRank: string;
  readonly claimCount: number;
  readonly isHonest: boolean;
  readonly score: number;
}



