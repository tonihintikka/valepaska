import type { Rank } from '../types/card.js';
import type { BurnReason } from '../types/events.js';
import type { ClaimRecord } from '../types/claim.js';

/**
 * Checks if a claim triggers a burn
 * Burns can be triggered by:
 * 1. Claiming 10 (and it's accepted)
 * 2. Claiming A (and it's accepted)
 * 3. Four consecutive claims of the same rank
 */
export function checkBurn(
  claimRank: Rank,
  claimHistory: readonly ClaimRecord[]
): BurnReason | null {
  // 10 burns
  if (claimRank === '10') {
    return 'TEN';
  }

  // A burns
  if (claimRank === 'A') {
    return 'ACE';
  }

  // Check for four consecutive same rank
  if (checkFourInRow(claimHistory, claimRank)) {
    return 'FOUR_IN_ROW';
  }

  return null;
}

/**
 * Checks if adding this claim would create four consecutive same rank claims
 * Only counts accepted claims
 */
export function checkFourInRow(
  claimHistory: readonly ClaimRecord[],
  newClaimRank: Rank
): boolean {
  // Get the last 3 accepted claims
  let consecutiveCount = 1; // The new claim counts as 1
  
  for (let i = claimHistory.length - 1; i >= 0 && consecutiveCount < 4; i--) {
    const claim = claimHistory[i];
    if (!claim?.accepted) {
      continue; // Skip non-accepted claims
    }
    
    if (claim.rank === newClaimRank) {
      consecutiveCount++;
    } else {
      break; // Chain broken
    }
  }

  return consecutiveCount >= 4;
}

/**
 * Counts consecutive claims of the same rank at the end of history
 */
export function countConsecutiveSameRank(
  claimHistory: readonly ClaimRecord[],
  rank: Rank
): number {
  let count = 0;
  
  for (let i = claimHistory.length - 1; i >= 0; i--) {
    const claim = claimHistory[i];
    if (!claim?.accepted) {
      continue;
    }
    
    if (claim.rank === rank) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

/**
 * Gets how many more claims of a rank would trigger a four-in-row burn
 */
export function claimsUntilFourInRow(
  claimHistory: readonly ClaimRecord[],
  rank: Rank
): number {
  const current = countConsecutiveSameRank(claimHistory, rank);
  return Math.max(0, 4 - current - 1); // -1 because the new claim would add 1
}

/**
 * Checks if a rank is a burn rank (10 or A)
 */
export function isBurnRank(rank: Rank): boolean {
  return rank === '10' || rank === 'A';
}

