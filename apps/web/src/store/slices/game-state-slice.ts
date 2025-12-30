import type { StateCreator } from 'zustand';
import type { GameEngine, GameState, PlayerObservation } from '@valepaska/core';
import type { UIPhase } from '../../../types';

export interface GameStateSlice {
  // Core state
  uiPhase: UIPhase;
  engine: GameEngine | null;
  observation: PlayerObservation | null;
  gameState: GameState | null; // Full state for spectator mode
  winnerId: string | null;
  
  // Actions
  setEngine: (engine: GameEngine | null) => void;
  setObservation: (observation: PlayerObservation | null) => void;
  setGameState: (gameState: GameState | null) => void;
  setWinnerId: (winnerId: string | null) => void;
  setUIPhase: (phase: UIPhase) => void;
}

export const createGameStateSlice: StateCreator<
  GameStateSlice,
  [],
  [],
  GameStateSlice
> = (set) => ({
  // Initial state
  uiPhase: 'start',
  engine: null,
  observation: null,
  gameState: null,
  winnerId: null,
  
  // Actions
  setEngine: (engine) => set({ engine }),
  setObservation: (observation) => set({ observation }),
  setGameState: (gameState) => set({ gameState }),
  setWinnerId: (winnerId) => set({ winnerId }),
  setUIPhase: (phase) => set({ uiPhase: phase }),
});

