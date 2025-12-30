import { describe, it, expect } from 'vitest';
import {
  checkBurn,
  checkFourInRow,
  countConsecutiveSameRank,
  isBurnRank,
} from '../../src/rules/burn-rules.js';
import type { ClaimRecord } from '../../src/types/claim.js';

describe('Burn Rules', () => {
  const createClaimRecord = (rank: string, accepted = true): ClaimRecord => ({
    playerId: 'player1',
    rank: rank as ClaimRecord['rank'],
    count: 1,
    timestamp: Date.now(),
    accepted,
  });

  describe('checkBurn()', () => {
    it('should trigger burn for 10', () => {
      const result = checkBurn('10', []);
      expect(result).toBe('TEN');
    });

    it('should trigger burn for A', () => {
      const result = checkBurn('A', []);
      expect(result).toBe('ACE');
    });

    it('should not trigger burn for other ranks', () => {
      expect(checkBurn('7', [])).toBeNull();
      expect(checkBurn('K', [])).toBeNull();
      expect(checkBurn('2', [])).toBeNull();
    });

    it('should trigger burn for four consecutive same rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      const result = checkBurn('7', history);
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
      expect(checkFourInRow(history, '7')).toBe(true);
    });

    it('should not trigger with only 3 consecutive', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7')).toBe(false);
    });

    it('should not count non-accepted claims', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7', false), // Not accepted (lie)
      ];
      expect(checkFourInRow(history, '7')).toBe(false);
    });

    it('should reset count on different rank', () => {
      const history = [
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('8'), // Different rank breaks chain
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7')).toBe(false);
    });

    it('should work with mixed history', () => {
      const history = [
        createClaimRecord('5'),
        createClaimRecord('6'),
        createClaimRecord('7'),
        createClaimRecord('7'),
        createClaimRecord('7'),
      ];
      expect(checkFourInRow(history, '7')).toBe(true);
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

