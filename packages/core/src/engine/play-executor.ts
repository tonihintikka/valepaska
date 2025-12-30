import type { Card } from '../types/card.js';
import type { PlayerId } from '../types/player.js';
import type { GameState, LastPlay } from '../types/game-state.js';
import type { PlayMove } from '../types/moves.js';
import { findCardsByIds, removeCards } from '../utils/deck.js';

/**
 * Execute a play move
 */
export function executePlay(
  state: GameState,
  playerId: PlayerId,
  move: PlayMove
): {
  newState: GameState;
  playedCards: Card[];
} {
  const hand = state.hands.get(playerId);
  if (!hand) {
    throw new Error('Player not found');
  }

  const playedCards = findCardsByIds(hand, move.cardIds);
  const newHand = removeCards(hand, move.cardIds);

  // Update hands
  const newHands = new Map(state.hands);
  newHands.set(playerId, newHand);

  // Add cards to table pile
  const newTablePile = [...state.tablePile, ...playedCards];

  // Record last play for challenge resolution
  const lastPlay: LastPlay = {
    playerId,
    cards: playedCards,
    claimRank: move.claimRank,
    claimCount: move.claimCount,
  };

  const newState: GameState = {
    ...state,
    hands: newHands,
    tablePile: newTablePile,
    lastPlay,
    phase: 'WAITING_FOR_CHALLENGES',
  };

  return { newState, playedCards };
}

