/**
 * Card suits
 */
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/**
 * Card ranks in order: 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
 */
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

/**
 * Unique card identifier (e.g., "7♥", "A♠")
 */
export type CardId = string;

/**
 * A playing card
 */
export interface Card {
  readonly id: CardId;
  readonly rank: Rank;
  readonly suit: Suit;
}

/**
 * All valid suits
 */
export const SUITS: readonly Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'] as const;

/**
 * All valid ranks in ascending order (3 is lowest, 2 is highest)
 */
export const RANKS: readonly Rank[] = [
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
  '2',
] as const;

/**
 * Rank order map for comparison (higher value = higher rank)
 */
export const RANK_ORDER: Record<Rank, number> = {
  '3': 0,
  '4': 1,
  '5': 2,
  '6': 3,
  '7': 4,
  '8': 5,
  '9': 6,
  '10': 7,
  J: 8,
  Q: 9,
  K: 10,
  A: 11,
  '2': 12,
} as const;

/**
 * Suit symbols for display
 */
export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
} as const;

/**
 * Creates a card ID from rank and suit
 */
export function createCardId(rank: Rank, suit: Suit): CardId {
  return `${rank}${SUIT_SYMBOLS[suit]}`;
}

/**
 * Creates a card
 */
export function createCard(rank: Rank, suit: Suit): Card {
  return {
    id: createCardId(rank, suit),
    rank,
    suit,
  };
}

/**
 * Parses a card ID back to rank and suit
 */
export function parseCardId(id: CardId): { rank: Rank; suit: Suit } | null {
  const suitSymbol = id.slice(-1);
  const rankStr = id.slice(0, -1);

  const suit = (Object.entries(SUIT_SYMBOLS) as [Suit, string][]).find(
    ([, symbol]) => symbol === suitSymbol
  )?.[0];

  if (!suit || !RANKS.includes(rankStr as Rank)) {
    return null;
  }

  return { rank: rankStr as Rank, suit };
}




