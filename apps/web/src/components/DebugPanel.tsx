import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import type { GameEvent, Rank } from '@valepaska/core';
import { RANK_DISPLAY } from '../types';

export function DebugPanel() {
  const [copied, setCopied] = useState(false);
  const engine = useGameStore((state) => state.engine);
  const events = useGameStore((state) => state.events);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const isProcessingBots = useGameStore((state) => state.isProcessingBots);

  if (!engine) return null;

  const state = engine.getState();
  const currentPlayer = state.players[state.currentPlayerIndex];

  const getPlayerName = (id: string) =>
    playerConfigs.find(p => p.id === id)?.name ?? id;

  const displayRank = (rank: Rank | string): string =>
    RANK_DISPLAY[rank as keyof typeof RANK_DISPLAY] ?? rank;

  const formatEvent = (event: GameEvent): string => {
    switch (event.type) {
      case 'GAME_STARTED':
        return `🎮 Peli alkoi (${event.playerIds?.length ?? 0} pelaajaa)`;
      case 'PLAY_MADE':
        return `🃏 ${getPlayerName(event.playerId)} pelasi ${event.claimCount}× ${displayRank(event.claimRank)}`;
      case 'CHALLENGE_DECLARED':
        return `⚡ ${getPlayerName(event.challengerId)} haastoi ${getPlayerName(event.accusedId)}`;
      case 'CHALLENGE_RESOLVED':
        return `${event.wasLie ? '😱 VALE!' : '✅ Totta'} → ${getPlayerName(event.wasLie ? event.accusedId : event.challengerId)} nostaa pakan`;
      case 'PILE_BURNED':
        return `🔥 KAATO: ${event.reason}`;
      case 'CARDS_DRAWN':
        return `📥 ${getPlayerName(event.playerId)} nosti ${event.cardCount} korttia`;
      case 'TURN_ADVANCED':
        return `➡️ Vuoro: ${getPlayerName(event.currentPlayerId)}`;
      case 'PLAYER_WON':
        return `🏆 ${getPlayerName(event.winnerId)} VOITTI!`;
      default:
        return event.type;
    }
  };

  const handleCopyEvents = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(events, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy events', err);
    }
  };

  // Last 10 events
  const recentEvents = events.slice(-10);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-4 bottom-4 w-80 bg-bg-deep/95 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden flex flex-col z-50"
    >
      {/* Header */}
      <div className="bg-bg-elevated px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <span className="text-sm font-medium text-white">Debug Panel</span>
          {isProcessingBots && (
            <span className="ml-auto text-xs bg-accent-gold text-bg-deep px-2 py-0.5 rounded-full animate-pulse">
              Botti ajattelee...
            </span>
          )}
        </div>
      </div>

      {/* Game State */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">PELIN TILA</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">Vaihe</div>
            <div className={`font-mono font-medium ${state.phase === 'GAME_OVER' ? 'text-accent-gold' :
              state.phase === 'WAITING_FOR_CHALLENGES' ? 'text-red-400' :
                'text-accent-ice'
              }`}>
              {state.phase}
            </div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">Kierros</div>
            <div className="font-mono font-medium text-white">{state.roundNumber}</div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">Vuorossa</div>
            <div className="font-medium text-white truncate">
              {currentPlayer?.name ?? 'N/A'}
              {currentPlayer?.id === humanPlayerId && ' 👤'}
            </div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">Pelaaja #</div>
            <div className="font-mono font-medium text-white">
              {state.currentPlayerIndex + 1}/{state.players.length}
            </div>
          </div>
        </div>
      </div>

      {/* Piles */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">PINOT</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.tablePile.length}</div>
            <div className="text-xs text-slate-400">Pöytä</div>
          </div>
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.drawPile.length}</div>
            <div className="text-xs text-slate-400">Nosto</div>
          </div>
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.burnPile.length}</div>
            <div className="text-xs text-slate-400">Pois</div>
          </div>
        </div>
      </div>

      {/* Last Claim */}
      {state.lastPlay && (
        <div className="p-3 border-b border-slate-800">
          <h3 className="text-xs font-medium text-slate-400 mb-2">VIIMEISIN PELI</h3>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-sm text-white">
              <span className="font-medium">{getPlayerName(state.lastPlay.playerId)}</span>
              {' pelasi '}
              <span className="text-accent-gold font-bold">
                {state.lastPlay.claimCount}× {displayRank(state.lastPlay.claimRank)}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Todelliset kortit: {state.lastPlay.cards.map(c =>
                `${RANK_DISPLAY[c.rank]}${c.suit === 'hearts' || c.suit === 'diamonds' ? '♥' : '♠'}`
              ).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Hand sizes */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">KÄSIEN KOOT</h3>
        <div className="space-y-1">
          {state.players.map((player, i) => {
            const hand = state.hands.get(player.id);
            const isCurrentPlayer = i === state.currentPlayerIndex;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between text-xs px-2 py-1 rounded ${isCurrentPlayer ? 'bg-accent-gold/20 text-accent-gold' : 'text-slate-300'
                  }`}
              >
                <span className="truncate">
                  {player.name}
                  {player.id === humanPlayerId && ' 👤'}
                </span>
                <span className={`font-mono font-medium ${hand?.length === 0 ? 'text-red-400' : ''
                  }`}>
                  {hand?.length ?? 0} korttia
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 pb-0 flex items-center justify-between">
          <h3 className="text-xs font-medium text-slate-400">
            TAPAHTUMAT ({events.length})
          </h3>
          <button
            onClick={handleCopyEvents}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
          >
            {copied ? 'Kopioitu!' : 'Kopioi JSON'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {recentEvents.map((event, i) => (
              <motion.div
                key={`${event.type}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs bg-bg-surface rounded p-2 text-slate-300"
              >
                {formatEvent(event)}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}




