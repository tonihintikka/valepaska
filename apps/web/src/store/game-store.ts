import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameEngine,
  type PlayerId,
  type GameEvent,
  type Player,
  createPlayMove,
  createHumanPlayer,
  createBotPlayer,
} from '@valepaska/core';
import { RuleBot } from '@valepaska/bots';
import type { GameConfig } from '../types';
import { createGameStateSlice, type GameStateSlice } from './slices/game-state-slice.js';
import { createPlayerSlice, type PlayerSlice } from './slices/player-slice.js';
import { createUISlice, type UISlice } from './slices/ui-slice.js';
import { createEventSlice, type EventSlice } from './slices/event-slice.js';
import { createBotSlice, type BotSlice } from './slices/bot-slice.js';
import { createDebugSlice, type DebugSlice } from './slices/debug-slice.js';

// Combined store interface
export interface GameStore extends 
  GameStateSlice,
  PlayerSlice,
  UISlice,
  EventSlice,
  BotSlice,
  DebugSlice {
  // Game actions
  startGame: (config: GameConfig) => void;
  resetGame: () => void;
  
  // Human actions
  playCards: () => void;
  challenge: () => void;
  pass: () => void;
  
  // Internal
  updateObservation: () => void;
  processBotTurn: () => void;
  processBotChallenges: () => void;
  handleEvent: (event: GameEvent) => void;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get, api) => ({
    // Combine all slices
    ...createGameStateSlice(set, get, api),
    ...createPlayerSlice(set, get, api),
    ...createUISlice(set, get, api),
    ...createEventSlice(set, get, api),
    ...createBotSlice(set, get, api),
    ...createDebugSlice(set, get, api),
    
    // Game actions
    startGame: (config: GameConfig) => {
      // Create player objects for the engine
      const players: Player[] = config.players.map(p => {
        if (p.isHuman) {
          return createHumanPlayer(p.id, p.name);
        } else {
          return createBotPlayer(p.id, p.name, p.botDifficulty ?? 'Normal');
        }
      });
      
      // Create the engine
      const engine = GameEngine.create(players, {}, config.seed ?? Date.now());
      
      // Create bots for ALL non-human players
      const bots = new Map<PlayerId, RuleBot>();
      const humanPlayer = config.players.find(p => p.isHuman);
      const isSpectator = !humanPlayer; // No human = spectator mode
      
      for (const player of config.players) {
        if (!player.isHuman) {
          const difficulty = player.botDifficulty ?? 'Normal';
          const bot = new RuleBot(player.id, difficulty, config.seed);
          bots.set(player.id, bot);
          // Register bot with engine so tick() can use it
          engine.registerBot(player.id, bot);
        }
      }
      
      // Subscribe to all events
      engine.onAll((event: GameEvent) => {
        get().handleEvent(event);
      });
      
      const humanPlayerId = humanPlayer?.id ?? null;
      
      // In spectator mode, observe from first player's perspective
      const observePlayerId = humanPlayerId ?? config.players[0]?.id ?? null;
      const observation = observePlayerId 
        ? engine.getObservation(observePlayerId) 
        : null;
      
      set({
        uiPhase: 'playing',
        engine,
        humanPlayerId,
        playerConfigs: config.players,
        observation,
        events: [],
        winnerId: null,
        standings: [],
        bots,
        selectedCards: [],
        selectedRank: null,
        showChallengeModal: false,
        isProcessingBots: false,
        debugMode: config.debugMode ?? false,
        isSpectator,
      });
      
      // Start the game - bots will play automatically
      const { gameSpeed } = get();
      setTimeout(() => get().processBotTurn(), Math.max(50, 300 / gameSpeed));
    },
    
    resetGame: () => {
      set({
        uiPhase: 'start',
        engine: null,
        humanPlayerId: null,
        playerConfigs: [],
        observation: null,
        gameState: null,
        events: [],
        winnerId: null,
        standings: [],
        bots: new Map(),
        selectedCards: [],
        selectedRank: null,
        showChallengeModal: false,
        isProcessingBots: false,
        showVictoryOverlay: false,
        pendingWinnerId: null,
        activeChallenge: null,
        challengeReveal: null,
        debugMode: false,
        isSpectator: false,
        gameSpeed: 1,
      });
    },
    
    playCards: () => {
      const { engine, humanPlayerId, selectedCards, selectedRank } = get();
      if (!engine || !humanPlayerId || selectedCards.length === 0 || !selectedRank) {
        return;
      }
      
      const move = createPlayMove(humanPlayerId, selectedCards, selectedRank, selectedCards.length);
      engine.submitMove(humanPlayerId, move);
      
      set({ 
        selectedCards: [], 
        selectedRank: null,
        showChallengeModal: true,
        challengeTimeLeft: 5,
      });
      
      get().updateObservation();
      
      // Start challenge window timer
      const timer = setInterval(() => {
        const { challengeTimeLeft, showChallengeModal, engine } = get();
        if (!showChallengeModal || !engine) {
          clearInterval(timer);
          return;
        }
        
        if (challengeTimeLeft <= 0) {
          clearInterval(timer);
          
          // Check who made the last play - they can't challenge themselves
          const state = engine.getState();
          const lastPlayerId = state.lastPlay?.playerId;
          
          // Only submit challenge decision if human didn't make the last play
          if (lastPlayerId !== humanPlayerId) {
            engine.submitChallengeDecision(humanPlayerId, false);
          }
          
          get().processBotChallenges(); // Let bots decide
          engine.processChallenges(); // Process all decisions
          
          set({ showChallengeModal: false });
          get().updateObservation();
          const { gameSpeed } = get();
          setTimeout(() => get().processBotTurn(), Math.max(50, 200 / gameSpeed));
          return;
        }
        
        set({ challengeTimeLeft: challengeTimeLeft - 1 });
      }, 1000);
    },
    
    challenge: () => {
      const { engine, humanPlayerId, observation } = get();
      if (!engine || !humanPlayerId || !observation) return;
      
      // Check who made the last play - can't challenge yourself
      const state = engine.getState();
      const lastPlayerId = state.lastPlay?.playerId;
      if (lastPlayerId === humanPlayerId) return; // Can't challenge own play
      
      // Human challenges the last claim
      engine.submitChallengeDecision(humanPlayerId, true);
      
      // Other players pass (except the one who played)
      get().processBotChallenges();
      
      // Process challenges and resolve
      engine.processChallenges();
      
      set({ showChallengeModal: false });
      get().updateObservation();
      
      const { gameSpeed } = get();
      setTimeout(() => get().processBotTurn(), Math.max(50, 300 / gameSpeed));
    },
    
    pass: () => {
      const { engine, humanPlayerId } = get();
      if (!engine || !humanPlayerId) return;
      
      // Check who made the last play
      const state = engine.getState();
      const lastPlayerId = state.lastPlay?.playerId;
      
      // Only submit decision if human didn't make the last play
      if (lastPlayerId !== humanPlayerId) {
        engine.submitChallengeDecision(humanPlayerId, false);
      }
      
      // Other players decide
      get().processBotChallenges();
      
      // Process all challenge decisions and advance game
      engine.processChallenges();
      
      set({ showChallengeModal: false });
      get().updateObservation();
      
      const { gameSpeed } = get();
      setTimeout(() => get().processBotTurn(), Math.max(50, 200 / gameSpeed));
    },
    
    updateObservation: () => {
      const { engine, humanPlayerId, isSpectator } = get();
      if (!engine) return;
      
      // Store full game state for spectator mode
      if (isSpectator) {
        const gameState = engine.getState();
        set({ gameState });
      }
      
      // In spectator mode, observe from current player's perspective
      const observeId = isSpectator 
        ? engine.getCurrentPlayer().id 
        : humanPlayerId;
      
      if (!observeId) return;
      
      const observation = engine.getObservation(observeId);
      set({ observation });
    },
    
    processBotTurn: () => {
      const { engine, humanPlayerId, uiPhase, isSpectator } = get();
      if (!engine || uiPhase !== 'playing') return;
      
      const state = engine.getState();
      if (state.phase === 'GAME_OVER') {
        set({ uiPhase: 'gameOver' });
        return;
      }
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer) return;
      const currentPlayerId = currentPlayer.id;
      
      // If it's human's turn and not spectator, don't process
      if (currentPlayerId === humanPlayerId && !isSpectator) {
        get().updateObservation();
        return;
      }
      
      // If waiting for challenges (for human player only)
      if (state.phase === 'WAITING_FOR_CHALLENGES' && !isSpectator) {
        // For human player, show challenge window with enough time to react
        set({ showChallengeModal: true, challengeTimeLeft: 5 });
        
        const timer = setInterval(() => {
          const { challengeTimeLeft, showChallengeModal, engine: eng, humanPlayerId: hpId } = get();
          if (!showChallengeModal || !eng) {
            clearInterval(timer);
            return;
          }
          
          if (challengeTimeLeft <= 0) {
            clearInterval(timer);
            
            // Check who made the last play
            const st = eng.getState();
            const lastPlayerId = st.lastPlay?.playerId;
            
            // Human passes (only if they didn't make the play)
            if (hpId && lastPlayerId !== hpId) {
              eng.submitChallengeDecision(hpId, false);
            }
            get().processBotChallenges();
            eng.processChallenges();
            
            set({ showChallengeModal: false });
            get().updateObservation();
            const { gameSpeed } = get();
            setTimeout(() => get().processBotTurn(), Math.max(50, 100 / gameSpeed));
            return;
          }
          
          set({ challengeTimeLeft: challengeTimeLeft - 1 });
        }, 1000); // 1 second countdown for human-friendly timing
        
        return;
      }
      
      // Use engine.tick() for bot turns - it handles everything correctly
      const { gameSpeed } = get();
      setTimeout(() => {
        const { engine: eng, uiPhase: phase } = get();
        if (!eng || phase !== 'playing') return;
        
        const currentState = eng.getState();
        if (currentState.phase === 'GAME_OVER') {
          set({ uiPhase: 'gameOver' });
          return;
        }
        
        // Use tick() which properly handles active players and challenges
        const didSomething = eng.tick();
        get().updateObservation();

        const nextState = eng.getState();

        if (didSomething && nextState.phase !== 'GAME_OVER') {
          const { gameSpeed: currentSpeed } = get();
          setTimeout(() => get().processBotTurn(), Math.max(50, 100 / currentSpeed));
        }
      }, Math.max(50, 150 / gameSpeed));
    },
    
    processBotChallenges: () => {
      const { engine, humanPlayerId, bots } = get();
      if (!engine) return;
      
      const state = engine.getState();
      if (state.phase !== 'WAITING_FOR_CHALLENGES') return;
      
      // Who made the last play? They can't challenge themselves
      const lastPlayerId = state.lastPlay?.playerId;
      
      // All bots submit their challenge decisions (except the one who played, and finished players)
      for (const [botId, bot] of bots) {
        if (botId === humanPlayerId) continue;
        if (botId === lastPlayerId) continue; // Can't challenge own play
        if (!state.activePlayerIds.includes(botId)) continue; // Finished players can't challenge
        
        const botObs = engine.getObservation(botId);
        const lastClaim = botObs.lastClaim;
        const shouldChallenge = lastClaim 
          ? bot.shouldChallenge(botObs, lastClaim.rank, lastClaim.count) 
          : false;
        
        engine.submitChallengeDecision(botId, shouldChallenge);
      }
    },
    
    handleEvent: (event: GameEvent) => {
      const { isSpectator } = get();
      get().addEvent(event);
      
      if (event.type === 'PLAYER_FINISHED') {
        // Update standings when a player finishes
        const { standings } = get();
        const newStanding = {
          playerId: event.playerId,
          position: event.position,
          score: event.score,
          finishedAtRound: event.finishedAtRound,
        };
        get().setStandings([...standings, newStanding]);
        
        // Show victory overlay for first place (winner)
        if (event.position === 1) {
          get().setShowVictoryOverlay(true);
          get().setPendingWinnerId(event.playerId);
          get().setWinnerId(event.playerId);
          set({ 
            showChallengeModal: false,
            activeChallenge: null,
            challengeReveal: null,
          });
        }
      }
      
      // PLAYER_WON is deprecated, handled by PLAYER_FINISHED + GAME_OVER
      
      if (event.type === 'GAME_OVER') {
        // Update standings from final event
        if (event.standings && event.standings.length > 0) {
          get().setStandings([...event.standings]);
        }
        get().setWinnerId(event.winnerId || null);
        
        // NOW transition to game over screen (all players finished)
        set({ uiPhase: 'gameOver' });
      }
      
      // Show challenge indicator in spectator mode
      if (event.type === 'CHALLENGE_DECLARED' && isSpectator) {
        set({
          activeChallenge: {
            challengerId: event.challengerId,
            accusedId: event.accusedId,
          },
        });
        
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
          get().dismissChallenge();
        }, 2000);
      }
      
      // Show challenge reveal overlay when challenge is resolved
      if (event.type === 'CHALLENGE_RESOLVED') {
        // Determine who receives the pile (the loser)
        const receiverId = event.wasLie ? event.accusedId : event.challengerId;
        
        set({ 
          activeChallenge: null,
          challengeReveal: {
            revealedCards: event.revealedCards,
            wasLie: event.wasLie,
            claimedRank: event.claimedRank,
            claimedCount: event.claimedCount,
            challengerId: event.challengerId,
            accusedId: event.accusedId,
            receiverId,
          },
        });
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          get().dismissChallengeReveal();
        }, 3000);
      }
      
      get().updateObservation();
    },
    
    // Override dismissVictoryOverlay - game continues after first player wins!
    dismissVictoryOverlay: () => {
      const { pendingWinnerId, gameSpeed } = get();
      set({ 
        showVictoryOverlay: false,
        pendingWinnerId: null,
        winnerId: pendingWinnerId,
        // DO NOT set uiPhase to gameOver here - game continues until GAME_OVER event
      });
      
      // Continue bot processing after victory overlay
      setTimeout(() => get().processBotTurn(), Math.max(50, 300 / gameSpeed));
    },
  }))
);
