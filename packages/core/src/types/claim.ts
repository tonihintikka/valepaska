import type { PlayerId } from './player.js';
import type { Rank } from './card.js';

/**
 * A claim made by a player
 */
export interface Claim {
  readonly playerId: PlayerId;
  readonly rank: Rank;
  readonly count: number;
  readonly timestamp: number;
}

/**
 * Claim with acceptance status (for history)
 */
export interface ClaimRecord extends Claim {
  readonly accepted: boolean;
  readonly challengedBy?: PlayerId;
  readonly wasLie?: boolean;
}

/**
 * Creates a claim
 */
export function createClaim(playerId: PlayerId, rank: Rank, count: number): Claim {
  return {
    playerId,
    rank,
    count,
    timestamp: Date.now(),
  };
}

/**
 * Creates a claim record
 */
export function createClaimRecord(
  claim: Claim,
  accepted: boolean,
  challengedBy?: PlayerId,
  wasLie?: boolean
): ClaimRecord {
  return {
    ...claim,
    accepted,
    challengedBy,
    wasLie,
  };
}

