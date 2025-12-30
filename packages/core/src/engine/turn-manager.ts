import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/player.js';

/**
 * Advances turn to next player
 */
export function advanceTurn(state: GameState): GameState {
  const currentPlayerIndex = state.currentPlayerIndex;
  const nextIndex = (currentPlayerIndex + 1) % state.players.length;

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    roundNumber: nextIndex === 0 ? state.roundNumber + 1 : state.roundNumber,
  };
}

/**
 * Get the next player ID in rotation
 */
export function getNextPlayerId(state: GameState): PlayerId {
  const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const nextPlayer = state.players[nextIndex];
  if (!nextPlayer) {
    throw new Error('Invalid next player index');
  }
  return nextPlayer.id;
}

/**
 * Get the current player ID
 */
export function getCurrentPlayerId(state: GameState): PlayerId {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error('Invalid current player index');
  }
  return currentPlayer.id;
}

