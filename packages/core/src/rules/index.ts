// Claim rules
export {
  type ClaimValidationResult,
  validateClaimRank,
  validateCardCount,
  validateCardsInHand,
  validatePlay,
  verifyClaimTruth,
  getLastAcceptedClaimRank,
  getValidClaimRanks,
  isValidClaimRank,
} from './claim-rules.js';

// Burn rules
export {
  checkBurn,
  checkFourInRow,
  countConsecutiveSameRank,
  claimsUntilFourInRow,
  isBurnRank,
} from './burn-rules.js';

// Challenge rules
export {
  type ChallengeResult,
  type ChallengeValidationResult,
  resolveChallenge,
  getPenaltyRecipient,
  validateChallenge,
  getChallengerPriorityOrder,
  selectChallenger,
} from './challenge-rules.js';

// Game rules
export {
  type PlayerCountValidation,
  checkWinCondition,
  calculateDrawCount,
  getNextPlayerIndex,
  getPlayerIndex,
  isPlayersTurn,
  validatePlayerCount,
  replenishHand,
  isEndgame,
  calculateFinalStandings,
} from './game-rules.js';

