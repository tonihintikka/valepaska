import { describe, it, expect } from 'vitest';
import { runSimulation } from '../src/runner.js';
import { formatResults } from '../src/reporter.js';
import type { SimulationConfig } from '../src/types.js';

describe('Simulator', () => {
  describe('runSimulation', () => {
    it('should run a single game', () => {
      const config: SimulationConfig = {
        games: 1,
        players: 4,
        bots: ['Easy', 'Normal', 'Hard', 'Pro'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);

      expect(results.totalGames).toBe(1);
      expect(results.playerCount).toBe(4);
      expect(results.playerStats).toHaveLength(4);
      
      // Exactly one player should have won
      const totalWins = results.playerStats.reduce((sum, p) => sum + p.wins, 0);
      expect(totalWins).toBe(1);
    });

    it('should run multiple games', () => {
      const config: SimulationConfig = {
        games: 10,
        players: 4,
        bots: ['Easy', 'Normal', 'Hard', 'Pro'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);

      expect(results.totalGames).toBe(10);
      
      const totalWins = results.playerStats.reduce((sum, p) => sum + p.wins, 0);
      expect(totalWins).toBe(10);
    });

    it('should be deterministic with same seed', () => {
      const config: SimulationConfig = {
        games: 10,
        players: 4,
        bots: ['Easy', 'Normal', 'Hard', 'Pro'],
        seed: 42,
        verbose: false,
      };

      const results1 = runSimulation(config);
      const results2 = runSimulation(config);

      expect(results1.playerStats.map((p) => p.wins))
        .toEqual(results2.playerStats.map((p) => p.wins));
    });

    it('should produce different results with different seeds', () => {
      const config1: SimulationConfig = {
        games: 50,
        players: 4,
        bots: ['Pro', 'Pro', 'Pro', 'Pro'],
        seed: 42,
        verbose: false,
      };

      const config2: SimulationConfig = {
        ...config1,
        seed: 99,
      };

      const results1 = runSimulation(config1);
      const results2 = runSimulation(config2);

      // With enough games and same bots, results should usually differ
      // (this is probabilistic, but with different seeds it's very likely)
      const wins1 = results1.playerStats.map((p) => p.wins).join(',');
      const wins2 = results2.playerStats.map((p) => p.wins).join(',');
      
      // Note: There's a small chance this could fail due to randomness
      // but it's very unlikely with 50 games
      expect(wins1).not.toBe(wins2);
    });

    it('should work with 3 players', () => {
      const config: SimulationConfig = {
        games: 5,
        players: 3,
        bots: ['Easy', 'Normal', 'Hard'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);

      expect(results.playerCount).toBe(3);
      expect(results.playerStats).toHaveLength(3);
    });

    it('should work with 6 players', () => {
      const config: SimulationConfig = {
        games: 5,
        players: 6,
        bots: ['Easy', 'Easy', 'Normal', 'Normal', 'Hard', 'Pro'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);

      expect(results.playerCount).toBe(6);
      expect(results.playerStats).toHaveLength(6);
    });

    it('should track challenge statistics', () => {
      const config: SimulationConfig = {
        games: 20,
        players: 4,
        bots: ['Easy', 'Normal', 'Hard', 'Pro'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);

      expect(results.totalChallenges).toBeGreaterThanOrEqual(0);
      expect(results.successfulChallenges).toBeLessThanOrEqual(results.totalChallenges);
      expect(results.averageChallengesPerGame).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatResults', () => {
    it('should format results as readable string', () => {
      const config: SimulationConfig = {
        games: 100,
        players: 4,
        bots: ['Easy', 'Normal', 'Hard', 'Pro'],
        seed: 12345,
        verbose: false,
      };

      const results = runSimulation(config);
      const formatted = formatResults(results);

      expect(formatted).toContain('Valepaska Simulation Results');
      expect(formatted).toContain('Win Rates');
      expect(formatted).toContain('Easy');
      expect(formatted).toContain('Normal');
      expect(formatted).toContain('Hard');
      expect(formatted).toContain('Pro');
      expect(formatted).toContain('Game Statistics');
    });
  });
});




