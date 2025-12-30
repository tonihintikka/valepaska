# Modularization Plan

## Overview

This document outlines a plan to split the largest files in the codebase into smaller, more manageable modules.

---

## Priority 1: `game-engine.ts` ✅ COMPLETED (2025-01-27)

**Previous state:** Single monolithic file handling all game logic (770 lines).

**Current state:** Modularized into 6 focused modules (550 lines main file).

### Implementation Result

```
packages/core/src/engine/
├── game-engine.ts          (550 lines) - Main GameEngine class, state management, public API
├── turn-manager.ts         (40 lines)  - Turn advancement, player rotation ✅
├── play-executor.ts        (50 lines)  - Play move execution ✅
├── challenge-executor.ts   (164 lines) - Challenge resolution, burn handling ✅
├── burn-executor.ts        (48 lines)  - Burn logic, pile clearing ✅
├── hand-manager.ts         (90 lines)  - Card dealing, hand replenishment ✅
├── bot-runner.ts           (94 lines)  - Bot integration, challenge decisions ✅
└── index.ts                            - Re-exports ✅
```

**Result:** Reduced from 770 to 550 lines (-220 lines, -29% reduction)

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

### Implementation Notes

**Approach Used:**
1. ✅ Extracted pure functions first (no state changes)
2. ✅ Created executor functions that receive state and return new state
3. ✅ Kept GameEngine as facade that delegates to executors
4. ✅ All tests passing (166/166) - no test changes needed

**Key Design Decisions:**
- Used functional approach: executors receive `GameState` and return new `GameState`
- Maintained backward compatibility: public API unchanged
- Type safety: Fixed TypeScript strict mode issues with readonly types
- Event emission: Kept in `game-engine.ts` for centralized event handling

**Lessons Learned:**
- Functional state transformation works well for game engine
- TypeScript's `exactOptionalPropertyTypes` requires careful handling of optional properties
- `LastPlay.claimRank` is `string` type (not `Rank`) - requires type assertions in some places

---

## Priority 2: `game-store.ts` ✅ COMPLETED (2025-01-27)

**Previous state:** Single Zustand store with all game state and actions (537 lines).

**Current state:** Modularized into 6 Zustand slices (455 lines main file).

### Implementation Result

```
apps/web/src/store/
├── game-store.ts           (455 lines) - Main store, combines slices ✅
└── slices/
    ├── game-state-slice.ts (41 lines)  - Core game state ✅
    ├── player-slice.ts     (27 lines)  - Player configs ✅
    ├── ui-slice.ts         (103 lines) - UI state, modals, overlays ✅
    ├── event-slice.ts      (29 lines)  - Event handling ✅
    ├── bot-slice.ts        (28 lines)  - Bot instances, speed control ✅
    └── debug-slice.ts      (26 lines)  - Debug/spectator mode ✅
```

**Result:** Reduced from 537 to 455 lines (-82 lines, -15% reduction)

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

### Implementation Notes

**Approach Used:**
1. ✅ Identified logical groupings of state and actions
2. ✅ Created slice files with `StateCreator` pattern
3. ✅ Combined slices in main store using spread operator
4. ✅ Maintained type safety with proper slice composition via interface extension

**Key Design Decisions:**
- Used Zustand's `StateCreator` pattern for clean slice composition
- Maintained backward compatibility: public API unchanged
- Game actions (startGame, playCards, etc.) kept in main store for complex logic
- Slice actions are simple setters, complex logic remains in main store

**Lessons Learned:**
- Zustand slices work well for organizing large stores
- Interface extension (`GameStore extends GameStateSlice, PlayerSlice, ...`) provides clean type composition
- Complex actions that need multiple slices can stay in main store
- Simple state updates work well in slices

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

1. **Phase 1: game-store.ts** ✅ COMPLETED (2025-01-27)
   - Zustand slices are well-established pattern
   - Improves developer experience immediately
   - ✅ Successfully completed with all tests passing

2. **Phase 2: StartScreen.tsx** (Medium impact, low effort)
   - UI components are easy to extract
   - No state management complexity
   - Good practice for component composition

3. **Phase 3: game-engine.ts** ✅ COMPLETED (2025-01-27)
   - Most complex refactoring
   - Requires careful testing
   - ✅ Successfully completed with all tests passing

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


