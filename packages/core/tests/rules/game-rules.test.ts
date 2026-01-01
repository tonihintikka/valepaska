import { describe, it, expect } from 'vitest';
import {
  checkWinCondition,
  calculateDrawCount,
  getNextPlayerIndex,
  validatePlayerCount,
  replenishHand,
  isEndgame,
} from '../../src/rules/game-rules.js';
import { DEFAULT_GAME_CONFIG } from '../../src/types/game-state.js';
import { createCard } from '../../src/types/card.js';

describe('Game Rules', () => {
  describe('checkWinCondition()', () => {
    it('should not win while draw pile has cards', () => {
      expect(checkWinCondition(0, 10, false)).toBe(false);
    });

    it('should not win if hand not empty', () => {
      expect(checkWinCondition(3, 0, false)).toBe(false);
    });

    it('should not win if caught lying on final play', () => {
      expect(checkWinCondition(0, 0, true)).toBe(false);
    });

    it('should win with empty hand in endgame', () => {
      expect(checkWinCondition(0, 0, false)).toBe(true);
    });
  });

  describe('calculateDrawCount()', () => {
    it('should draw to fill hand to target', () => {
      expect(calculateDrawCount(3, 20, 5)).toBe(2);
    });

    it('should not draw if hand at target', () => {
      expect(calculateDrawCount(5, 20, 5)).toBe(0);
    });

    it('should not draw if hand above target', () => {
      expect(calculateDrawCount(7, 20, 5)).toBe(0);
    });

    it('should limit draw to available cards', () => {
      expect(calculateDrawCount(2, 2, 5)).toBe(2);
    });

    it('should not draw from empty pile', () => {
      expect(calculateDrawCount(2, 0, 5)).toBe(0);
    });
  });

  describe('getNextPlayerIndex()', () => {
    it('should advance to next player', () => {
      expect(getNextPlayerIndex(0, 4)).toBe(1);
      expect(getNextPlayerIndex(1, 4)).toBe(2);
    });

    it('should wrap around', () => {
      expect(getNextPlayerIndex(3, 4)).toBe(0);
    });
  });

  describe('validatePlayerCount()', () => {
    it('should accept 3-6 players', () => {
      expect(validatePlayerCount(3).valid).toBe(true);
      expect(validatePlayerCount(4).valid).toBe(true);
      expect(validatePlayerCount(5).valid).toBe(true);
      expect(validatePlayerCount(6).valid).toBe(true);
    });

    it('should reject 2 players', () => {
      const result = validatePlayerCount(2);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 3 and 6');
    });

    it('should reject 7 players', () => {
      const result = validatePlayerCount(7);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 3 and 6');
    });
  });

  describe('replenishHand()', () => {
    const drawPile = [
      createCard('7', 'hearts'),
      createCard('8', 'diamonds'),
      createCard('9', 'clubs'),
      createCard('10', 'spades'),
      createCard('J', 'hearts'),
    ];

    it('should replenish to target size', () => {
      const hand = [
        createCard('3', 'hearts'),
        createCard('4', 'diamonds'),
        createCard('5', 'clubs'),
      ];

      const { newHand, newDrawPile } = replenishHand(hand, drawPile, DEFAULT_GAME_CONFIG);

      expect(newHand).toHaveLength(5);
      expect(newDrawPile).toHaveLength(3);
    });

    it('should not modify full hand', () => {
      const hand = [
        createCard('3', 'hearts'),
        createCard('4', 'diamonds'),
        createCard('5', 'clubs'),
        createCard('6', 'spades'),
        createCard('7', 'hearts'),
      ];

      const { newHand, newDrawPile } = replenishHand(hand, drawPile, DEFAULT_GAME_CONFIG);

      expect(newHand).toHaveLength(5);
      expect(newDrawPile).toHaveLength(5);
    });

    it('should handle partial replenishment', () => {
      const hand = [
        createCard('3', 'hearts'),
      ];
      const smallDrawPile = [
        createCard('7', 'hearts'),
        createCard('8', 'diamonds'),
      ];

      const { newHand, newDrawPile } = replenishHand(hand, smallDrawPile, DEFAULT_GAME_CONFIG);

      expect(newHand).toHaveLength(3);
      expect(newDrawPile).toHaveLength(0);
    });
  });

  describe('isEndgame()', () => {
    it('should return true when draw pile is empty', () => {
      expect(isEndgame(0)).toBe(true);
    });

    it('should return false when draw pile has cards', () => {
      expect(isEndgame(10)).toBe(false);
    });
  });
});




