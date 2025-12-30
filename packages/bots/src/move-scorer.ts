import type { PlayerObservation } from '@valepaska/core';
import type { BotConfig, CandidateMove } from './types.js';

/**
 * Score a candidate move
 */
export function scoreMove(
  move: CandidateMove,
  observation: PlayerObservation,
  config: BotConfig
): number {
  let score = 0;

  // Base score: more cards out is better
  score += move.cardIds.length * 2;

  // Honest moves are safer
  if (move.isHonest) {
    score += 3;
  } else {
    // Bluff penalty based on pile size risk
    score -= config.pileFearFactor * Math.log(1 + observation.tablePileSize);
  }

  // Burn moves are valuable (if honest or we're aggressive)
  // NEW RULES:
  // - 10 burns number cards (3-9) only
  // - A burns face cards (J, Q, K) only
  if (move.claimRank === '10' || move.claimRank === 'A') {
    // If this burn rank is in validClaimRanks, it means we CAN play it
    // (engine already validates 10 on numbers, A on faces)
    const pileBonus = Math.min(observation.tablePileSize * 0.5, 4);
    
    if (move.isHonest) {
      score += 5 + pileBonus; // Honest burn is great, especially big piles
    } else {
      score += 2 + pileBonus; // Bluff burn is risky but high reward on big piles
    }
  }
  
  // Strategic: reaching 7 enables face cards and eventual A burn
  // Encourage progression toward face card territory
  const lastRank = observation.lastClaimRank;
  if (lastRank && ['5', '6'].includes(lastRank) && move.claimRank === '7') {
    score += 2; // Reaching 7 opens up face cards → eventual A burn
  }
  
  // Strategic: on face cards (J, Q, K), A is valuable for burning
  if (lastRank && ['J', 'Q', 'K'].includes(lastRank) && move.claimRank === 'A') {
    if (move.isHonest) {
      score += 3; // A on face cards burns - very valuable
    }
  }

  // Four-in-row potential
  const consecutiveCount = countConsecutiveClaims(observation, move.claimRank);
  if (consecutiveCount >= 2) {
    score += (3 - consecutiveCount) * 1.5; // Closer to 4 = more valuable
  }

  // 2-card strategy: save 2s for endgame
  if (move.claimRank === '2') {
    if (observation.isEndgame) {
      // In endgame, 2 is VERY valuable - wildcard to empty hand
      score += 8;
    } else {
      // Before endgame, SAVE your 2s - penalize playing them
      // Only play if it's honest and we have multiple 2s
      const twosInHand = observation.hand.filter(c => c.rank === '2').length;
      if (move.isHonest && twosInHand >= 2) {
        score -= 2; // Small penalty, okay to play one if we have spares
      } else {
        score -= 5; // Big penalty - save your 2s!
      }
    }
  }

  // Endgame adjustments
  if (observation.isEndgame) {
    // Much higher value on getting cards out
    score += move.cardIds.length * config.endgameAggro * 3;

    // Penalize keeping cards
    const remainingCards = observation.hand.length - move.cardIds.length;
    if (remainingCards > 0) {
      score -= remainingCards * config.endgameAggro;
    }
  }

  return score;
}

/**
 * Score all candidate moves
 */
export function scoreMoves(
  candidates: CandidateMove[],
  observation: PlayerObservation,
  config: BotConfig
): CandidateMove[] {
  return candidates.map((move) => ({
    ...move,
    score: scoreMove(move, observation, config),
  }));
}

/**
 * Count consecutive claims of the same rank in history
 */
function countConsecutiveClaims(observation: PlayerObservation, rank: string): number {
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

