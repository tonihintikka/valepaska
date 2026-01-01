import { type Card, type Rank, type Suit, RANKS, SUITS, createCard } from '../types/card.js';
import type { SeededRng } from './rng.js';

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }

  return deck;
}

/**
 * Shuffles a deck using the provided RNG
 */
export function shuffleDeck(deck: Card[], rng: SeededRng): Card[] {
  const shuffled = [...deck];
  rng.shuffle(shuffled);
  return shuffled;
}

/**
 * Deals cards from the deck to players
 * Returns a tuple of [hands, remainingDeck]
 */
export function dealCards(
  deck: readonly Card[],
  playerCount: number,
  cardsPerPlayer: number
): [Map<number, Card[]>, Card[]] {
  const hands = new Map<number, Card[]>();
  const remainingDeck = [...deck];

  // Initialize hands
  for (let i = 0; i < playerCount; i++) {
    hands.set(i, []);
  }

  // Deal cards round-robin style
  for (let card = 0; card < cardsPerPlayer; card++) {
    for (let player = 0; player < playerCount; player++) {
      const dealtCard = remainingDeck.shift();
      if (dealtCard) {
        hands.get(player)!.push(dealtCard);
      }
    }
  }

  return [hands, remainingDeck];
}

/**
 * Groups cards by rank
 */
export function groupCardsByRank(cards: readonly Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();

  for (const card of cards) {
    if (!groups.has(card.rank)) {
      groups.set(card.rank, []);
    }
    groups.get(card.rank)!.push(card);
  }

  return groups;
}

/**
 * Groups cards by suit
 */
export function groupCardsBySuit(cards: readonly Card[]): Map<Suit, Card[]> {
  const groups = new Map<Suit, Card[]>();

  for (const card of cards) {
    if (!groups.has(card.suit)) {
      groups.set(card.suit, []);
    }
    groups.get(card.suit)!.push(card);
  }

  return groups;
}

/**
 * Finds all cards of a specific rank
 */
export function findCardsOfRank(cards: readonly Card[], rank: Rank): Card[] {
  return cards.filter((card) => card.rank === rank);
}

/**
 * Counts cards of a specific rank
 */
export function countCardsOfRank(cards: readonly Card[], rank: Rank): number {
  return cards.filter((card) => card.rank === rank).length;
}

/**
 * Removes specific cards from a collection by ID
 */
export function removeCards(cards: readonly Card[], cardIds: readonly string[]): Card[] {
  const idsToRemove = new Set(cardIds);
  return cards.filter((card) => !idsToRemove.has(card.id));
}

/**
 * Finds cards by their IDs
 */
export function findCardsByIds(cards: readonly Card[], cardIds: readonly string[]): Card[] {
  const idsToFind = new Set(cardIds);
  return cards.filter((card) => idsToFind.has(card.id));
}




