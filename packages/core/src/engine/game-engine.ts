import type { Card, Rank } from '../types/card.js';
import type { ClaimRecord } from '../types/claim.js';
import type { BurnReason, GameEvent } from '../types/events.js';
import {
  type GameConfig,
  type GamePhase,
  type GameState,
  type LastPlay,
  DEFAULT_GAME_CONFIG,
} from '../types/game-state.js';
import type { PlayMove } from '../types/moves.js';
import type { PlayerObservation } from '../types/observation.js';
import type { Player, PlayerId } from '../types/player.js';
import { createClaimRecord } from '../types/claim.js';
import { createDeck, shuffleDeck, findCardsByIds, removeCards } from '../utils/deck.js';
import { createRng, SeededRng } from '../utils/rng.js';
import {
  validatePlay,
  verifyClaimTruth,
} from '../rules/claim-rules.js';
import { checkBurn } from '../rules/burn-rules.js';
import {
  resolveChallenge,
  validateChallenge,
  getChallengerPriorityOrder,
  selectChallenger,
} from '../rules/challenge-rules.js';
import {
  checkWinCondition,
  validatePlayerCount,
  replenishHand,
} from '../rules/game-rules.js';
import { GameEventEmitter } from './event-emitter.js';
import { createObservation } from './observation-factory.js';

/**
 * Bot interface for automated players
 */
export interface Bot {
  chooseMove(observation: PlayerObservation): PlayMove;
  shouldChallenge(observation: PlayerObservation, claimRank: Rank, claimCount: number): boolean;
  onEvent(event: GameEvent): void;
}

/**
 * Main game engine class
 */
export class GameEngine {
  private state: GameState;
  private rng: SeededRng;
  private eventEmitter: GameEventEmitter;
  private bots: Map<PlayerId, Bot>;
  private challengeDecisions: Map<PlayerId, boolean>;

  private constructor(
    players: readonly Player[],
    config: GameConfig,
    seed: number
  ) {
    this.rng = createRng(seed);
    this.eventEmitter = new GameEventEmitter();
    this.bots = new Map();
    this.challengeDecisions = new Map();

    // Initialize state
    this.state = {
      phase: 'WAITING_FOR_PLAY',
      players,
      hands: new Map(),
      drawPile: [],
      tablePile: [],
      burnPile: [],
      claimHistory: [],
      currentPlayerIndex: 0,
      lastPlay: null,
      config,
      seed,
      roundNumber: 0,
      winnerId: null,
    };

    // Deal cards
    this.dealInitialCards();
  }

  /**
   * Create a new game engine
   */
  static create(
    players: readonly Player[],
    config: Partial<GameConfig> = {},
    seed: number = Date.now()
  ): GameEngine {
    const fullConfig: GameConfig = { ...DEFAULT_GAME_CONFIG, ...config };

    // Validate player count
    const validation = validatePlayerCount(players.length);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return new GameEngine(players, fullConfig, seed);
  }

  /**
   * Deal initial cards to all players
   */
  private dealInitialCards(): void {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, this.rng);

    const hands = new Map<PlayerId, Card[]>();
    let deckIndex = 0;

    // Initialize hands
    for (const player of this.state.players) {
      hands.set(player.id, []);
    }

    // Deal cards round-robin
    for (let i = 0; i < this.state.config.initialHandSize; i++) {
      for (const player of this.state.players) {
        const card = shuffled[deckIndex];
        if (card) {
          hands.get(player.id)!.push(card);
          deckIndex++;
        }
      }
    }

    // Set draw pile to remaining cards
    const drawPile = shuffled.slice(deckIndex);

    this.state = {
      ...this.state,
      hands,
      drawPile,
    };

    // Emit events
    this.eventEmitter.emit('GAME_STARTED', {
      playerIds: this.state.players.map((p) => p.id),
      seed: this.state.seed,
    });

    for (const player of this.state.players) {
      this.eventEmitter.emit('CARDS_DEALT', {
        playerId: player.id,
        cardCount: this.state.config.initialHandSize,
      });
    }
  }

  /**
   * Get the current game state (internal use)
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Get player observation
   */
  getObservation(playerId: PlayerId): PlayerObservation {
    return createObservation(this.state, playerId);
  }

  /**
   * Get event log
   */
  getEventLog(): readonly GameEvent[] {
    return this.eventEmitter.getEventLog();
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): GamePhase {
    return this.state.phase;
  }

  /**
   * Get winner (if game is over)
   */
  getWinner(): PlayerId | null {
    return this.state.winnerId;
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    const player = this.state.players[this.state.currentPlayerIndex];
    if (!player) {
      throw new Error('Invalid current player index');
    }
    return player;
  }

  /**
   * Register a bot for a player
   */
  registerBot(playerId: PlayerId, bot: Bot): void {
    this.bots.set(playerId, bot);

    // Subscribe bot to events
    this.eventEmitter.onAll((event) => {
      bot.onEvent(event);
    });
  }

  /**
   * Submit a play move
   */
  submitMove(playerId: PlayerId, move: PlayMove): void {
    if (this.state.phase !== 'WAITING_FOR_PLAY') {
      throw new Error('Not waiting for a play');
    }

    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer.id !== playerId) {
      throw new Error("Not player's turn");
    }

    const hand = this.state.hands.get(playerId);
    if (!hand) {
      throw new Error('Player not found');
    }

    // Get last accepted claim rank
    const lastClaimRank = this.getLastAcceptedClaimRank();

    // Validate the move
    const validation = validatePlay(
      move.cardIds,
      move.claimRank,
      move.claimCount,
      hand,
      lastClaimRank,
      this.state.config
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Execute the move
    this.executePlay(playerId, move);
  }

  /**
   * Execute a play move
   */
  private executePlay(playerId: PlayerId, move: PlayMove): void {
    const hand = this.state.hands.get(playerId)!;
    const playedCards = findCardsByIds(hand, move.cardIds);
    const newHand = removeCards(hand, move.cardIds);

    // Update hands
    const newHands = new Map(this.state.hands);
    newHands.set(playerId, newHand);

    // Add cards to table pile
    const newTablePile = [...this.state.tablePile, ...playedCards];

    // Record last play for challenge resolution
    const lastPlay: LastPlay = {
      playerId,
      cards: playedCards,
      claimRank: move.claimRank,
      claimCount: move.claimCount,
    };

    this.state = {
      ...this.state,
      hands: newHands,
      tablePile: newTablePile,
      lastPlay,
      phase: 'WAITING_FOR_CHALLENGES',
    };

    // Emit event
    this.eventEmitter.emit('PLAY_MADE', {
      playerId,
      claimRank: move.claimRank,
      claimCount: move.claimCount,
      actualCardCount: playedCards.length,
      cardIds: move.cardIds,
    });

    this.eventEmitter.emit('CHALLENGE_OFFERED', {
      accusedId: playerId,
    });

    // Clear previous challenge decisions
    this.challengeDecisions.clear();
  }

  /**
   * Submit a challenge decision
   */
  submitChallengeDecision(playerId: PlayerId, challenge: boolean): void {
    if (this.state.phase !== 'WAITING_FOR_CHALLENGES') {
      throw new Error('Not in challenge phase');
    }

    if (!this.state.lastPlay) {
      throw new Error('No play to challenge');
    }

    const validation = validateChallenge(
      playerId,
      this.state.lastPlay.playerId,
      true
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.challengeDecisions.set(playerId, challenge);
  }

  /**
   * Process challenge phase (call after all decisions are in)
   */
  processChallenges(): void {
    if (this.state.phase !== 'WAITING_FOR_CHALLENGES') {
      throw new Error('Not in challenge phase');
    }

    if (!this.state.lastPlay) {
      throw new Error('No last play');
    }

    // Get willing challengers
    const willingChallengers: PlayerId[] = [];
    for (const [playerId, challenge] of this.challengeDecisions) {
      if (challenge) {
        willingChallengers.push(playerId);
      }
    }

    // Select challenger by priority
    const playerIds = this.state.players.map((p) => p.id);
    const priorityOrder = getChallengerPriorityOrder(
      playerIds,
      this.state.lastPlay.playerId
    );
    const challenger = selectChallenger(willingChallengers, priorityOrder);

    if (challenger) {
      this.executeChallenge(challenger);
    } else {
      this.acceptClaim();
    }
  }

  /**
   * Execute a challenge
   */
  private executeChallenge(challengerId: PlayerId): void {
    if (!this.state.lastPlay) {
      throw new Error('No last play');
    }

    const { playerId: accusedId, cards, claimRank, claimCount } = this.state.lastPlay;

    this.eventEmitter.emit('CHALLENGE_DECLARED', {
      challengerId,
      accusedId,
    });

    // Resolve the challenge
    const result = resolveChallenge(
      cards,
      claimRank,
      claimCount,
      accusedId,
      challengerId,
      this.state.tablePile.length
    );

    // Record claim as challenged
    const claimRecord = createClaimRecord(
      {
        playerId: accusedId,
        rank: claimRank,
        count: claimCount,
        timestamp: Date.now(),
      },
      !result.wasLie, // accepted if not a lie
      challengerId,
      result.wasLie
    );

    const newClaimHistory = [...this.state.claimHistory, claimRecord];

    // Check if burn should occur (only when claim was true and it's a burn rank)
    const burnReason = !result.wasLie ? checkBurn(claimRank, this.state.claimHistory) : null;

    if (burnReason) {
      // Burn the pile instead of giving it to challenger
      const burnedCards = [...this.state.tablePile];

      this.state = {
        ...this.state,
        tablePile: [],
        burnPile: [...this.state.burnPile, ...burnedCards],
        claimHistory: [], // Reset claim history after burn
        lastPlay: null,
        phase: 'WAITING_FOR_PLAY',
      };

      // Emit challenge resolved event (0 penalty cards since pile burned)
      this.eventEmitter.emit('CHALLENGE_RESOLVED', {
        challengerId,
        accusedId,
        wasLie: result.wasLie,
        revealedCards: cards,
        claimedRank: claimRank,
        claimedCount: claimCount,
        penaltyCardCount: 0,
      });

      // Emit burn event
      this.eventEmitter.emit('PILE_BURNED', {
        reason: burnReason,
        cardCount: burnedCards.length,
        triggeredBy: accusedId,
      });

      // Check for win (player who burned might have emptied their hand)
      this.checkForWin(accusedId);

      if (this.state.phase === 'GAME_OVER') {
        return;
      }

      // Honest player continues after burn
      // Replenish hands
      this.replenishAllHands();
    } else {
      // Normal challenge resolution - move pile to penalty recipient
      const penaltyCards = [...this.state.tablePile];
      const newHands = new Map(this.state.hands);
      const recipientHand = newHands.get(result.penaltyRecipient) ?? [];
      newHands.set(result.penaltyRecipient, [...recipientHand, ...penaltyCards]);

      this.state = {
        ...this.state,
        hands: newHands,
        tablePile: [],
        claimHistory: newClaimHistory,
        lastPlay: null,
        phase: 'WAITING_FOR_PLAY',
      };

      // Emit event
      this.eventEmitter.emit('CHALLENGE_RESOLVED', {
        challengerId,
        accusedId,
        wasLie: result.wasLie,
        revealedCards: cards,
        claimedRank: claimRank,
        claimedCount: claimCount,
        penaltyCardCount: penaltyCards.length,
      });

      // Check for win - the accused might have emptied their hand before challenge
      if (result.accusedContinues) {
        // Honest player might have won - check for win
        this.checkForWin(accusedId);
      }

      if (this.state.phase === 'GAME_OVER') {
        return; // Game ended, no need to advance turn or replenish
      }

      // Determine next player
      if (result.accusedContinues) {
        // Honest player continues - already their turn
      } else {
        // Liar loses turn - advance to next player
        this.advanceTurn();
      }

      // Replenish hands
      this.replenishAllHands();
    }
  }

  /**
   * Accept a claim (no challenge)
   */
  private acceptClaim(): void {
    if (!this.state.lastPlay) {
      throw new Error('No last play');
    }

    const { playerId, claimRank, claimCount } = this.state.lastPlay;

    // Record claim as accepted
    const claimRecord = createClaimRecord(
      {
        playerId,
        rank: claimRank,
        count: claimCount,
        timestamp: Date.now(),
      },
      true // accepted
    );

    const newClaimHistory = [...this.state.claimHistory, claimRecord];

    // Check for burn
    const burnReason = checkBurn(claimRank, newClaimHistory.slice(0, -1));

    if (burnReason) {
      this.executeBurn(burnReason, newClaimHistory);
    } else {
      this.state = {
        ...this.state,
        claimHistory: newClaimHistory,
        lastPlay: null,
        phase: 'WAITING_FOR_PLAY',
      };

      // Check for win
      this.checkForWin(playerId);

      if (this.state.phase !== 'GAME_OVER') {
        // Advance turn
        this.advanceTurn();
        // Replenish hands
        this.replenishAllHands();
      }
    }
  }

  /**
   * Execute a burn
   */
  private executeBurn(reason: BurnReason, newClaimHistory: ClaimRecord[]): void {
    if (!this.state.lastPlay) {
      throw new Error('No last play');
    }

    const burnedCards = [...this.state.tablePile];

    this.state = {
      ...this.state,
      tablePile: [],
      burnPile: [...this.state.burnPile, ...burnedCards],
      claimHistory: [], // Reset claim history after burn
      lastPlay: null,
      phase: 'WAITING_FOR_PLAY',
    };

    this.eventEmitter.emit('PILE_BURNED', {
      reason,
      cardCount: burnedCards.length,
      triggeredBy: this.state.lastPlay?.playerId ?? this.getCurrentPlayer().id,
    });

    // Check for win (player who burned might have emptied their hand)
    const currentPlayer = this.getCurrentPlayer();
    this.checkForWin(currentPlayer.id);

    if (this.state.phase !== 'GAME_OVER') {
      // Player who caused burn continues (no turn advance)
      // Replenish hands
      this.replenishAllHands();
    }
  }

  /**
   * Advance turn to next player
   */
  private advanceTurn(): void {
    const previousPlayer = this.getCurrentPlayer();
    const nextIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;

    this.state = {
      ...this.state,
      currentPlayerIndex: nextIndex,
      roundNumber: nextIndex === 0 ? this.state.roundNumber + 1 : this.state.roundNumber,
    };

    const currentPlayer = this.getCurrentPlayer();

    this.eventEmitter.emit('TURN_ADVANCED', {
      previousPlayerId: previousPlayer.id,
      currentPlayerId: currentPlayer.id,
    });
  }

  /**
   * Replenish all players' hands
   */
  private replenishAllHands(): void {
    if (this.state.drawPile.length === 0) {
      return; // No cards to draw
    }

    const newHands = new Map(this.state.hands);
    let newDrawPile = [...this.state.drawPile];

    for (const player of this.state.players) {
      const hand = newHands.get(player.id) ?? [];
      const { newHand, newDrawPile: updatedDrawPile } = replenishHand(
        hand,
        newDrawPile,
        this.state.config
      );

      if (newHand.length > hand.length) {
        const drawnCount = newHand.length - hand.length;
        newHands.set(player.id, newHand);
        newDrawPile = updatedDrawPile;

        this.eventEmitter.emit('CARDS_DRAWN', {
          playerId: player.id,
          cardCount: drawnCount,
        });
      }
    }

    this.state = {
      ...this.state,
      hands: newHands,
      drawPile: newDrawPile,
    };
  }

  /**
   * Check for win condition
   */
  private checkForWin(playerId: PlayerId): void {
    const hand = this.state.hands.get(playerId);
    if (!hand) return;

    const hasWon = checkWinCondition(
      hand.length,
      this.state.drawPile.length,
      false // Already handled challenge
    );

    if (hasWon) {
      this.declareWinner(playerId);
    }
  }

  /**
   * Declare a winner
   */
  private declareWinner(winnerId: PlayerId): void {
    const finalHandSizes: Record<PlayerId, number> = {};
    for (const [playerId, hand] of this.state.hands) {
      finalHandSizes[playerId] = hand.length;
    }

    this.state = {
      ...this.state,
      phase: 'GAME_OVER',
      winnerId,
    };

    this.eventEmitter.emit('PLAYER_WON', {
      winnerId,
      finalHandSizes,
    });

    this.eventEmitter.emit('GAME_OVER', {
      winnerId,
      totalRounds: this.state.roundNumber,
    });
  }

  /**
   * Get last accepted claim rank
   */
  private getLastAcceptedClaimRank(): Rank | null {
    for (let i = this.state.claimHistory.length - 1; i >= 0; i--) {
      const claim = this.state.claimHistory[i];
      if (claim?.accepted) {
        return claim.rank;
      }
    }
    return null;
  }

  /**
   * Process one tick of bot gameplay
   */
  tick(): boolean {
    if (this.state.phase === 'GAME_OVER') {
      return false;
    }

    if (this.state.phase === 'WAITING_FOR_PLAY') {
      const currentPlayer = this.getCurrentPlayer();
      const bot = this.bots.get(currentPlayer.id);

      if (bot) {
        const observation = this.getObservation(currentPlayer.id);
        const move = bot.chooseMove(observation);
        this.submitMove(currentPlayer.id, move);
        return true;
      }
    }

    if (this.state.phase === 'WAITING_FOR_CHALLENGES') {
      // Get challenge decisions from all bots
      for (const player of this.state.players) {
        if (player.id === this.state.lastPlay?.playerId) {
          continue; // Can't challenge own play
        }

        const bot = this.bots.get(player.id);
        if (bot && !this.challengeDecisions.has(player.id)) {
          const observation = this.getObservation(player.id);
          const shouldChallenge = bot.shouldChallenge(
            observation,
            this.state.lastPlay!.claimRank,
            this.state.lastPlay!.claimCount
          );
          this.submitChallengeDecision(player.id, shouldChallenge);
        }
      }

      // Process challenges
      this.processChallenges();
      return true;
    }

    return false;
  }

  /**
   * Run game to completion (for bots only)
   */
  runToCompletion(maxTicks: number = 10000): PlayerId | null {
    let ticks = 0;
    while (this.tick() && ticks < maxTicks) {
      ticks++;
    }
    return this.getWinner();
  }

  /**
   * Subscribe to events
   */
  on<T extends GameEvent>(
    type: T['type'],
    listener: (event: T) => void
  ): () => void {
    return this.eventEmitter.on(type, listener);
  }

  /**
   * Subscribe to all events
   */
  onAll(listener: (event: GameEvent) => void): () => void {
    return this.eventEmitter.onAll(listener);
  }
}

