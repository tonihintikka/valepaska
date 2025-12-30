import { useGameStore } from './store/game-store';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';

export function App() {
  const phase = useGameStore((state) => state.uiPhase);

  return (
    <div className="h-full w-full">
      {phase === 'start' && <StartScreen />}
      {phase === 'playing' && <GameScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
    </div>
  );
}

