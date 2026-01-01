# Valepaska Web UI - Design Plan

## Technology Stack (December 2025 Best Practices)

### Core Technologies
- **Framework:** React 19 with Server Components
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS 4 + CSS Variables
- **Animations:** Framer Motion 12
- **State Management:** Zustand 5 (lightweight, perfect for game state)
- **Type Safety:** TypeScript 5.7 strict

### Why These Choices?
- **React 19:** Concurrent features, improved suspense, better performance
- **Vite 6:** Lightning-fast HMR, optimized builds, native ESM
- **Tailwind 4:** New engine, CSS-first configuration, better performance
- **Framer Motion:** Best-in-class React animations, gesture support
- **Zustand:** Minimal boilerplate, excellent TypeScript support, perfect for game state

---

## Design Philosophy

### Visual Theme: "Nordic Noir Casino"
A sophisticated dark theme inspired by Finnish design aesthetics - minimalist, functional, with subtle warmth.

### Color Palette
```css
:root {
  /* Background layers */
  --bg-deep: #0a0a0f;        /* Deepest background */
  --bg-felt: #0f1419;        /* Card table felt */
  --bg-surface: #1a1f2e;     /* Card/UI surfaces */
  --bg-elevated: #252b3b;    /* Elevated elements */
  
  /* Accent colors */
  --accent-gold: #d4af37;    /* Primary accent - warm gold */
  --accent-copper: #b87333;  /* Secondary accent */
  --accent-ice: #7dd3fc;     /* Highlight/selection */
  
  /* Semantic colors */
  --success: #22c55e;        /* Honest play, win */
  --danger: #ef4444;         /* Bluff caught, challenge */
  --warning: #f59e0b;        /* Caution, burn warning */
  
  /* Card suits */
  --hearts: #dc2626;
  --diamonds: #dc2626;
  --clubs: #1e293b;
  --spades: #1e293b;
  
  /* Text */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #475569;
}
```

### Typography
- **Primary Font:** "Geist" (Vercel's new font) - Clean, modern, excellent readability
- **Card Numbers:** "Geist Mono" - Monospace for alignment
- **Accent/Headers:** "Playfair Display" - Elegant serif for titles

### Design Principles
1. **Information Hierarchy:** Critical game info always visible
2. **Reduced Cognitive Load:** Clear visual states for all game phases
3. **Satisfying Feedback:** Every action has visual + audio feedback
4. **Accessibility:** WCAG 2.2 AA compliant, keyboard navigable

---

## UI Components

### 1. Game Table (Main View)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                    Round 5           [Settings] [?] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                      │
│     Bot 2 (5)      │   TABLE PILE    │      Bot 3 (3)       │
│     [avatar]       │    12 cards     │      [avatar]        │
│                    │   Last: "3x 7"  │                      │
│                    └─────────────────┘                      │
│                                                             │
│  Bot 1 (7)                                     Bot 4 (2)    │
│  [avatar]              [BURN PILE]             [avatar]     │
│                          (8)                    ⚠️ Low!     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     YOUR HAND (5 cards)                     │
│    ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                      │
│    │ 7♥ │ │ 7♦ │ │ K♠ │ │ 3♣ │ │ 9♦ │                      │
│    └────┘ └────┘ └────┘ └────┘ └────┘                      │
│           [Selected: 2]  [PLAY] [Claim: 7 ▼]               │
├─────────────────────────────────────────────────────────────┤
│  📜 Game Log                              [CHALLENGE!] 🔥   │
│  "Bot 2 played 2 cards, claimed 7"                         │
└─────────────────────────────────────────────────────────────┘
```

### 2. Card Component
- **Size:** 80x112px (standard poker ratio 2.5:3.5)
- **States:** Default, Hover, Selected, Disabled, Face-down
- **Animations:**
  - Hover: Subtle lift (translateY -4px, shadow increase)
  - Select: Golden glow border, slight scale (1.05)
  - Play: Fly to table with rotation
  - Draw: Slide in from deck

### 3. Player Avatars
- Circular with difficulty-based colors:
  - Easy: Green ring
  - Normal: Blue ring
  - Hard: Orange ring
  - Pro: Red ring with glow
- Hand size badge
- Turn indicator (pulsing glow)
- "Thinking" animation for bots

### 4. Challenge Button
- Large, prominent, red
- Pulses when challenge window is open
- Timer countdown visual
- Satisfying "slam" animation on click

### 5. Claim Selector
- Dropdown showing valid ranks only
- Visual indication of burn ranks (10, A)
- "After 2" restriction clearly shown

### 6. Game Log
- Scrollable history
- Color-coded entries:
  - Play: White
  - Challenge: Red
  - Burn: Orange with flame icon
  - Win: Gold

---

## Screen Flow

### 1. Start Screen
```
┌─────────────────────────────────────────┐
│                                         │
│            🃏 VALEPASKA                  │
│         "The Art of Deception"          │
│                                         │
│     ┌─────────────────────────────┐     │
│     │     👤 Players: [3-6]       │     │
│     │                             │     │
│     │  You vs:                    │     │
│     │  [x] Easy Bot               │     │
│     │  [x] Normal Bot             │     │
│     │  [x] Hard Bot               │     │
│     │  [ ] Pro Bot                │     │
│     └─────────────────────────────┘     │
│                                         │
│          [ START GAME ]                 │
│                                         │
│     [Rules]  [Settings]  [Stats]        │
└─────────────────────────────────────────┘
```

### 2. Game Screen (Main)
- See Game Table layout above

### 3. Challenge Modal
```
┌─────────────────────────────────────┐
│                                     │
│    🔍 Bot 2 claims: 3x Seven        │
│                                     │
│         Do you believe it?          │
│                                     │
│   [  ACCEPT  ]    [ CHALLENGE! ]    │
│                     (5s remaining)  │
│                                     │
└─────────────────────────────────────┘
```

### 4. Challenge Result Modal
```
┌─────────────────────────────────────┐
│                                     │
│          🎭 REVEALED!               │
│                                     │
│     Claimed: 3x Seven               │
│     Actual:  7♥ 7♦ 3♣               │
│                                     │
│         ❌ IT WAS A LIE!            │
│                                     │
│    Bot 2 picks up 15 cards          │
│                                     │
│          [ CONTINUE ]               │
└─────────────────────────────────────┘
```

### 5. Game Over Screen
```
┌─────────────────────────────────────┐
│                                     │
│         🏆 GAME OVER 🏆             │
│                                     │
│          YOU WIN!                   │
│                                     │
│     Final Standings:                │
│     1. You - 0 cards                │
│     2. Bot 3 - 2 cards              │
│     3. Bot 1 - 5 cards              │
│     4. Bot 2 - 12 cards             │
│                                     │
│   [PLAY AGAIN]    [MAIN MENU]       │
│                                     │
└─────────────────────────────────────┘
```

---

## Animation Specifications

### Card Animations
| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Card hover | 150ms | ease-out | Lift + shadow |
| Card select | 200ms | spring | Scale + glow |
| Card play | 400ms | ease-in-out | Fly to table + flip |
| Card draw | 300ms | ease-out | Slide from deck |
| Card fan | 200ms | ease-out | Spread hand |

### UI Animations
| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| Modal appear | 250ms | spring | Scale from center |
| Button press | 100ms | ease-out | Scale down 0.95 |
| Turn indicator | 1000ms | ease-in-out | Pulse loop |
| Burn effect | 600ms | ease-out | Flame particles |

### Sound Effects (Optional)
- Card play: Soft "thwap"
- Challenge: Dramatic "slam"
- Burn: Whoosh + crackle
- Win: Triumphant chord
- Lose: Sad trombone (subtle)

---

## State Management Architecture

```typescript
// stores/gameStore.ts
interface GameStore {
  // Game state (from engine)
  engine: GameEngine | null;
  observation: PlayerObservation | null;
  
  // UI state
  selectedCards: CardId[];
  claimRank: Rank | null;
  phase: 'setup' | 'playing' | 'challenging' | 'result' | 'gameover';
  
  // Settings
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  
  // Actions
  startGame: (config: GameSetup) => void;
  selectCard: (cardId: CardId) => void;
  playCards: () => void;
  challenge: () => void;
  passchallenge: () => void;
}
```

---

## Component Structure

```
apps/web/src/
├── main.tsx
├── App.tsx
├── index.css              # Tailwind + CSS variables
│
├── components/
│   ├── cards/
│   │   ├── Card.tsx       # Single card
│   │   ├── CardHand.tsx   # Player's hand
│   │   ├── CardPile.tsx   # Table/burn pile
│   │   └── CardBack.tsx   # Face-down card
│   │
│   ├── game/
│   │   ├── GameTable.tsx  # Main game layout
│   │   ├── PlayerSlot.tsx # Bot/player avatar
│   │   ├── ClaimSelector.tsx
│   │   ├── ChallengeButton.tsx
│   │   └── GameLog.tsx
│   │
│   ├── modals/
│   │   ├── ChallengeModal.tsx
│   │   ├── ResultModal.tsx
│   │   └── GameOverModal.tsx
│   │
│   ├── screens/
│   │   ├── StartScreen.tsx
│   │   ├── GameScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Badge.tsx
│
├── stores/
│   └── gameStore.ts       # Zustand store
│
├── hooks/
│   ├── useGame.ts         # Game logic hook
│   ├── useAnimation.ts    # Animation utilities
│   └── useSound.ts        # Sound effects
│
└── lib/
    ├── sounds.ts          # Sound management
    └── constants.ts       # Game constants
```

---

## Responsive Design

### Breakpoints
- **Mobile:** < 640px (portrait cards, stacked layout)
- **Tablet:** 640-1024px (smaller cards, adjusted spacing)
- **Desktop:** > 1024px (full experience)

### Mobile Adaptations
- Cards in horizontal scroll
- Bottom sheet for claim selector
- Simplified table view
- Larger touch targets

---

## Performance Considerations

1. **Card Images:** SVG for scalability, lazy load
2. **Animations:** GPU-accelerated (transform, opacity only)
3. **State Updates:** Batched, minimal re-renders
4. **Bot Thinking:** Web Worker for AI calculations
5. **Sound:** Preloaded, Web Audio API

---

## Accessibility

1. **Keyboard Navigation:**
   - Tab through cards
   - Enter to select/play
   - Space for challenge
   - Escape to cancel

2. **Screen Reader:**
   - ARIA labels on all interactive elements
   - Game state announcements
   - Card descriptions

3. **Visual:**
   - High contrast mode
   - Reduced motion option
   - Color-blind friendly indicators

---

## Implementation Phases

### Phase 1: Core Game UI (4-6 hours)
- [ ] Project setup (Vite + React + Tailwind)
- [ ] Card components
- [ ] Game table layout
- [ ] Basic game flow

### Phase 2: Polish & Animations (2-3 hours)
- [ ] Framer Motion integration
- [ ] Card animations
- [ ] Modal transitions
- [ ] Turn indicators

### Phase 3: Game Flow (2-3 hours)
- [ ] Challenge system UI
- [ ] Result displays
- [ ] Game over screen
- [ ] Start screen

### Phase 4: Final Polish (1-2 hours)
- [ ] Sound effects (optional)
- [ ] Settings
- [ ] Mobile responsive
- [ ] Performance optimization

**Total Estimated Time: 9-14 hours**

---

## File Dependencies

```mermaid
graph TD
    A[apps/web] --> B[@valepaska/core]
    A --> C[@valepaska/bots]
    B --> D[Game Engine]
    B --> E[Types]
    C --> F[RuleBot]
```

The web app imports:
- `GameEngine` from @valepaska/core
- `RuleBot` from @valepaska/bots
- All type definitions




