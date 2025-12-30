import { describe, it, expect } from 'vitest';
import {
  compareRanks,
  isRankGte,
  isRankGt,
  getRanksGte,
  getValidClaimRanks,
  isValidClaimRank,
  VALID_AFTER_TWO,
  parseRank,
  getRankDisplayName,
} from '../../src/utils/rank-utils.js';
import { RANKS } from '../../src/types/card.js';

describe('Rank utilities', () => {
  describe('compareRanks()', () => {
    it('should return 0 for equal ranks', () => {
      for (const rank of RANKS) {
        expect(compareRanks(rank, rank)).toBe(0);
      }
    });

    it('should return negative for lower rank', () => {
      expect(compareRanks('3', '4')).toBeLessThan(0);
      expect(compareRanks('7', 'K')).toBeLessThan(0);
      expect(compareRanks('A', '2')).toBeLessThan(0);
    });

    it('should return positive for higher rank', () => {
      expect(compareRanks('4', '3')).toBeGreaterThan(0);
      expect(compareRanks('K', '7')).toBeGreaterThan(0);
      expect(compareRanks('2', 'A')).toBeGreaterThan(0);
    });

    it('should order correctly: 3 < 4 < ... < K < A < 2', () => {
      const expectedOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as const;
      
      for (let i = 0; i < expectedOrder.length - 1; i++) {
        expect(compareRanks(expectedOrder[i]!, expectedOrder[i + 1]!)).toBeLessThan(0);
      }
    });

    it('should have 2 as highest rank', () => {
      for (const rank of RANKS) {
        if (rank !== '2') {
          expect(compareRanks(rank, '2')).toBeLessThan(0);
        }
      }
    });
  });

  describe('isRankGte()', () => {
    it('should return true for equal ranks', () => {
      for (const rank of RANKS) {
        expect(isRankGte(rank, rank)).toBe(true);
      }
    });

    it('should return true for higher ranks', () => {
      expect(isRankGte('7', '5')).toBe(true);
      expect(isRankGte('2', 'A')).toBe(true);
    });

    it('should return false for lower ranks', () => {
      expect(isRankGte('5', '7')).toBe(false);
      expect(isRankGte('A', '2')).toBe(false);
    });
  });

  describe('getRanksGte()', () => {
    it('should return all ranks for 3', () => {
      const ranks = getRanksGte('3');
      expect(ranks).toEqual(RANKS);
    });

    it('should return only 2 for 2', () => {
      const ranks = getRanksGte('2');
      expect(ranks).toEqual(['2']);
    });

    it('should return correct subset for middle rank', () => {
      const ranks = getRanksGte('10');
      expect(ranks).toEqual(['10', 'J', 'Q', 'K', 'A', '2']);
    });
  });

  describe('getValidClaimRanks()', () => {
    it('should return number cards (3-10) and 2 when starting and deck has cards', () => {
      const valid = getValidClaimRanks(null); // default: deckHasCards = true
      // 2 is a wildcard - can be played anytime
      expect(valid).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', '2']);
    });

    it('should return all ranks when starting and deck is empty', () => {
      const valid = getValidClaimRanks(null, { deckHasCards: false });
      expect(valid).toEqual([...RANKS]);
    });

    it('should return same or higher for normal ranks (excluding J,Q,K before 7, A only on face cards)', () => {
      const valid = getValidClaimRanks('5');
      // J, Q, K not allowed before reaching 7
      // A not allowed on number cards (only on face cards J, Q, K)
      expect(valid).toEqual(['5', '6', '7', '8', '9', '10', '2']);
    });

    it('should return same or higher including face cards after reaching 7 (A only on face cards)', () => {
      const valid = getValidClaimRanks('7');
      // A not allowed on number cards (7 is still a number card)
      expect(valid).toEqual(['7', '8', '9', '10', 'J', 'Q', 'K', '2']);
    });

    it('should allow A after face cards (J, Q, K)', () => {
      const validJ = getValidClaimRanks('J');
      expect(validJ).toContain('A');
      expect(validJ).toEqual(['J', 'Q', 'K', 'A', '2']);
      
      const validQ = getValidClaimRanks('Q');
      expect(validQ).toContain('A');
      
      const validK = getValidClaimRanks('K');
      expect(validK).toContain('A');
    });

    it('should allow 10 on number cards (3-9) but not on face cards', () => {
      // 10 valid on number cards
      expect(getValidClaimRanks('5')).toContain('10');
      expect(getValidClaimRanks('9')).toContain('10');
      
      // 10 not valid on face cards (already passed in rank order)
      expect(getValidClaimRanks('J')).not.toContain('10');
      expect(getValidClaimRanks('Q')).not.toContain('10');
      expect(getValidClaimRanks('K')).not.toContain('10');
    });

    it('should return only 2, 10, A after 2 (special rule)', () => {
      const valid = getValidClaimRanks('2');
      expect(valid.sort()).toEqual([...VALID_AFTER_TWO].sort());
    });
  });

  describe('isValidClaimRank()', () => {
    describe('normal progression', () => {
      it('should allow same rank', () => {
        expect(isValidClaimRank('7', '7')).toBe(true);
      });

      it('should allow higher rank', () => {
        expect(isValidClaimRank('9', '7')).toBe(true);
        expect(isValidClaimRank('2', 'A')).toBe(true);
      });

      it('should not allow lower rank', () => {
        expect(isValidClaimRank('5', '7')).toBe(false);
        expect(isValidClaimRank('3', 'K')).toBe(false);
      });
    });

    describe('after 2 (special rule)', () => {
      it('should allow only 2 after 2', () => {
        expect(isValidClaimRank('2', '2')).toBe(true);
      });

      it('should not allow 10 after 2', () => {
        expect(isValidClaimRank('10', '2')).toBe(false);
      });

      it('should not allow A after 2', () => {
        expect(isValidClaimRank('A', '2')).toBe(false);
      });

      it('should not allow other ranks after 2', () => {
        expect(isValidClaimRank('3', '2')).toBe(false);
        expect(isValidClaimRank('7', '2')).toBe(false);
        expect(isValidClaimRank('K', '2')).toBe(false);
        expect(isValidClaimRank('J', '2')).toBe(false);
      });
    });

    describe('first claim', () => {
      it('should allow number cards (3-10) and 2 when deck has cards', () => {
        // Number cards allowed
        for (const rank of ['3', '4', '5', '6', '7', '8', '9', '10'] as const) {
          expect(isValidClaimRank(rank, null)).toBe(true);
        }
        // 2 is a wildcard - always allowed
        expect(isValidClaimRank('2', null)).toBe(true);
        // Other face cards not allowed when deck has cards
        for (const rank of ['J', 'Q', 'K', 'A'] as const) {
          expect(isValidClaimRank(rank, null)).toBe(false);
        }
      });

      it('should allow any rank when deck is empty', () => {
        for (const rank of RANKS) {
          expect(isValidClaimRank(rank, null, { deckHasCards: false })).toBe(true);
        }
      });
    });

    describe('face card restrictions', () => {
      it('should not allow J, Q, K before reaching 7', () => {
        expect(isValidClaimRank('J', '5')).toBe(false);
        expect(isValidClaimRank('Q', '6')).toBe(false);
        expect(isValidClaimRank('K', '4')).toBe(false);
      });

      it('should allow J, Q, K after reaching 7', () => {
        expect(isValidClaimRank('J', '7')).toBe(true);
        expect(isValidClaimRank('Q', '8')).toBe(true);
        expect(isValidClaimRank('K', '9')).toBe(true);
      });

      it('should allow 10 on number cards, A on face cards, 2 anywhere (burn/wildcard rules)', () => {
        // 10 burns number cards (3-9), so valid on them
        expect(isValidClaimRank('10', '5')).toBe(true);
        expect(isValidClaimRank('10', '9')).toBe(true);
        
        // A burns face cards (J, Q, K), NOT valid on number cards
        expect(isValidClaimRank('A', '5')).toBe(false);
        expect(isValidClaimRank('A', 'J')).toBe(true);
        expect(isValidClaimRank('A', 'Q')).toBe(true);
        expect(isValidClaimRank('A', 'K')).toBe(true);
        
        // 2 is wildcard - always valid
        expect(isValidClaimRank('2', '5')).toBe(true);
        expect(isValidClaimRank('2', 'J')).toBe(true);
      });
    });
  });

  describe('parseRank()', () => {
    it('should parse numeric ranks', () => {
      expect(parseRank('3')).toBe('3');
      expect(parseRank('10')).toBe('10');
    });

    it('should parse face cards', () => {
      expect(parseRank('J')).toBe('J');
      expect(parseRank('jack')).toBe('J');
      expect(parseRank('QUEEN')).toBe('Q');
      expect(parseRank('k')).toBe('K');
      expect(parseRank('ace')).toBe('A');
    });

    it('should return null for invalid ranks', () => {
      expect(parseRank('1')).toBeNull();
      expect(parseRank('11')).toBeNull();
      expect(parseRank('invalid')).toBeNull();
    });
  });

  describe('getRankDisplayName()', () => {
    it('should return full names for face cards', () => {
      expect(getRankDisplayName('J')).toBe('Jack');
      expect(getRankDisplayName('Q')).toBe('Queen');
      expect(getRankDisplayName('K')).toBe('King');
      expect(getRankDisplayName('A')).toBe('Ace');
    });

    it('should return number for numeric cards', () => {
      expect(getRankDisplayName('7')).toBe('7');
      expect(getRankDisplayName('10')).toBe('10');
    });
  });
});

