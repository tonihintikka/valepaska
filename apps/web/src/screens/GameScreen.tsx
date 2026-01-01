import { GameTable } from '../components/GameTable';
import { PlayerHand } from '../components/PlayerHand';
import { ActionBar } from '../components/ActionBar';
import { EventLog } from '../components/EventLog';
import { DebugPanel } from '../components/DebugPanel';
import { VictoryOverlay } from '../components/VictoryOverlay';
import { ChallengeIndicator } from '../components/ChallengeIndicator';
import { ChallengeRevealOverlay } from '../components/ChallengeRevealOverlay';
import { SpeedControl } from '../components/SpeedControl';
import { Logo } from '../components/Logo';
import { useGameStore } from '../store/game-store';
import { PLAYER_POSITIONS, type PlayerPosition } from '../types';

export function GameScreen() {
  const debugMode = useGameStore((state) => state.debugMode);
  const isSpectator = useGameStore((state) => state.isSpectator);
  const showVictoryOverlay = useGameStore((state) => state.showVictoryOverlay);
  const pendingWinnerId = useGameStore((state) => state.pendingWinnerId);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const dismissVictoryOverlay = useGameStore((state) => state.dismissVictoryOverlay);
  const activeChallenge = useGameStore((state) => state.activeChallenge);
  const dismissChallenge = useGameStore((state) => state.dismissChallenge);
  const challengeReveal = useGameStore((state) => state.challengeReveal);
  const dismissChallengeReveal = useGameStore((state) => state.dismissChallengeReveal);

  // Get player position by ID (for challenge indicator)
  const getPlayerPosition = (playerId: string): PlayerPosition => {
    const playerCount = playerConfigs.length;
    const positions = PLAYER_POSITIONS[playerCount] ?? PLAYER_POSITIONS[4]!;
    const playerIndex = playerConfigs.findIndex((p) => p.id === playerId);
    return positions[playerIndex] ?? 'top';
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-bg-deep overflow-hidden fixed inset-0">
      {/* Spectator mode banner */}
      {isSpectator && (
        <div className="bg-accent-ice/20 text-accent-ice text-center py-2 text-sm shrink-0">
          👁️ Katselutila - Seuraat bottien peliä
        </div>
      )}

      {/* Main game area */}
      <div className="flex-1 relative min-h-0 w-full">
        <GameTable />

        {/* Logo in top-left corner */}
        <div className="absolute top-safe-top left-4 z-20 pt-2">
          <Logo size="sm" variant="light" showTitle={false} animate={false} />
        </div>

        {/* EventLog: Top right, under safe area */}
        {!debugMode && (
          <div className="absolute top-safe-top right-4 z-20 pt-12 sm:pt-2 pointer-events-none">
            <div className="pointer-events-auto">
              <EventLog />
            </div>
          </div>
        )}
      </div>

      {/* Player's hand and actions (only if not spectator) */}
      {!isSpectator && (
        <div className="relative z-10 w-full shrink-0 flex flex-col pb-safe-bottom">
          <PlayerHand />
          <ActionBar />
        </div>
      )}

      {/* Spectator controls */}
      {isSpectator && (
        <div className="bg-bg-surface/80 backdrop-blur-sm border-t border-slate-700 px-4 py-3">
          <div className="flex items-center justify-center gap-6">
            <SpeedControl />
          </div>
        </div>
      )}

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

      {/* Challenge reveal overlay - shows flipped cards after challenge */}
      {challengeReveal && (() => {
        const challenger = playerConfigs.find((p) => p.id === challengeReveal.challengerId);
        const accused = playerConfigs.find((p) => p.id === challengeReveal.accusedId);
        const receiver = playerConfigs.find((p) => p.id === challengeReveal.receiverId);
        if (!challenger || !accused || !receiver) return null;

        return (
          <ChallengeRevealOverlay
            revealedCards={challengeReveal.revealedCards}
            wasLie={challengeReveal.wasLie}
            claimedRank={challengeReveal.claimedRank}
            claimedCount={challengeReveal.claimedCount}
            accusedName={accused.name}
            receiverName={receiver.name}
            onComplete={dismissChallengeReveal}
          />
        );
      })()}

      {/* Victory overlay */}
      {showVictoryOverlay && pendingWinnerId && (() => {
        const winner = playerConfigs.find((p) => p.id === pendingWinnerId);
        if (!winner) return null;

        return (
          <VictoryOverlay
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

