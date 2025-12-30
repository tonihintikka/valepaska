import type { StateCreator } from 'zustand';
import type { GameEvent } from '@valepaska/core';

export interface EventSlice {
  events: GameEvent[];
  
  // Actions
  addEvent: (event: GameEvent) => void;
  clearEvents: () => void;
}

export const createEventSlice: StateCreator<
  EventSlice,
  [],
  [],
  EventSlice
> = (set, get) => ({
  // Initial state
  events: [],
  
  // Actions
  addEvent: (event) => {
    const { events } = get();
    set({ events: [...events, event] });
  },
  
  clearEvents: () => set({ events: [] }),
});

