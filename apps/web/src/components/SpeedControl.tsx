import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×', description: 'Hidas' },
  { value: 1, label: '1×', description: 'Normaali' },
  { value: 2, label: '2×', description: 'Nopea' },
  { value: 4, label: '4×', description: 'Hyvin nopea' },
];

/**
 * Speed control for spectator mode
 * Allows adjusting how fast bots play
 */
export function SpeedControl() {
  const gameSpeed = useGameStore((state) => state.gameSpeed);
  const setGameSpeed = useGameStore((state) => state.setGameSpeed);

  return (
    <div className="flex items-center gap-4">
      <span className="text-slate-400 text-sm">Nopeus:</span>
      <div className="flex gap-1">
        {SPEED_OPTIONS.map((option) => (
          <motion.button
            key={option.value}
            onClick={() => setGameSpeed(option.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${gameSpeed === option.value
                ? 'bg-accent-gold text-bg-deep'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }
            `}
            title={option.description}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

