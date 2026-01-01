/**
 * Unique player identifier
 */
export type PlayerId = string;

/**
 * Player type
 */
export type PlayerType = 'human' | 'bot';

/**
 * Bot difficulty levels
 */
export type BotDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Pro';

/**
 * Player information
 */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly type: PlayerType;
  readonly difficulty?: BotDifficulty;
}

/**
 * Creates a human player
 */
export function createHumanPlayer(id: PlayerId, name: string): Player {
  return {
    id,
    name,
    type: 'human',
  };
}

/**
 * Creates a bot player
 */
export function createBotPlayer(id: PlayerId, name: string, difficulty: BotDifficulty): Player {
  return {
    id,
    name,
    type: 'bot',
    difficulty,
  };
}



