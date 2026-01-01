import { describe, it, expect } from 'vitest';
import {
  createDeck,
  shuffleDeck,
  dealCards,
  groupCardsByRank,
  findCardsOfRank,
  countCardsOfRank,
  removeCards,
  findCardsByIds,
} from '../../src/utils/deck.js';
import { createRng } from '../../src/utils/rng.js';
import { RANKS, SUITS } from '../../src/types/card.js';

describe('Deck utilities', () => {
  describe('createDeck()', () => {
    it('should create a 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 4 suits', () => {
      const deck = createDeck();
      const suits = new Set(deck.map((c) => c.suit));
      expect(suits.size).toBe(4);
      expect([...suits].sort()).toEqual([...SUITS].sort());
    });

    it('should have 13 cards per suit', () => {
      const deck = createDeck();
      
      for (const suit of SUITS) {
        const suitCards = deck.filter((c) => c.suit === suit);
        expect(suitCards).toHaveLength(13);
      }
    });

    it('should have all ranks in each suit', () => {
      const deck = createDeck();

      for (const suit of SUITS) {
        const suitRanks = deck.filter((c) => c.suit === suit).map((c) => c.rank);
        expect(suitRanks.sort()).toEqual([...RANKS].sort());
      }
    });

    it('should have unique card IDs', () => {
      const deck = createDeck();
      const ids = deck.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(52);
    });
  });

  describe('shuffleDeck()', () => {
    it('should return all cards', () => {
      const deck = createDeck();
      const rng = createRng(12345);
      const shuffled = shuffleDeck(deck, rng);

      expect(shuffled).toHaveLength(52);
      expect(shuffled.map((c) => c.id).sort()).toEqual(deck.map((c) => c.id).sort());
    });

    it('should be deterministic with same seed', () => {
      const deck = createDeck();
      const rng1 = createRng(12345);
      const rng2 = createRng(12345);

      const shuffled1 = shuffleDeck([...deck], rng1);
      const shuffled2 = shuffleDeck([...deck], rng2);

      expect(shuffled1.map((c) => c.id)).toEqual(shuffled2.map((c) => c.id));
    });
  });

  describe('dealCards()', () => {
    it('should deal correct number of cards to each player', () => {
      const deck = createDeck();
      const [hands, remaining] = dealCards(deck, 4, 5);

      expect(hands.size).toBe(4);
      for (const [, hand] of hands) {
        expect(hand).toHaveLength(5);
      }
      expect(remaining).toHaveLength(52 - 20);
    });

    it('should deal to different player counts', () => {
      const deck = createDeck();

      for (let playerCount = 3; playerCount <= 6; playerCount++) {
        const [hands, remaining] = dealCards(deck, playerCount, 5);
        expect(hands.size).toBe(playerCount);
        expect(remaining).toHaveLength(52 - playerCount * 5);
      }
    });
  });

  describe('groupCardsByRank()', () => {
    it('should group cards by rank', () => {
      const deck = createDeck();
      const groups = groupCardsByRank(deck);

      expect(groups.size).toBe(13);
      for (const [rank, cards] of groups) {
        expect(cards).toHaveLength(4);
        expect(cards.every((c) => c.rank === rank)).toBe(true);
      }
    });
  });

  describe('findCardsOfRank()', () => {
    it('should find all cards of a rank', () => {
      const deck = createDeck();
      const sevens = findCardsOfRank(deck, '7');

      expect(sevens).toHaveLength(4);
      expect(sevens.every((c) => c.rank === '7')).toBe(true);
    });

    it('should return empty array if no cards match', () => {
      const deck = createDeck().filter((c) => c.rank !== '7');
      const sevens = findCardsOfRank(deck, '7');

      expect(sevens).toHaveLength(0);
    });
  });

  describe('countCardsOfRank()', () => {
    it('should count cards of a rank', () => {
      const deck = createDeck();
      expect(countCardsOfRank(deck, 'A')).toBe(4);
    });
  });

  describe('removeCards()', () => {
    it('should remove specified cards', () => {
      const deck = createDeck();
      const toRemove = ['7♥', '7♦'];
      const remaining = removeCards(deck, toRemove);

      expect(remaining).toHaveLength(50);
      expect(remaining.find((c) => c.id === '7♥')).toBeUndefined();
      expect(remaining.find((c) => c.id === '7♦')).toBeUndefined();
    });
  });

  describe('findCardsByIds()', () => {
    it('should find cards by IDs', () => {
      const deck = createDeck();
      const ids = ['7♥', 'A♠', 'K♦'];
      const found = findCardsByIds(deck, ids);

      expect(found).toHaveLength(3);
      expect(found.map((c) => c.id).sort()).toEqual(ids.sort());
    });
  });
});



