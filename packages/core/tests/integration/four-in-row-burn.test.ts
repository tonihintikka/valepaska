import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { createHumanPlayer } from '../../src/types/player.js';
import { createPlayMove } from '../../src/types/moves.js';
import type { GameEvent, PileBurnedEvent } from '../../src/types/events.js';
import type { Card, Rank } from '../../src/types/card.js';

describe('Four-in-Row Burn Integration', () => {
    /**
     * Creates a controlled game where we can manipulate hands for testing
     */
    function createControlledGame() {
        const players = [
            createHumanPlayer('p1', 'Player 1'),
            createHumanPlayer('p2', 'Player 2'),
            createHumanPlayer('p3', 'Player 3'),
            createHumanPlayer('p4', 'Player 4'),
        ];

        // Use a fixed seed for reproducibility
        const engine = GameEngine.create(players, {}, 12345);
        return engine;
    }

    /**
     * Helper to make a play and have no one challenge it
     */
    function makeUncontesstedPlay(
        engine: GameEngine,
        playerId: string,
        cardIds: string[],
        claimRank: Rank,
        claimCount: number
    ): void {
        const move = createPlayMove(playerId, cardIds, claimRank, claimCount);
        engine.submitMove(playerId, move);

        // All other players pass
        const state = engine.getState();
        for (const player of state.players) {
            if (player.id !== playerId) {
                engine.submitChallengeDecision(player.id, false);
            }
        }
        engine.processChallenges();
    }

    describe('FOUR_IN_ROW detection', () => {
        it('should burn pile when 4 consecutive same rank claims are made', () => {
            const engine = createControlledGame();
            const events: GameEvent[] = [];
            engine.onAll((e) => events.push(e));

            // Get initial state
            const initialState = engine.getState();

            // We need to find cards of the same rank across all players
            // Since we're testing the rule, we'll need to lie about the rank
            // The FOUR_IN_ROW burn happens when 4 consecutive CLAIMS of the same rank are accepted

            // Make 4 consecutive claims of rank '7'
            let currentPlayer = engine.getCurrentPlayer();
            let obs = engine.getObservation(currentPlayer.id);
            let cardToPlay = obs.hand[0]!;

            // First claim: 7
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);

            // Second claim: 7
            currentPlayer = engine.getCurrentPlayer();
            obs = engine.getObservation(currentPlayer.id);
            cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);

            // Third claim: 7
            currentPlayer = engine.getCurrentPlayer();
            obs = engine.getObservation(currentPlayer.id);
            cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);

            // Track pile size before fourth claim
            const stateBeforeFourth = engine.getState();
            const pileSizeBefore = stateBeforeFourth.tablePile.length;
            expect(pileSizeBefore).toBe(3); // 3 cards should be on the pile

            // Fourth claim: 7 - this should trigger FOUR_IN_ROW burn
            currentPlayer = engine.getCurrentPlayer();
            const playerBeforeBurn = currentPlayer.id;
            obs = engine.getObservation(currentPlayer.id);
            cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);

            // Check that PILE_BURNED event was emitted with FOUR_IN_ROW reason
            const burnEvent = events.find((e): e is PileBurnedEvent =>
                e.type === 'PILE_BURNED'
            );
            expect(burnEvent).toBeDefined();
            expect(burnEvent?.reason).toBe('FOUR_IN_ROW');

            // Check that table pile is now empty
            const stateAfterBurn = engine.getState();
            expect(stateAfterBurn.tablePile.length).toBe(0);

            // Check that burned cards went to burn pile
            expect(stateAfterBurn.burnPile.length).toBe(4);
        });

        it('should let the burner continue playing after FOUR_IN_ROW burn', () => {
            const engine = createControlledGame();

            // Make 3 claims of rank '7'
            for (let i = 0; i < 3; i++) {
                const currentPlayer = engine.getCurrentPlayer();
                const obs = engine.getObservation(currentPlayer.id);
                const cardToPlay = obs.hand[0]!;
                makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);
            }

            // Fourth claim triggers burn - record who made it
            const playerWhoBurns = engine.getCurrentPlayer();
            const burnerPlayerId = playerWhoBurns.id;

            const obs = engine.getObservation(burnerPlayerId);
            const cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, burnerPlayerId, [cardToPlay.id], '7', 1);

            // After burn, the SAME player should still be current player (burner continues)
            const playerAfterBurn = engine.getCurrentPlayer();
            expect(playerAfterBurn.id).toBe(burnerPlayerId);

            // Verify game phase is waiting for the burner to play
            expect(engine.getCurrentPhase()).toBe('WAITING_FOR_PLAY');
        });

        it('should reset claim history after burn', () => {
            const engine = createControlledGame();

            // Make 4 consecutive '7' claims - triggers burn
            for (let i = 0; i < 4; i++) {
                const currentPlayer = engine.getCurrentPlayer();
                const obs = engine.getObservation(currentPlayer.id);
                const cardToPlay = obs.hand[0]!;
                makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);
            }

            // After burn, claim history should be cleared
            const stateAfterBurn = engine.getState();
            expect(stateAfterBurn.claimHistory.length).toBe(0);
        });

        it('should not trigger burn with only 3 consecutive same rank', () => {
            const engine = createControlledGame();
            const events: GameEvent[] = [];
            engine.onAll((e) => events.push(e));

            // Make 3 claims of rank '7'
            for (let i = 0; i < 3; i++) {
                const currentPlayer = engine.getCurrentPlayer();
                const obs = engine.getObservation(currentPlayer.id);
                const cardToPlay = obs.hand[0]!;
                makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);
            }

            // Fourth claim is different rank - should NOT burn
            const currentPlayer = engine.getCurrentPlayer();
            const obs = engine.getObservation(currentPlayer.id);
            const cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '8', 1);

            // No burn event should have occurred (except possibly during earlier 10 or A claims)
            const burnEvents = events.filter((e): e is PileBurnedEvent =>
                e.type === 'PILE_BURNED' && e.reason === 'FOUR_IN_ROW'
            );
            expect(burnEvents.length).toBe(0);

            // Pile should still have cards
            const state = engine.getState();
            expect(state.tablePile.length).toBeGreaterThan(0);
        });

        it('should reset consecutive count when different rank is played', () => {
            const engine = createControlledGame();
            const events: GameEvent[] = [];
            engine.onAll((e) => events.push(e));

            // Make 2 claims of '5'
            for (let i = 0; i < 2; i++) {
                const currentPlayer = engine.getCurrentPlayer();
                const obs = engine.getObservation(currentPlayer.id);
                const cardToPlay = obs.hand[0]!;
                makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '5', 1);
            }

            // Play different rank '6' - breaks the chain
            let currentPlayer = engine.getCurrentPlayer();
            let obs = engine.getObservation(currentPlayer.id);
            let cardToPlay = obs.hand[0]!;
            makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '6', 1);

            // Make 2 more claims of '7' - should NOT burn (only 2 consecutive '7', not 4)
            for (let i = 0; i < 2; i++) {
                currentPlayer = engine.getCurrentPlayer();
                obs = engine.getObservation(currentPlayer.id);
                cardToPlay = obs.hand[0]!;
                makeUncontesstedPlay(engine, currentPlayer.id, [cardToPlay.id], '7', 1);
            }

            // No FOUR_IN_ROW burn should have occurred
            const fourInRowBurns = events.filter((e): e is PileBurnedEvent =>
                e.type === 'PILE_BURNED' && e.reason === 'FOUR_IN_ROW'
            );
            expect(fourInRowBurns.length).toBe(0);
        });
    });
});
