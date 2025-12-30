import type { PlayerObservation, Rank, PlayerId } from '@valepaska/core';
import { countCardsOfRank } from '@valepaska/core';
import type { BotConfig } from './types.js';
import type { BotMemory } from './memory.js';

/**
 * Calculate suspicion score for a claim
 */
export function calculateSuspicionScore(
  observation: PlayerObservation,
  claimRank: Rank,
  claimCount: number,
  accusedId: PlayerId,
  config: BotConfig,
  memory: BotMemory
): number {
  let score = 0;

  // Check if we hold all cards of the claimed rank
  const myCardsOfRank = countCardsOfRank(observation.hand, claimRank);
  if (myCardsOfRank >= 4) {
    return Infinity; // Guaranteed lie - we have all 4
  }

  // High suspicion for claims that exceed possible cards
  const maxPossible = 4 - myCardsOfRank;
  if (claimCount > maxPossible) {
    return Infinity; // Impossible claim
  }
  
  // If we have 3+ cards of claimed rank, very suspicious
  if (myCardsOfRank >= 3 && claimCount >= 2) {
    score += 5.0; // Very likely a lie
  } else if (myCardsOfRank >= 2 && claimCount >= 3) {
    score += 4.0; // Probably a lie
  }

  // Burn rank suspicion (10, A)
  if (claimRank === '10' || claimRank === 'A') {
    score += 2.0;
  }

  // High count claims are suspicious
  if (claimCount >= 3) {
    score += 0.6;
  } else if (claimCount === 2) {
    score += 0.2;
  }

  // Four-in-row trigger suspicion
  const consecutiveCount = countConsecutiveClaimsOfRank(observation, claimRank);
  if (consecutiveCount >= 2) {
    score += 1.5; // Claim would trigger or approach burn
  }

  // Player reputation
  const lieRate = memory.getLieRate(accusedId);
  score += lieRate * 2.0;

  // Endgame aggression
  if (observation.isEndgame) {
    const accusedHandSize = observation.otherHandSizes.get(accusedId) ?? 5;
    if (accusedHandSize <= 2) {
      // Very suspicious if they're about to win
      score += config.endgameAggro * (3 - accusedHandSize);
    }
  }

  // Pile fear (reduce willingness to challenge big piles)
  score -= config.pileFearFactor * Math.log(1 + observation.tablePileSize);

  // If we're winning (small hand), be more conservative
  if (!observation.isEndgame) {
    const myHandSize = observation.hand.length;
    const avgOtherHandSize = calculateAverageOtherHandSize(observation);
    if (myHandSize < avgOtherHandSize - 2) {
      score -= 0.5; // We're ahead, don't risk it
    }
  }

  return score;
}

/**
 * Decide whether to challenge based on suspicion score
 */
export function shouldChallenge(
  observation: PlayerObservation,
  claimRank: Rank,
  claimCount: number,
  accusedId: PlayerId,
  config: BotConfig,
  memory: BotMemory
): boolean {
  const suspicionScore = calculateSuspicionScore(
    observation,
    claimRank,
    claimCount,
    accusedId,
    config,
    memory
  );

  // Always challenge if guaranteed lie
  if (!isFinite(suspicionScore)) {
    return true;
  }

  // Dynamic threshold adjustment in endgame
  let threshold = config.challengeThreshold;
  if (observation.isEndgame) {
    const accusedHandSize = observation.otherHandSizes.get(accusedId) ?? 5;
    if (accusedHandSize <= 2) {
      // Lower threshold when opponent is about to win
      threshold -= config.endgameAggro * 0.5;
    }
  }

  return suspicionScore >= threshold;
}

/**
 * Count consecutive claims of the same rank
 */
function countConsecutiveClaimsOfRank(observation: PlayerObservation, rank: Rank): number {
  let count = 0;
  
  for (let i = observation.claimHistory.length - 1; i >= 0; i--) {
    const claim = observation.claimHistory[i];
    if (claim?.accepted && claim.rank === rank) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

/**
 * Calculate average hand size of other players
 */
function calculateAverageOtherHandSize(observation: PlayerObservation): number {
  const sizes = Array.from(observation.otherHandSizes.values());
  if (sizes.length === 0) return 5;
  return sizes.reduce((a, b) => a + b, 0) / sizes.length;
}

