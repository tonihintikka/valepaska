import type { Card } from '../types/card.js';
import type { GameConfig } from '../types/game-state.js';
import type { PlayerId } from '../types/player.js';

/**
 * Checks if a player has won
 * A player wins when:
 * 1. Draw pile is empty (endgame)
 * 2. They have no cards in hand
 * 3. Their last play was not challenged or challenge failed (claim was true)
 */
export function checkWinCondition(
  handSize: number,
  drawPileSize: number,
  lastPlayWasChallengedSuccessfully: boolean
): boolean {
  // Cannot win while draw pile has cards
  if (drawPileSize > 0) {
    return false;
  }

  // Cannot win if caught lying on final play
  if (lastPlayWasChallengedSuccessfully) {
    return false;
  }

  // Win when hand is empty in endgame
  return handSize === 0;
}

/**
 * Calculates how many cards to draw to replenish hand
 */
export function calculateDrawCount(
  currentHandSize: number,
  drawPileSize: number,
  targetHandSize: number
): number {
  if (drawPileSize === 0) {
    return 0; // No cards to draw
  }

  const needed = targetHandSize - currentHandSize;
  if (needed <= 0) {
    return 0; // Hand already at or above target
  }

  return Math.min(needed, drawPileSize);
}

/**
 * Gets the next player index
 */
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number
): number {
  return (currentIndex + 1) % playerCount;
}

/**
 * Gets player index by ID
 */
export function getPlayerIndex(
  playerId: PlayerId,
  playerIds: readonly PlayerId[]
): number {
  return playerIds.indexOf(playerId);
}

/**
 * Checks if it's a player's turn
 */
export function isPlayersTurn(
  playerId: PlayerId,
  currentPlayerIndex: number,
  playerIds: readonly PlayerId[]
): boolean {
  const playerIndex = getPlayerIndex(playerId, playerIds);
  return playerIndex === currentPlayerIndex;
}

/**
 * Validates player count
 */
export interface PlayerCountValidation {
  readonly valid: boolean;
  readonly error?: string;
}

export function validatePlayerCount(
  playerCount: number,
  min: number = 3,
  max: number = 6
): PlayerCountValidation {
  if (playerCount < min || playerCount > max) {
    return {
      valid: false,
      error: `Player count must be between ${min} and ${max}`,
    };
  }
  return { valid: true };
}

/**
 * Deals cards and returns new hands and draw pile
 */
export function replenishHand(
  hand: readonly Card[],
  drawPile: readonly Card[],
  config: GameConfig
): { newHand: Card[]; newDrawPile: Card[] } {
  const drawCount = calculateDrawCount(
    hand.length,
    drawPile.length,
    config.initialHandSize
  );

  if (drawCount === 0) {
    return {
      newHand: [...hand],
      newDrawPile: [...drawPile],
    };
  }

  const newHand = [...hand, ...drawPile.slice(0, drawCount)];
  const newDrawPile = drawPile.slice(drawCount);

  return { newHand, newDrawPile };
}

/**
 * Checks if game is in endgame phase
 */
export function isEndgame(drawPileSize: number): boolean {
  return drawPileSize === 0;
}

/**
 * Calculates final standings
 */
export function calculateFinalStandings(
  hands: ReadonlyMap<PlayerId, readonly Card[]>,
  winnerId: PlayerId
): Map<PlayerId, number> {
  const standings = new Map<PlayerId, number>();
  
  for (const [playerId, hand] of hands) {
    standings.set(playerId, playerId === winnerId ? 0 : hand.length);
  }

  return standings;
}

