import type { Card, Rank, PlayerObservation } from '@valepaska/core';
import { groupCardsByRank } from '@valepaska/core';
import type { BotConfig, CandidateMove } from './types.js';
import type { SeededRng } from '@valepaska/core';

/**
 * Generate candidate moves for the bot to evaluate
 */
export function generateCandidateMoves(
  observation: PlayerObservation,
  config: BotConfig,
  rng: SeededRng
): CandidateMove[] {
  const candidates: CandidateMove[] = [];
  const handByRank = groupCardsByRank(observation.hand);

  // Generate honest moves
  const honestMoves = generateHonestMoves(observation, handByRank, config);
  candidates.push(...honestMoves);

  // Generate bluff moves based on bluffRate or if no honest moves available
  if (rng.chance(config.bluffRate) || candidates.length === 0) {
    const bluffMoves = generateBluffMoves(observation, handByRank, config);
    candidates.push(...bluffMoves);
  }

  // Generate burn bluffs for large piles
  if (observation.tablePileSize >= 5 && rng.chance(config.burnBluffRate)) {
    const burnBluffs = generateBurnBluffs(observation, handByRank, config);
    candidates.push(...burnBluffs);
  }

  // Fallback: if still no candidates, generate a forced bluff
  if (candidates.length === 0 && observation.hand.length > 0 && observation.validClaimRanks.length > 0) {
    const card = observation.hand[0]!;
    const rank = observation.validClaimRanks[0]!;
    candidates.push({
      cardIds: [card.id],
      claimRank: rank,
      claimCount: 1,
      isHonest: card.rank === rank,
      score: 0,
    });
  }

  return candidates;
}

/**
 * Generate honest moves (cards match claimed rank)
 */
function generateHonestMoves(
  observation: PlayerObservation,
  handByRank: Map<Rank, Card[]>,
  config: BotConfig
): CandidateMove[] {
  const moves: CandidateMove[] = [];

  for (const validRank of observation.validClaimRanks) {
    const cards = handByRank.get(validRank);
    if (!cards || cards.length === 0) continue;

    // Generate moves with 1 to min(available, maxCards) cards
    const maxCards = Math.min(cards.length, config.maxCardsToPlay);
    
    for (let count = 1; count <= maxCards; count++) {
      const cardIds = cards.slice(0, count).map((c) => c.id);
      moves.push({
        cardIds,
        claimRank: validRank,
        claimCount: count,
        isHonest: true,
        score: 0, // Will be scored later
      });
    }
  }

  return moves;
}

/**
 * Generate bluff moves (cards don't match claimed rank)
 */
function generateBluffMoves(
  observation: PlayerObservation,
  handByRank: Map<Rank, Card[]>,
  config: BotConfig
): CandidateMove[] {
  const moves: CandidateMove[] = [];
  const validRanks = new Set(observation.validClaimRanks);

  // Find cards that don't match any valid rank OR cards we want to get rid of
  const bluffCards = observation.hand.filter((c) => !validRanks.has(c.rank));
  
  // If no obvious bad cards, use any cards
  const cardsToUse = bluffCards.length > 0 ? bluffCards : [...observation.hand];
  if (cardsToUse.length === 0) return moves;

  // Bluff with 1-2 cards, claiming a valid rank we don't have
  for (const claimRank of observation.validClaimRanks.slice(0, 3)) {
    // Prefer ranks we don't have for bluffing
    const hasRank = (handByRank.get(claimRank)?.length ?? 0) > 0;
    if (hasRank) continue; // Skip ranks we have (would be honest)

    for (let count = 1; count <= Math.min(2, cardsToUse.length, config.maxCardsToPlay); count++) {
      const cardIds = cardsToUse.slice(0, count).map((c) => c.id);
      moves.push({
        cardIds,
        claimRank,
        claimCount: count,
        isHonest: false,
        score: 0,
      });
    }
    
    if (moves.length >= 4) break; // Limit bluff candidates
  }

  return moves;
}

/**
 * Generate burn bluff moves (claiming 10 or A with wrong cards)
 */
function generateBurnBluffs(
  observation: PlayerObservation,
  handByRank: Map<Rank, Card[]>,
  config: BotConfig
): CandidateMove[] {
  const moves: CandidateMove[] = [];
  const burnRanks: Rank[] = ['10', 'A'];
  const validRanksSet = new Set(observation.validClaimRanks);

  for (const burnRank of burnRanks) {
    if (!validRanksSet.has(burnRank)) continue;

    // Check if we have cards of this rank (would be honest)
    const hasHonest = (handByRank.get(burnRank)?.length ?? 0) > 0;
    if (hasHonest) continue; // Skip, honest move exists

    // Use any cards for the bluff
    const bluffCards = observation.hand.slice(0, Math.min(2, config.maxCardsToPlay));
    if (bluffCards.length === 0) continue;

    moves.push({
      cardIds: bluffCards.map((c) => c.id),
      claimRank: burnRank,
      claimCount: bluffCards.length,
      isHonest: false,
      score: 0,
    });
  }

  return moves;
}

/**
 * Select the best move from candidates
 */
export function selectBestMove(candidates: CandidateMove[]): CandidateMove | null {
  if (candidates.length === 0) return null;

  // Sort by score descending
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return sorted[0] ?? null;
}

