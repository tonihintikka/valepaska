import type { Card, Rank } from './card.js';
import type { ClaimRecord } from './claim.js';
import type { Player, PlayerId } from './player.js';

/**
 * Player standing (ranking)
 */
export interface PlayerStanding {
  readonly playerId: PlayerId;
  readonly position: number; // 1 = 1st place (Winner), 2 = 2nd, etc.
  readonly score: number;
  readonly finishedAtRound: number;
}

/**
 * Game phases
 */
export type GamePhase =
  | 'WAITING_FOR_PLAY'
  | 'WAITING_FOR_CHALLENGES'
  | 'RESOLVING_CHALLENGE'
  | 'GAME_OVER';

/**
 * Game configuration
 */
export interface GameConfig {
  readonly playerCount: number;
  readonly initialHandSize: number;
  readonly maxPlayCards: number;
  readonly allowAnyPlayerToChallenge: boolean;
  readonly challengeTimeoutMs: number;
}

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  playerCount: 4,
  initialHandSize: 5,
  maxPlayCards: 4,
  allowAnyPlayerToChallenge: true,
  challengeTimeoutMs: 10000,
} as const;

/**
 * Last play information (for challenge resolution)
 */
export interface LastPlay {
  readonly playerId: PlayerId;
  readonly cards: readonly Card[];
  readonly claimRank: Rank;
  readonly claimCount: number;
}

/**
 * Complete game state (internal use only - not exposed to players/bots)
 */
export interface GameState {
  readonly phase: GamePhase;
  readonly players: readonly Player[];
  readonly hands: ReadonlyMap<PlayerId, readonly Card[]>;
  readonly drawPile: readonly Card[];
  readonly tablePile: readonly Card[];
  readonly burnPile: readonly Card[];
  readonly claimHistory: readonly ClaimRecord[];
  readonly currentPlayerIndex: number;
  readonly lastPlay: LastPlay | null;
  readonly config: GameConfig;
  readonly seed: number;
  readonly roundNumber: number;
  readonly winnerId: PlayerId | null; // Deprecated: use standings[0] instead
  readonly standings: readonly PlayerStanding[]; // Players who have finished, ordered by position
  readonly activePlayerIds: readonly PlayerId[]; // Players still in the game
}

/**
 * Creates initial game state
 */
export function createInitialGameState(
  players: readonly Player[],
  config: GameConfig,
  seed: number
): GameState {
  return {
    phase: 'WAITING_FOR_PLAY',
    players,
    hands: new Map(),
    drawPile: [],
    tablePile: [],
    burnPile: [],
    claimHistory: [],
    currentPlayerIndex: 0,
    lastPlay: null,
    config,
    seed,
    roundNumber: 0,
    winnerId: null,
    standings: [],
    activePlayerIds: players.map(p => p.id),
  };
}

/**
 * Gets current player from state
 */
export function getCurrentPlayer(state: GameState): Player {
  const player = state.players[state.currentPlayerIndex];
  if (!player) {
    throw new Error('Invalid current player index');
  }
  return player;
}

/**
 * Gets next player index
 */
export function getNextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

/**
 * Checks if game is in endgame (draw pile empty)
 */
export function isEndgame(state: GameState): boolean {
  return state.drawPile.length === 0;
}

/**
 * Gets the last accepted claim (for progression rules)
 */
export function getLastAcceptedClaim(state: GameState): ClaimRecord | null {
  for (let i = state.claimHistory.length - 1; i >= 0; i--) {
    const claim = state.claimHistory[i];
    if (claim?.accepted) {
      return claim;
    }
  }
  return null;
}

