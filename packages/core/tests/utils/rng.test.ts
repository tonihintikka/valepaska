import { describe, it, expect } from 'vitest';
import { createRng, SeededRng } from '../../src/utils/rng.js';

describe('SeededRng', () => {
  describe('determinism', () => {
    it('should produce same sequence with same seed', () => {
      const rng1 = createRng(12345);
      const rng2 = createRng(12345);

      const sequence1 = Array.from({ length: 10 }, () => rng1.random());
      const sequence2 = Array.from({ length: 10 }, () => rng2.random());

      expect(sequence1).toEqual(sequence2);
    });

    it('should produce different sequences with different seeds', () => {
      const rng1 = createRng(12345);
      const rng2 = createRng(54321);

      const sequence1 = Array.from({ length: 10 }, () => rng1.random());
      const sequence2 = Array.from({ length: 10 }, () => rng2.random());

      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('random()', () => {
    it('should produce values between 0 and 1', () => {
      const rng = createRng(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('randomInt()', () => {
    it('should produce values in specified range', () => {
      const rng = createRng(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.randomInt(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThan(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('shuffle()', () => {
    it('should shuffle array deterministically', () => {
      const rng1 = createRng(12345);
      const rng2 = createRng(12345);

      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      rng1.shuffle(arr1);
      rng2.shuffle(arr2);

      expect(arr1).toEqual(arr2);
    });

    it('should contain all original elements', () => {
      const rng = createRng(12345);
      const original = [1, 2, 3, 4, 5];
      const arr = [...original];

      rng.shuffle(arr);

      expect(arr.sort()).toEqual(original);
    });
  });

  describe('pick()', () => {
    it('should pick an element from array', () => {
      const rng = createRng(12345);
      const arr = ['a', 'b', 'c', 'd', 'e'];

      const picked = rng.pick(arr);

      expect(arr).toContain(picked);
    });

    it('should throw on empty array', () => {
      const rng = createRng(12345);

      expect(() => rng.pick([])).toThrow('Cannot pick from empty array');
    });
  });

  describe('chance()', () => {
    it('should return true with probability 1', () => {
      const rng = createRng(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng.chance(1)).toBe(true);
      }
    });

    it('should return false with probability 0', () => {
      const rng = createRng(12345);

      for (let i = 0; i < 10; i++) {
        expect(rng.chance(0)).toBe(false);
      }
    });
  });

  describe('state serialization', () => {
    it('should save and restore state', () => {
      const rng = createRng(12345);

      // Generate some values
      rng.random();
      rng.random();

      // Save state
      const state = rng.getState();

      // Generate more values
      const value1 = rng.random();
      const value2 = rng.random();

      // Restore state
      rng.setState(state);

      // Should get same values
      expect(rng.random()).toBe(value1);
      expect(rng.random()).toBe(value2);
    });
  });
});



