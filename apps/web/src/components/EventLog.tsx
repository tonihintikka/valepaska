import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/game-store';
import type { GameEvent } from '@valepaska/core';
import { RANK_DISPLAY } from '../types';

export function EventLog() {
  const { t: tGame } = useTranslation('game');
  const { t: tUi } = useTranslation('ui');
  const events = useGameStore((state) => state.events);
  const playerConfigs = useGameStore((state) => state.playerConfigs);

  // Show only last 5 events
  const recentEvents = events.slice(-5);

  const getPlayerName = (playerId: string) => {
    return playerConfigs.find((p) => p.id === playerId)?.name ?? playerId;
  };

  const formatEvent = (event: GameEvent): string => {
    switch (event.type) {
      case 'PLAY_MADE':
        return tGame('actions.played', {
          player: getPlayerName(event.playerId),
          count: event.claimCount,
          rank: RANK_DISPLAY[event.claimRank]
        });
      case 'CHALLENGE_DECLARED':
        return tGame('actions.challenged', {
          challenger: getPlayerName(event.challengerId),
          accused: getPlayerName(event.accusedId)
        });
      case 'CHALLENGE_RESOLVED':
        return event.wasLie
          ? `${tGame('results.wasLie')} ${tGame('actions.picksUp', { player: getPlayerName(event.accusedId) })}`
          : `${tGame('results.wasTruth')} ${tGame('actions.picksUp', { player: getPlayerName(event.challengerId) })}`;
      case 'PILE_BURNED':
        const reasons = {
          TEN: tGame('burn.ten'),
          ACE: tGame('burn.ace'),
          FOUR_IN_ROW: tGame('burn.fourInRow'),
        };
        return `🔥 ${tGame('burn.title')} ${reasons[event.reason]}`;
      case 'CARDS_DRAWN':
        return tGame('actions.drew', {
          player: getPlayerName(event.playerId),
          count: event.cardCount
        });
      case 'TURN_ADVANCED':
        return tGame('status.turn', { player: getPlayerName(event.currentPlayerId) });
      case 'PLAYER_WON':
        return `🏆 ${tUi('gameOverScreen.winnerWon', { winner: getPlayerName(event.winnerId) })}`;
      case 'GAME_STARTED':
        return tUi('gameScreen.events.gameStarted');
      default:
        return '';
    }
  };

  const getEventIcon = (event: GameEvent): string => {
    switch (event.type) {
      case 'PLAY_MADE': return '🎴';
      case 'CHALLENGE_DECLARED': return '⚡';
      case 'CHALLENGE_RESOLVED': return event.wasLie ? '😱' : '😤';
      case 'PILE_BURNED': return '🔥';
      case 'CARDS_DRAWN': return '📥';
      case 'TURN_ADVANCED': return '➡️';
      case 'PLAYER_WON': return '🏆';
      case 'GAME_STARTED': return '🎮';
      default: return '📝';
    }
  };

  if (recentEvents.length === 0) return null;

  return (
    <div className="w-48 sm:w-72 glass rounded-xl p-2 sm:p-3 max-h-28 sm:max-h-48 overflow-hidden">
      <div className="text-xs text-slate-400 mb-2 font-medium">{tUi('gameScreen.events.title')}</div>
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {recentEvents.map((event, index) => {
            const text = formatEvent(event);
            if (!text) return null;

            return (
              <motion.div
                key={`${event.type}-${index}`}
                initial={{ opacity: 0, x: 20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 text-xs"
              >
                <span className="shrink-0">{getEventIcon(event)}</span>
                <span className="text-slate-300">{text}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

