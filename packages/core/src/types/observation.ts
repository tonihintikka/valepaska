import type { Card, Rank } from './card.js';
import type { ClaimRecord } from './claim.js';
import type { PlayerId } from './player.js';

/**
 * Player observation - limited view of game state for players and bots
 * This is what a player can "see" - their own hand, public information,
 * but NOT hidden cards (other hands, draw pile contents, table pile contents)
 */
export interface PlayerObservation {
  /** The player this observation is for */
  readonly playerId: PlayerId;

  /** Player's own hand (visible to them) */
  readonly hand: readonly Card[];

  /** Other players' hand sizes (visible, but not contents) */
  readonly otherHandSizes: ReadonlyMap<PlayerId, number>;

  /** Number of cards remaining in draw pile */
  readonly drawPileSize: number;

  /** Number of cards in table pile (face down) */
  readonly tablePileSize: number;

  /** History of claims (public information) */
  readonly claimHistory: readonly ClaimRecord[];

  /** Last claim made (for progression rules) */
  readonly lastClaim: ClaimRecord | null;

  /** Valid ranks that can be claimed next */
  readonly validClaimRanks: readonly Rank[];

  /** Whether the game is in endgame (draw pile empty) */
  readonly isEndgame: boolean;

  /** Current player ID */
  readonly currentPlayerId: PlayerId;

  /** Whether it's this player's turn */
  readonly isMyTurn: boolean;

  /** Current game phase */
  readonly phase: string;

  /** Player order (for priority calculations) */
  readonly playerOrder: readonly PlayerId[];

  /** Round number */
  readonly roundNumber: number;
}

/**
 * Observation of last play for challenge decisions
 */
export interface LastPlayObservation {
  readonly playerId: PlayerId;
  readonly claimRank: Rank;
  readonly claimCount: number;
  readonly actualCardCount: number;
}




