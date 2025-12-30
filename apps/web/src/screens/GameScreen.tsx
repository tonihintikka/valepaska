import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { ActionBar } from '../components/ActionBar';
import { ChallengeModal } from '../components/ChallengeModal';
import { EventLog } from '../components/EventLog';
import { DebugPanel } from '../components/DebugPanel';
import { VictoryOverlay } from '../components/VictoryOverlay';
import { ChallengeIndicator } from '../components/ChallengeIndicator';
import { useGameStore } from '../store/game-store';
import { PLAYER_POSITIONS, type PlayerPosition } from '../types';

export function GameScreen() {
  const showChallengeModal = useGameStore((state) => state.showChallengeModal);
  const debugMode = useGameStore((state) => state.debugMode);
  const isSpectator = useGameStore((state) => state.isSpectator);
  const showVictoryOverlay = useGameStore((state) => state.showVictoryOverlay);
  const pendingWinnerId = useGameStore((state) => state.pendingWinnerId);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const dismissVictoryOverlay = useGameStore((state) => state.dismissVictoryOverlay);
  const activeChallenge = useGameStore((state) => state.activeChallenge);
  const dismissChallenge = useGameStore((state) => state.dismissChallenge);

  // Get player position by ID (for challenge indicator)
  const getPlayerPosition = (playerId: string): PlayerPosition => {
    const playerCount = playerConfigs.length;
    const positions = PLAYER_POSITIONS[playerCount] ?? PLAYER_POSITIONS[4]!;
    const playerIndex = playerConfigs.findIndex((p) => p.id === playerId);
    return positions[playerIndex] ?? 'top';
  };

  return (
    <div className="h-full w-full flex flex-col bg-bg-deep overflow-hidden">
      {/* Spectator mode banner */}
      {isSpectator && (
        <div className="bg-accent-ice/20 text-accent-ice text-center py-2 text-sm">
          👁️ Katselutila - Seuraat bottien peliä
        </div>
      )}

      {/* Main game area */}
      <div className="flex-1 relative">
        <GameTable />
        
        {/* Event log overlay (only if not in debug mode) */}
        {!debugMode && (
          <div className="absolute top-4 right-4 z-20">
            <EventLog />
          </div>
        )}
      </div>

      {/* Player's hand and actions (only if not spectator) */}
      {!isSpectator && (
        <div className="relative z-10">
          <PlayerHand />
          <ActionBar />
        </div>
      )}

      {/* Spectator controls */}
      {isSpectator && (
        <div className="bg-bg-surface/80 backdrop-blur-sm border-t border-slate-700 px-4 py-3 text-center">
          <div className="text-slate-400 text-sm">
            Peli etenee automaattisesti...
          </div>
        </div>
      )}

      {/* Challenge modal */}
      {showChallengeModal && !isSpectator && <ChallengeModal />}

      {/* Challenge indicator (spectator mode) */}
      {activeChallenge && isSpectator && (() => {
        const challenger = playerConfigs.find((p) => p.id === activeChallenge.challengerId);
        const accused = playerConfigs.find((p) => p.id === activeChallenge.accusedId);
        if (!challenger || !accused) return null;

        return (
          <ChallengeIndicator
            challengerId={activeChallenge.challengerId}
            challengerName={challenger.name}
            challengerPosition={getPlayerPosition(activeChallenge.challengerId)}
            accusedName={accused.name}
            onComplete={dismissChallenge}
          />
        );
      })()}

      {/* Victory overlay */}
      {showVictoryOverlay && pendingWinnerId && (() => {
        const winner = playerConfigs.find((p) => p.id === pendingWinnerId);
        if (!winner) return null;
        
        return (
          <VictoryOverlay
            winnerId={pendingWinnerId}
            winnerName={winner.name}
            winnerAvatar={winner.avatar}
            onComplete={dismissVictoryOverlay}
          />
        );
      })()}

      {/* Debug panel */}
      {debugMode && <DebugPanel />}
    </div>
  );
}

