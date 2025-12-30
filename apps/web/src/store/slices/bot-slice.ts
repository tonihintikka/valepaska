import type { StateCreator } from 'zustand';
import type { PlayerId } from '@valepaska/core';
import type { RuleBot } from '@valepaska/bots';

export interface BotSlice {
  bots: Map<PlayerId, RuleBot>;
  gameSpeed: number; // Multiplier: 0.5 = slow, 1 = normal, 2 = fast, 4 = very fast
  
  // Actions
  setBots: (bots: Map<PlayerId, RuleBot>) => void;
  setGameSpeed: (speed: number) => void;
}

export const createBotSlice: StateCreator<
  BotSlice,
  [],
  [],
  BotSlice
> = (set) => ({
  // Initial state
  bots: new Map(),
  gameSpeed: 1,
  
  // Actions
  setBots: (bots) => set({ bots }),
  setGameSpeed: (speed) => set({ gameSpeed: speed }),
});

