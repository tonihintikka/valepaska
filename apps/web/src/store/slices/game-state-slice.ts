import type { StateCreator } from 'zustand';
import type { GameEngine, GameState, PlayerObservation, PlayerStanding } from '@valepaska/core';
import type { UIPhase } from '../../types';

export interface GameStateSlice {
  // Core state
  uiPhase: UIPhase;
  engine: GameEngine | null;
  observation: PlayerObservation | null;
  gameState: GameState | null; // Full state for spectator mode
  winnerId: string | null;
  standings: PlayerStanding[]; // Player rankings
  
  // Actions
  setEngine: (engine: GameEngine | null) => void;
  setObservation: (observation: PlayerObservation | null) => void;
  setGameState: (gameState: GameState | null) => void;
  setWinnerId: (winnerId: string | null) => void;
  setStandings: (standings: PlayerStanding[]) => void;
  setUIPhase: (phase: UIPhase) => void;
}

export const createGameStateSlice: StateCreator<
  GameStateSlice,
  [],
  [],
  GameStateSlice
> = (set, _get, _store) => ({
  // Initial state
  uiPhase: 'start',
  engine: null,
  observation: null,
  gameState: null,
  winnerId: null,
  standings: [],
  
  // Actions
  setEngine: (engine) => set({ engine }),
  setObservation: (observation) => set({ observation }),
  setGameState: (gameState) => set({ gameState }),
  setWinnerId: (winnerId) => set({ winnerId }),
  setStandings: (standings) => set({ standings }),
  setUIPhase: (phase) => set({ uiPhase: phase }),
});

