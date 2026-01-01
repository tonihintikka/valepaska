
import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine';
import { createBotPlayer, createHumanPlayer } from '../../src/types/player';
import type { Bot } from '../../src/engine/game-engine';
import type { PlayerObservation } from '../../src/types/observation';
import { createCard } from '../../src/types/card';

describe('Bot API Boundary', () => {
    it('should only expose PlayerObservation to bots, not full GameState', () => {
        // 1. Setup
        const botPlayer = createBotPlayer('bot1', 'Test Bot', 'Normal');
        const humanPlayer1 = createHumanPlayer('h1', 'Human 1');
        const humanPlayer2 = createHumanPlayer('h2', 'Human 2');
        const players = [botPlayer, humanPlayer1, humanPlayer2];

        const engine = GameEngine.create(players, {
            initialHandSize: 5,
            playerCount: 3
        }, 12345);

        // 2. Create a Mock Bot
        let capturedObservation: any = null;

        const mockBot: Bot = {
            chooseMove: (obs: PlayerObservation) => {
                capturedObservation = obs;
                // Return a dummy move to satisfy type
                return {
                    type: 'PLAY_CARDS',
                    playerId: 'bot1',
                    timestamp: Date.now(),
                    cardIds: [obs.hand[0].id],
                    claimRank: '7',
                    claimCount: 1
                };
            },
            shouldChallenge: () => false,
            onEvent: () => { }
        };

        engine.registerBot('bot1', mockBot);

        // 3. Force a bot turn or just verify API
        // Direct Verification of getObservation (The API Boundary)
        const observation = engine.getObservation('bot1');
        capturedObservation = observation;

        // 4. Verification

        // A) Should have known safe properties
        expect(capturedObservation.playerId).toBe('bot1');
        expect(capturedObservation.hand).toBeInstanceOf(Array);
        expect(capturedObservation.hand.length).toBe(5);

        // B) Should NOT have hidden information

        // Other hands should be a Map of sizes, NOT arrays of cards
        expect(capturedObservation.otherHandSizes).toBeDefined();
        expect(capturedObservation.otherHandSizes.get('h1')).toBe(5); // Just a number

        // "hands" (the raw GameState map) should NOT be present
        expect((capturedObservation as any).hands).toBeUndefined();

        // Draw pile should be a number, not an array
        expect(capturedObservation.drawPileSize).toBeGreaterThan(0);
        expect((capturedObservation as any).drawPile).toBeUndefined();

        // Table pile should be a number (count), not an array
        expect(capturedObservation.tablePileSize).toBe(0);
        expect((capturedObservation as any).tablePile).toBeUndefined();

        // Internal state like current RNG should not be there
        expect((capturedObservation as any).rng).toBeUndefined();
        expect((capturedObservation as any).seed).toBeUndefined();

        // Verify cards in hand are valid card objects
        const firstCard = capturedObservation.hand[0];
        expect(firstCard).toHaveProperty('id');
        expect(firstCard).toHaveProperty('rank');
        expect(firstCard).toHaveProperty('suit');
    });

    it('should not allow bot to modify the hand array affects engine state', () => {
        // Ensuring immutability (or at least separation)

        const botPlayer = createBotPlayer('bot1', 'TestBot', 'Normal');
        const players = [botPlayer, createHumanPlayer('h1', 'Human'), createHumanPlayer('h2', 'Human')];
        const engine = GameEngine.create(players, {}, 999);

        const obs = engine.getObservation('bot1');

        // Try to mutate the hand
        // This test checks if `hand` is a new array instance.
        const hand = obs.hand as any[];
        hand.pop();

        // Fetch again
        const obs2 = engine.getObservation('bot1');
        expect(obs2.hand.length).toBe(5); // Should still be 5 in the engine
        expect(hand.length).toBe(4); // Local mutation only
    });
});
