import { describe, it, expect } from 'vitest';
import {
  resolveChallenge,
  validateChallenge,
  getChallengerPriorityOrder,
  selectChallenger,
} from '../../src/rules/challenge-rules.js';
import { createCard } from '../../src/types/card.js';

describe('Challenge Rules', () => {
  describe('resolveChallenge()', () => {
    it('should correctly resolve true claim', () => {
      const cards = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'),
      ];

      const result = resolveChallenge(
        cards,
        '7',
        2,
        'accused',
        'challenger',
        10
      );

      expect(result.wasLie).toBe(false);
      expect(result.penaltyRecipient).toBe('challenger');
      expect(result.penaltyCardCount).toBe(10);
      expect(result.accusedContinues).toBe(true);
    });

    it('should correctly resolve lie claim', () => {
      const cards = [
        createCard('5', 'hearts'),
        createCard('7', 'diamonds'),
      ];

      const result = resolveChallenge(
        cards,
        '7',
        2,
        'accused',
        'challenger',
        10
      );

      expect(result.wasLie).toBe(true);
      expect(result.penaltyRecipient).toBe('accused');
      expect(result.penaltyCardCount).toBe(10);
      expect(result.accusedContinues).toBe(false);
    });

    it('should detect count mismatch as lie', () => {
      const cards = [
        createCard('7', 'hearts'),
      ];

      const result = resolveChallenge(
        cards,
        '7',
        2, // Claimed 2 but only played 1
        'accused',
        'challenger',
        5
      );

      expect(result.wasLie).toBe(true);
    });

    it('should include revealed cards', () => {
      const cards = [
        createCard('7', 'hearts'),
        createCard('7', 'diamonds'),
      ];

      const result = resolveChallenge(
        cards,
        '7',
        2,
        'accused',
        'challenger',
        10
      );

      expect(result.revealedCards).toEqual(cards);
      expect(result.claimedRank).toBe('7');
      expect(result.claimedCount).toBe(2);
    });
  });

  describe('validateChallenge()', () => {
    it('should allow valid challenge', () => {
      const result = validateChallenge('challenger', 'accused', true);
      expect(result.valid).toBe(true);
    });

    it('should reject self-challenge', () => {
      const result = validateChallenge('player1', 'player1', true);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot challenge your own');
    });

    it('should reject challenge when no play', () => {
      const result = validateChallenge('challenger', 'accused', false);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No play to challenge');
    });
  });

  describe('getChallengerPriorityOrder()', () => {
    it('should return players in order after accused', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4'];
      const order = getChallengerPriorityOrder(playerIds, 'p2');

      expect(order).toEqual(['p3', 'p4', 'p1']);
    });

    it('should wrap around correctly', () => {
      const playerIds = ['p1', 'p2', 'p3', 'p4'];
      const order = getChallengerPriorityOrder(playerIds, 'p4');

      expect(order).toEqual(['p1', 'p2', 'p3']);
    });

    it('should return empty for unknown player', () => {
      const playerIds = ['p1', 'p2', 'p3'];
      const order = getChallengerPriorityOrder(playerIds, 'unknown');

      expect(order).toEqual([]);
    });
  });

  describe('selectChallenger()', () => {
    it('should select first willing challenger in priority order', () => {
      const willing = ['p4', 'p2'];
      const priority = ['p2', 'p3', 'p4'];

      const selected = selectChallenger(willing, priority);
      expect(selected).toBe('p2');
    });

    it('should return null if no willing challengers', () => {
      const willing: string[] = [];
      const priority = ['p2', 'p3', 'p4'];

      const selected = selectChallenger(willing, priority);
      expect(selected).toBeNull();
    });

    it('should return null if willing not in priority', () => {
      const willing = ['p1'];
      const priority = ['p2', 'p3', 'p4'];

      const selected = selectChallenger(willing, priority);
      expect(selected).toBeNull();
    });
  });
});



