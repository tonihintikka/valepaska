import type { GameState } from '../types/game-state.js';
import type { BurnReason } from '../types/events.js';
import type { ClaimRecord } from '../types/claim.js';
import { getCurrentPlayerId } from './turn-manager.js';

/**
 * Execute a burn
 */
export function executeBurn(
  state: GameState,
  _reason: BurnReason,
  newClaimHistory?: ClaimRecord[]
): GameState {
  const newState: GameState = {
    ...state,
    tablePile: [],
    burnPile: [...state.burnPile, ...state.tablePile],
    claimHistory: newClaimHistory ? [] : state.claimHistory, // Reset claim history after burn
    lastPlay: null,
    phase: 'WAITING_FOR_PLAY',
  };

  return newState;
}

/**
 * Get burn event data
 */
export function getBurnEventData(
  state: GameState,
  reason: BurnReason
): {
  reason: BurnReason;
  cardCount: number;
  triggeredBy: string;
} {
  const burnedCards = state.tablePile;
  const triggeredBy = state.lastPlay?.playerId ?? getCurrentPlayerId(state);

  return {
    reason,
    cardCount: burnedCards.length,
    triggeredBy,
  };
}

