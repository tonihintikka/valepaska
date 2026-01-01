import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { PileCard } from './Card';
import { MiniCard } from './MiniCard';
import { PLAYER_POSITIONS, type PlayerPosition } from '../types';
import type { Card } from '@valepaska/core';

export function GameTable() {
  const observation = useGameStore((state) => state.observation);
  const gameState = useGameStore((state) => state.gameState);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const isSpectator = useGameStore((state) => state.isSpectator);
  const standings = useGameStore((state) => state.standings);

  if (!observation) return null;

  const playerCount = playerConfigs.length;
  const positions = PLAYER_POSITIONS[playerCount] ?? PLAYER_POSITIONS[4]!;

  // In spectator mode, show all players; otherwise filter out human
  const displayedPlayers = isSpectator 
    ? playerConfigs 
    : playerConfigs.filter((p) => p.id !== humanPlayerId);
  
  // In spectator mode, use all positions; otherwise skip bottom (human's position)
  const playerPositions = isSpectator 
    ? positions 
    : positions.slice(1);

  // Get last claim info
  const lastClaim = observation.lastClaim;

  return (
    <div className="relative w-full h-full felt-texture overflow-hidden">
      {/* Table edge glow */}
      <div className="absolute inset-4 rounded-3xl border border-emerald-700/30 pointer-events-none" />
      <div className="absolute inset-8 rounded-2xl border border-emerald-600/20 pointer-events-none" />

      {/* Center pile area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8">
        {/* Table pile and claim info */}
        <div className="flex flex-col items-center gap-4">
          {/* Table pile */}
          <div className="relative">
            {observation.tablePileSize > 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.3 }}
              >
                <PileCard count={observation.tablePileSize} />
              </motion.div>
            ) : (
              <div className="w-20 h-28 rounded-lg border-2 border-dashed border-emerald-600/30 flex items-center justify-center">
                <span className="text-emerald-600/50 text-sm">Pöytä</span>
              </div>
            )}
          </div>

          {/* Last claim display */}
          {lastClaim && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-lg px-4 py-2 text-center"
            >
              <div className="text-xs text-slate-400 mb-1">Viimeisin väite</div>
              <div className="text-lg font-bold text-accent-gold">
                {lastClaim.count}× {lastClaim.rank}
              </div>
              <div className="text-xs text-slate-400">
                {playerConfigs.find((p) => p.id === lastClaim.playerId)?.name ?? 'Tuntematon'}
              </div>
            </motion.div>
          )}
        </div>

        {/* Draw pile - now part of flex layout, not absolute */}
        <div className="flex flex-col items-center">
          {observation.drawPileSize > 0 ? (
            <div className="relative">
              <PileCard count={observation.drawPileSize} />
              <div className="text-center text-xs text-slate-400 mt-2">
                Nostopakka
              </div>
            </div>
          ) : (
            <div className="w-20 h-28 rounded-lg border-2 border-dashed border-red-500/30 flex items-center justify-center">
              <span className="text-red-500/50 text-xs text-center">Pakka<br/>tyhjä!</span>
            </div>
          )}
        </div>
      </div>

      {/* Players (all in spectator mode, opponents only in normal mode) */}
      {displayedPlayers.map((player, index) => {
        const position = playerPositions[index];
        if (!position) return null;

        // In spectator mode, get hand size from gameState; otherwise from observation
        const handSize = isSpectator && gameState
          ? (gameState.hands.get(player.id)?.length ?? 0)
          : (observation.otherHandSizes.get(player.id) ?? 0);

        const isCurrentPlayer = observation.currentPlayerId === player.id;
        
        // Check if player has finished
        const standing = standings.find(s => s.playerId === player.id);
        const isFinished = !!standing;

        // Get actual cards in spectator mode
        const cards = isSpectator && gameState
          ? gameState.hands.get(player.id) ?? []
          : undefined;

        return (
          <OpponentSlot
            key={player.id}
            position={position}
            name={player.name}
            avatar={player.avatar}
            handSize={handSize}
            isCurrentPlayer={isCurrentPlayer && !isFinished}
            difficulty={player.botDifficulty}
            cards={cards}
            standing={standing}
            isFinished={isFinished}
          />
        );
      })}

      {/* Current turn indicator for human */}
      {observation.currentPlayerId === humanPlayerId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-accent-gold/20 text-accent-gold px-4 py-2 rounded-full text-sm font-medium"
        >
          Sinun vuorosi
        </motion.div>
      )}
    </div>
  );
}

interface OpponentSlotProps {
  position: PlayerPosition;
  name: string;
  avatar?: string;
  handSize: number;
  isCurrentPlayer: boolean;
  difficulty?: string;
  cards?: readonly Card[]; // Actual cards (spectator mode only)
  standing?: { position: number; score: number }; // Player standing if finished
  isFinished: boolean;
}

function OpponentSlot({ position, name, avatar, handSize, isCurrentPlayer, difficulty, cards, standing, isFinished }: OpponentSlotProps) {
  const positionClasses: Record<PlayerPosition, string> = {
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    top: 'top-4 left-1/2 -translate-x-1/2',
    left: 'left-4 top-1/2 -translate-y-1/2',
    right: 'right-4 top-1/2 -translate-y-1/2',
    'top-left': 'top-4 left-1/4',
    'top-right': 'top-4 right-1/4',
  };

  const cardRotation: Record<PlayerPosition, string> = {
    bottom: '',
    top: 'rotate-180',
    left: 'rotate-90',
    right: '-rotate-90',
    'top-left': '',
    'top-right': '',
  };

  return (
    <div className={`absolute ${positionClasses[position]}`}>
      <motion.div
        animate={isCurrentPlayer ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 1.5, repeat: isCurrentPlayer ? Infinity : 0 }}
        className={`glass rounded-xl p-3 ${
          isCurrentPlayer ? 'ring-2 ring-accent-gold shadow-glow-gold' : ''
        } ${
          isFinished ? 'opacity-60' : ''
        }`}
      >
        {/* Player info */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{avatar ?? '🤖'}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-white">{name}</div>
              {isFinished && standing && (
                <span className={`text-xs font-bold ${
                  standing.position === 1 ? 'text-accent-gold' : 
                  standing.position === 2 ? 'text-slate-300' : 
                  standing.position === 3 ? 'text-amber-600' : 
                  'text-slate-500'
                }`}>
                  {standing.position === 1 ? '🏆' : 
                   standing.position === 2 ? '🥈' : 
                   standing.position === 3 ? '🥉' : 
                   `${standing.position}.`}
                </span>
              )}
            </div>
            {difficulty && (
              <div className="text-xs text-slate-400">{difficulty}</div>
            )}
            {isFinished && standing && (
              <div className="text-xs text-accent-gold font-medium">
                {standing.score}p
              </div>
            )}
          </div>
        </div>

        {/* Hand representation */}
        {cards ? (
          // Spectator mode: show actual cards
          <div className={`flex justify-center flex-wrap gap-1 max-w-[200px] ${cardRotation[position]}`}>
            {cards.map((card) => (
              <MiniCard key={card.id} card={card} />
            ))}
          </div>
        ) : (
          // Normal mode: show card backs
          <div className={`flex justify-center -space-x-4 ${cardRotation[position]}`}>
            {Array.from({ length: Math.min(handSize, 5) }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-12 rounded bg-gradient-to-br from-blue-800 to-blue-900 border border-blue-700/50 shadow-sm"
                style={{ transform: `rotate(${(i - 2) * 5}deg)` }}
              />
            ))}
          </div>
        )}

        {/* Card count */}
        <div className="text-center mt-2">
          <span className={`text-xs font-medium ${
            handSize === 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {handSize} korttia
          </span>
        </div>
      </motion.div>
    </div>
  );
}

