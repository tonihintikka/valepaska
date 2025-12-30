import type { StateCreator } from 'zustand';

export interface DebugSlice {
  debugMode: boolean;
  isSpectator: boolean;
  
  // Actions
  setDebugMode: (enabled: boolean) => void;
  setIsSpectator: (enabled: boolean) => void;
}

export const createDebugSlice: StateCreator<
  DebugSlice,
  [],
  [],
  DebugSlice
> = (set) => ({
  // Initial state
  debugMode: false,
  isSpectator: false,
  
  // Actions
  setDebugMode: (enabled) => set({ debugMode: enabled }),
  setIsSpectator: (enabled) => set({ isSpectator: enabled }),
});

