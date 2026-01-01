import { describe, it, expect, beforeEach } from 'vitest';
import {
  GameEngine,
  createHumanPlayer,
  createPlayMove,
  type GameState,
  type Card,
  type Rank,
} from '../../src/index.js';

/**
 * Tests for player finishing scenarios
 * Verifies that the game correctly handles when players empty their hands
 */
describe('Player Finish Scenarios', () => {
  /**
   * Helper to create a game with specific hands for testing
   */
  function createTestGame(
    hands: Map<string, Card[]>,
    drawPile: Card[] = [],
    currentPlayerIndex: number = 0
  ): GameEngine {
    const playerIds = Array.from(hands.keys());
    const players = playerIds.map(id => createHumanPlayer(id, `Player ${id}`));
    
    const engine = GameEngine.create(players, {}, 12345);
    
    // Access private state to set up test scenario
    const state = engine.getState();
    const newState: GameState = {
      ...state,
      hands,
      drawPile,
      currentPlayerIndex,
      activePlayerIds: playerIds,
    };
    
    // Use reflection to set state (for testing only)
    (engine as unknown as { state: GameState }).state = newState;
    
    return engine;
  }

  /**
   * Helper to create a card
   */
  function card(rank: Rank, suit: 'H' | 'D' | 'C' | 'S', id?: string): Card {
    const suitMap = { H: 'hearts', D: 'diamonds', C: 'clubs', S: 'spades' } as const;
    return {
      id: id ?? `${rank}-${suit}`,
      rank,
      suit: suitMap[suit],
    };
  }

  describe('Normal finish (no burn, no challenge)', () => {
    it('player finishes when they play their last card and draw pile is empty', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('7', 'H')]],  // p1 has only 1 card
        ['p2', [card('8', 'D'), card('9', 'C')]],
        ['p3', [card('K', 'S'), card('A', 'H')]],
      ]);
      
      const engine = createTestGame(hands, []); // Empty draw pile
      
      // Track events
      const finishedEvents: Array<{ playerId: string; position: number }> = [];
      const turnEvents: Array<{ previousPlayerId: string; currentPlayerId: string }> = [];
      
      engine.on('PLAYER_FINISHED', (e) => finishedEvents.push({ playerId: e.playerId, position: e.position }));
      engine.on('TURN_ADVANCED', (e) => turnEvents.push({ previousPlayerId: e.previousPlayerId, currentPlayerId: e.currentPlayerId }));
      
      // p1 plays their last card
      const move = createPlayMove('p1', ['7-H'], '7', 1);
      engine.submitMove('p1', move);
      
      // Process challenges (no one challenges)
      engine.processChallenges();
      
      // Verify p1 finished
      expect(finishedEvents).toHaveLength(1);
      expect(finishedEvents[0]).toEqual({ playerId: 'p1', position: 1 });
      
      // Verify p1 is no longer active
      const state = engine.getState();
      expect(state.activePlayerIds).not.toContain('p1');
      expect(state.activePlayerIds).toContain('p2');
      expect(state.activePlayerIds).toContain('p3');
      
      // Verify turn advanced to next player
      expect(turnEvents.length).toBeGreaterThanOrEqual(1);
      const lastTurn = turnEvents[turnEvents.length - 1]!;
      expect(lastTurn.currentPlayerId).not.toBe('p1');
    });

    it('finished player cannot be the current player', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('7', 'H')]],
        ['p2', [card('8', 'D'), card('9', 'C')]],
        ['p3', [card('K', 'S'), card('A', 'H')]],
      ]);
      
      const engine = createTestGame(hands, []);
      
      // p1 plays their last card
      const move = createPlayMove('p1', ['7-H'], '7', 1);
      engine.submitMove('p1', move);
      engine.processChallenges();
      
      // Current player should NOT be p1
      const currentPlayer = engine.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('p1');
    });
  });

  describe('Finish after burn', () => {
    it('player finishes after burning pile with their last card (10)', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('10', 'H')]],  // p1 has only a 10
        ['p2', [card('8', 'D'), card('9', 'C')]],
        ['p3', [card('K', 'S'), card('A', 'H')]],
      ]);
      
      const engine = createTestGame(hands, []);
      
      const finishedEvents: Array<{ playerId: string; position: number }> = [];
      const burnEvents: string[] = [];
      
      engine.on('PLAYER_FINISHED', (e) => finishedEvents.push({ playerId: e.playerId, position: e.position }));
      engine.on('PILE_BURNED', () => burnEvents.push('burn'));
      
      // p1 plays 10 (burns pile)
      const move = createPlayMove('p1', ['10-H'], '10', 1);
      engine.submitMove('p1', move);
      engine.processChallenges();
      
      // Verify burn happened
      expect(burnEvents).toHaveLength(1);
      
      // Verify p1 finished
      expect(finishedEvents).toHaveLength(1);
      expect(finishedEvents[0]).toEqual({ playerId: 'p1', position: 1 });
      
      // Verify p1 is not active and not current player
      const state = engine.getState();
      expect(state.activePlayerIds).not.toContain('p1');
      
      const currentPlayer = engine.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('p1');
    });

    it('player finishes after burning pile with Ace', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('A', 'H')]],  // p1 has only an Ace
        ['p2', [card('8', 'D'), card('9', 'C')]],
        ['p3', [card('K', 'S'), card('Q', 'H')]],
      ]);
      
      const engine = createTestGame(hands, []);
      
      const finishedEvents: Array<{ playerId: string }> = [];
      
      engine.on('PLAYER_FINISHED', (e) => finishedEvents.push({ playerId: e.playerId }));
      
      // p1 plays Ace (burns pile)
      const move = createPlayMove('p1', ['A-H'], 'A', 1);
      engine.submitMove('p1', move);
      engine.processChallenges();
      
      // Verify p1 finished and is not current player
      expect(finishedEvents).toHaveLength(1);
      
      const currentPlayer = engine.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('p1');
    });
  });

  describe('Finish after false challenge', () => {
    it('player finishes when falsely challenged on their last truthful play', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('7', 'H')]],  // p1 has only a 7
        ['p2', [card('8', 'D'), card('9', 'C')]],
        ['p3', [card('K', 'S'), card('A', 'H')]],
      ]);
      
      const engine = createTestGame(hands, []);
      
      const finishedEvents: Array<{ playerId: string }> = [];
      const challengeEvents: Array<{ wasLie: boolean }> = [];
      
      engine.on('PLAYER_FINISHED', (e) => finishedEvents.push({ playerId: e.playerId }));
      engine.on('CHALLENGE_RESOLVED', (e) => challengeEvents.push({ wasLie: e.wasLie }));
      
      // p1 plays their 7 truthfully
      const move = createPlayMove('p1', ['7-H'], '7', 1);
      engine.submitMove('p1', move);
      
      // p2 challenges (incorrectly - p1 was telling the truth)
      engine.submitChallengeDecision('p2', true);
      engine.processChallenges();
      
      // Verify challenge was false (p1 was NOT lying)
      expect(challengeEvents).toHaveLength(1);
      expect(challengeEvents[0]!.wasLie).toBe(false);
      
      // Verify p1 finished
      expect(finishedEvents).toHaveLength(1);
      expect(finishedEvents[0]!.playerId).toBe('p1');
      
      // Verify p1 is not current player
      const currentPlayer = engine.getCurrentPlayer();
      expect(currentPlayer.id).not.toBe('p1');
    });
  });

  describe('Game continues after first player finishes', () => {
    it('game continues until only one player remains', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('7', 'H')]],
        ['p2', [card('8', 'D')]],
        ['p3', [card('K', 'S'), card('A', 'H'), card('Q', 'C')]],  // p3 has most cards
      ]);
      
      const engine = createTestGame(hands, []);
      
      const finishedEvents: Array<{ playerId: string; position: number }> = [];
      let gameOverFired = false;
      
      engine.on('PLAYER_FINISHED', (e) => finishedEvents.push({ playerId: e.playerId, position: e.position }));
      engine.on('GAME_OVER', () => { gameOverFired = true; });
      
      // p1 plays and finishes (1st place)
      engine.submitMove('p1', createPlayMove('p1', ['7-H'], '7', 1));
      engine.processChallenges();
      
      expect(finishedEvents).toHaveLength(1);
      expect(finishedEvents[0]).toEqual({ playerId: 'p1', position: 1 });
      expect(gameOverFired).toBe(false);  // Game should NOT be over yet
      
      // p2 plays and finishes (2nd place)
      engine.submitMove('p2', createPlayMove('p2', ['8-D'], '8', 1));
      engine.processChallenges();
      
      // When p2 finishes, only p3 remains -> p3 automatically becomes loser (position 3)
      // So we get 3 PLAYER_FINISHED events total
      expect(finishedEvents).toHaveLength(3);
      expect(finishedEvents[1]).toEqual({ playerId: 'p2', position: 2 });
      expect(finishedEvents[2]).toEqual({ playerId: 'p3', position: 3 });  // Loser
      
      // Now game should be over (only p3 left = loser)
      expect(gameOverFired).toBe(true);
      
      const state = engine.getState();
      expect(state.phase).toBe('GAME_OVER');
      expect(state.standings).toHaveLength(3);
    });
  });

  describe('Turn order after finish', () => {
    it('turn correctly skips finished players', () => {
      // Use cards that allow valid claim progression: 3 -> 4 -> 5 -> 6 -> 7 -> ...
      const hands = new Map<string, Card[]>([
        ['p1', [card('3', 'H')]],
        ['p2', [card('4', 'D'), card('8', 'C')]],
        ['p3', [card('5', 'S'), card('9', 'H')]],
        ['p4', [card('6', 'D'), card('10', 'C')]],
      ]);
      
      const engine = createTestGame(hands, [], 0);  // p1 starts
      
      const turnOrder: string[] = [];
      engine.on('TURN_ADVANCED', (e) => turnOrder.push(e.currentPlayerId));
      
      // p1 plays 3 and finishes
      engine.submitMove('p1', createPlayMove('p1', ['3-H'], '3', 1));
      engine.processChallenges();
      
      // Turn should go to p2
      expect(engine.getCurrentPlayer().id).toBe('p2');
      
      // p2 plays 4 (doesn't finish, still has 8)
      engine.submitMove('p2', createPlayMove('p2', ['4-D'], '4', 1));
      engine.processChallenges();
      
      // Turn should go to p3 (skipping p1 who finished)
      expect(engine.getCurrentPlayer().id).toBe('p3');
      
      // p3 plays 5
      engine.submitMove('p3', createPlayMove('p3', ['5-S'], '5', 1));
      engine.processChallenges();
      
      // Turn should go to p4 (skipping p1)
      expect(engine.getCurrentPlayer().id).toBe('p4');
      
      // p4 plays 6
      engine.submitMove('p4', createPlayMove('p4', ['6-D'], '6', 1));
      engine.processChallenges();
      
      // Turn should go back to p2 (skipping p1 who finished)
      expect(engine.getCurrentPlayer().id).toBe('p2');
    });
  });

  describe('Standings and scores', () => {
    it('players get correct positions based on finish order', () => {
      const hands = new Map<string, Card[]>([
        ['p1', [card('7', 'H')]],
        ['p2', [card('8', 'D')]],
        ['p3', [card('K', 'S')]],
      ]);
      
      const engine = createTestGame(hands, []);
      
      // p1 finishes first
      engine.submitMove('p1', createPlayMove('p1', ['7-H'], '7', 1));
      engine.processChallenges();
      
      // p2 finishes second (current player should be p2 now)
      engine.submitMove('p2', createPlayMove('p2', ['8-D'], '8', 1));
      engine.processChallenges();
      
      // Game over - p3 is last
      const state = engine.getState();
      expect(state.standings).toHaveLength(3);
      
      const p1Standing = state.standings.find(s => s.playerId === 'p1');
      const p2Standing = state.standings.find(s => s.playerId === 'p2');
      const p3Standing = state.standings.find(s => s.playerId === 'p3');
      
      expect(p1Standing?.position).toBe(1);  // 1st place
      expect(p2Standing?.position).toBe(2);  // 2nd place
      expect(p3Standing?.position).toBe(3);  // 3rd place (loser)
      
      // Scores: 1st gets 200, 2nd gets 100, last gets 0
      expect(p1Standing?.score).toBe(200);
      expect(p2Standing?.score).toBe(100);
      expect(p3Standing?.score).toBe(0);
    });
  });
});

describe('Edge cases', () => {
  function card(rank: Rank, suit: 'H' | 'D' | 'C' | 'S', id?: string): Card {
    const suitMap = { H: 'hearts', D: 'diamonds', C: 'clubs', S: 'spades' } as const;
    return {
      id: id ?? `${rank}-${suit}`,
      rank,
      suit: suitMap[suit],
    };
  }

  it('cannot finish while draw pile has cards', () => {
    const hands = new Map<string, Card[]>([
      ['p1', [card('7', 'H')]],
      ['p2', [card('8', 'D'), card('9', 'C')]],
      ['p3', [card('K', 'S'), card('A', 'H')]],
    ]);
    
    // Draw pile has cards - player cannot finish
    const drawPile = [card('3', 'H'), card('4', 'D')];
    
    const players = ['p1', 'p2', 'p3'].map(id => createHumanPlayer(id, `Player ${id}`));
    const engine = GameEngine.create(players, {}, 12345);
    
    // Set up state
    const state = engine.getState();
    (engine as unknown as { state: GameState }).state = {
      ...state,
      hands,
      drawPile,
      currentPlayerIndex: 0,
      activePlayerIds: ['p1', 'p2', 'p3'],
    };
    
    const finishedEvents: string[] = [];
    engine.on('PLAYER_FINISHED', () => finishedEvents.push('finished'));
    
    // p1 plays their last card
    engine.submitMove('p1', createPlayMove('p1', ['7-H'], '7', 1));
    engine.processChallenges();
    
    // p1 should NOT have finished (draw pile has cards)
    expect(finishedEvents).toHaveLength(0);
    
    // p1 should have drawn new cards
    const newState = engine.getState();
    const p1Hand = newState.hands.get('p1');
    expect(p1Hand?.length).toBeGreaterThan(0);
  });

  it('caught liar cannot finish on that play', () => {
    const hands = new Map<string, Card[]>([
      ['p1', [card('7', 'H')]],  // p1 has 7 but will claim 8 (lie)
      ['p2', [card('8', 'D'), card('9', 'C')]],
      ['p3', [card('K', 'S'), card('A', 'H')]],
    ]);
    
    const players = ['p1', 'p2', 'p3'].map(id => createHumanPlayer(id, `Player ${id}`));
    const engine = GameEngine.create(players, {}, 12345);
    
    (engine as unknown as { state: GameState }).state = {
      ...engine.getState(),
      hands,
      drawPile: [],
      currentPlayerIndex: 0,
      activePlayerIds: ['p1', 'p2', 'p3'],
    };
    
    const finishedEvents: string[] = [];
    const challengeEvents: Array<{ wasLie: boolean }> = [];
    
    engine.on('PLAYER_FINISHED', () => finishedEvents.push('finished'));
    engine.on('CHALLENGE_RESOLVED', (e) => challengeEvents.push({ wasLie: e.wasLie }));
    
    // p1 lies - plays 7 but claims 8
    engine.submitMove('p1', createPlayMove('p1', ['7-H'], '8', 1));
    
    // p2 challenges correctly
    engine.submitChallengeDecision('p2', true);
    engine.processChallenges();
    
    // Verify p1 was caught lying
    expect(challengeEvents).toHaveLength(1);
    expect(challengeEvents[0]!.wasLie).toBe(true);
    
    // p1 should NOT have finished (caught lying)
    expect(finishedEvents).toHaveLength(0);
    
    // p1 should still be active (picked up pile)
    const state = engine.getState();
    expect(state.activePlayerIds).toContain('p1');
  });
});

