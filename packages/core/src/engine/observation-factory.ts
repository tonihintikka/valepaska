import type { Rank } from '../types/card.js';
import type { ClaimRecord } from '../types/claim.js';
import type { GameState } from '../types/game-state.js';
import type { PlayerObservation } from '../types/observation.js';
import type { PlayerId } from '../types/player.js';
import { getValidClaimRanks } from '../rules/claim-rules.js';

/**
 * Creates a player observation from the full game state
 * This filters out hidden information that the player shouldn't see
 */
export function createObservation(
  state: GameState,
  playerId: PlayerId
): PlayerObservation {
  // Get player's hand
  const hand = state.hands.get(playerId) ?? [];

  // Get other players' hand sizes (not contents!)
  const otherHandSizes = new Map<PlayerId, number>();
  for (const [pid, cards] of state.hands) {
    if (pid !== playerId) {
      otherHandSizes.set(pid, cards.length);
    }
  }

  // Get last accepted claim rank for valid ranks calculation
  const lastAcceptedClaimRank = getLastAcceptedClaimRank(state.claimHistory);

  // Get valid claim ranks
  const validClaimRanks = getValidClaimRanks(lastAcceptedClaimRank);

  // Get last claim
  const lastClaim = state.claimHistory.length > 0 
    ? state.claimHistory[state.claimHistory.length - 1] ?? null
    : null;

  // Get player order
  const playerOrder = state.players.map((p) => p.id);

  // Current player
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer) {
    throw new Error('Invalid current player index');
  }

  return {
    playerId,
    hand,
    otherHandSizes,
    drawPileSize: state.drawPile.length,
    tablePileSize: state.tablePile.length,
    claimHistory: state.claimHistory,
    lastClaim,
    validClaimRanks,
    isEndgame: state.drawPile.length === 0,
    currentPlayerId: currentPlayer.id,
    isMyTurn: currentPlayer.id === playerId,
    phase: state.phase,
    playerOrder,
    roundNumber: state.roundNumber,
  };
}

/**
 * Helper to get last accepted claim rank from history
 */
function getLastAcceptedClaimRank(history: readonly ClaimRecord[]): Rank | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const claim = history[i];
    if (claim?.accepted) {
      return claim.rank;
    }
  }
  return null;
}

