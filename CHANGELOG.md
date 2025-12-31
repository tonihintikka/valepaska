# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Logo Component (2025-12-31)

Added reusable `Logo` component that displays across all game screens:

- **StartScreen**: Gold variant, medium size with title
- **GameScreen**: Light variant, small card icon in top-left corner
- **GameOverScreen**: Dark variant, small size with title at top

**Features:**
- Three sizes: `sm`, `md`, `lg`
- Three color variants: `gold`, `light`, `dark`
- Optional title display
- Animated entrance with Framer Motion
- Hover effects and gold glow
- Joker emoji with corner "V" decorations

**Files Added:**
- `apps/web/src/components/Logo.tsx`
- `docs/screenshot.png` (README screenshot)

---

### Fixed

#### Bot Turn Progression (2025-12-31)

Fixed bug where game would not progress between bot turns.

**Problem:** Bots were created in the store's `bots` Map but not registered with the game engine. When `tick()` was called, it looked for bots in the engine's internal `this.bots` Map which was empty.

**Solution:** Added `engine.registerBot(player.id, bot)` call after creating each bot in `startGame()`.

**Files Changed:**
- `apps/web/src/store/game-store.ts`

---

#### Vercel Deployment (2025-12-31)

Fixed Vercel deployment error "No Output Directory named 'dist' found".

**Problem:** Monorepo structure with pnpm workspaces caused output directory mismatch.

**Solution:** 
- Added `vercel.json` to `apps/web/` directory
- Build command navigates to root for pnpm workspace support
- Root Directory in Vercel set to `apps/web`

**Files Added:**
- `apps/web/vercel.json`

---

### Refactored

#### `game-store.ts` Modularization (2025-01-27)

**Breaking Change:** Internal refactoring - public API unchanged, but Zustand store structure significantly improved.

Split the monolithic `game-store.ts` (537 lines) into focused Zustand slices:

- **`game-state-slice.ts`** (41 lines): Core game state management
  - `uiPhase`, `engine`, `observation`, `gameState`, `winnerId`
  - State setters for engine lifecycle

- **`player-slice.ts`** (27 lines): Player configuration
  - `humanPlayerId`, `playerConfigs`
  - Player management actions

- **`ui-slice.ts`** (103 lines): UI state and modals
  - Card selection (`selectedCards`, `selectedRank`)
  - Challenge modal state
  - Overlays (victory, challenge reveal, active challenge)
  - Processing state (`isProcessingBots`)

- **`event-slice.ts`** (29 lines): Event handling
  - `events` array
  - `addEvent()`, `clearEvents()`

- **`bot-slice.ts`** (28 lines): Bot instances and speed control
  - `bots` Map
  - `gameSpeed` multiplier
  - Bot management actions

- **`debug-slice.ts`** (26 lines): Debug and spectator mode
  - `debugMode`, `isSpectator`
  - Debug controls

**Result:**
- `game-store.ts`: Reduced from 537 to 455 lines (-82 lines, -15%)
- Better separation of concerns using Zustand slice pattern
- Easier to maintain and test individual slices
- Improved type safety with slice composition

**Migration Notes:**
- Public API (`useGameStore` hook) remains unchanged
- All existing components continue to work without modifications
- Internal structure changed, but behavior is identical
- All 166 tests passing

**Files Changed:**
- `apps/web/src/store/game-store.ts` (refactored)
- `apps/web/src/store/slices/game-state-slice.ts` (new)
- `apps/web/src/store/slices/player-slice.ts` (new)
- `apps/web/src/store/slices/ui-slice.ts` (new)
- `apps/web/src/store/slices/event-slice.ts` (new)
- `apps/web/src/store/slices/bot-slice.ts` (new)
- `apps/web/src/store/slices/debug-slice.ts` (new)

---

#### `game-engine.ts` Modularization (2025-01-27)

**Breaking Change:** Internal refactoring - public API unchanged, but internal structure significantly improved.

Split the monolithic `game-engine.ts` (770 lines) into focused, single-responsibility modules:

- **`turn-manager.ts`** (40 lines): Turn advancement and player rotation logic
  - `advanceTurn()`: Advances to next player
  - `getNextPlayerId()`: Gets next player in rotation
  - `getCurrentPlayerId()`: Gets current player ID

- **`hand-manager.ts`** (90 lines): Card dealing and hand replenishment
  - `dealInitialCards()`: Deals cards at game start
  - `replenishAllHands()`: Replenishes all players' hands after turn

- **`play-executor.ts`** (50 lines): Play move execution
  - `executePlay()`: Executes a play move, updates state

- **`challenge-executor.ts`** (164 lines): Challenge resolution logic
  - `executeChallenge()`: Resolves a challenge, handles burn logic
  - `acceptClaim()`: Accepts a claim when no challenge occurs
  - Returns `ChallengeResult` with detailed resolution info

- **`burn-executor.ts`** (48 lines): Burn/pile clearing logic
  - `executeBurn()`: Executes a burn, clears table pile
  - `getBurnEventData()`: Generates burn event data

- **`bot-runner.ts`** (94 lines): Bot integration and challenge decision collection
  - `BotRunner` class: Manages bot challenge decisions
  - `collectChallengeDecisions()`: Collects decisions from all bots
  - `allBotsDecided()`: Checks if all bots have made decisions

**Result:**
- `game-engine.ts`: Reduced from 770 to 550 lines (-220 lines, -29%)
- Better separation of concerns
- Easier to test individual components
- Improved maintainability

**Migration Notes:**
- Public API (`GameEngine` class) remains unchanged
- All existing code continues to work without modifications
- Internal implementation details changed, but behavior is identical
- All 166 tests passing

**Files Changed:**
- `packages/core/src/engine/game-engine.ts` (refactored)
- `packages/core/src/engine/turn-manager.ts` (new)
- `packages/core/src/engine/hand-manager.ts` (new)
- `packages/core/src/engine/play-executor.ts` (new)
- `packages/core/src/engine/challenge-executor.ts` (new)
- `packages/core/src/engine/burn-executor.ts` (new)
- `packages/core/src/engine/bot-runner.ts` (new)
- `packages/core/src/engine/index.ts` (updated exports)

---

## Previous Changes

### Added

- Spectator mode with visible AI player cards
- Victory announcement overlay
- Challenge visualization with card reveal animation
- Game speed control (0.5x, 1x, 2x, 4x) for spectator mode
- Draw pile and discard pile visibility on game table

### Changed

- Burn rules: 10 only burns number cards (3-9), A only burns face cards (J, Q, K)
- Claim progression: 2 is wildcard, after 2 only 2 is valid
- Face card restrictions: J, Q, K only after reaching 7 or higher
- Bot AI: Enhanced strategy for 2-card value recognition

### Fixed

- Fixed game deadlock when claim history wasn't reset after pile pickup
- Fixed burn not triggering when true 10/A claim was challenged
- Fixed spectator mode showing only 3 out of 4 bot hands
- Fixed event log showing undefined values

