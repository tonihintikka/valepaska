import type { Card, Rank } from '../types/card.js';
import type { Claim, ClaimRecord } from '../types/claim.js';
import type { GameConfig } from '../types/game-state.js';
import { getValidClaimRanks, isValidClaimRank, type ClaimRankOptions, FACE_RANKS, FACE_CARD_THRESHOLD, isRankLt } from '../utils/rank-utils.js';

/**
 * Claim validation result
 */
export interface ClaimValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Validates a claim's rank against the last claim
 */
export function validateClaimRank(
  claimRank: Rank,
  lastClaimRank: Rank | null,
  options: ClaimRankOptions = {}
): ClaimValidationResult {
  if (!isValidClaimRank(claimRank, lastClaimRank, options)) {
    // Specific error messages
    if (lastClaimRank === '2') {
      return {
        valid: false,
        error: 'After 2, only 2 is a valid claim',
      };
    }
    
    // Starting claim restriction
    if (lastClaimRank === null && options.deckHasCards) {
      return {
        valid: false,
        error: 'Starting claim must be a number card (3-10) while deck has cards',
      };
    }
    
    // Face card restriction (J, Q, K only after 7)
    if (lastClaimRank !== null && isRankLt(lastClaimRank, FACE_CARD_THRESHOLD) && 
        FACE_RANKS.includes(claimRank as typeof FACE_RANKS[number])) {
      return {
        valid: false,
        error: 'Face cards (J, Q, K) can only be claimed after reaching 7 or higher',
      };
    }
    
    return {
      valid: false,
      error: 'Claim rank must be same or higher than last claim',
    };
  }
  return { valid: true };
}

/**
 * Validates the number of cards in a play
 */
export function validateCardCount(
  cardCount: number,
  config: GameConfig
): ClaimValidationResult {
  if (cardCount < 1) {
    return {
      valid: false,
      error: 'Must play at least 1 card',
    };
  }
  if (cardCount > config.maxPlayCards) {
    return {
      valid: false,
      error: `Cannot play more than ${config.maxPlayCards} cards`,
    };
  }
  return { valid: true };
}

/**
 * Validates that all cards are in the player's hand
 */
export function validateCardsInHand(
  cardIds: readonly string[],
  hand: readonly Card[]
): ClaimValidationResult {
  const handCardIds = new Set(hand.map((c) => c.id));
  
  for (const cardId of cardIds) {
    if (!handCardIds.has(cardId)) {
      return {
        valid: false,
        error: "Card not in player's hand",
      };
    }
  }
  return { valid: true };
}

/**
 * Validates a complete play move
 */
export function validatePlay(
  cardIds: readonly string[],
  claimRank: Rank,
  claimCount: number,
  hand: readonly Card[],
  lastClaimRank: Rank | null,
  config: GameConfig,
  options: ClaimRankOptions = {}
): ClaimValidationResult {
  // Validate card count
  const cardCountResult = validateCardCount(cardIds.length, config);
  if (!cardCountResult.valid) {
    return cardCountResult;
  }

  // Validate claim count matches played cards (or is explicitly set)
  if (claimCount !== cardIds.length) {
    // Allow mismatch - this is a lie
  }

  // Validate cards are in hand
  const cardsInHandResult = validateCardsInHand(cardIds, hand);
  if (!cardsInHandResult.valid) {
    return cardsInHandResult;
  }

  // Validate claim rank progression (with deck state and hand for face card rules)
  const rankOptions: ClaimRankOptions = {
    ...options,
    hand: hand, // Pass hand for checking if only face cards
  };
  const rankResult = validateClaimRank(claimRank, lastClaimRank, rankOptions);
  if (!rankResult.valid) {
    return rankResult;
  }

  return { valid: true };
}

/**
 * Verifies if a claim is true (all cards match claimed rank and count matches)
 */
export function verifyClaimTruth(
  playedCards: readonly Card[],
  claimRank: Rank,
  claimCount: number
): { isTrue: boolean; reason?: string } {
  // Check count matches
  if (playedCards.length !== claimCount) {
    return {
      isTrue: false,
      reason: `Claimed ${claimCount} cards but played ${playedCards.length}`,
    };
  }

  // Check all cards match rank
  for (const card of playedCards) {
    if (card.rank !== claimRank) {
      return {
        isTrue: false,
        reason: `Card ${card.id} is ${card.rank}, not ${claimRank}`,
      };
    }
  }

  return { isTrue: true };
}

/**
 * Gets the last accepted claim rank from history
 */
export function getLastAcceptedClaimRank(history: readonly ClaimRecord[]): Rank | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const claim = history[i];
    if (claim?.accepted) {
      return claim.rank;
    }
  }
  return null;
}

/**
 * Re-export for convenience
 */
export { getValidClaimRanks, isValidClaimRank, type ClaimRankOptions };

