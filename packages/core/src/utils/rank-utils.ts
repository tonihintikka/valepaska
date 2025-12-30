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
 * Gets valid claim ranks based on the last claim
 * @param lastClaimRank The rank of the last accepted claim, or null if no claim
 * @returns Array of valid ranks that can be claimed
 */
export function getValidClaimRanks(lastClaimRank: Rank | null): Rank[] {
  // No previous claim - any rank is valid
  if (lastClaimRank === null) {
    return [...RANKS];
  }

  // Special rule: after 2, only 2, 10, or A
  if (lastClaimRank === '2') {
    return [...VALID_AFTER_TWO];
  }

  // Normal rule: same or higher
  return getRanksGte(lastClaimRank);
}

/**
 * Checks if a claim rank is valid given the last claim
 */
export function isValidClaimRank(claimRank: Rank, lastClaimRank: Rank | null): boolean {
  const validRanks = getValidClaimRanks(lastClaimRank);
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

