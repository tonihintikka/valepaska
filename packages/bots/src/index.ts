// Types
export type { BotConfig, CandidateMove, PlayerReputation } from './types.js';
export { BOT_PRESETS } from './types.js';

// Memory
export { BotMemory } from './memory.js';

// Move generation and scoring
export { generateCandidateMoves, selectBestMove } from './move-generator.js';
export { scoreMove, scoreMoves } from './move-scorer.js';

// Challenge evaluation
export { calculateSuspicionScore, shouldChallenge } from './challenge-evaluator.js';

// Main bot class
export { RuleBot } from './rule-bot.js';

