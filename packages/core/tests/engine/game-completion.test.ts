import { describe, it, expect } from 'vitest';
import {
  GameEngine,
  createBotPlayer,
  createPlayMove,
  type PlayerId,
  type PlayerObservation,
  type PlayMove,
  type Rank,
} from '../../src/index.js';

/**
 * Simple test bot that makes valid moves
 */
class SimpleBot {
  constructor(private playerId: PlayerId, private seed: number) {}

  chooseMove(observation: PlayerObservation): PlayMove {
    const hand = observation.hand;
    if (hand.length === 0) {
      throw new Error('Cannot play with empty hand');
    }

    // Pick first card and claim valid rank
    const cardToPlay = hand[0]!;
    const validRanks = observation.validClaimRanks;
    
    // Try to claim truthfully if possible, otherwise claim lowest valid rank
    let claimRank: Rank;
    if (validRanks.includes(cardToPlay.rank)) {
      claimRank = cardToPlay.rank;
    } else {
      claimRank = validRanks[0]!;
    }

    return createPlayMove(this.playerId, [cardToPlay.id], claimRank, 1);
  }

  shouldChallenge(_observation: PlayerObservation, _claimRank: Rank, _claimCount: number): boolean {
    // Simple bot never challenges
    return false;
  }

  onEvent(): void {
    // No-op
  }
}

/**
 * Simulation tests to verify game always completes correctly
 * These tests run full games with bots to ensure no freezing or infinite loops
 */
describe('Game Completion Simulation', () => {
  /**
   * Helper to run a full game with bots
   */
  function runFullGame(seed: number, playerCount: number = 4): {
    winnerId: PlayerId | null;
    standings: Array<{ playerId: PlayerId; position: number }>;
    totalTurns: number;
    finishedInOrder: boolean;
  } {
    const players = [];
    for (let i = 0; i < playerCount; i++) {
      players.push(createBotPlayer(`p${i + 1}`, `Bot ${i + 1}`, 'Normal'));
    }

    const engine = GameEngine.create(players, {}, seed);
    
    // Register simple test bots
    for (let i = 0; i < playerCount; i++) {
      const bot = new SimpleBot(`p${i + 1}`, seed + i);
      engine.registerBot(`p${i + 1}`, bot);
    }

    // Track finish order
    const finishOrder: PlayerId[] = [];
    engine.on('PLAYER_FINISHED', (e) => {
      finishOrder.push(e.playerId);
    });

    // Run to completion with max ticks to prevent infinite loop
    let totalTurns = 0;
    const maxTurns = 10000;
    
    while (engine.getState().phase !== 'GAME_OVER' && totalTurns < maxTurns) {
      engine.tick();
      totalTurns++;
    }

    const state = engine.getState();
    
    // Verify positions match finish order
    const finishedInOrder = finishOrder.every((playerId, index) => {
      const standing = state.standings.find(s => s.playerId === playerId);
      return standing?.position === index + 1;
    });

    return {
      winnerId: state.winnerId,
      standings: state.standings.map(s => ({ playerId: s.playerId, position: s.position })),
      totalTurns,
      finishedInOrder,
    };
  }

  describe('Full game simulations', () => {
    it('should complete a 3-player game', () => {
      const result = runFullGame(12345, 3);
      
      expect(result.winnerId).not.toBeNull();
      expect(result.standings).toHaveLength(3);
      expect(result.totalTurns).toBeLessThan(10000);
      expect(result.finishedInOrder).toBe(true);
      
      // Verify positions are 1, 2, 3
      const positions = result.standings.map(s => s.position).sort();
      expect(positions).toEqual([1, 2, 3]);
    });

    it('should complete a 4-player game', () => {
      const result = runFullGame(54321, 4);
      
      expect(result.winnerId).not.toBeNull();
      expect(result.standings).toHaveLength(4);
      expect(result.totalTurns).toBeLessThan(10000);
      expect(result.finishedInOrder).toBe(true);
      
      const positions = result.standings.map(s => s.position).sort();
      expect(positions).toEqual([1, 2, 3, 4]);
    });

    it('should complete a 5-player game', () => {
      const result = runFullGame(99999, 5);
      
      expect(result.winnerId).not.toBeNull();
      expect(result.standings).toHaveLength(5);
      expect(result.totalTurns).toBeLessThan(10000);
      expect(result.finishedInOrder).toBe(true);
      
      const positions = result.standings.map(s => s.position).sort();
      expect(positions).toEqual([1, 2, 3, 4, 5]);
    });

    it('should complete a 6-player game', () => {
      const result = runFullGame(11111, 6);
      
      expect(result.winnerId).not.toBeNull();
      expect(result.standings).toHaveLength(6);
      expect(result.totalTurns).toBeLessThan(10000);
      expect(result.finishedInOrder).toBe(true);
      
      const positions = result.standings.map(s => s.position).sort();
      expect(positions).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Multiple game simulation (stress test)', () => {
    it('should complete 100 games without freezing', () => {
      const results = [];
      
      for (let i = 0; i < 100; i++) {
        const seed = 10000 + i;
        const playerCount = 3 + (i % 4); // 3-6 players
        const result = runFullGame(seed, playerCount);
        results.push(result);
      }
      
      // All games should complete
      expect(results.every(r => r.winnerId !== null)).toBe(true);
      expect(results.every(r => r.totalTurns < 10000)).toBe(true);
      expect(results.every(r => r.finishedInOrder)).toBe(true);
      
      // All games should have proper standings
      results.forEach((r, i) => {
        const playerCount = 3 + (i % 4);
        expect(r.standings).toHaveLength(playerCount);
      });
    });
  });

  describe('Winner verification', () => {
    it('winner should be the first player to empty their hand', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const players = [
          createBotPlayer('p1', 'Bot 1', 'Normal'),
          createBotPlayer('p2', 'Bot 2', 'Normal'),
          createBotPlayer('p3', 'Bot 3', 'Normal'),
        ];

        const engine = GameEngine.create(players, {}, seed);
        
        for (let i = 1; i <= 3; i++) {
          const bot = new SimpleBot(`p${i}`, seed + i);
          engine.registerBot(`p${i}`, bot);
        }

        const firstFinisher: { playerId?: PlayerId } = {};
        engine.on('PLAYER_FINISHED', (e) => {
          if (e.position === 1) {
            firstFinisher.playerId = e.playerId;
          }
        });

        engine.runToCompletion();

        const state = engine.getState();
        expect(state.winnerId).toBe(firstFinisher.playerId);
        
        // Winner should have position 1
        const winnerStanding = state.standings.find(s => s.playerId === state.winnerId);
        expect(winnerStanding?.position).toBe(1);
      }
    });

    it('loser should be the last remaining player', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const players = [
          createBotPlayer('p1', 'Bot 1', 'Normal'),
          createBotPlayer('p2', 'Bot 2', 'Normal'),
          createBotPlayer('p3', 'Bot 3', 'Normal'),
        ];

        const engine = GameEngine.create(players, {}, seed);
        
        for (let i = 1; i <= 3; i++) {
          const bot = new SimpleBot(`p${i}`, seed + i);
          engine.registerBot(`p${i}`, bot);
        }

        engine.runToCompletion();

        const state = engine.getState();
        
        // Loser should have position 3 (last place) and score 0
        const loserStanding = state.standings.find(s => s.position === 3);
        expect(loserStanding).toBeDefined();
        expect(loserStanding?.score).toBe(0);
      }
    });
  });

  describe('Active players tracking', () => {
    it('finished players should not be in activePlayerIds', () => {
      const players = [
        createBotPlayer('p1', 'Bot 1', 'Normal'),
        createBotPlayer('p2', 'Bot 2', 'Normal'),
        createBotPlayer('p3', 'Bot 3', 'Normal'),
      ];

      const engine = GameEngine.create(players, {}, 12345);
      
      for (let i = 1; i <= 3; i++) {
        const bot = new SimpleBot(`p${i}`, 12345 + i);
        engine.registerBot(`p${i}`, bot);
      }

      engine.on('PLAYER_FINISHED', (e) => {
        const state = engine.getState();
        // Player who just finished should NOT be in activePlayerIds
        expect(state.activePlayerIds).not.toContain(e.playerId);
      });

      engine.runToCompletion();
      
      // At end of game, activePlayerIds should be empty or just have the loser
      const finalState = engine.getState();
      expect(finalState.activePlayerIds.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Current player validation', () => {
    it('current player should always be an active player during the game', () => {
      const players = [
        createBotPlayer('p1', 'Bot 1', 'Normal'),
        createBotPlayer('p2', 'Bot 2', 'Normal'),
        createBotPlayer('p3', 'Bot 3', 'Normal'),
        createBotPlayer('p4', 'Bot 4', 'Normal'),
      ];

      const engine = GameEngine.create(players, {}, 54321);
      
      for (let i = 1; i <= 4; i++) {
        const bot = new SimpleBot(`p${i}`, 54321 + i);
        engine.registerBot(`p${i}`, bot);
      }

      let violations = 0;
      let tickCount = 0;
      const maxTicks = 5000;

      while (engine.getState().phase !== 'GAME_OVER' && tickCount < maxTicks) {
        const state = engine.getState();
        
        // During the game, current player should be active
        if (state.phase === 'WAITING_FOR_PLAY') {
          const currentPlayer = engine.getCurrentPlayer();
          if (!state.activePlayerIds.includes(currentPlayer.id)) {
            violations++;
            console.log(`Violation at tick ${tickCount}: current player ${currentPlayer.id} not in active players ${state.activePlayerIds}`);
          }
        }
        
        engine.tick();
        tickCount++;
      }

      expect(violations).toBe(0);
    });
  });
});

