# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Refactored

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

