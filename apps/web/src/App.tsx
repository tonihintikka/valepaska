import { useGameStore } from './store/game-store';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { UpdatePrompt } from './components/UpdatePrompt';

export function App() {
  const phase = useGameStore((state) => state.uiPhase);

  return (
    <div className="h-full w-full">
      {phase === 'start' && <StartScreen />}
      {phase === 'playing' && <GameScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
      <UpdatePrompt />
    </div>
  );
}
