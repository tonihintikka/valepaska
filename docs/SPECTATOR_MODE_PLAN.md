# Spectator Mode Implementation Plan

## Overview

Implement a spectator mode where users can watch AI players compete with full visibility of all cards, plus improved victory announcements.

## Goals

1. **Phase 1** (Current): Show all AI players' cards in spectator mode
2. **Phase 2** (Current): Clear in-game victory announcement
3. **Phase 3** (Future): Play until loser is determined with rankings

---

## Phase 1: Visible AI Cards

### Requirements

- When `isSpectator: true`, all AI players' hands should be visible
- Cards should be displayed face-up in opponent slots
- Real-time updates as cards are played/drawn

### Technical Changes

#### 1. Store Changes (`game-store.ts`)

```typescript
interface GameStore {
  // Add full game state for spectator mode
  gameState: GameState | null;
  
  // Existing
  isSpectator: boolean;
}

// In updateObservation():
updateObservation: () => {
  const { engine, isSpectator } = get();
  if (!engine) return;
  
  // Store full state for spectator mode
  if (isSpectator) {
    set({ gameState: engine.getState() });
  }
  // ... existing observation logic
}
```

#### 2. GameTable Changes (`GameTable.tsx`)

```typescript
// Get hands from full state when spectator
const gameState = useGameStore((state) => state.gameState);
const isSpectator = useGameStore((state) => state.isSpectator);

// In OpponentSlot, add cards prop:
interface OpponentSlotProps {
  // ... existing props
  cards?: readonly Card[];  // Actual cards (spectator mode)
}

// Render actual cards when available:
{cards ? (
  <div className="flex gap-1">
    {cards.map((card) => (
      <MiniCard key={card.id} card={card} />
    ))}
  </div>
) : (
  // Existing card back rendering
)}
```

#### 3. New Component: MiniCard (`MiniCard.tsx`)

Small card component for opponent hands:
- Size: ~40x56px (smaller than player cards)
- Shows rank and suit
- Subtle styling to not distract from main game

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/store/game-store.ts` | Add `gameState`, update in `updateObservation` |
| `apps/web/src/components/GameTable.tsx` | Pass cards to OpponentSlot in spectator mode |
| `apps/web/src/components/MiniCard.tsx` | New component for small visible cards |
| `apps/web/src/types/index.ts` | Import Card type from core |

---

## Phase 2: Victory Announcement

### Requirements

- When a player wins, show prominent in-game overlay
- Display winner's name, avatar, and "WINS!" text
- Celebration animation (confetti/particles)
- 2-3 second display before transitioning to GameOverScreen

### Technical Changes

#### 1. New Component: VictoryOverlay (`VictoryOverlay.tsx`)

```typescript
interface VictoryOverlayProps {
  winnerId: PlayerId;
  winnerName: string;
  winnerAvatar?: string;
  onComplete: () => void;
}

// Features:
// - Full-screen overlay with blur backdrop
// - Large animated trophy icon
// - Winner name with gold text
// - Confetti particle effect
// - Auto-dismiss after 3 seconds
```

#### 2. GameScreen Changes

```typescript
// Add victory overlay state
const [showVictoryOverlay, setShowVictoryOverlay] = useState(false);
const [pendingWinnerId, setPendingWinnerId] = useState<PlayerId | null>(null);

// When PLAYER_WON event occurs:
// 1. Show VictoryOverlay
// 2. After 3 seconds, transition to gameOver phase
```

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/components/VictoryOverlay.tsx` | New component |
| `apps/web/src/screens/GameScreen.tsx` | Show overlay before GameOverScreen |
| `apps/web/src/store/game-store.ts` | Add intermediate victory state |

---

## Phase 3: Play Until Loser (Future)

### Requirements

- Game continues after first winner until only 1 player remains
- Track finishing order (1st, 2nd, 3rd... last = loser)
- Show rankings in game over screen
- May require AI reward adjustments

### Considerations

- **Core Engine Changes**: Currently game ends on first winner
- **AI Impact**: Bots may need strategy adjustments for playing beyond winning
- **UI**: Need to show eliminated players and current rankings during play

### Not in Current Scope

This phase requires significant core engine changes and is planned for future implementation.

---

## Implementation Order

1. ✅ Create plan and BDD specs
2. [ ] Phase 1: Implement `gameState` in store
3. [ ] Phase 1: Create `MiniCard` component
4. [ ] Phase 1: Update `OpponentSlot` to show cards
5. [ ] Phase 2: Create `VictoryOverlay` component
6. [ ] Phase 2: Integrate overlay in `GameScreen`
7. [ ] Testing and polish

---

## Design Notes

### MiniCard Styling

- Background: Same gradient as main cards
- Border: Subtle gold/ice accent
- Text: Rank and suit clearly visible
- Hover: No interaction (display only)

### Victory Overlay Styling

- Background: Semi-transparent dark with blur
- Trophy: Large animated emoji or SVG
- Text: Gold color, large serif font ("WINS!")
- Animation: Spring entrance, confetti particles
- Duration: 3 seconds auto-dismiss

---

## Testing

See `docs/features/spectator-mode.feature` for BDD scenarios.

Key test cases:
1. All AI hands visible in spectator mode
2. Human mode does NOT show opponent cards
3. Victory overlay appears on win
4. Overlay transitions to game over screen

