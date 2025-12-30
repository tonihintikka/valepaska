import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  GameEngine, 
  type PlayerId, 
  type Rank, 
  type GameEvent, 
  type PlayerObservation,
  type Player,
  type GameState,
  createPlayMove,
  createHumanPlayer,
  createBotPlayer,
} from '@valepaska/core';
import { RuleBot } from '@valepaska/bots';
import type { UIPhase, PlayerConfig, GameConfig, BotDifficulty } from '../types';

interface GameStore {
  // Core state
  uiPhase: UIPhase;
  engine: GameEngine | null;
  humanPlayerId: PlayerId | null;
  playerConfigs: PlayerConfig[];
  observation: PlayerObservation | null;
  gameState: GameState | null; // Full state for spectator mode
  events: GameEvent[];
  winnerId: PlayerId | null;
  
  // UI state
  selectedCards: string[];
  selectedRank: Rank | null;
  showChallengeModal: boolean;
  challengeTimeLeft: number;
  isProcessingBots: boolean;
  
  // Debug/Spectator
  debugMode: boolean;
  isSpectator: boolean;
  
  // Bot instances
  bots: Map<PlayerId, RuleBot>;
  
  // Actions
  startGame: (config: GameConfig) => void;
  resetGame: () => void;
  
  // Human actions
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  clearSelection: () => void;
  setSelectedRank: (rank: Rank | null) => void;
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
  subscribeWithSelector((set, get) => ({
    // Initial state
    uiPhase: 'start',
    engine: null,
    humanPlayerId: null,
    playerConfigs: [],
    observation: null,
    gameState: null,
    events: [],
    winnerId: null,
    
    selectedCards: [],
    selectedRank: null,
    showChallengeModal: false,
    challengeTimeLeft: 0,
    isProcessingBots: false,
    
    debugMode: false,
    isSpectator: false,
    
    bots: new Map(),
    
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
        }
      }
      
      // Subscribe to events
      engine.on('event', (event: GameEvent) => {
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
        bots,
        selectedCards: [],
        selectedRank: null,
        showChallengeModal: false,
        isProcessingBots: false,
        debugMode: config.debugMode ?? false,
        isSpectator,
      });
      
      // Start the game - bots will play automatically
      setTimeout(() => get().processBotTurn(), 300);
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
        bots: new Map(),
        selectedCards: [],
        selectedRank: null,
        showChallengeModal: false,
        isProcessingBots: false,
        debugMode: false,
        isSpectator: false,
      });
    },
    
    selectCard: (cardId: string) => {
      const { selectedCards } = get();
      if (selectedCards.length < 4 && !selectedCards.includes(cardId)) {
        set({ selectedCards: [...selectedCards, cardId] });
      }
    },
    
    deselectCard: (cardId: string) => {
      const { selectedCards } = get();
      set({ selectedCards: selectedCards.filter(id => id !== cardId) });
    },
    
    clearSelection: () => {
      set({ selectedCards: [], selectedRank: null });
    },
    
    setSelectedRank: (rank: Rank | null) => {
      set({ selectedRank: rank });
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
          setTimeout(() => get().processBotTurn(), 200);
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
      
      setTimeout(() => get().processBotTurn(), 300);
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
      
      setTimeout(() => get().processBotTurn(), 200);
    },
    
    updateObservation: () => {
      const { engine, humanPlayerId, playerConfigs, isSpectator } = get();
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
      const { engine, humanPlayerId, bots, uiPhase, isSpectator } = get();
      if (!engine || uiPhase !== 'playing') return;
      
      const state = engine.getState();
      if (state.phase === 'GAME_OVER') return;
      
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (!currentPlayer) return;
      const currentPlayerId = currentPlayer.id;
      
      // If it's human's turn and not spectator, don't process
      if (currentPlayerId === humanPlayerId && !isSpectator) {
        get().updateObservation();
        return;
      }
      
      // If waiting for challenges
      if (state.phase === 'WAITING_FOR_CHALLENGES') {
        // In spectator mode, process challenges immediately (fast)
        if (isSpectator) {
          get().processBotChallenges();
          engine.processChallenges();
          get().updateObservation();
          setTimeout(() => get().processBotTurn(), 150);
          return;
        }
        
        // For human player, show quick challenge window
        set({ showChallengeModal: true, challengeTimeLeft: 2 });
        
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
            setTimeout(() => get().processBotTurn(), 100);
            return;
          }
          
          set({ challengeTimeLeft: challengeTimeLeft - 1 });
        }, 500); // Faster countdown
        
        return;
      }
      
      // Get the bot for current player
      const bot = bots.get(currentPlayerId);
      if (!bot) return;
      
      set({ isProcessingBots: true });
      
      // Get bot's observation
      const botObs = engine.getObservation(currentPlayerId);
      
      // Bot chooses a move
      const move = bot.chooseMove(botObs);
      
      // Apply the move with a short delay for animation
      setTimeout(() => {
        engine.submitMove(currentPlayerId, move);
        get().updateObservation();
        set({ isProcessingBots: false });
        
        // Continue with challenge window
        setTimeout(() => get().processBotTurn(), 100);
      }, 300);
    },
    
    processBotChallenges: () => {
      const { engine, humanPlayerId, bots } = get();
      if (!engine) return;
      
      const state = engine.getState();
      if (state.phase !== 'WAITING_FOR_CHALLENGES') return;
      
      // Who made the last play? They can't challenge themselves
      const lastPlayerId = state.lastPlay?.playerId;
      
      // All bots submit their challenge decisions (except the one who played)
      for (const [botId, bot] of bots) {
        if (botId === humanPlayerId) continue;
        if (botId === lastPlayerId) continue; // Can't challenge own play
        
        const botObs = engine.getObservation(botId);
        const lastClaim = botObs.lastClaim;
        const shouldChallenge = lastClaim 
          ? bot.shouldChallenge(botObs, lastClaim.rank, lastClaim.count) 
          : false;
        
        engine.submitChallengeDecision(botId, shouldChallenge);
      }
    },
    
    handleEvent: (event: GameEvent) => {
      const { events } = get();
      set({ events: [...events, event] });
      
      if (event.type === 'PLAYER_WON') {
        set({ 
          uiPhase: 'gameOver', 
          winnerId: event.playerId,
          showChallengeModal: false,
        });
      }
      
      get().updateObservation();
    },
  }))
);

