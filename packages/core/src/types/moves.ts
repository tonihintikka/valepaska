import type { CardId, Rank } from './card.js';
import type { PlayerId } from './player.js';

/**
 * Move types
 */
export type MoveType = 'PLAY';

/**
 * Base move interface
 */
export interface BaseMove {
  readonly type: MoveType;
  readonly playerId: PlayerId;
  readonly timestamp: number;
}

/**
 * Play move - play cards face down with a claim
 */
export interface PlayMove extends BaseMove {
  readonly type: 'PLAY';
  readonly cardIds: readonly CardId[];
  readonly claimRank: Rank;
  readonly claimCount: number;
}

/**
 * Union of all move types
 */
export type Move = PlayMove;

/**
 * Creates a play move
 */
export function createPlayMove(
  playerId: PlayerId,
  cardIds: readonly CardId[],
  claimRank: Rank,
  claimCount?: number
): PlayMove {
  return {
    type: 'PLAY',
    playerId,
    cardIds,
    claimRank,
    claimCount: claimCount ?? cardIds.length,
    timestamp: Date.now(),
  };
}

