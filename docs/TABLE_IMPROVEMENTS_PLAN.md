# Table UI Improvements Plan

## Current Issues

1. **Draw pile (Nostopino)** - Exists but positioned far right, may be hard to see
2. **Burn pile (Kaatopino)** - Not shown at all
3. **Challenge animation** - No visual reveal of face-down cards
4. **5-player layout** - Need to verify cards display correctly

## Proposed Improvements

### Phase 1: Improve Pile Visibility

**Changes:**
- Move draw pile closer to center
- Add burn pile indicator
- Show both piles clearly with labels

**Layout:**
```
        [Burn Pile]
            🔥
            
    [Draw]  [Table]  
     Pile    Pile
```

### Phase 2: Challenge Reveal Animation

**When challenge is declared:**

1. **Face-down cards on table** → Animate flip to face-up
2. **Show revealed cards** for 2-3 seconds
3. **Result animation:**
   - If LIE: Cards animate toward liar's position
   - If TRUTH: Cards animate toward challenger's position
4. **Clear pile** after animation completes

**Technical Requirements:**
- Track `lastPlayedCards` in store (the cards that were just played)
- Need actual card data from game engine (currently hidden)
- Add `ChallengeRevealOverlay` component

**Store Changes:**
```typescript
interface GameStore {
  // Challenge reveal state
  challengeReveal: {
    isRevealing: boolean;
    revealedCards: Card[];
    wasLie: boolean;
    receiverId: PlayerId; // Who receives the pile
  } | null;
}
```

**Animation Sequence:**
1. Cards flip from back to front (0.5s)
2. Show result text ("Vale!" or "Totta!") (1s)
3. Cards animate to receiver (0.5s)
4. Clear and continue game

### Phase 3: 5-Player Layout Fix

**Current positions for 5 players:**
```typescript
5: ['bottom', 'left', 'top-left', 'top-right', 'right']
```

**Check:**
- Cards don't overflow their containers
- Proper spacing between players
- Current player highlight works correctly

## Implementation Priority

1. **High**: Phase 1 - Pile visibility (simple CSS changes)
2. **Medium**: Phase 3 - 5-player layout verification
3. **Lower**: Phase 2 - Challenge animation (complex, needs engine changes)

## Challenge Animation - Detailed Design

### Required Engine Changes

The game engine currently doesn't expose played cards to spectators. Options:

**Option A: Add event data**
- Extend `CHALLENGE_RESOLVED` event to include `revealedCards: Card[]`
- Minimal change, backwards compatible

**Option B: Expose via observation**
- Add `lastPlayedCards` to PlayerObservation
- More data available but privacy concern for non-spectator mode

**Recommended: Option A** - Only reveal cards during challenge resolution

### UI Components

```
┌─────────────────────────────────────────┐
│           CHALLENGE REVEAL              │
│                                         │
│    ┌───┐ ┌───┐ ┌───┐                   │
│    │ 7 │ │ 7 │ │ 5 │  ← Flipped cards  │
│    │ ♠ │ │ ♥ │ │ ♣ │                   │
│    └───┘ └───┘ └───┘                   │
│                                         │
│         ⚡ VALE! ⚡                      │
│                                         │
│    Hard Bot nostaa pakan               │
└─────────────────────────────────────────┘
```

## Files to Modify

### Phase 1
- `GameTable.tsx` - Reposition piles, add burn pile indicator

### Phase 2
- `packages/core/src/types/events.ts` - Add `revealedCards` to ChallengeResolvedEvent
- `packages/core/src/engine/game-engine.ts` - Include cards in event
- `apps/web/src/store/game-store.ts` - Add challengeReveal state
- `apps/web/src/components/ChallengeRevealOverlay.tsx` - New component
- `apps/web/src/screens/GameScreen.tsx` - Integrate overlay

### Phase 3
- `apps/web/src/types/index.ts` - Verify PLAYER_POSITIONS
- `apps/web/src/components/GameTable.tsx` - Adjust card sizes if needed

