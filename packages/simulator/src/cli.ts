import { Command } from 'commander';
import type { BotDifficulty } from '@valepaska/core';
import { runSimulation } from './runner.js';
import { formatResults, formatResultsJson } from './reporter.js';
import type { SimulationConfig } from './types.js';

const program = new Command();

program
  .name('valepaska-sim')
  .description('Valepaska card game simulator')
  .version('0.1.0');

program
  .option('-g, --games <number>', 'Number of games to simulate', '1000')
  .option('-p, --players <number>', 'Number of players (3-6)', '4')
  .option('-b, --bots <difficulties>', 'Bot difficulties (comma-separated: Easy,Normal,Hard,Pro)', 'Easy,Normal,Hard,Pro')
  .option('-s, --seed <number>', 'Random seed for reproducibility')
  .option('-v, --verbose', 'Show progress')
  .option('--json', 'Output results as JSON')
  .action((options) => {
    // Parse options
    const games = parseInt(options.games, 10);
    const players = parseInt(options.players, 10);
    const bots = parseBotDifficulties(options.bots);
    const seed = options.seed ? parseInt(options.seed, 10) : undefined;
    const verbose = !!options.verbose;
    const json = !!options.json;

    // Validate
    if (isNaN(games) || games < 1) {
      console.error('Error: games must be a positive number');
      process.exit(1);
    }

    if (isNaN(players) || players < 3 || players > 6) {
      console.error('Error: players must be between 3 and 6');
      process.exit(1);
    }

    if (bots.length === 0) {
      console.error('Error: at least one bot difficulty required');
      process.exit(1);
    }

    // Extend bots array to match player count
    while (bots.length < players) {
      bots.push(bots[bots.length % bots.length]!);
    }

    // Create config
    const config: SimulationConfig = {
      games,
      players,
      bots: bots.slice(0, players),
      seed,
      verbose,
    };

    // Run simulation
    if (verbose) {
      console.warn(`Starting simulation: ${games} games with ${players} players...`);
    }

    const results = runSimulation(config);

    // Output results
    if (json) {
      console.log(formatResultsJson(results));
    } else {
      console.log(formatResults(results));
    }
  });

/**
 * Parse bot difficulties from comma-separated string
 */
function parseBotDifficulties(input: string): BotDifficulty[] {
  const validDifficulties = new Set(['Easy', 'Normal', 'Hard', 'Pro']);
  const parts = input.split(',').map((s) => s.trim());
  const difficulties: BotDifficulty[] = [];

  for (const part of parts) {
    // Capitalize first letter
    const normalized = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    
    if (validDifficulties.has(normalized)) {
      difficulties.push(normalized as BotDifficulty);
    } else {
      console.warn(`Warning: Unknown difficulty "${part}", skipping`);
    }
  }

  return difficulties;
}

program.parse();



