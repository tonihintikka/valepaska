import { type Rank, RANKS, RANK_ORDER } from '../types/card.js';

/**
 * Compares two ranks
 * Returns negative if a < b, positive if a > b, zero if equal
 */
export function compareRanks(a: Rank, b: Rank): number {
  return RANK_ORDER[a] - RANK_ORDER[b];
}

/**
 * Checks if rank a is greater than or equal to rank b
 */
export function isRankGte(a: Rank, b: Rank): boolean {
  return RANK_ORDER[a] >= RANK_ORDER[b];
}

/**
 * Checks if rank a is greater than rank b
 */
export function isRankGt(a: Rank, b: Rank): boolean {
  return RANK_ORDER[a] > RANK_ORDER[b];
}

/**
 * Checks if rank a is less than or equal to rank b
 */
export function isRankLte(a: Rank, b: Rank): boolean {
  return RANK_ORDER[a] <= RANK_ORDER[b];
}

/**
 * Checks if rank a is less than rank b
 */
export function isRankLt(a: Rank, b: Rank): boolean {
  return RANK_ORDER[a] < RANK_ORDER[b];
}

/**
 * Gets all ranks greater than or equal to the given rank
 */
export function getRanksGte(rank: Rank): Rank[] {
  const minOrder = RANK_ORDER[rank];
  return RANKS.filter((r) => RANK_ORDER[r] >= minOrder);
}

/**
 * Gets all ranks greater than the given rank
 */
export function getRanksGt(rank: Rank): Rank[] {
  const minOrder = RANK_ORDER[rank];
  return RANKS.filter((r) => RANK_ORDER[r] > minOrder);
}

/**
 * Special rule: valid ranks after 2
 * After claiming 2, only 2, 10, or A are valid
 */
export const VALID_AFTER_TWO: readonly Rank[] = ['2', '10', 'A'] as const;

/**
 * Number cards (3-10) - valid for starting claims when deck has cards
 */
export const NUMBER_RANKS: readonly Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10'] as const;

/**
 * Face cards (J, Q, K) - only valid after claim >= 7
 */
export const FACE_RANKS: readonly Rank[] = ['J', 'Q', 'K'] as const;

/**
 * Minimum rank before face cards (J, Q, K) can be claimed
 */
export const FACE_CARD_THRESHOLD: Rank = '7';

/**
 * Options for getting valid claim ranks
 */
export interface ClaimRankOptions {
  /** Whether the deck still has cards */
  deckHasCards?: boolean;
  /** Player's current hand (for checking if only face cards) */
  hand?: readonly { rank: Rank }[];
}

/**
 * Gets valid claim ranks based on the last claim and game state
 * @param lastClaimRank The rank of the last accepted claim, or null if no claim
 * @param options Additional options for validation
 * @returns Array of valid ranks that can be claimed
 */
export function getValidClaimRanks(lastClaimRank: Rank | null, options: ClaimRankOptions = {}): Rank[] {
  const { deckHasCards = true, hand = [] } = options;
  
  // Check if hand has only face cards (J, Q, K, A, 2)
  const hasOnlyFaceCards = hand.length > 0 && hand.every(
    card => FACE_RANKS.includes(card.rank as Rank) || card.rank === 'A' || card.rank === '2'
  );
  
  // No previous claim - starting a new round
  if (lastClaimRank === null) {
    // If deck has cards, must start with number card (3-10)
    // Exception: if hand has only face cards and deck is empty, allow face cards
    if (deckHasCards) {
      return [...NUMBER_RANKS];
    } else if (hasOnlyFaceCards) {
      // Deck empty and only face cards - can start with any rank
      return [...RANKS];
    } else {
      // Deck empty - prefer number cards but allow face cards if needed
      return [...RANKS];
    }
  }

  // Special rule: after 2, only 2, 10, or A
  if (lastClaimRank === '2') {
    return [...VALID_AFTER_TWO];
  }

  // Get ranks >= lastClaimRank
  const validRanks = getRanksGte(lastClaimRank);
  
  // Face card restriction: J, Q, K only allowed after claim >= 7
  if (isRankLt(lastClaimRank, FACE_CARD_THRESHOLD)) {
    // Filter out J, Q, K (but keep 10, A, 2 which are special)
    return validRanks.filter(r => !FACE_RANKS.includes(r));
  }

  return validRanks;
}

/**
 * Checks if a claim rank is valid given the last claim
 */
export function isValidClaimRank(claimRank: Rank, lastClaimRank: Rank | null, options: ClaimRankOptions = {}): boolean {
  const validRanks = getValidClaimRanks(lastClaimRank, options);
  return validRanks.includes(claimRank);
}

/**
 * Gets the minimum valid rank for the next claim
 */
export function getMinimumClaimRank(lastClaimRank: Rank | null): Rank {
  if (lastClaimRank === null) {
    return '3';
  }
  if (lastClaimRank === '2') {
    return '2'; // After 2, minimum is 2 (but only 2, 10, A allowed)
  }
  return lastClaimRank;
}

/**
 * Parses rank from string, handling face cards
 */
export function parseRank(str: string): Rank | null {
  const normalized = str.toUpperCase();
  
  // Handle numeric ranks
  if (['3', '4', '5', '6', '7', '8', '9', '10', '2'].includes(normalized)) {
    return normalized as Rank;
  }
  
  // Handle face cards
  if (['J', 'JACK'].includes(normalized)) return 'J';
  if (['Q', 'QUEEN'].includes(normalized)) return 'Q';
  if (['K', 'KING'].includes(normalized)) return 'K';
  if (['A', 'ACE'].includes(normalized)) return 'A';
  
  return null;
}

/**
 * Gets display name for a rank
 */
export function getRankDisplayName(rank: Rank): string {
  switch (rank) {
    case 'J': return 'Jack';
    case 'Q': return 'Queen';
    case 'K': return 'King';
    case 'A': return 'Ace';
    default: return rank;
  }
}

