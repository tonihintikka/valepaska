import type { BotDifficulty, PlayerId } from '@valepaska/core';

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  /** Number of games to simulate */
  games: number;

  /** Number of players */
  players: number;

  /** Bot difficulties for each player */
  bots: BotDifficulty[];

  /** Random seed (optional, for reproducibility) */
  seed?: number;

  /** Whether to show progress */
  verbose: boolean;
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  games: 1000,
  players: 4,
  bots: ['Easy', 'Normal', 'Hard', 'Pro'],
  verbose: false,
};

/**
 * Statistics for a single player
 */
export interface PlayerStats {
  playerId: PlayerId;
  difficulty: BotDifficulty;
  wins: number;
  totalGames: number;
  winRate: number;
}

/**
 * Simulation results
 */
export interface SimulationResults {
  /** Total games played */
  totalGames: number;

  /** Number of players */
  playerCount: number;

  /** Duration in milliseconds */
  durationMs: number;

  /** Statistics per player */
  playerStats: PlayerStats[];

  /** Average game length in rounds */
  averageGameLength: number;

  /** Average challenges per game */
  averageChallengesPerGame: number;

  /** Total challenges */
  totalChallenges: number;

  /** Successful challenges (caught a lie) */
  successfulChallenges: number;

  /** Seed used (if deterministic) */
  seed?: number;
}



