# Multi-Player Ranking & Play-to-End Plan

## Overview

Currently, the game ends immediately when the first player empties their hand. This plan outlines the changes required to continue the game until a single "loser" remains (the "Valepaska"), allowing for a full ranking of all players and a point scoring system.

## 1. Core Logic Changes (`@valepaska/core`)

### 1.1 Game State Updates
Modify `GameState` to track finished players and their standings.

```typescript
// packages/core/src/types/game-state.ts

export interface PlayerStanding {
  playerId: PlayerId;
  position: number; // 1 = 1st place (Winner), 2 = 2nd, etc.
  score: number;
  finishedAtRound: number;
}

export interface GameState {
  // ... existing fields
  
  // Replace 'winnerId' with 'standings'
  standings: PlayerStanding[];
  
  // Track who is still playing
  activePlayerIds: PlayerId[];
}
```

### 1.2 Winning vs. Finishing
Split the concept of "Game Over" from "Player Finished".

*   **Current:** `checkForWin` -> if hand empty -> `GAME_OVER`
*   **New:** `checkForFinish` -> if hand empty -> Player status = FINISHED -> Game continues

### 1.3 Turn Management (`turn-manager.ts`)
The turn rotation logic must skip players who have finished.

*   Update `advanceTurn`: Find the next *active* player in the rotation.
*   Update `getNextPlayerId`: Must return the next *active* player.

### 1.4 End Condition
The game ends when:
1.  Only **one player** remains active (The Loser / "Valepaska").
2.  OR all hands are empty (rare draw scenario).

The last player is automatically assigned the last position.

## 2. Scoring System

We will implement a dynamic scoring system based on the number of players.

### Formula
$$ Score = (TotalPlayers - Position) \times 100 + (Bonus) $$

### Example (4 Players)
| Position | Base Score | Description |
|----------|------------|-------------|
| 1st      | 300        | Winner |
| 2nd      | 200        | Runner-up |
| 3rd      | 100        | Safe |
| 4th      | 0          | **Valepaska** (Loser) |

*Optional Bonus:* +50 points for finishing without drawing any cards from the deck (perfect game).

## 3. Implementation Steps

### Phase 1: Core Engine Refactoring

1.  **Update Types:** Modify `GameState` to include `standings` and `activePlayerIds`.
2.  **Refactor `checkWinCondition`:** Rename to `checkFinishCondition`.
3.  **Update `game-engine.ts`:**
    *   When a player finishes:
        *   Add to `standings`.
        *   Remove from `activePlayerIds`.
        *   Emit `PLAYER_FINISHED` event (instead of `PLAYER_WON`).
        *   If `activePlayerIds.length > 1`, continue game.
        *   If `activePlayerIds.length === 1`, end game (`GAME_OVER`).
4.  **Update `turn-manager.ts`:** Ensure `advanceTurn` skips IDs not in `activePlayerIds`.

### Phase 2: Web UI Updates (`apps/web`)

1.  **Game Store:** Handle `PLAYER_FINISHED` event.
2.  **Game Table:**
    *   Visually mark finished players (e.g., dim avatar, show "1st Place" badge).
    *   Do not show cards for finished players.
    *   Skip finished players in turn indicators.
3.  **Game Over Screen:**
    *   Replace single winner display with a **Leaderboard Table**.
    *   Show Rank, Player Name, Score.
    *   Highlight the "Valepaska" (Loser).

### Phase 3: Bot Adjustments (`@valepaska/bots`)

1.  Bots need to know they are playing against fewer opponents.
2.  `PlayerObservation` should indicate which players are still active.
3.  Bots should not try to challenge finished players (logic usually prevents this, but explicit check needed).

## 4. API Changes (Internal)

### Events
*   **New Event:** `PLAYER_FINISHED`
    ```typescript
    {
      type: 'PLAYER_FINISHED',
      playerId: string,
      position: number,
      handSize: 0
    }
    ```
*   **Modified Event:** `GAME_OVER`
    ```typescript
    {
      type: 'GAME_OVER',
      standings: PlayerStanding[],
      totalRounds: number
    }
    ```

## 5. Future Considerations

*   **League Mode:** Accumulate scores across multiple games.
*   **Elo Rating:** For matchmaking in future online versions.

