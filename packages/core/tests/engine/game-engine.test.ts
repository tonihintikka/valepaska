import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { createBotPlayer, createHumanPlayer } from '../../src/types/player.js';
import { createPlayMove } from '../../src/types/moves.js';
import type { PlayerObservation } from '../../src/types/observation.js';
import type { PlayMove } from '../../src/types/moves.js';
import type { Rank } from '../../src/types/card.js';
import type { GameEvent } from '../../src/types/events.js';

describe('GameEngine', () => {
  const players = [
    createHumanPlayer('p1', 'Player 1'),
    createHumanPlayer('p2', 'Player 2'),
    createHumanPlayer('p3', 'Player 3'),
    createHumanPlayer('p4', 'Player 4'),
  ];

  describe('creation', () => {
    it('should create a game with valid player count', () => {
      const engine = GameEngine.create(players, {}, 12345);
      expect(engine.getCurrentPhase()).toBe('WAITING_FOR_PLAY');
    });

    it('should reject invalid player count', () => {
      const tooFew = [createHumanPlayer('p1', 'P1'), createHumanPlayer('p2', 'P2')];
      expect(() => GameEngine.create(tooFew)).toThrow('between 3 and 6');
    });

    it('should deal 5 cards to each player', () => {
      const engine = GameEngine.create(players, {}, 12345);
      
      for (const player of players) {
        const obs = engine.getObservation(player.id);
        expect(obs.hand).toHaveLength(5);
      }
    });

    it('should set correct draw pile size', () => {
      const engine = GameEngine.create(players, {}, 12345);
      const obs = engine.getObservation('p1');
      expect(obs.drawPileSize).toBe(52 - 4 * 5); // 32 cards
    });
  });

  describe('determinism', () => {
    it('should deal same cards with same seed', () => {
      const engine1 = GameEngine.create(players, {}, 12345);
      const engine2 = GameEngine.create(players, {}, 12345);

      for (const player of players) {
        const obs1 = engine1.getObservation(player.id);
        const obs2 = engine2.getObservation(player.id);
        expect(obs1.hand.map((c) => c.id)).toEqual(obs2.hand.map((c) => c.id));
      }
    });

    it('should deal different cards with different seeds', () => {
      const engine1 = GameEngine.create(players, {}, 12345);
      const engine2 = GameEngine.create(players, {}, 54321);

      const obs1 = engine1.getObservation('p1');
      const obs2 = engine2.getObservation('p1');
      expect(obs1.hand.map((c) => c.id)).not.toEqual(obs2.hand.map((c) => c.id));
    });
  });

  describe('observation', () => {
    it('should hide other players hands', () => {
      const engine = GameEngine.create(players, {}, 12345);
      const obs = engine.getObservation('p1');

      expect(obs.hand).toHaveLength(5);
      expect(obs.otherHandSizes.get('p2')).toBe(5);
      expect(obs.otherHandSizes.get('p3')).toBe(5);
      expect(obs.otherHandSizes.get('p4')).toBe(5);
    });

    it('should show valid claim ranks', () => {
      const engine = GameEngine.create(players, {}, 12345);
      const obs = engine.getObservation('p1');

      // First claim must be number card (3-10) or 2 (wildcard) when deck has cards
      expect(obs.validClaimRanks).toHaveLength(9); // 3,4,5,6,7,8,9,10,2
      expect(obs.validClaimRanks).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', '2']);
    });
  });

  describe('submitMove', () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = GameEngine.create(players, {}, 12345);
    });

    it('should accept valid move', () => {
      const currentPlayer = engine.getCurrentPlayer();
      const obs = engine.getObservation(currentPlayer.id);
      const cardToPlay = obs.hand[0]!;
      
      // First claim must be a number card (3-10), so we claim '7' (may be a lie)
      const move = createPlayMove(currentPlayer.id, [cardToPlay.id], '7');
      engine.submitMove(currentPlayer.id, move);

      expect(engine.getCurrentPhase()).toBe('WAITING_FOR_CHALLENGES');
    });

    it('should reject move from wrong player', () => {
      const currentPlayer = engine.getCurrentPlayer();
      // Find a player who is NOT the current player
      const wrongPlayer = players.find(p => p.id !== currentPlayer.id)!;
      
      const obs = engine.getObservation(wrongPlayer.id);
      const cardToPlay = obs.hand[0]!;
      
      const move = createPlayMove(wrongPlayer.id, [cardToPlay.id], cardToPlay.rank);
      expect(() => engine.submitMove(wrongPlayer.id, move)).toThrow("Not player's turn");
    });

    it('should emit PLAY_MADE event', () => {
      const events: GameEvent[] = [];
      engine.onAll((e) => events.push(e));

      const currentPlayer = engine.getCurrentPlayer();
      const obs = engine.getObservation(currentPlayer.id);
      const cardToPlay = obs.hand[0]!;
      
      // First claim must be a number card (3-10)
      const move = createPlayMove(currentPlayer.id, [cardToPlay.id], '7');
      engine.submitMove(currentPlayer.id, move);

      const playEvent = events.find((e) => e.type === 'PLAY_MADE');
      expect(playEvent).toBeDefined();
    });
  });

  describe('challenges', () => {
    let engine: GameEngine;

    beforeEach(() => {
      engine = GameEngine.create(players, {}, 12345);
      
      const currentPlayer = engine.getCurrentPlayer();
      const obs = engine.getObservation(currentPlayer.id);
      const cardToPlay = obs.hand[0]!;
      // First claim must be a number card (3-10)
      const move = createPlayMove(currentPlayer.id, [cardToPlay.id], '7');
      engine.submitMove(currentPlayer.id, move);
    });

    it('should accept challenge from other player', () => {
      const currentPlayerId = engine.getCurrentPlayer().id; // Note: turn doesn't advance until challenge resolved
      // Actually, after play, the turn stays with current player until challenge phase done.
      // But we need to find someone who is NOT the one who played.
      // In `beforeEach`, `currentPlayer` made the move.
      // We need to fetch the player who made the move from the state/lastPlay?
      // Or just re-derive:
      
      // Since we just created the engine with same seed in beforeEach, let's just use a known "other"
      // But wait, `currentPlayer` advanced? No, phase is WAITING_FOR_CHALLENGES.
      // The `lastPlay` was by the player who started.
      
      // The `engine.getCurrentPlayer()` returns the player whose turn it IS or WAS?
      // State check: currentPlayerIndex usually points to the one who just played if we rely on advanceTurn happening AFTER challenges.
      // Let's assume currentPlayer is the one who played.
      const accuser = engine.getCurrentPlayer();
      const challenger = players.find(p => p.id !== accuser.id)!;
      
      engine.submitChallengeDecision(challenger.id, true);
      // Should not throw
    });

    it('should reject challenge from same player', () => {
      const accuser = engine.getCurrentPlayer();
      expect(() => engine.submitChallengeDecision(accuser.id, true))
        .toThrow('Cannot challenge your own');
    });

    it('should process challenges correctly', () => {
      const accuser = engine.getCurrentPlayer();
      const others = players.filter(p => p.id !== accuser.id);
      
      others.forEach(p => engine.submitChallengeDecision(p.id, false));
      engine.processChallenges();

      // Should advance to next player since no one challenged
      expect(engine.getCurrentPhase()).toBe('WAITING_FOR_PLAY');
    });
  });

  describe('bot integration', () => {
    it('should run game with simple bots', () => {
      const botPlayers = [
        createBotPlayer('b1', 'Bot 1', 'Easy'),
        createBotPlayer('b2', 'Bot 2', 'Easy'),
        createBotPlayer('b3', 'Bot 3', 'Easy'),
        createBotPlayer('b4', 'Bot 4', 'Easy'),
      ];

      const engine = GameEngine.create(botPlayers, {}, 12345);

      // Create simple bots that always play first card honestly and never challenge
      class SimpleBot {
        chooseMove(obs: PlayerObservation): PlayMove {
          const card = obs.hand[0]!;
          // Find a valid rank to claim
          const validRank = obs.validClaimRanks.find((r) => 
            obs.hand.some((c) => c.rank === r)
          ) ?? obs.validClaimRanks[0]!;
          
          return createPlayMove(obs.playerId, [card.id], validRank);
        }

        shouldChallenge(_obs: PlayerObservation, _rank: Rank, _count: number): boolean {
          return false;
        }

        onEvent(_event: GameEvent): void {}
      }

      for (const player of botPlayers) {
        engine.registerBot(player.id, new SimpleBot());
      }

      // Run a few ticks
      for (let i = 0; i < 20; i++) {
        if (!engine.tick()) break;
      }

      // Game should still be running or finished
      expect(['WAITING_FOR_PLAY', 'GAME_OVER']).toContain(engine.getCurrentPhase());
    });
  });

  describe('event log', () => {
    it('should record all events', () => {
      const engine = GameEngine.create(players, {}, 12345);
      
      const log = engine.getEventLog();
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]?.type).toBe('GAME_STARTED');
    });

    it('should have sequential event numbers', () => {
      const engine = GameEngine.create(players, {}, 12345);
      
      const log = engine.getEventLog();
      for (let i = 0; i < log.length; i++) {
        expect(log[i]?.sequenceNumber).toBe(i);
      }
    });
  });
});

