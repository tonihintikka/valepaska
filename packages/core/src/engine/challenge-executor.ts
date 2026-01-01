import type { Card, Rank } from '../types/card.js';
import type { GameState } from '../types/game-state.js';
import type { PlayerId } from '../types/player.js';
import { resolveChallenge } from '../rules/challenge-rules.js';
import { checkBurn } from '../rules/burn-rules.js';
import { createClaimRecord } from '../types/claim.js';
import { advanceTurn } from './turn-manager.js';
import { executeBurn } from './burn-executor.js';

/**
 * Result of executing a challenge
 */
export interface ChallengeResult {
  newState: GameState;
  wasLie: boolean;
  revealedCards: readonly Card[];
  penaltyCardCount: number;
  accusedContinues: boolean;
  penaltyRecipient: PlayerId;
  shouldBurn: boolean;
  burnReason?: string;
}

/**
 * Execute a challenge
 */
export function executeChallenge(
  state: GameState,
  challengerId: PlayerId
): ChallengeResult {
  if (!state.lastPlay) {
    throw new Error('No last play');
  }

  const { playerId: accusedId, cards, claimRank, claimCount } = state.lastPlay;

  // Resolve the challenge (claimRank is string in LastPlay, cast to Rank)
  const result = resolveChallenge(
    cards,
    claimRank as Rank,
    claimCount,
    accusedId,
    challengerId,
    state.tablePile.length
  );

  // Record claim as challenged
  const claimRecord = createClaimRecord(
    {
      playerId: accusedId,
      rank: claimRank as Rank,
      count: claimCount,
      timestamp: Date.now(),
    },
    !result.wasLie, // accepted if not a lie
    challengerId,
    result.wasLie
  );

  const newClaimHistory = [...state.claimHistory, claimRecord];

  // Check if burn should occur (only when claim was true and it's a burn rank)
  const burnReason = !result.wasLie ? checkBurn(claimRank as Rank, claimCount, state.claimHistory) : null;

  if (burnReason) {
    // Burn the pile instead of giving it to challenger
    const newState = executeBurn(state, burnReason, newClaimHistory);

    return {
      newState,
      wasLie: result.wasLie,
      revealedCards: cards,
      penaltyCardCount: 0,
      accusedContinues: result.accusedContinues,
      penaltyRecipient: challengerId,
      shouldBurn: true,
      burnReason,
    };
  } else {
    // Normal challenge resolution - move pile to penalty recipient
    const penaltyCards = [...state.tablePile];
    const newHands = new Map(state.hands);
    const recipientHand = newHands.get(result.penaltyRecipient) ?? [];
    newHands.set(result.penaltyRecipient, [...recipientHand, ...penaltyCards]);

    let newState: GameState = {
      ...state,
      hands: newHands,
      tablePile: [],
      // Reset claim history when pile is cleared (next claim starts fresh)
      claimHistory: [],
      lastPlay: null,
      phase: 'WAITING_FOR_PLAY',
    };

    // Determine next player
    if (!result.accusedContinues) {
      // Liar loses turn - advance to next player
      newState = advanceTurn(newState);
    }

    return {
      newState,
      wasLie: result.wasLie,
      revealedCards: cards,
      penaltyCardCount: penaltyCards.length,
      accusedContinues: result.accusedContinues,
      penaltyRecipient: result.penaltyRecipient,
      shouldBurn: false,
    };
  }
}

/**
 * Accept a claim (no challenge)
 */
export function acceptClaim(state: GameState): {
  newState: GameState;
  shouldBurn: boolean;
  burnReason?: string;
} {
  if (!state.lastPlay) {
    throw new Error('No last play');
  }

  const { playerId, claimRank, claimCount } = state.lastPlay;

  // Record claim as accepted
  const claimRecord = createClaimRecord(
    {
      playerId,
      rank: claimRank as Rank,
      count: claimCount,
      timestamp: Date.now(),
    },
    true // accepted
  );

  const newClaimHistory = [...state.claimHistory, claimRecord];

  // Check for burn
  const burnReason = checkBurn(claimRank as Rank, claimCount, newClaimHistory.slice(0, -1));

  if (burnReason) {
    const newState = executeBurn(state, burnReason, newClaimHistory);
    return {
      newState,
      shouldBurn: true,
      burnReason,
    };
  } else {
    const newState: GameState = {
      ...state,
      claimHistory: newClaimHistory,
      lastPlay: null,
      phase: 'WAITING_FOR_PLAY',
    };
    return {
      newState,
      shouldBurn: false,
    };
  }
}

