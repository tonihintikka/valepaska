import type { Rank } from '../types/card.js';
import type { BurnReason, GameEvent } from '../types/events.js';
import {
  type GameConfig,
  type GamePhase,
  type GameState,
  DEFAULT_GAME_CONFIG,
} from '../types/game-state.js';
import type { PlayMove } from '../types/moves.js';
import type { PlayerObservation } from '../types/observation.js';
import type { Player, PlayerId } from '../types/player.js';
import { createRng, SeededRng } from '../utils/rng.js';
import { validatePlay } from '../rules/claim-rules.js';
import {
  validateChallenge,
  getChallengerPriorityOrder,
  selectChallenger,
} from '../rules/challenge-rules.js';
import {
  checkWinCondition,
  validatePlayerCount,
} from '../rules/game-rules.js';
import { GameEventEmitter } from './event-emitter.js';
import { createObservation } from './observation-factory.js';
import { dealInitialCards, replenishAllHands } from './hand-manager.js';
import { executePlay } from './play-executor.js';
import { executeChallenge, acceptClaim } from './challenge-executor.js';
import { getBurnEventData } from './burn-executor.js';
import { advanceTurn } from './turn-manager.js';
import { BotRunner } from './bot-runner.js';

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
  private botRunner: BotRunner;

  private constructor(
    players: readonly Player[],
    config: GameConfig,
    seed: number
  ) {
    this.rng = createRng(seed);
    this.eventEmitter = new GameEventEmitter();
    this.bots = new Map();
    this.botRunner = new BotRunner();

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
    const { hands, drawPile } = dealInitialCards(
      this.state.players,
      this.state.config,
      this.rng
    );

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

    // Validate the move (pass deck state for starting claim rules)
    const validation = validatePlay(
      move.cardIds,
      move.claimRank,
      move.claimCount,
      hand,
      lastClaimRank,
      this.state.config,
      { deckHasCards: this.state.drawPile.length > 0 }
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
    const { newState, playedCards } = executePlay(this.state, playerId, move);
    this.state = newState;

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
    this.botRunner.clearChallengeDecisions();
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

    this.botRunner.recordChallengeDecision(playerId, challenge);
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
    const willingChallengers = this.botRunner.getWillingChallengers();

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

    const { playerId: accusedId } = this.state.lastPlay;

    this.eventEmitter.emit('CHALLENGE_DECLARED', {
      challengerId,
      accusedId,
    });

    // Execute challenge using executor
    const result = executeChallenge(this.state, challengerId);
    this.state = result.newState;

    // Emit challenge resolved event
    this.eventEmitter.emit('CHALLENGE_RESOLVED', {
      challengerId,
      accusedId,
      wasLie: result.wasLie,
      revealedCards: result.revealedCards,
      claimedRank: this.state.lastPlay?.claimRank ?? '3',
      claimedCount: this.state.lastPlay?.claimCount ?? 1,
      penaltyCardCount: result.penaltyCardCount,
    });

    // Emit burn event if needed
    if (result.shouldBurn && result.burnReason) {
      const burnData = getBurnEventData(this.state, result.burnReason as BurnReason);
      this.eventEmitter.emit('PILE_BURNED', burnData);
    }

    // Check for win
    if (result.accusedContinues) {
      this.checkForWin(accusedId);
    }

    if (this.state.phase === 'GAME_OVER') {
      return;
    }

    // Replenish hands
    this.replenishAllHands();
  }

  /**
   * Accept a claim (no challenge)
   */
  private acceptClaim(): void {
    if (!this.state.lastPlay) {
      throw new Error('No last play');
    }

    const { playerId } = this.state.lastPlay;

    // Accept claim using executor
    const result = acceptClaim(this.state);
    this.state = result.newState;

    if (result.shouldBurn && result.burnReason) {
      // Emit burn event
      const burnData = getBurnEventData(this.state, result.burnReason as BurnReason);
      this.eventEmitter.emit('PILE_BURNED', burnData);

      // Check for win (player who burned might have emptied their hand)
      this.checkForWin(playerId);

      if (this.state.phase !== 'GAME_OVER') {
        // Replenish hands
        this.replenishAllHands();
      }
    } else {
      // Check for win
      this.checkForWin(playerId);

      if (this.state.phase !== 'GAME_OVER') {
        // Advance turn
        const previousPlayer = this.getCurrentPlayer();
        this.state = advanceTurn(this.state);
        const currentPlayer = this.getCurrentPlayer();

        this.eventEmitter.emit('TURN_ADVANCED', {
          previousPlayerId: previousPlayer.id,
          currentPlayerId: currentPlayer.id,
        });

        // Replenish hands
        this.replenishAllHands();
      }
    }
  }



  /**
   * Replenish all players' hands
   */
  private replenishAllHands(): void {
    const { hands, drawPile, drawnCounts } = replenishAllHands(this.state);

    this.state = {
      ...this.state,
      hands,
      drawPile,
    };

    // Emit events for drawn cards
    for (const [playerId, count] of drawnCounts) {
      this.eventEmitter.emit('CARDS_DRAWN', {
        playerId,
        cardCount: count,
      });
    }
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
      // Collect challenge decisions from all bots
      this.botRunner.collectChallengeDecisions(
        this.state,
        this.bots,
        (playerId) => this.getObservation(playerId)
      );

      // Process challenges if all bots have decided
      if (this.botRunner.allBotsDecided(this.state, this.bots)) {
        this.processChallenges();
      }
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

