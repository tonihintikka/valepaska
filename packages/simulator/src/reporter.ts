import type { SimulationResults } from './types.js';

/**
 * Format simulation results for console output
 */
export function formatResults(results: SimulationResults): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('=== Valepaska Simulation Results ===');
  lines.push(`Games: ${results.totalGames.toLocaleString()} | Players: ${results.playerCount} | Duration: ${formatDuration(results.durationMs)}`);
  
  if (results.seed !== undefined) {
    lines.push(`Seed: ${results.seed}`);
  }
  
  lines.push('');
  lines.push('Win Rates:');

  // Sort by win rate descending
  const sortedStats = [...results.playerStats].sort((a, b) => b.winRate - a.winRate);

  for (const stats of sortedStats) {
    const winPercent = (stats.winRate * 100).toFixed(1);
    const paddedDifficulty = stats.difficulty.padEnd(6);
    const paddedWins = stats.wins.toLocaleString().padStart(6);
    lines.push(`  ${paddedDifficulty} (${stats.playerId}): ${winPercent.padStart(5)}%  (${paddedWins} wins)`);
  }

  lines.push('');
  lines.push('Game Statistics:');
  lines.push(`  Average Game Length: ${results.averageGameLength.toFixed(1)} rounds`);
  lines.push(`  Average Challenges/Game: ${results.averageChallengesPerGame.toFixed(1)}`);
  
  const bluffSuccessRate = results.totalChallenges > 0
    ? ((results.totalChallenges - results.successfulChallenges) / results.totalChallenges * 100).toFixed(1)
    : 'N/A';
  lines.push(`  Bluff Success Rate: ${bluffSuccessRate}%`);
  
  lines.push('');

  return lines.join('\n');
}

/**
 * Format JSON results
 */
export function formatResultsJson(results: SimulationResults): string {
  return JSON.stringify(results, null, 2);
}

/**
 * Format duration in human readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(0);
  return `${minutes}m ${remainingSeconds}s`;
}




