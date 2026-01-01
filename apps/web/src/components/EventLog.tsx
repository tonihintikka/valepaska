import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import type { GameEvent } from '@valepaska/core';
import { RANK_DISPLAY } from '../types';

export function EventLog() {
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
        return `${getPlayerName(event.playerId)} pelasi ${event.claimCount}× ${RANK_DISPLAY[event.claimRank]}`;
      case 'CHALLENGE_DECLARED':
        return `${getPlayerName(event.challengerId)} haastoi ${getPlayerName(event.accusedId)}!`;
      case 'CHALLENGE_RESOLVED':
        return event.wasLie
          ? `Vale paljastui! ${getPlayerName(event.accusedId)} nostaa pakan`
          : `Totta oli! ${getPlayerName(event.challengerId)} nostaa pakan`;
      case 'PILE_BURNED':
        const reasons = {
          TEN: 'kympit kaataa',
          ACE: 'äSSä kaataa',
          FOUR_IN_ROW: 'neljä samaa kaataa',
        };
        return `🔥 Pöytä kaatui: ${reasons[event.reason]}`;
      case 'CARDS_DRAWN':
        return `${getPlayerName(event.playerId)} nosti ${event.cardCount} korttia`;
      case 'TURN_ADVANCED':
        return `Vuoro: ${getPlayerName(event.currentPlayerId)}`;
      case 'PLAYER_WON':
        return `🏆 ${getPlayerName(event.winnerId)} voitti pelin!`;
      case 'GAME_STARTED':
        return 'Peli alkoi!';
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
      <div className="text-xs text-slate-400 mb-2 font-medium">Tapahtumat</div>
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

