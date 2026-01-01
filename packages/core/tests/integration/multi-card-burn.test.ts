import { describe, it, expect } from 'vitest';
import { GameEngine } from '../../src/engine/game-engine.js';
import { createHumanPlayer } from '../../src/types/player.js';
import { createPlayMove } from '../../src/types/moves.js';
import type { GameEvent, PileBurnedEvent } from '../../src/types/events.js';
import type { Rank } from '../../src/types/card.js';

describe('Four-in-Row Burn with Multi-Card Claims', () => {
    function createControlledGame() {
        const players = [
            createHumanPlayer('p1', 'Player 1'),
            createHumanPlayer('p2', 'Player 2'),
            createHumanPlayer('p3', 'Player 3'),
        ];
        return GameEngine.create(players, {}, 12345);
    }

    function makeUncontesstedPlay(
        engine: GameEngine,
        playerId: string,
        cardIds: string[],
        claimRank: Rank,
        claimCount: number
    ): void {
        const move = createPlayMove(playerId, cardIds, claimRank, claimCount);
        engine.submitMove(playerId, move);

        const state = engine.getState();
        for (const player of state.players) {
            if (player.id !== playerId) {
                engine.submitChallengeDecision(player.id, false);
            }
        }
        engine.processChallenges();
    }

    it('should burn immediately when single player plays 4 cards of same rank', () => {
        const engine = createControlledGame();
        const events: GameEvent[] = [];
        engine.onAll((e) => events.push(e));

        const currentPlayer = engine.getCurrentPlayer();
        const obs = engine.getObservation(currentPlayer.id);

        // We need 4 cards to play. In a real game we'd search for them,
        // but here we can just pick 4 card IDs and claim they are '9's.
        // The game engine validation might check if we actually have them if we were playing honestly,
        // but for the sake of the rule logic (assuming we lie or have them), we just need to pass IDs.
        // However, validation enforces that we hold the cards we claim to play.
        // So we'll validly play whatever 4 cards we have, but CLAIM they are 9s.
        // If the game allows lying, this is valid.

        // Pick 4 cards from hand
        const cardsToPlay = obs.hand.slice(0, 4);
        expect(cardsToPlay.length).toBe(4);

        // Play 4 cards claiming rank '9'
        makeUncontesstedPlay(
            engine,
            currentPlayer.id,
            cardsToPlay.map(c => c.id),
            '9',
            4
        );

        // Should trigger burn
        const burnEvent = events.find((e): e is PileBurnedEvent =>
            e.type === 'PILE_BURNED'
        );

        expect(burnEvent).toBeDefined();
        expect(burnEvent?.reason).toBe('FOUR_IN_ROW');

        // Verify pile is empty
        const state = engine.getState();
        expect(state.tablePile.length).toBe(0);

        // Verify burner continues
        const burnerIndex = state.players.findIndex(p => p.id === currentPlayer.id);
        expect(state.currentPlayerIndex).toBe(burnerIndex);
    });

    it('should burn when cumulative count reaches 4 (e.g. 2+2)', () => {
        const engine = createControlledGame();
        const events: GameEvent[] = [];
        engine.onAll((e) => events.push(e));

        // P1 plays 2 cards
        let currentPlayer = engine.getCurrentPlayer(); // p1
        let obs = engine.getObservation(currentPlayer.id);
        let cardsToPlay = obs.hand.slice(0, 2);
        makeUncontesstedPlay(engine, currentPlayer.id, cardsToPlay.map(c => c.id), '9', 2);

        // P2 plays 2 cards of same rank
        // Note: turn advances because burn didn't happen yet
        currentPlayer = engine.getCurrentPlayer(); // p2
        obs = engine.getObservation(currentPlayer.id);
        cardsToPlay = obs.hand.slice(0, 2);
        makeUncontesstedPlay(engine, currentPlayer.id, cardsToPlay.map(c => c.id), '9', 2);

        // Should trigger burn on second play
        const burnEvent = events.find((e): e is PileBurnedEvent =>
            e.type === 'PILE_BURNED'
        );

        expect(burnEvent).toBeDefined();
        expect(burnEvent?.reason).toBe('FOUR_IN_ROW');
        expect(events.filter(e => e.type === 'PILE_BURNED').length).toBe(1);
    });
});
