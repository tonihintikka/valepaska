# Valepaska - Game Rules

## Overview

Valepaska ("Bullshit" in Finnish) is a bluffing card game for 3-6 players. Players play cards face-down and claim a rank. Other players can challenge ("Lie!") if they think the claim is false.

---

## 1. Deck and Deal

- Standard 52-card deck, no jokers
- 3-6 players
- Each player is dealt 5 cards at the start
- Remaining cards form the draw pile (face down)

---

## 2. Hand Replenishment ("Always 5 cards")

- **While draw pile has cards:**
  - After each turn, player draws back up to 5 cards (if hand < 5)
  
- **When draw pile is empty:**
  - No replenishment; goal is to empty your hand

---

## 3. Basic Turn Action (PLAY)

- Player plays 1-4 cards face-down onto the table pile
- Player announces a **claim**: `claimRank` (what rank they allegedly played) and `count` (how many)
- Player may **lie**: claimed rank doesn't have to match actual cards

---

## 4. Claim Validity and Progression

- There is a `lastClaimRank` (previous valid claim)
- New `claimRank` must be **same or higher** than `lastClaimRank`

### Rank Order (lowest to highest)
```
3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2
```

- When table burns, `lastClaimRank` resets → next claim can be anything

### Starting Claim Rule
- **While deck has cards:** First claim must be a **number card (3-10)**
- **When deck is empty:** Any rank is allowed
- Exception: If hand has only face cards (J, Q, K, A, 2) and deck is empty, any rank is allowed

### Face Card Restriction
- **J, Q, K** can only be claimed after `lastClaimRank >= 7`
- **10, A, 2** are special ranks and can always be claimed (when rank progression allows)

### Special Rule: 2 is a Wildcard
- **2 can be claimed anytime** (regardless of lastClaimRank)
- **After 2, only 2 is valid** - once someone claims 2, only 2 can be claimed next

---

## 5. Challenge ("Lie!")

After a PLAY, other players may challenge:

1. **Challenge window opens** after each PLAY
2. Any player can challenge (priority order: next player first)
3. Last played cards are revealed

### Challenge Resolution

**If claim was TRUE (cards match claim):**
- Challenger picks up the entire table pile
- Claimer continues (gets another turn on empty/same table)

**If claim was LIE (cards don't match claim):**
- Claimer picks up the entire table pile
- Turn passes to next player (liar loses continuation)

---

## 6. Burns (Table Clears)

Burns clear the table (cards go to burn pile, out of game).

Burns trigger only if the claim is **accepted** (no challenge, or challenged and true).

### Burn Conditions

1. **10 burns:** If `claimRank == 10` and accepted → table burns
2. **A burns:** If `claimRank == A` and accepted → table burns
3. **Four consecutive same rank burns:** If last 4 accepted claims have same rank → table burns

### After Burn
- Player who caused burn continues (plays to empty table)
- `lastClaimRank` resets

---

## 7. Winning

- **While draw pile has cards:** Hands replenish to 5, game continues
- **When draw pile is empty:** First player to empty their hand wins
- **Final challenge:** Other players may still challenge the final play before win is confirmed

---

## 8. Summary Table

| Rule | Description |
|------|-------------|
| Rank order | 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K < A < 2 |
| Starting claim | Number card (3-10) or 2 while deck has cards |
| Face cards (J,Q,K) | Only after reaching 7 or higher |
| 2 wildcard | Can be claimed anytime |
| After 2 | Only 2 allowed |
| 10 burns | Table clears on accepted 10 |
| A burns | Table clears on accepted A |
| 4-in-row burns | Table clears on 4 same consecutive claims |
| True claim challenged | Challenger picks up pile, claimer continues |
| Lie challenged | Liar picks up pile, turn passes |
| Hand size | Always 5 while draw pile has cards |
| Win condition | Empty hand when draw pile is empty |

