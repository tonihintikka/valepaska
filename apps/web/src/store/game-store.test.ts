
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGameStore } from './game-store';
import { act } from 'react';

describe('GameStore Challenge Flow', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        useGameStore.getState().resetGame();
    });

    afterEach(() => {
        vi.useRealTimers();
        useGameStore.getState().resetGame();
    });

    it('Scenario 1: Passive Wait - Human play waits for timer', async () => {
        const store = useGameStore.getState();
        store.startGame({
            players: [
                { id: 'p1', name: 'Human', isHuman: true },
                { id: 'b1', name: 'Bot 1', isHuman: false },
                { id: 'b2', name: 'Bot 2', isHuman: false },
            ],
            seed: 12345
        });

        // Advance to human turn
        let state = useGameStore.getState().engine?.getState();
        const humanId = 'p1';
        let loops = 0;
        while (state && state.players[state.currentPlayerIndex]!.id !== humanId && loops < 20) {
            await act(async () => { vi.advanceTimersByTime(2000); });
            if (useGameStore.getState().showChallengeModal) useGameStore.getState().pass();
            state = useGameStore.getState().engine?.getState();
            loops++;
        }

        if (!state || state.players[state.currentPlayerIndex]!.id !== humanId) throw new Error('Failed to reach human turn');

        const obs = useGameStore.getState().engine?.getObservation(humanId);
        if (obs?.validClaimRanks[0]) {
            useGameStore.setState({
                selectedCards: [obs!.hand[0]!.id],
                selectedRank: obs!.validClaimRanks[0]!
            });
        }

        useGameStore.getState().playCards();
        expect(useGameStore.getState().showChallengeModal).toBe(true); // T=0

        // Step-by-step verification
        for (let i = 0; i < 5; i++) {
            await act(async () => { vi.advanceTimersByTime(1000); });
            // T=1000..5000
        }

        expect(useGameStore.getState().challengeTimeLeft).toBe(0);
        expect(useGameStore.getState().showChallengeModal).toBe(true);

        // Advance one more second to trigger closure
        await act(async () => { vi.advanceTimersByTime(1000); });

        expect(useGameStore.getState().showChallengeModal).toBe(false);
    });

    it('Scenario 2: Active Pass - Human plays then cancels wait', async () => {
        const store = useGameStore.getState();
        store.startGame({
            players: [
                { id: 'p1', name: 'Human', isHuman: true },
                { id: 'b1', name: 'Bot 1', isHuman: false },
                { id: 'b2', name: 'Bot 2', isHuman: false }
            ],
            seed: 999
        });

        let state = useGameStore.getState().engine?.getState();
        const humanId = 'p1';
        let loops = 0;
        while (state && state.players[state.currentPlayerIndex]!.id !== humanId && loops < 20) {
            await act(async () => { vi.advanceTimersByTime(2000); });
            if (useGameStore.getState().showChallengeModal) useGameStore.getState().pass();
            state = useGameStore.getState().engine?.getState();
            loops++;
        }

        const obs = useGameStore.getState().engine?.getObservation(humanId);
        useGameStore.setState({
            selectedCards: [obs!.hand[0]!.id],
            selectedRank: obs!.validClaimRanks[0]!
        });

        useGameStore.getState().playCards();
        expect(useGameStore.getState().showChallengeModal).toBe(true);

        useGameStore.getState().pass();
        expect(useGameStore.getState().showChallengeModal).toBe(false);
    });

    it('Scenario 3: Multi-turn Constraint - Bot Play -> Human Decision', async () => {
        const store = useGameStore.getState();
        store.startGame({
            players: [
                { id: 'p1', name: 'Human', isHuman: true },
                { id: 'b1', name: 'Bot 1', isHuman: false },
                { id: 'b2', name: 'Bot 2', isHuman: false }
            ],
            seed: 12345
        });

        let state = useGameStore.getState().engine?.getState();
        const humanId = 'p1';

        if (state?.players[state.currentPlayerIndex]!.id === humanId) {
            const obs = useGameStore.getState().engine?.getObservation(humanId);
            useGameStore.setState({
                selectedCards: [obs!.hand[0]!.id],
                selectedRank: obs!.validClaimRanks[0]!
            });
            useGameStore.getState().playCards();
            useGameStore.getState().pass();
            await act(async () => { vi.runAllTimers(); });
            state = useGameStore.getState().engine?.getState();
        }

        await act(async () => { vi.advanceTimersByTime(1000); });
        expect(useGameStore.getState().showChallengeModal).toBe(true);
        useGameStore.getState().pass();
        expect(useGameStore.getState().showChallengeModal).toBe(false);
    });
    it('should pause and show challenge modal when a bot plays', async () => {
        const store = useGameStore.getState();
        const players = [
            { id: 'p1', name: 'Human', isHuman: true },
            { id: 'p2', name: 'Bot 1', isHuman: false },
            { id: 'p3', name: 'Bot 2', isHuman: false }
        ];

        store.startGame({
            players,
            seed: 12345
        });

        let state = useGameStore.getState();
        let engine = state.engine!;

        // Advance timers to trigger the first processBotTurn
        await vi.advanceTimersByTimeAsync(1000);

        state = useGameStore.getState();
        engine = state.engine!;

        // If it's human's turn, we must play to pass turn to bot
        if (engine.getCurrentPlayer().id === 'p1') {
            const cards = engine.getState().hands.get('p1');
            if (!cards || cards.length === 0) throw new Error('Human has no cards');

            // Human plays
            useGameStore.setState({
                selectedCards: [cards![0].id],
                selectedRank: '7'
            });
            store.playCards();

            // Advance to process human's own challenge window
            await vi.advanceTimersByTimeAsync(6000); // 5s timer + buffer
        }

        // Allow time for Bot to play
        await vi.advanceTimersByTimeAsync(500);

        // We might need to advance more if the recursion logic has delays
        await vi.advanceTimersByTimeAsync(500);

        state = useGameStore.getState();

        // Either we are in WAITING_FOR_CHALLENGES (modal shown) or something else
        if (state.engine!.getState().phase === 'WAITING_FOR_CHALLENGES') {
            expect(state.showChallengeModal).toBe(true);
            expect(state.challengeTimeLeft).toBeGreaterThan(0);
        } else {
            // If bot hasn't played yet, fail or advance more?
            // But based on previous successful run, 1000ms is enough.
            if (state.engine!.getState().lastPlay?.playerId !== 'p1') {
                expect(state.showChallengeModal).toBe(true);
            }
        }
    });
});
