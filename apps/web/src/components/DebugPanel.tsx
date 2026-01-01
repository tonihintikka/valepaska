import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/game-store';
import type { GameEvent, Rank } from '@valepaska/core';
import { RANK_DISPLAY } from '../types';

export function DebugPanel() {
  const { t: tCommon } = useTranslation('common');
  const { t: tGame } = useTranslation('game');
  const { t: tUi } = useTranslation('ui');
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
        return `🎮 ${tUi('gameScreen.events.gameStarted')} (${event.playerIds?.length ?? 0} ${tCommon('player.player')})`;
      case 'PLAY_MADE':
        return `🃏 ${tGame('actions.played', {
          player: getPlayerName(event.playerId),
          count: event.claimCount,
          rank: displayRank(event.claimRank)
        })}`;
      case 'CHALLENGE_DECLARED':
        return `⚡ ${tGame('actions.challenged', {
          challenger: getPlayerName(event.challengerId),
          accused: getPlayerName(event.accusedId)
        })}`;
      case 'CHALLENGE_RESOLVED':
        return `${event.wasLie ? `😱 ${tGame('results.lie')}` : `✅ ${tGame('results.truth')}`} → ${tGame('actions.picksUp', { player: getPlayerName(event.wasLie ? event.accusedId : event.challengerId) })}`;
      case 'PILE_BURNED':
        return `🔥 ${tGame('burn.title')} ${event.reason}`;
      case 'CARDS_DRAWN':
        return `📥 ${tGame('actions.drew', {
          player: getPlayerName(event.playerId),
          count: event.cardCount
        })}`;
      case 'TURN_ADVANCED':
        return `➡️ ${tGame('status.turn', { player: getPlayerName(event.currentPlayerId) })}`;
      case 'PLAYER_WON':
        return `🏆 ${tUi('gameOverScreen.winnerWon', { winner: getPlayerName(event.winnerId) })}`;
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
          <span className="text-sm font-medium text-white">{tUi('debugPanel.title')}</span>
          {isProcessingBots && (
            <span className="ml-auto text-xs bg-accent-gold text-bg-deep px-2 py-0.5 rounded-full animate-pulse">
              {tUi('debugPanel.botThinking')}
            </span>
          )}
        </div>
      </div>

      {/* Game State */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">{tUi('debugPanel.gameState')}</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">{tUi('debugPanel.phase')}</div>
            <div className={`font-mono font-medium ${state.phase === 'GAME_OVER' ? 'text-accent-gold' :
              state.phase === 'WAITING_FOR_CHALLENGES' ? 'text-red-400' :
                'text-accent-ice'
              }`}>
              {state.phase}
            </div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">{tUi('debugPanel.round')}</div>
            <div className="font-mono font-medium text-white">{state.roundNumber}</div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">{tUi('debugPanel.currentTurn')}</div>
            <div className="font-medium text-white truncate">
              {currentPlayer?.name ?? 'N/A'}
              {currentPlayer?.id === humanPlayerId && ' 👤'}
            </div>
          </div>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-slate-400">{tUi('debugPanel.playerNumber')}</div>
            <div className="font-mono font-medium text-white">
              {state.currentPlayerIndex + 1}/{state.players.length}
            </div>
          </div>
        </div>
      </div>

      {/* Piles */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">{tUi('debugPanel.piles.title')}</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.tablePile.length}</div>
            <div className="text-xs text-slate-400">{tUi('debugPanel.piles.table')}</div>
          </div>
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.drawPile.length}</div>
            <div className="text-xs text-slate-400">{tUi('debugPanel.piles.draw')}</div>
          </div>
          <div className="flex-1 bg-bg-surface rounded p-2 text-center">
            <div className="text-2xl font-bold text-white">{state.burnPile.length}</div>
            <div className="text-xs text-slate-400">{tUi('debugPanel.piles.burn')}</div>
          </div>
        </div>
      </div>

      {/* Last Claim */}
      {state.lastPlay && (
        <div className="p-3 border-b border-slate-800">
          <h3 className="text-xs font-medium text-slate-400 mb-2">{tUi('debugPanel.lastPlay.title')}</h3>
          <div className="bg-bg-surface rounded p-2">
            <div className="text-sm text-white">
              <span className="font-medium">{getPlayerName(state.lastPlay.playerId)}</span>
              {` ${tUi('debugPanel.lastPlay.played')} `}
              <span className="text-accent-gold font-bold">
                {state.lastPlay.claimCount}× {displayRank(state.lastPlay.claimRank)}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {tUi('debugPanel.lastPlay.actualCards')} {state.lastPlay.cards.map(c =>
                `${RANK_DISPLAY[c.rank]}${c.suit === 'hearts' || c.suit === 'diamonds' ? '♥' : '♠'}`
              ).join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Hand sizes */}
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-xs font-medium text-slate-400 mb-2">{tUi('debugPanel.handSizes.title')}</h3>
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
                  {hand?.length ?? 0} {tUi('debugPanel.handSizes.cards')}
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
            {tUi('debugPanel.events')} ({events.length})
          </h3>
          <button
            onClick={handleCopyEvents}
            className={`text-[10px] px-2 py-0.5 rounded transition-colors ${copied
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600'
              }`}
          >
            {copied ? tCommon('buttons.copied') : tCommon('buttons.copyJson')}
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




