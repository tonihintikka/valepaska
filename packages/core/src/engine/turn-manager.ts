import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/player.js';

/**
 * Advances turn to next active player (skips finished players)
 */
export function advanceTurn(state: GameState): GameState {
  if (state.activePlayerIds.length === 0) {
    return state; // No active players
  }

  const currentPlayerId = getCurrentPlayerId(state);
  const currentActiveIndex = state.activePlayerIds.indexOf(currentPlayerId);
  
  if (currentActiveIndex === -1) {
    // Current player is not active, find first active player
    const firstActivePlayer = state.players.find(p => state.activePlayerIds.includes(p.id));
    if (!firstActivePlayer) {
      return state;
    }
    const newIndex = state.players.findIndex(p => p.id === firstActivePlayer.id);
    return {
      ...state,
      currentPlayerIndex: newIndex,
    };
  }

  // Find next active player
  const nextActiveIndex = (currentActiveIndex + 1) % state.activePlayerIds.length;
  const nextActivePlayerId = state.activePlayerIds[nextActiveIndex];
  const nextPlayerIndex = state.players.findIndex(p => p.id === nextActivePlayerId);
  
  if (nextPlayerIndex === -1) {
    throw new Error('Next active player not found in players array');
  }

  const wasNewRound = nextPlayerIndex < state.currentPlayerIndex || 
                      (nextPlayerIndex === 0 && state.currentPlayerIndex > 0);

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    roundNumber: wasNewRound ? state.roundNumber + 1 : state.roundNumber,
  };
}

/**
 * Get the next active player ID in rotation
 */
export function getNextPlayerId(state: GameState): PlayerId {
  if (state.activePlayerIds.length === 0) {
    throw new Error('No active players');
  }

  const currentPlayerId = getCurrentPlayerId(state);
  const currentActiveIndex = state.activePlayerIds.indexOf(currentPlayerId);
  
  if (currentActiveIndex === -1) {
    // Current player is not active, return first active player
    return state.activePlayerIds[0];
  }

  const nextActiveIndex = (currentActiveIndex + 1) % state.activePlayerIds.length;
  return state.activePlayerIds[nextActiveIndex];
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

