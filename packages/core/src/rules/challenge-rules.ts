import type { Card, Rank } from '../types/card.js';
import type { PlayerId } from '../types/player.js';
import { verifyClaimTruth } from './claim-rules.js';

/**
 * Challenge resolution result
 */
export interface ChallengeResult {
  readonly wasLie: boolean;
  readonly accusedId: PlayerId;
  readonly challengerId: PlayerId;
  readonly revealedCards: readonly Card[];
  readonly claimedRank: Rank;
  readonly claimedCount: number;
  readonly penaltyRecipient: PlayerId;
  readonly penaltyCardCount: number;
  readonly accusedContinues: boolean;
}

/**
 * Resolves a challenge by comparing played cards to the claim
 * 
 * @param playedCards The actual cards that were played
 * @param claimedRank The rank that was claimed
 * @param claimedCount The count that was claimed
 * @param accusedId The player who made the claim
 * @param challengerId The player who challenged
 * @param tablePileSize The current size of the table pile (including played cards)
 * @returns Challenge resolution result
 */
export function resolveChallenge(
  playedCards: readonly Card[],
  claimedRank: Rank,
  claimedCount: number,
  accusedId: PlayerId,
  challengerId: PlayerId,
  tablePileSize: number
): ChallengeResult {
  const { isTrue } = verifyClaimTruth(playedCards, claimedRank, claimedCount);
  const wasLie = !isTrue;

  if (wasLie) {
    // Claim was a lie - accused picks up the pile
    return {
      wasLie: true,
      accusedId,
      challengerId,
      revealedCards: playedCards,
      claimedRank,
      claimedCount,
      penaltyRecipient: accusedId,
      penaltyCardCount: tablePileSize,
      accusedContinues: false, // Liar loses their turn
    };
  } else {
    // Claim was true - challenger picks up the pile
    return {
      wasLie: false,
      accusedId,
      challengerId,
      revealedCards: playedCards,
      claimedRank,
      claimedCount,
      penaltyRecipient: challengerId,
      penaltyCardCount: tablePileSize,
      accusedContinues: true, // Honest player continues
    };
  }
}

/**
 * Determines who should receive the penalty pile after a challenge
 */
export function getPenaltyRecipient(
  wasLie: boolean,
  accusedId: PlayerId,
  challengerId: PlayerId
): PlayerId {
  return wasLie ? accusedId : challengerId;
}

/**
 * Determines if a challenge should be allowed
 */
export interface ChallengeValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Validates if a player can challenge
 */
export function validateChallenge(
  challengerId: PlayerId,
  accusedId: PlayerId,
  hasLastPlay: boolean
): ChallengeValidationResult {
  if (!hasLastPlay) {
    return {
      valid: false,
      error: 'No play to challenge',
    };
  }

  if (challengerId === accusedId) {
    return {
      valid: false,
      error: 'Cannot challenge your own play',
    };
  }

  return { valid: true };
}

/**
 * Gets challenger priority order
 * Priority goes to the player immediately after the accused, then continuing around
 */
export function getChallengerPriorityOrder(
  playerIds: readonly PlayerId[],
  accusedId: PlayerId
): PlayerId[] {
  const accusedIndex = playerIds.indexOf(accusedId);
  if (accusedIndex === -1) {
    return [];
  }

  const order: PlayerId[] = [];
  for (let i = 1; i < playerIds.length; i++) {
    const index = (accusedIndex + i) % playerIds.length;
    const playerId = playerIds[index];
    if (playerId) {
      order.push(playerId);
    }
  }

  return order;
}

/**
 * Selects the challenger from a list of willing challengers using priority order
 */
export function selectChallenger(
  willingChallengers: readonly PlayerId[],
  priorityOrder: readonly PlayerId[]
): PlayerId | null {
  if (willingChallengers.length === 0) {
    return null;
  }

  const willingSet = new Set(willingChallengers);
  
  for (const playerId of priorityOrder) {
    if (willingSet.has(playerId)) {
      return playerId;
    }
  }

  return null;
}

