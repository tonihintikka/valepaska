# Valepaska - Modular Implementation Plan

## Project Overview

**Technologies (December 2025 Best Practices):**
- **Runtime:** Node.js 22 LTS + Browser (ESM dual-build)
- **Language:** TypeScript 5.7 (strict mode)
- **Build:** Vite 6 (library mode + app mode)
- **Testing:** Vitest 3 + Cucumber.js (BDD)
- **Linting:** ESLint 9 (flat config) + Prettier
- **Package Manager:** pnpm 9
- **Deploy:** Vercel (Edge-ready)

---

## Module Structure

```
valepaska/
├── packages/
│   ├── core/                    # Module 1: Game Engine
│   │   ├── src/
│   │   │   ├── types/           # Types and interfaces
│   │   │   ├── engine/          # Game logic
│   │   │   ├── rules/           # Rules
│   │   │   └── utils/           # Utilities (RNG, cards)
│   │   ├── tests/
│   │   │   ├── unit/            # Unit tests
│   │   │   └── features/        # BDD Gherkin features
│   │   └── package.json
│   │
│   ├── bots/                    # Module 2: Rule-based Bots
│   │   ├── src/
│   │   │   ├── RuleBot.ts
│   │   │   ├── presets/
│   │   │   └── strategies/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── simulator/               # Module 3: CLI Simulator
│       ├── src/
│       │   ├── cli.ts
│       │   └── reporter.ts
│       └── package.json
│
├── apps/
│   └── web/                     # Module 4: Web UI (optional)
│       ├── src/
│       └── package.json
│
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   ├── RULES.md
│   └── features/                # BDD Feature files
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.workspace.ts
├── vercel.json
└── README.md
```

---

## Implementation Phases

### PHASE 1: Project Foundation
**Duration:** 1-2 hours

| Task | Description |
|------|-------------|
| 1.1 | Create monorepo structure (`pnpm-workspace.yaml`) |
| 1.2 | Configure TypeScript (strict, ESM, path aliases) |
| 1.3 | Configure Vitest (workspace mode) + Cucumber.js |
| 1.4 | Configure ESLint 9 + Prettier |
| 1.5 | Create Vercel configuration (`vercel.json`) |
| 1.6 | Write README (run instructions, deploy) |

**Deliverables:**
- Working monorepo
- `pnpm install && pnpm build && pnpm test` works

---

### PHASE 2: Core Types (packages/core/src/types/)
**Duration:** 1-2 hours

| File | Content |
|------|---------|
| `card.ts` | `Suit`, `Rank`, `Card`, `CardId` |
| `game-state.ts` | `GameState`, `GamePhase`, `GameConfig` |
| `observation.ts` | `PlayerObservation` (restricted view) |
| `moves.ts` | `Move`, `PlayMove` |
| `events.ts` | `GameEvent` (PLAY_MADE, CHALLENGE_*, PILE_BURNED, etc.) |
| `player.ts` | `Player`, `PlayerType`, `BotDifficulty` |
| `claim.ts` | `Claim`, `ClaimHistory` |

**Critical Types:**

```typescript
// Rank order: 3 < 4 < ... < K < A < 2
type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

interface GameState {
  readonly phase: GamePhase;
  readonly players: Player[];
  readonly hands: Map<PlayerId, Card[]>;
  readonly drawPile: Card[];
  readonly tablePile: Card[];  // Actual cards (hidden)
  readonly burnPile: Card[];
  readonly claimHistory: Claim[];
  readonly lastClaim: Claim | null;
  readonly currentPlayerIndex: number;
  readonly config: GameConfig;
  readonly rngState: RngState;
}

interface PlayerObservation {
  readonly playerId: PlayerId;
  readonly hand: Card[];           // Only own hand
  readonly otherHandSizes: Map<PlayerId, number>;
  readonly drawPileSize: number;
  readonly tablePileSize: number;
  readonly claimHistory: Claim[];  // Last N claims
  readonly lastClaim: Claim | null;
  readonly validClaimRanks: Rank[];  // What can be claimed
  readonly isEndgame: boolean;       // Draw pile empty
}
```

---

### PHASE 3: Utility Functions (packages/core/src/utils/)
**Duration:** 1-2 hours

| File | Content |
|------|---------|
| `rng.ts` | Seeded PRNG (e.g., xoshiro128++) |
| `deck.ts` | `createDeck()`, `shuffleDeck(deck, rng)` |
| `rank-utils.ts` | `compareRanks()`, `isValidNextClaim()`, `RANK_ORDER` |
| `card-utils.ts` | `groupByRank()`, `findCardsOfRank()` |

**Tests:**
- RNG produces same sequence with same seed
- Rank comparison works correctly (especially 2 > A > K)

---

### PHASE 4: Rules Module (packages/core/src/rules/)
**Duration:** 2-3 hours

| File | Content |
|------|---------|
| `claim-rules.ts` | `isValidClaim()`, `getValidClaimRanks()` |
| `burn-rules.ts` | `shouldBurn()`, `checkFourInRow()` |
| `challenge-rules.ts` | `resolveChallenge()` |
| `game-rules.ts` | `checkWinCondition()`, `getNextPlayer()` |

**Critical Rules:**

```typescript
// After 2, only 2/10/A allowed
function getValidClaimRanks(lastClaim: Claim | null): Rank[] {
  if (!lastClaim) return ALL_RANKS;
  if (lastClaim.rank === '2') return ['2', '10', 'A'];
  return RANKS_GTE[lastClaim.rank]; // Same or higher
}

// Burn rules
function shouldBurn(claim: Claim, claimHistory: Claim[]): BurnReason | null {
  if (claim.rank === '10') return 'TEN';
  if (claim.rank === 'A') return 'ACE';
  if (checkFourInRow(claimHistory, claim)) return 'FOUR_IN_ROW';
  return null;
}
```

---

### PHASE 5: Game Engine (packages/core/src/engine/)
**Duration:** 4-6 hours (most critical phase)

| File | Content |
|------|---------|
| `game-engine.ts` | Main class `GameEngine` |
| `action-handlers.ts` | `handlePlay()`, `handleChallenge()` |
| `state-manager.ts` | Immutable state updates |
| `event-emitter.ts` | Event log |
| `observation-factory.ts` | `createObservation(state, playerId)` |

**GameEngine API:**

```typescript
class GameEngine {
  // Creation
  static create(config: GameConfig, seed: number): GameEngine;
  
  // State
  getState(): GameState;  // Full state (internal use only)
  getObservation(playerId: PlayerId): PlayerObservation;
  getEventLog(): readonly GameEvent[];
  
  // Moves
  submitMove(playerId: PlayerId, move: Move): void;
  submitChallengeDecision(playerId: PlayerId, challenge: boolean): void;
  
  // Phase management
  getCurrentPhase(): GamePhase;
  getWinner(): PlayerId | null;
  
  // Bots
  registerBot(playerId: PlayerId, bot: Bot): void;
  tick(): void;  // Process next bot move
}

enum GamePhase {
  WAITING_FOR_PLAY,       // Waiting for player move
  WAITING_FOR_CHALLENGES, // Challenge window open
  RESOLVING_CHALLENGE,    // Challenge being resolved
  GAME_OVER
}
```

**Determinism:**
- All randomness through seeded RNG
- Challengers selected by priority order (next player first)
- Event log is complete and reproducible

---

### PHASE 6: Bot Interface (packages/bots/src/)
**Duration:** 3-4 hours

| File | Content |
|------|---------|
| `bot.interface.ts` | `Bot` interface |
| `RuleBot.ts` | Main class |
| `move-generator.ts` | Candidate move generation |
| `move-scorer.ts` | Move scoring |
| `challenge-evaluator.ts` | Challenge decision logic |
| `memory.ts` | Reputation memory |
| `presets/` | Easy, Normal, Hard, Pro |

**Bot Interface:**

```typescript
interface Bot {
  chooseMove(obs: PlayerObservation): PlayMove;
  shouldChallenge(obs: PlayerObservation, claim: Claim): boolean;
  onEvent(event: GameEvent): void;  // Memory update
}

interface BotConfig {
  bluffRate: number;           // 0-1
  burnBluffRate: number;       // 0-1
  maxCardsToPlay: number;      // 1-4
  challengeThreshold: number;  // Suspicion score threshold
  pileFearFactor: number;      // Table pile fear
  endgameAggro: number;        // Endgame aggression
  memoryLevel: 0 | 1 | 2;      // 0=none, 1=basic, 2=full
}
```

**Presets:**

| Level | bluffRate | burnBluffRate | challengeThreshold | pileFearFactor | endgameAggro | memory |
|-------|-----------|---------------|-------------------|----------------|--------------|--------|
| Easy | 0.05 | 0.00 | 3.4 | 1.2 | 0.3 | 0 |
| Normal | 0.20 | 0.05 | 2.7 | 1.0 | 0.6 | 1 |
| Hard | 0.35 | 0.15 | 2.2 | 0.8 | 0.9 | 2 |
| Pro | 0.45 | 0.25 | 1.9 | 0.7 | 1.2 | 2 |

---

### PHASE 7: Simulator (packages/simulator/)
**Duration:** 2-3 hours

| File | Content |
|------|---------|
| `cli.ts` | Commander.js CLI |
| `runner.ts` | Game runner |
| `stats.ts` | Statistics collection |
| `reporter.ts` | Results formatting |

**CLI:**

```bash
pnpm simulate --games 10000 --players 4 --bots Easy,Normal,Hard,Pro
pnpm simulate --games 1000 --players 3 --bots Pro,Pro,Pro --seed 12345
```

---

### PHASE 8: Tests (all modules)
**Duration:** 3-4 hours

| Test Class | Description |
|------------|-------------|
| `*.feature` | BDD Gherkin scenarios |
| `rules.test.ts` | All rules |
| `engine.test.ts` | Engine integration |
| `bot.test.ts` | Bot decisions |
| `simulation.test.ts` | E2E game simulation |
| `determinism.test.ts` | Same seed → same result |

---

### PHASE 9: Vercel Deploy & README
**Duration:** 1 hour

**vercel.json:**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "apps/web/dist",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

---

## Dependency Diagram

```
┌─────────────────────────┐
│    @valepaska/core      │
│ (types, rules, engine)  │
└───────────┬─────────────┘
            │
            ▼
┌───────────────────┐     ┌─────────────────────┐
│  @valepaska/bots  │◄────│ @valepaska/simulator│
│    (RuleBot)      │     │       (CLI)         │
└───────────┬───────┘     └─────────────────────┘
            │
            ▼
┌───────────────────┐
│  @valepaska/web   │ (optional)
│      (UI)         │
└───────────────────┘
```

---

## Time Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Project foundation | 1-2h | 2h |
| 2. Core types | 1-2h | 4h |
| 3. Utility functions | 1-2h | 6h |
| 4. Rules module | 2-3h | 9h |
| 5. Game engine | 4-6h | 15h |
| 6. Bots | 3-4h | 19h |
| 7. Simulator | 2-3h | 22h |
| 8. Tests | 3-4h | 26h |
| 9. Deploy & README | 1h | **27h** |

---

## Testing Strategy

### BDD Testing with Gherkin

All game rules are specified as Gherkin feature files in `docs/features/` and implemented as automated tests. This ensures:

1. **Living Documentation:** Feature files serve as executable specifications
2. **Full Coverage:** Every rule has corresponding test scenarios
3. **Regression Prevention:** All edge cases are captured and tested

### Test Execution

```bash
# Run all tests
pnpm test

# Run only BDD tests
pnpm test:bdd

# Run unit tests
pnpm test:unit

# Run with coverage
pnpm test:coverage
```



