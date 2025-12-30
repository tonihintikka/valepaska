import type { Card } from '../types/card.js';
import type { PlayerId } from '../types/player.js';
import type { GameState, GameConfig } from '../types/game-state.js';
import { createDeck, shuffleDeck } from '../utils/deck.js';
import { replenishHand } from '../rules/game-rules.js';
import type { SeededRng } from '../utils/rng.js';

/**
 * Deal initial cards to all players
 */
export function dealInitialCards(
  players: readonly { id: PlayerId }[],
  config: GameConfig,
  rng: SeededRng
): {
  hands: Map<PlayerId, Card[]>;
  drawPile: Card[];
} {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck, rng);

  const hands = new Map<PlayerId, Card[]>();
  let deckIndex = 0;

  // Initialize hands
  for (const player of players) {
    hands.set(player.id, []);
  }

  // Deal cards round-robin
  for (let i = 0; i < config.initialHandSize; i++) {
    for (const player of players) {
      const card = shuffled[deckIndex];
      if (card) {
        hands.get(player.id)!.push(card);
        deckIndex++;
      }
    }
  }

  // Set draw pile to remaining cards
  const drawPile = shuffled.slice(deckIndex);

  return { hands, drawPile };
}

/**
 * Replenish all players' hands
 */
export function replenishAllHands(
  state: GameState
): {
  hands: Map<PlayerId, Card[]>;
  drawPile: Card[];
  drawnCounts: Map<PlayerId, number>;
} {
  if (state.drawPile.length === 0) {
    // Convert readonly Map to mutable Map
    const mutableHands = new Map<PlayerId, Card[]>();
    for (const [playerId, cards] of state.hands) {
      mutableHands.set(playerId, [...cards] as Card[]);
    }
    return {
      hands: mutableHands,
      drawPile: state.drawPile,
      drawnCounts: new Map(),
    };
  }

  const newHands = new Map(state.hands);
  let newDrawPile = [...state.drawPile];
  const drawnCounts = new Map<PlayerId, number>();

  for (const player of state.players) {
    const hand = newHands.get(player.id) ?? [];
    const { newHand, newDrawPile: updatedDrawPile } = replenishHand(
      hand,
      newDrawPile,
      state.config
    );

    if (newHand.length > hand.length) {
      const drawnCount = newHand.length - hand.length;
      newHands.set(player.id, newHand);
      newDrawPile = updatedDrawPile;
      drawnCounts.set(player.id, drawnCount);
    }
  }

  return {
    hands: newHands as Map<PlayerId, Card[]>,
    drawPile: newDrawPile,
    drawnCounts,
  };
}

