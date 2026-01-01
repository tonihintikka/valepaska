import { describe, it, expect } from 'vitest';
import {
  checkBurn,
  checkFourInRow,
  countConsecutiveSameRank,
  isBurnRank,
} from '../../src/rules/burn-rules.js';
import type { ClaimRecord } from '../../src/types/claim.js';

describe('Burn Rules', () => {
  const createClaimRecord = (rank: string, accepted = true, playerId = 'player1', count = 1): ClaimRecord => ({
    playerId,
    rank: rank as ClaimRecord['rank'],
    count,
    timestamp: Date.now(),
    accepted,
  });

  describe('checkBurn()', () => {
    it('should trigger burn for 10', () => {
      const result = checkBurn('10', 1, []);
      expect(result).toBe('TEN');
    });

    it('should trigger burn for A', () => {
      const result = checkBurn('A', 1, []);
      expect(result).toBe('ACE');
    });

    it('should not trigger burn for other ranks', () => {
      expect(checkBurn('7', 1, [])).toBeNull();
      expect(checkBurn('K', 1, [])).toBeNull();
      expect(checkBurn('2', 1, [])).toBeNull();
    });

    it('should trigger burn for four consecutive same rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      // playing 4th card (count 1)
      const result = checkBurn('7', 1, history);
      expect(result).toBe('FOUR_IN_ROW');
    });

    it('should trigger burn for multi-card claim (4 cards at once)', () => {
      const history: ClaimRecord[] = [];
      // playing 4 cards at once
      const result = checkBurn('7', 4, history);
      expect(result).toBe('FOUR_IN_ROW');
    });

    it('should trigger burn for cumulative count (2 + 2)', () => {
      const history = [
        createClaimRecord('7', true, 'player1', 2),
      ];
      // playing 2 cards
      const result = checkBurn('7', 2, history);
      expect(result).toBe('FOUR_IN_ROW');
    });
  });

  describe('checkFourInRow()', () => {
    it('should detect four consecutive same rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7', 1)).toBe(true);
    });

    it('should not trigger with only 3 consecutive', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7', 1)).toBe(false);
    });

    it('should not count non-accepted claims', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7', false), // Not accepted (lie)
      ];
      expect(checkFourInRow(history, '7', 1)).toBe(false);
    });

    it('should reset count on different rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('8'), // Different rank breaks chain
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7', 1)).toBe(false);
    });

    it('should work with mixed history', () => {
      const history = [
        createClaimRecord('5'),
        createClaimRecord('6'),
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7', 1)).toBe(true);
    });

    it('should trigger four-in-row even from different players', () => {
      const history = [
        createClaimRecord('7', true, 'player1'),
        createClaimRecord('7', true, 'player2'),
        createClaimRecord('7', true, 'player3'),
      ];
      // player4 claims 7 - should trigger burn
      expect(checkFourInRow(history, '7', 1)).toBe(true);
    });
  });

  describe('countConsecutiveSameRank()', () => {
    it('should count consecutive ranks at end of history', () => {
      const history = [
        createClaimRecord('5'),
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(countConsecutiveSameRank(history, '7')).toBe(3);
    });

    it('should count multi-card claims correctly', () => {
      const history = [
        createClaimRecord('7', true, 'p1', 2),
        createClaimRecord('7', true, 'p2', 1),
      ];
      expect(countConsecutiveSameRank(history, '7')).toBe(3);
    });

    it('should return 0 if last claim is different rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('8'),
      ];
      expect(countConsecutiveSameRank(history, '7')).toBe(0);
    });

    it('should skip non-accepted claims', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7', false),
        createClaimRecord('7'),
      ];
      expect(countConsecutiveSameRank(history, '7')).toBe(2);
    });
  });

  describe('isBurnRank()', () => {
    it('should return true for 10', () => {
      expect(isBurnRank('10')).toBe(true);
    });

    it('should return true for A', () => {
      expect(isBurnRank('A')).toBe(true);
    });

    it('should return false for other ranks', () => {
      expect(isBurnRank('7')).toBe(false);
      expect(isBurnRank('K')).toBe(false);
      expect(isBurnRank('2')).toBe(false);
    });
  });
});

