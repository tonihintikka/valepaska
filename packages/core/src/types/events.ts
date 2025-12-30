import type { Card, CardId, Rank } from './card.js';
import type { PlayerId } from './player.js';
import type { PlayerStanding } from './game-state.js';

/**
 * Game event types
 */
export type GameEventType =
  | 'GAME_STARTED'
  | 'CARDS_DEALT'
  | 'PLAY_MADE'
  | 'CHALLENGE_OFFERED'
  | 'CHALLENGE_DECLARED'
  | 'CHALLENGE_RESOLVED'
  | 'PILE_BURNED'
  | 'CARDS_DRAWN'
  | 'TURN_ADVANCED'
  | 'PLAYER_FINISHED'
  | 'PLAYER_WON' // Deprecated: use PLAYER_FINISHED
  | 'GAME_OVER';

/**
 * Burn reasons
 */
export type BurnReason = 'TEN' | 'ACE' | 'FOUR_IN_ROW';

/**
 * Base event interface
 */
export interface BaseEvent {
  readonly type: GameEventType;
  readonly timestamp: number;
  readonly sequenceNumber: number;
}

/**
 * Game started event
 */
export interface GameStartedEvent extends BaseEvent {
  readonly type: 'GAME_STARTED';
  readonly playerIds: readonly PlayerId[];
  readonly seed: number;
}

/**
 * Cards dealt event
 */
export interface CardsDealtEvent extends BaseEvent {
  readonly type: 'CARDS_DEALT';
  readonly playerId: PlayerId;
  readonly cardCount: number;
}

/**
 * Play made event
 */
export interface PlayMadeEvent extends BaseEvent {
  readonly type: 'PLAY_MADE';
  readonly playerId: PlayerId;
  readonly claimRank: Rank;
  readonly claimCount: number;
  readonly actualCardCount: number;
  readonly cardIds: readonly CardId[]; // Hidden from observers
}

/**
 * Challenge offered event
 */
export interface ChallengeOfferedEvent extends BaseEvent {
  readonly type: 'CHALLENGE_OFFERED';
  readonly accusedId: PlayerId;
}

/**
 * Challenge declared event
 */
export interface ChallengeDeclaredEvent extends BaseEvent {
  readonly type: 'CHALLENGE_DECLARED';
  readonly challengerId: PlayerId;
  readonly accusedId: PlayerId;
}

/**
 * Challenge resolved event
 */
export interface ChallengeResolvedEvent extends BaseEvent {
  readonly type: 'CHALLENGE_RESOLVED';
  readonly challengerId: PlayerId;
  readonly accusedId: PlayerId;
  readonly wasLie: boolean;
  readonly revealedCards: readonly Card[];
  readonly claimedRank: Rank;
  readonly claimedCount: number;
  readonly penaltyCardCount: number;
}

/**
 * Pile burned event
 */
export interface PileBurnedEvent extends BaseEvent {
  readonly type: 'PILE_BURNED';
  readonly reason: BurnReason;
  readonly cardCount: number;
  readonly triggeredBy: PlayerId;
}

/**
 * Cards drawn event
 */
export interface CardsDrawnEvent extends BaseEvent {
  readonly type: 'CARDS_DRAWN';
  readonly playerId: PlayerId;
  readonly cardCount: number;
}

/**
 * Turn advanced event
 */
export interface TurnAdvancedEvent extends BaseEvent {
  readonly type: 'TURN_ADVANCED';
  readonly previousPlayerId: PlayerId;
  readonly currentPlayerId: PlayerId;
}

/**
 * Player finished event (emptied hand, got a position)
 */
export interface PlayerFinishedEvent extends BaseEvent {
  readonly type: 'PLAYER_FINISHED';
  readonly playerId: PlayerId;
  readonly position: number; // 1 = 1st place, 2 = 2nd, etc.
  readonly score: number;
  readonly finishedAtRound: number;
}

/**
 * Player won event (deprecated: use PLAYER_FINISHED with position 1)
 */
export interface PlayerWonEvent extends BaseEvent {
  readonly type: 'PLAYER_WON';
  readonly winnerId: PlayerId;
  readonly finalHandSizes: Record<PlayerId, number>;
}

/**
 * Game over event
 */
export interface GameOverEvent extends BaseEvent {
  readonly type: 'GAME_OVER';
  readonly winnerId: PlayerId; // Deprecated: use standings[0].playerId
  readonly standings: readonly PlayerStanding[];
  readonly totalRounds: number;
}

/**
 * Union of all event types
 */
export type GameEvent =
  | GameStartedEvent
  | CardsDealtEvent
  | PlayMadeEvent
  | ChallengeOfferedEvent
  | ChallengeDeclaredEvent
  | ChallengeResolvedEvent
  | PileBurnedEvent
  | CardsDrawnEvent
  | TurnAdvancedEvent
  | PlayerFinishedEvent
  | PlayerWonEvent
  | GameOverEvent;

/**
 * Event factory functions
 */
export function createEvent<T extends GameEventType>(
  type: T,
  sequenceNumber: number,
  data: Omit<Extract<GameEvent, { type: T }>, 'type' | 'timestamp' | 'sequenceNumber'>
): Extract<GameEvent, { type: T }> {
  return {
    type,
    timestamp: Date.now(),
    sequenceNumber,
    ...data,
  } as Extract<GameEvent, { type: T }>;
}

