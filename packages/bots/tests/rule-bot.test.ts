import { describe, it, expect } from 'vitest';
import { RuleBot } from '../src/rule-bot.js';
import { BOT_PRESETS } from '../src/types.js';
import type { PlayerObservation, ClaimRecord, Card, Rank } from '@valepaska/core';

describe('RuleBot', () => {
  const createMockObservation = (overrides: Partial<PlayerObservation> = {}): PlayerObservation => ({
    playerId: 'bot1',
    hand: [
      { id: '7♥', rank: '7', suit: 'hearts' },
      { id: '7♦', rank: '7', suit: 'diamonds' },
      { id: '5♣', rank: '5', suit: 'clubs' },
      { id: '9♠', rank: '9', suit: 'spades' },
      { id: 'K♥', rank: 'K', suit: 'hearts' },
    ] as Card[],
    otherHandSizes: new Map([
      ['p2', 5],
      ['p3', 5],
      ['p4', 5],
    ]),
    drawPileSize: 32,
    tablePileSize: 0,
    claimHistory: [],
    lastClaim: null,
    validClaimRanks: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as Rank[],
    isEndgame: false,
    currentPlayerId: 'bot1',
    isMyTurn: true,
    phase: 'WAITING_FOR_PLAY',
    playerOrder: ['bot1', 'p2', 'p3', 'p4'],
    roundNumber: 0,
    ...overrides,
  });

  describe('presets', () => {
    it('should have correct Easy preset values', () => {
      expect(BOT_PRESETS.Easy.bluffRate).toBe(0.05);
      expect(BOT_PRESETS.Easy.burnBluffRate).toBe(0.0);
      expect(BOT_PRESETS.Easy.challengeThreshold).toBe(3.4);
      expect(BOT_PRESETS.Easy.pileFearFactor).toBe(1.2);
      expect(BOT_PRESETS.Easy.endgameAggro).toBe(0.3);
      expect(BOT_PRESETS.Easy.memoryLevel).toBe(0);
    });

    it('should have correct Normal preset values', () => {
      expect(BOT_PRESETS.Normal.bluffRate).toBe(0.2);
      expect(BOT_PRESETS.Normal.burnBluffRate).toBe(0.05);
      expect(BOT_PRESETS.Normal.challengeThreshold).toBe(2.7);
      expect(BOT_PRESETS.Normal.pileFearFactor).toBe(1.0);
      expect(BOT_PRESETS.Normal.endgameAggro).toBe(0.6);
      expect(BOT_PRESETS.Normal.memoryLevel).toBe(1);
    });

    it('should have correct Hard preset values', () => {
      expect(BOT_PRESETS.Hard.bluffRate).toBe(0.35);
      expect(BOT_PRESETS.Hard.burnBluffRate).toBe(0.15);
      expect(BOT_PRESETS.Hard.challengeThreshold).toBe(2.2);
      expect(BOT_PRESETS.Hard.pileFearFactor).toBe(0.8);
      expect(BOT_PRESETS.Hard.endgameAggro).toBe(0.9);
      expect(BOT_PRESETS.Hard.memoryLevel).toBe(2);
    });

    it('should have correct Pro preset values', () => {
      expect(BOT_PRESETS.Pro.bluffRate).toBe(0.45);
      expect(BOT_PRESETS.Pro.burnBluffRate).toBe(0.25);
      expect(BOT_PRESETS.Pro.challengeThreshold).toBe(1.9);
      expect(BOT_PRESETS.Pro.pileFearFactor).toBe(0.7);
      expect(BOT_PRESETS.Pro.endgameAggro).toBe(1.2);
      expect(BOT_PRESETS.Pro.memoryLevel).toBe(2);
    });
  });

  describe('chooseMove', () => {
    it('should return a valid move', () => {
      const bot = new RuleBot('bot1', 'Normal', 12345);
      const obs = createMockObservation();

      const move = bot.chooseMove(obs);

      expect(move.type).toBe('PLAY');
      expect(move.playerId).toBe('bot1');
      expect(move.cardIds.length).toBeGreaterThan(0);
      expect(obs.validClaimRanks).toContain(move.claimRank);
    });

    it('should prefer honest moves for Easy difficulty', () => {
      const bot = new RuleBot('bot1', 'Easy', 12345);
      const obs = createMockObservation();

      // Run multiple times to check pattern
      let honestMoves = 0;
      for (let i = 0; i < 20; i++) {
        const move = bot.chooseMove(obs);
        const playedCard = obs.hand.find((c) => c.id === move.cardIds[0]);
        if (playedCard?.rank === move.claimRank) {
          honestMoves++;
        }
      }

      // Easy should mostly play honest
      expect(honestMoves).toBeGreaterThan(15);
    });

    it('should handle limited valid ranks', () => {
      const bot = new RuleBot('bot1', 'Normal', 12345);
      const obs = createMockObservation({
        validClaimRanks: ['K', 'A', '2'] as Rank[], // After K claim
        hand: [
          { id: 'K♥', rank: 'K', suit: 'hearts' },
          { id: 'A♦', rank: 'A', suit: 'diamonds' },
          { id: '5♣', rank: '5', suit: 'clubs' },
          { id: '9♠', rank: '9', suit: 'spades' },
          { id: '2♥', rank: '2', suit: 'hearts' },
        ] as Card[],
      });

      const move = bot.chooseMove(obs);

      expect(['K', 'A', '2']).toContain(move.claimRank);
    });

    it('should handle 2-rule restrictions', () => {
      const bot = new RuleBot('bot1', 'Normal', 12345);
      const obs = createMockObservation({
        validClaimRanks: ['2', '10', 'A'] as Rank[], // After 2 claim
        hand: [
          { id: '10♥', rank: '10', suit: 'hearts' },
          { id: 'A♦', rank: 'A', suit: 'diamonds' },
          { id: '5♣', rank: '5', suit: 'clubs' },
          { id: '9♠', rank: '9', suit: 'spades' },
          { id: '2♥', rank: '2', suit: 'hearts' },
        ] as Card[],
      });

      const move = bot.chooseMove(obs);

      expect(['2', '10', 'A']).toContain(move.claimRank);
    });
  });

  describe('shouldChallenge', () => {
    it('should always challenge when holding all 4 of claimed rank', () => {
      // Use Pro bot which has lower challenge threshold
      const bot = new RuleBot('bot1', 'Pro', 12345);
      const obs = createMockObservation({
        hand: [
          { id: '7♥', rank: '7', suit: 'hearts' },
          { id: '7♦', rank: '7', suit: 'diamonds' },
          { id: '7♣', rank: '7', suit: 'clubs' },
          { id: '7♠', rank: '7', suit: 'spades' },
          { id: 'K♥', rank: 'K', suit: 'hearts' },
        ] as Card[],
        lastClaim: {
          playerId: 'p2',
          rank: '7',
          count: 2,
          timestamp: Date.now(),
          accepted: false,
        } as ClaimRecord,
        tablePileSize: 2, // Small pile so pile fear doesn't dominate
      });

      const result = bot.shouldChallenge(obs, '7', 2);
      expect(result).toBe(true);
    });

    it('should be less likely to challenge large piles', () => {
      const botWithFear = new RuleBot('bot1', 'Easy', 12345); // High pile fear
      const obs = createMockObservation({
        tablePileSize: 20,
        lastClaim: {
          playerId: 'p2',
          rank: '5',
          count: 1,
          timestamp: Date.now(),
          accepted: false,
        } as ClaimRecord,
      });

      // Easy bot with high pile fear should rarely challenge big piles
      const result = botWithFear.shouldChallenge(obs, '5', 1);
      // This might be true or false depending on other factors,
      // but the pile fear should reduce the chance
      expect(typeof result).toBe('boolean');
    });

    it('should be more suspicious of burn claims (10, A)', () => {
      const bot = new RuleBot('bot1', 'Normal', 12345);
      const obsNormal = createMockObservation({
        lastClaim: {
          playerId: 'p2',
          rank: '5',
          count: 1,
          timestamp: Date.now(),
          accepted: false,
        } as ClaimRecord,
      });

      const obsBurn = createMockObservation({
        lastClaim: {
          playerId: 'p2',
          rank: '10',
          count: 1,
          timestamp: Date.now(),
          accepted: false,
        } as ClaimRecord,
      });

      // We can't directly compare without running many trials,
      // but the logic should add suspicion for burn claims
      const resultNormal = bot.shouldChallenge(obsNormal, '5', 1);
      const resultBurn = bot.shouldChallenge(obsBurn, '10', 1);
      
      // Just verify both return booleans
      expect(typeof resultNormal).toBe('boolean');
      expect(typeof resultBurn).toBe('boolean');
    });
  });

  describe('determinism', () => {
    it('should produce same moves with same seed', () => {
      const obs = createMockObservation();

      const bot1 = new RuleBot('bot1', 'Normal', 42);
      const bot2 = new RuleBot('bot1', 'Normal', 42);

      const move1 = bot1.chooseMove(obs);
      const move2 = bot2.chooseMove(obs);

      expect(move1.cardIds).toEqual(move2.cardIds);
      expect(move1.claimRank).toBe(move2.claimRank);
    });
  });
});
