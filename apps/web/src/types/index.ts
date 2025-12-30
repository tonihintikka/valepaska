import type { 
  PlayerId, 
  Rank, 
  Card, 
  GameEvent, 
  PlayerObservation 
} from '@valepaska/core';

export type UIPhase = 'start' | 'playing' | 'gameOver';

export type BotDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Pro';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  isHuman: boolean;
  botDifficulty?: BotDifficulty;
  avatar?: string;
}

export interface GameConfig {
  players: PlayerConfig[];
  seed?: number;
  debugMode?: boolean;
}

export interface UIState {
  selectedCards: string[];
  selectedRank: Rank | null;
  showChallengeModal: boolean;
  challengeTimeLeft: number;
  lastEvent: GameEvent | null;
  animatingCards: string[];
}

export interface Position {
  x: number;
  y: number;
  rotation: number;
}

export type PlayerPosition = 'bottom' | 'left' | 'top' | 'right' | 'top-left' | 'top-right';

export const PLAYER_POSITIONS: Record<number, PlayerPosition[]> = {
  3: ['bottom', 'top-left', 'top-right'],
  4: ['bottom', 'left', 'top', 'right'],
  5: ['bottom', 'left', 'top-left', 'top-right', 'right'],
  6: ['bottom', 'left', 'top-left', 'top', 'top-right', 'right'],
};

export interface CardAnimation {
  id: string;
  from: Position;
  to: Position;
  card?: Card;
  faceDown?: boolean;
}

export const RANK_DISPLAY: Record<Rank, string> = {
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'J',
  Q: 'Q',
  K: 'K',
  A: 'A',
  '2': '2',
};

export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-800',
  spades: 'text-slate-800',
};

