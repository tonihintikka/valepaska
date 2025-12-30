import { describe, it, expect } from 'vitest';
import {
  validateClaimRank,
  validateCardCount,
  validateCardsInHand,
  validatePlay,
  verifyClaimTruth,
} from '../../src/rules/claim-rules.js';
import { DEFAULT_GAME_CONFIG } from '../../src/types/game-state.js';
import { createCard } from '../../src/types/card.js';

describe('Claim Rules', () => {
  describe('validateClaimRank()', () => {
    it('should accept same rank', () => {
      const result = validateClaimRank('7', '7');
      expect(result.valid).toBe(true);
    });

    it('should accept higher rank', () => {
      const result = validateClaimRank('9', '7');
      expect(result.valid).toBe(true);
    });

    it('should reject lower rank', () => {
      const result = validateClaimRank('5', '7');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('same or higher');
    });

    it('should handle special 2 rule', () => {
      // After 2, only 2, 10, A allowed
      expect(validateClaimRank('2', '2').valid).toBe(true);
      expect(validateClaimRank('10', '2').valid).toBe(true);
      expect(validateClaimRank('A', '2').valid).toBe(true);
      
      const invalid = validateClaimRank('7', '2');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toContain('only 2, 10, or A');
    });

    it('should accept only number cards when starting and deck has cards', () => {
      expect(validateClaimRank('3', null).valid).toBe(true);
      expect(validateClaimRank('7', null).valid).toBe(true);
      expect(validateClaimRank('10', null).valid).toBe(true);
      // Face cards not allowed when starting with deck
      expect(validateClaimRank('K', null).valid).toBe(false);
      expect(validateClaimRank('A', null).valid).toBe(false);
      expect(validateClaimRank('2', null).valid).toBe(false);
    });

    it('should accept any rank when starting and deck is empty', () => {
      const options = { deckHasCards: false };
      expect(validateClaimRank('3', null, options).valid).toBe(true);
      expect(validateClaimRank('K', null, options).valid).toBe(true);
      expect(validateClaimRank('2', null, options).valid).toBe(true);
    });

    it('should not allow J, Q, K before reaching 7', () => {
      expect(validateClaimRank('J', '5').valid).toBe(false);
      expect(validateClaimRank('Q', '6').valid).toBe(false);
      expect(validateClaimRank('K', '4').valid).toBe(false);
    });

    it('should allow J, Q, K after reaching 7', () => {
      expect(validateClaimRank('J', '7').valid).toBe(true);
      expect(validateClaimRank('Q', '8').valid).toBe(true);
      expect(validateClaimRank('K', '9').valid).toBe(true);
    });
  });

  describe('validateCardCount()', () => {
    it('should accept valid card counts', () => {
      expect(validateCardCount(1, DEFAULT_GAME_CONFIG).valid).toBe(true);
      expect(validateCardCount(2, DEFAULT_GAME_CONFIG).valid).toBe(true);
      expect(validateCardCount(4, DEFAULT_GAME_CONFIG).valid).toBe(true);
    });

    it('should reject zero cards', () => {
      const result = validateCardCount(0, DEFAULT_GAME_CONFIG);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 1');
    });

    it('should reject too many cards', () => {
      const result = validateCardCount(5, DEFAULT_GAME_CONFIG);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('more than 4');
    });
  });

  describe('validateCardsInHand()', () => {
    const hand = [
      createCard('7', 'hearts'),
      createCard('7', 'diamonds'),
      createCard('5', 'clubs'),
    ];

    it('should accept cards in hand', () => {
      const result = validateCardsInHand(['7♥', '7♦'], hand);
      expect(result.valid).toBe(true);
    });

    it('should reject cards not in hand', () => {
      const result = validateCardsInHand(['A♠'], hand);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not in player');
    });
  });

  describe('validatePlay()', () => {
    const hand = [
      createCard('7', 'hearts'),
      createCard('7', 'diamonds'),
      createCard('5', 'clubs'),
      createCard('9', 'spades'),
      createCard('K', 'hearts'),
    ];

    it('should accept valid honest play', () => {
      const result = validatePlay(
        ['7♥', '7♦'],
        '7',
        2,
        hand,
        null,
        DEFAULT_GAME_CONFIG
      );
      expect(result.valid).toBe(true);
    });

    it('should accept valid bluff play', () => {
      const result = validatePlay(
        ['5♣', '9♠'],
        '7',
        2,
        hand,
        null,
        DEFAULT_GAME_CONFIG
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid progression', () => {
      const result = validatePlay(
        ['5♣'],
        '5',
        1,
        hand,
        '7', // Last claim was 7
        DEFAULT_GAME_CONFIG
      );
      expect(result.valid).toBe(false);
    });
  });

  describe('verifyClaimTruth()', () => {
    it('should verify true claim', () => {
      const cards = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'),
      ];
      const result = verifyClaimTruth(cards, '7', 2);
      expect(result.isTrue).toBe(true);
    });

    it('should detect lie - wrong rank', () => {
      const cards = [
        createCard('5', 'hearts'),
        createCard('7', 'diamonds'),
      ];
      const result = verifyClaimTruth(cards, '7', 2);
      expect(result.isTrue).toBe(false);
      expect(result.reason).toContain('5');
    });

    it('should detect lie - wrong count', () => {
      const cards = [
        createCard('7', 'hearts'),
      ];
      const result = verifyClaimTruth(cards, '7', 2);
      expect(result.isTrue).toBe(false);
      expect(result.reason).toContain('Claimed 2');
    });

    it('should detect partial lie', () => {
      const cards = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'),
        createCard('5', 'clubs'),
      ];
      const result = verifyClaimTruth(cards, '7', 3);
      expect(result.isTrue).toBe(false);
    });
  });
});

