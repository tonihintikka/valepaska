import {
  GameEngine,
  createBotPlayer,
  type PlayerId,
  type BotDifficulty,
  type ChallengeResolvedEvent,
  type GameOverEvent,
} from '@valepaska/core';
import { RuleBot } from '@valepaska/bots';
import type { SimulationConfig, SimulationResults, PlayerStats } from './types.js';

/**
 * Run a simulation of multiple games
 */
export function runSimulation(config: SimulationConfig): SimulationResults {
  const startTime = Date.now();

  // Initialize stats
  const wins = new Map<PlayerId, number>();
  const playerDifficulties = new Map<PlayerId, BotDifficulty>();
  
  let totalRounds = 0;
  let totalChallenges = 0;
  let successfulChallenges = 0;

  // Create player IDs
  const playerIds: PlayerId[] = [];
  for (let i = 0; i < config.players; i++) {
    const id = `p${i + 1}`;
    playerIds.push(id);
    wins.set(id, 0);
    playerDifficulties.set(id, config.bots[i % config.bots.length]!);
  }

  // Run games
  for (let gameNum = 0; gameNum < config.games; gameNum++) {
    // Calculate seed for this game
    const gameSeed = config.seed !== undefined 
      ? config.seed + gameNum 
      : Date.now() + gameNum;

    // Create players
    const players = playerIds.map((id) => {
      const difficulty = playerDifficulties.get(id)!;
      return createBotPlayer(id, `Bot ${id}`, difficulty);
    });

    // Create game
    const engine = GameEngine.create(players, {}, gameSeed);

    // Track challenges
    let gameChallenges = 0;
    let gameSuccessfulChallenges = 0;

    engine.on<ChallengeResolvedEvent>('CHALLENGE_RESOLVED', (event) => {
      gameChallenges++;
      if (event.wasLie) {
        gameSuccessfulChallenges++;
      }
    });

    // Track game length
    let gameRounds = 0;
    engine.on<GameOverEvent>('GAME_OVER', (event) => {
      gameRounds = event.totalRounds;
      // Winner is now the first player in standings (position 1)
      // For backward compatibility, event.winnerId is still available
    });

    // Register bots
    for (const player of players) {
      const bot = new RuleBot(player.id, player.difficulty!, gameSeed + playerIds.indexOf(player.id));
      engine.registerBot(player.id, bot);
    }

    // Run game to completion
    const winner = engine.runToCompletion();

    // Record results
    if (winner) {
      wins.set(winner, (wins.get(winner) ?? 0) + 1);
    }

    totalRounds += gameRounds;
    totalChallenges += gameChallenges;
    successfulChallenges += gameSuccessfulChallenges;

    // Progress output
    if (config.verbose && (gameNum + 1) % 100 === 0) {
      console.warn(`Completed ${gameNum + 1}/${config.games} games`);
    }
  }

  const endTime = Date.now();

  // Calculate player stats
  const playerStats: PlayerStats[] = playerIds.map((id) => ({
    playerId: id,
    difficulty: playerDifficulties.get(id)!,
    wins: wins.get(id) ?? 0,
    totalGames: config.games,
    winRate: (wins.get(id) ?? 0) / config.games,
  }));

  return {
    totalGames: config.games,
    playerCount: config.players,
    durationMs: endTime - startTime,
    playerStats,
    averageGameLength: totalRounds / config.games,
    averageChallengesPerGame: totalChallenges / config.games,
    totalChallenges,
    successfulChallenges,
    ...(config.seed !== undefined && { seed: config.seed }),
  };
}

