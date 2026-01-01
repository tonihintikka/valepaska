# Valepaska - Internationalization (i18n) Plan

## Overview

This document outlines the plan for adding multi-language support to the Valepaska web application. The initial implementation will support Finnish (fi) and English (en), with a structure that makes it easy to add more languages.

## Technology Stack

### Chosen Solution: react-i18next

**Why react-i18next?**
- Industry standard for React internationalization (2025)
- Active development, excellent TypeScript support
- Lightweight (~3KB gzipped)
- Supports namespaces for code splitting
- Built-in language detection
- Compatible with React 19

**Dependencies to install:**
```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

## File Structure

```
apps/web/src/
├── i18n/
│   ├── index.ts              # i18next configuration
│   ├── locales/
│   │   ├── fi/
│   │   │   ├── common.json   # Shared strings
│   │   │   ├── game.json     # Game-specific strings
│   │   │   └── ui.json       # UI elements
│   │   └── en/
│   │       ├── common.json
│   │       ├── game.json
│   │       └── ui.json
│   └── types.ts              # TypeScript types for translations
```

## Namespace Organization

### 1. `common` - Shared Strings
Button labels, common actions, generic terms

### 2. `game` - Game Mechanics
Card ranks, suits, game rules, event messages

### 3. `ui` - Screen-Specific UI
Start screen, game screen, game over screen texts

---

## Translation Keys

### common.json

```json
{
  "buttons": {
    "start": "Aloita peli",
    "startSpectate": "Aloita katselu",
    "newGame": "Uusi peli",
    "cancel": "Peruuta",
    "continue": "Jatka",
    "challenge": "VALE!",
    "believe": "Usko",
    "copyJson": "Kopioi JSON",
    "copied": "Kopioitu!"
  },
  "player": {
    "human": "Ihminen",
    "you": "Sinä",
    "player": "Pelaaja",
    "bot": "Botti"
  },
  "difficulty": {
    "Easy": "Helppo",
    "Normal": "Normaali", 
    "Hard": "Vaikea",
    "Pro": "Pro"
  }
}
```

**English (en/common.json):**
```json
{
  "buttons": {
    "start": "Start Game",
    "startSpectate": "Start Spectating",
    "newGame": "New Game",
    "cancel": "Cancel",
    "continue": "Continue",
    "challenge": "LIAR!",
    "believe": "Believe",
    "copyJson": "Copy JSON",
    "copied": "Copied!"
  },
  "player": {
    "human": "Human",
    "you": "You",
    "player": "Player",
    "bot": "Bot"
  },
  "difficulty": {
    "Easy": "Easy",
    "Normal": "Normal",
    "Hard": "Hard", 
    "Pro": "Pro"
  }
}
```

---

### game.json

```json
{
  "ranks": {
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "10": "10",
    "J": "J",
    "Q": "Q",
    "K": "K",
    "A": "A",
    "2": "2"
  },
  "suits": {
    "hearts": "Hertta",
    "diamonds": "Ruutu",
    "clubs": "Risti",
    "spades": "Pata"
  },
  "claims": {
    "playerClaims": "{{player}} väittää:",
    "claimed": "väitti",
    "cards": "{{count}} korttia",
    "card": "{{count}} kortti"
  },
  "actions": {
    "played": "{{player}} pelasi {{count}}× {{rank}}",
    "challenged": "{{challenger}} haastoi {{accused}}!",
    "picksUp": "{{player}} nostaa pakan",
    "drew": "{{player}} nosti {{count}} korttia"
  },
  "results": {
    "wasLie": "Vale paljastui!",
    "wasTruth": "Totta oli!",
    "lie": "VALE!",
    "truth": "TOTTA!",
    "penalty": "Rangaistus"
  },
  "burn": {
    "title": "Pöytä kaatui:",
    "ten": "kympit kaataa",
    "ace": "ässä kaataa",
    "fourInRow": "neljä samaa kaataa"
  },
  "phases": {
    "waitingForPlay": "Odotetaan muita pelaajia...",
    "waitingForChallenges": "Odotetaan haastoikkunaa..."
  },
  "status": {
    "yourTurn": "Sinun vuorosi",
    "turn": "Vuoro: {{player}}"
  }
}
```

**English (en/game.json):**
```json
{
  "ranks": {
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "10": "10",
    "J": "J",
    "Q": "Q",
    "K": "K",
    "A": "A",
    "2": "2"
  },
  "suits": {
    "hearts": "Hearts",
    "diamonds": "Diamonds",
    "clubs": "Clubs",
    "spades": "Spades"
  },
  "claims": {
    "playerClaims": "{{player}} claims:",
    "claimed": "claimed",
    "cards": "{{count}} cards",
    "card": "{{count}} card"
  },
  "actions": {
    "played": "{{player}} played {{count}}× {{rank}}",
    "challenged": "{{challenger}} challenged {{accused}}!",
    "picksUp": "{{player}} picks up the pile",
    "drew": "{{player}} drew {{count}} cards"
  },
  "results": {
    "wasLie": "It was a lie!",
    "wasTruth": "It was true!",
    "lie": "LIAR!",
    "truth": "TRUTH!",
    "penalty": "Penalty"
  },
  "burn": {
    "title": "Pile burned:",
    "ten": "tens burn the pile",
    "ace": "aces burn the pile",
    "fourInRow": "four in a row burns"
  },
  "phases": {
    "waitingForPlay": "Waiting for other players...",
    "waitingForChallenges": "Challenge window open..."
  },
  "status": {
    "yourTurn": "Your turn",
    "turn": "Turn: {{player}}"
  }
}
```

---

### ui.json

```json
{
  "startScreen": {
    "subtitle": "Suomalainen bluffikorttipeli",
    "tagline": "Väitä arvoa • Bluffaa • Haasta",
    "presets": {
      "playerVsBots": "Pelaaja vs Botit",
      "botsVsBots": "Botit vs Botit",
      "challengeMode": "Haaste-moodi"
    },
    "players": {
      "title": "Pelaajat",
      "placeholder": "Pelaaja {{index}}",
      "minWarning": "Valitse min. 2",
      "spectateMode": "Seuraat peliä"
    },
    "settings": {
      "debugMode": "Debug-tila"
    }
  },
  "gameScreen": {
    "spectatorBanner": "Katselutila - Seuraat bottien peliä",
    "events": {
      "title": "Tapahtumat",
      "gameStarted": "Peli alkoi!"
    },
    "actionBar": {
      "selectCards": "Valitse 1-4 korttia pelataksesi",
      "selectRank": "Valitse väitettävä arvo ({{count}} korttia)",
      "play": "Pelaa {{count}}× {{rank}}"
    },
    "challenge": {
      "clickToContinue": "Klikkaa jatkaaksesi..."
    }
  },
  "gameOverScreen": {
    "gameOver": "Peli päättyi!",
    "youWon": "Voitit!",
    "youLost": "Hävisit!",
    "congratulations": "Onneksi olkoon! Olet mestari bluffaaja!",
    "winnerWon": "{{winner}} voitti pelin!",
    "loserWon": "{{winner}} voitti pelin",
    "leaderboard": "Tulostaulukko",
    "stats": {
      "title": "Pelin tilastot",
      "winner": "Voittaja",
      "difficulty": "Vaikeustaso"
    },
    "loser": "Valepaska"
  },
  "victoryOverlay": {
    "won": "VOITTI!",
    "continues": "Peli jatkuu - kuka jää Valepaskaksi?"
  },
  "debugPanel": {
    "title": "Debug Panel",
    "botThinking": "Botti ajattelee...",
    "gameState": "PELIN TILA",
    "phase": "Vaihe",
    "round": "Kierros",
    "currentTurn": "Vuorossa",
    "playerNumber": "Pelaaja #",
    "piles": {
      "title": "PINOT",
      "table": "Pöytä",
      "draw": "Nosto",
      "burn": "Pois"
    },
    "lastPlay": {
      "title": "VIIMEISIN PELI",
      "played": "pelasi",
      "actualCards": "Todelliset kortit:"
    },
    "handSizes": {
      "title": "KÄSIEN KOOT",
      "cards": "korttia"
    },
    "events": "TAPAHTUMAT"
  },
  "speedControl": {
    "slow": "Hidas",
    "normal": "Normaali",
    "fast": "Nopea",
    "instant": "Heti"
  }
}
```

**English (en/ui.json):**
```json
{
  "startScreen": {
    "subtitle": "Finnish bluffing card game",
    "tagline": "Claim a rank • Bluff • Challenge",
    "presets": {
      "playerVsBots": "Player vs Bots",
      "botsVsBots": "Bots vs Bots",
      "challengeMode": "Challenge Mode"
    },
    "players": {
      "title": "Players",
      "placeholder": "Player {{index}}",
      "minWarning": "Select min. 2",
      "spectateMode": "Spectator mode"
    },
    "settings": {
      "debugMode": "Debug mode"
    }
  },
  "gameScreen": {
    "spectatorBanner": "Spectator mode - Watching bots play",
    "events": {
      "title": "Events",
      "gameStarted": "Game started!"
    },
    "actionBar": {
      "selectCards": "Select 1-4 cards to play",
      "selectRank": "Choose rank to claim ({{count}} cards)",
      "play": "Play {{count}}× {{rank}}"
    },
    "challenge": {
      "clickToContinue": "Click to continue..."
    }
  },
  "gameOverScreen": {
    "gameOver": "Game Over!",
    "youWon": "You Won!",
    "youLost": "You Lost!",
    "congratulations": "Congratulations! You're a master bluffer!",
    "winnerWon": "{{winner}} won the game!",
    "loserWon": "{{winner}} won the game",
    "leaderboard": "Leaderboard",
    "stats": {
      "title": "Game Stats",
      "winner": "Winner",
      "difficulty": "Difficulty"
    },
    "loser": "Bullshitter"
  },
  "victoryOverlay": {
    "won": "WON!",
    "continues": "Game continues - who becomes the Bullshitter?"
  },
  "debugPanel": {
    "title": "Debug Panel",
    "botThinking": "Bot thinking...",
    "gameState": "GAME STATE",
    "phase": "Phase",
    "round": "Round",
    "currentTurn": "Current turn",
    "playerNumber": "Player #",
    "piles": {
      "title": "PILES",
      "table": "Table",
      "draw": "Draw",
      "burn": "Burn"
    },
    "lastPlay": {
      "title": "LAST PLAY",
      "played": "played",
      "actualCards": "Actual cards:"
    },
    "handSizes": {
      "title": "HAND SIZES",
      "cards": "cards"
    },
    "events": "EVENTS"
  },
  "speedControl": {
    "slow": "Slow",
    "normal": "Normal",
    "fast": "Fast",
    "instant": "Instant"
  }
}
```

---

## Implementation Steps

### Phase 1: Setup (1-2 hours)

1. **Install dependencies**
   ```bash
   cd apps/web
   pnpm add i18next react-i18next i18next-browser-languagedetector
   ```

2. **Create i18n configuration**
   ```typescript
   // src/i18n/index.ts
   import i18n from 'i18next';
   import { initReactI18next } from 'react-i18next';
   import LanguageDetector from 'i18next-browser-languagedetector';

   import fiCommon from './locales/fi/common.json';
   import fiGame from './locales/fi/game.json';
   import fiUi from './locales/fi/ui.json';
   import enCommon from './locales/en/common.json';
   import enGame from './locales/en/game.json';
   import enUi from './locales/en/ui.json';

   i18n
     .use(LanguageDetector)
     .use(initReactI18next)
     .init({
       resources: {
         fi: { common: fiCommon, game: fiGame, ui: fiUi },
         en: { common: enCommon, game: enGame, ui: enUi },
       },
       fallbackLng: 'fi',
       defaultNS: 'common',
       interpolation: { escapeValue: false },
     });

   export default i18n;
   ```

3. **Initialize in main.tsx**
   ```typescript
   import './i18n';
   ```

### Phase 2: Language Switcher (30 min)

Create a language switcher component for the UI:

```typescript
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fi', flag: '🇫🇮', name: 'Suomi' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(({ code, flag }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={`text-2xl p-1 rounded transition-opacity ${
            i18n.language === code ? 'opacity-100' : 'opacity-50 hover:opacity-75'
          }`}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
```

### Phase 3: Migrate Components (2-4 hours)

Replace hardcoded strings with translation calls:

**Before:**
```tsx
<button>Aloita peli</button>
```

**After:**
```tsx
import { useTranslation } from 'react-i18next';

function StartButton() {
  const { t } = useTranslation();
  return <button>{t('buttons.start')}</button>;
}
```

**With interpolation:**
```tsx
// Before
<div>{playerName} pelasi 2× 7</div>

// After
<div>{t('game:actions.played', { player: playerName, count: 2, rank: '7' })}</div>
```

### Phase 4: TypeScript Support (30 min)

Create type definitions for type-safe translations:

```typescript
// src/i18n/types.ts
import 'i18next';
import type common from './locales/fi/common.json';
import type game from './locales/fi/game.json';
import type ui from './locales/fi/ui.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      game: typeof game;
      ui: typeof ui;
    };
  }
}
```

---

## Component Migration Checklist

### High Priority (User-facing)
- [ ] `StartScreen.tsx` - All UI text
- [ ] `GameOverScreen.tsx` - Results and leaderboard
- [ ] `ActionBar.tsx` - Game actions
- [ ] `VictoryOverlay.tsx` - Win messages
- [ ] `ChallengeRevealOverlay.tsx` - Challenge results

### Medium Priority
- [ ] `EventLog.tsx` - Event messages
- [ ] `DebugPanel.tsx` - Debug UI

### Low Priority
- [ ] `SpeedControl.tsx` - Speed labels

---

## Adding New Languages

To add a new language (e.g., Swedish):

1. Create locale folder: `src/i18n/locales/sv/`
2. Copy English files and translate
3. Update i18n config:
   ```typescript
   import svCommon from './locales/sv/common.json';
   // ...
   resources: {
     fi: { ... },
     en: { ... },
     sv: { common: svCommon, game: svGame, ui: svUi },
   }
   ```
4. Add to `LanguageSwitcher`:
   ```typescript
   { code: 'sv', flag: '🇸🇪', name: 'Svenska' }
   ```

---

## Estimated Effort

| Task | Time |
|------|------|
| Setup & Configuration | 1-2 hours |
| Language Switcher Component | 30 min |
| Migrate StartScreen | 1 hour |
| Migrate GameOverScreen | 45 min |
| Migrate ActionBar | 45 min |
| Migrate Overlays | 30 min |
| Migrate EventLog | 30 min |
| Migrate DebugPanel | 30 min |
| TypeScript Types | 30 min |
| Testing | 1 hour |
| **Total** | **~7-8 hours** |

---

## Future Enhancements

1. **Lazy Loading** - Load language files on demand for larger apps
2. **Backend Translations** - Store translations in CMS for non-developer updates
3. **RTL Support** - Preparation for Arabic/Hebrew
4. **Date/Number Formatting** - Use i18n formatters
5. **Pluralization Rules** - Handle complex plural forms

---

## Notes

- Finnish is the default language (fallbackLng)
- Browser language is auto-detected
- Language preference is persisted in localStorage
- All game-specific terms (Valepaska, etc.) stay in Finnish across languages as they are proper nouns

