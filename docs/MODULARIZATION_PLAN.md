# Modularization Plan

## Overview

This document outlines a plan to split the largest files in the codebase into smaller, more manageable modules.

---

## Priority 1: `game-engine.ts` (770 lines)

**Current state:** Single monolithic file handling all game logic.

### Proposed Split

```
packages/core/src/engine/
├── game-engine.ts          (~150 lines) - Main GameEngine class, state management
├── turn-manager.ts         (~100 lines) - Turn advancement, player rotation
├── play-executor.ts        (~150 lines) - submitMove, validateAndExecutePlay
├── challenge-executor.ts   (~150 lines) - executeChallenge, challenge resolution
├── burn-executor.ts        (~80 lines)  - executeBurn, burn logic
├── hand-manager.ts         (~80 lines)  - replenishHands, card drawing
├── bot-runner.ts           (~60 lines)  - Bot registration and execution
└── index.ts                            - Re-exports
```

### Module Responsibilities

| Module | Responsibility |
|--------|----------------|
| `game-engine.ts` | Core GameEngine class, state, event emitter, public API |
| `turn-manager.ts` | `advanceTurn()`, `getNextPlayer()`, turn logic |
| `play-executor.ts` | `submitMove()`, play validation, card placement |
| `challenge-executor.ts` | `executeChallenge()`, reveal cards, resolve |
| `burn-executor.ts` | `executeBurn()`, pile clearing, burn events |
| `hand-manager.ts` | `replenishHands()`, `drawCards()`, deck operations |
| `bot-runner.ts` | `registerBot()`, `runBotTurn()`, bot integration |

### Migration Strategy

1. Extract helper functions first (no state changes)
2. Create executor classes that receive state and return new state
3. Keep GameEngine as facade that delegates to executors
4. Update tests incrementally

---

## Priority 2: `game-store.ts` (537 lines)

**Current state:** Single Zustand store with all game state and actions.

### Proposed Split

```
apps/web/src/store/
├── game-store.ts           (~100 lines) - Main store, combines slices
├── slices/
│   ├── game-state-slice.ts (~80 lines)  - Core game state (observation, phase)
│   ├── player-slice.ts     (~80 lines)  - Player configs, selection
│   ├── ui-slice.ts         (~100 lines) - UI state (modals, overlays)
│   ├── event-slice.ts      (~80 lines)  - Event handling, event log
│   └── bot-slice.ts        (~100 lines) - Bot runner, speed control
├── actions/
│   ├── game-actions.ts     (~50 lines)  - startGame, resetGame
│   └── challenge-actions.ts (~50 lines) - handleChallenge, dismissChallenge
└── index.ts
```

### Slice Pattern

```typescript
// slices/ui-slice.ts
export interface UISlice {
  showVictoryOverlay: boolean;
  pendingWinnerId: PlayerId | null;
  challengeReveal: ChallengeReveal | null;
  activeChallenge: ActiveChallenge | null;
  
  dismissVictoryOverlay: () => void;
  dismissChallengeReveal: () => void;
  dismissChallenge: () => void;
}

export const createUISlice: StateCreator<GameStore, [], [], UISlice> = (set) => ({
  // ... implementation
});
```

### Migration Strategy

1. Identify logical groupings of state and actions
2. Create slice files with `StateCreator` pattern
3. Combine slices in main store using `create()`
4. Ensure type safety with proper slice composition

---

## Priority 3: `StartScreen.tsx` (342 lines)

**Current state:** Single component with player configuration UI.

### Proposed Split

```
apps/web/src/screens/StartScreen/
├── StartScreen.tsx         (~80 lines)  - Main container
├── GameModeSelector.tsx    (~60 lines)  - Mode buttons (Player vs Bots, etc.)
├── PlayerList.tsx          (~80 lines)  - Player configuration list
├── PlayerRow.tsx           (~80 lines)  - Single player row
├── DebugToggle.tsx         (~30 lines)  - Debug mode checkbox
└── index.ts
```

### Migration Strategy

1. Extract `PlayerRow` component first (reusable)
2. Extract `GameModeSelector` 
3. Extract `PlayerList` that uses `PlayerRow`
4. Keep `StartScreen` as layout container

---

## Priority 4: `GameTable.tsx` (219 lines)

**Current state:** Main game table with player positions.

### Proposed Split

```
apps/web/src/components/GameTable/
├── GameTable.tsx           (~80 lines)  - Main layout
├── OpponentSlot.tsx        (~60 lines)  - Opponent display
├── TableCenter.tsx         (~50 lines)  - Pile and claim display
├── PlayerPositions.ts      (~30 lines)  - Position calculation logic
└── index.ts
```

---

## Implementation Order

1. **Phase 1: game-store.ts** (High impact, medium effort)
   - Zustand slices are well-established pattern
   - Improves developer experience immediately
   - Low risk of breaking changes

2. **Phase 2: StartScreen.tsx** (Medium impact, low effort)
   - UI components are easy to extract
   - No state management complexity
   - Good practice for component composition

3. **Phase 3: game-engine.ts** (High impact, high effort)
   - Most complex refactoring
   - Requires careful testing
   - Should be done after store refactoring

4. **Phase 4: GameTable.tsx** (Low impact, low effort)
   - Optional optimization
   - Can be done incrementally

---

## Testing Strategy

- Keep existing tests passing throughout
- Add integration tests for module boundaries
- Use dependency injection for easier testing
- Consider adding snapshot tests for UI components

---

## Notes

- Maintain backward compatibility during migration
- Use barrel exports (`index.ts`) for clean imports
- Document any API changes in CHANGELOG
- Consider feature flags for gradual rollout


