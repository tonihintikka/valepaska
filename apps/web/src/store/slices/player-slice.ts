import type { StateCreator } from 'zustand';
import type { PlayerConfig } from '../../../types';

export interface PlayerSlice {
  humanPlayerId: string | null;
  playerConfigs: PlayerConfig[];
  
  // Actions
  setHumanPlayerId: (id: string | null) => void;
  setPlayerConfigs: (configs: PlayerConfig[]) => void;
}

export const createPlayerSlice: StateCreator<
  PlayerSlice,
  [],
  [],
  PlayerSlice
> = (set) => ({
  // Initial state
  humanPlayerId: null,
  playerConfigs: [],
  
  // Actions
  setHumanPlayerId: (id) => set({ humanPlayerId: id }),
  setPlayerConfigs: (configs) => set({ playerConfigs: configs }),
});

