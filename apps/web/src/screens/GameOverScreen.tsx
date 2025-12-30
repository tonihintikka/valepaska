import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';

export function GameOverScreen() {
  const winnerId = useGameStore((state) => state.winnerId);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const resetGame = useGameStore((state) => state.resetGame);

  const winner = playerConfigs.find((p) => p.id === winnerId);
  const isHumanWinner = winnerId === humanPlayerId;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-bg-deep relative overflow-hidden">
      {/* Background celebration effect */}
      {isHumanWinner && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 0, 
                y: '100vh',
                x: `${Math.random() * 100}vw`,
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: '-20vh',
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
              }}
              className="absolute text-4xl"
            >
              {['✨', '🎉', '🏆', '⭐'][i % 4]}
            </motion.div>
          ))}
        </div>
      )}

      {/* Glow effect */}
      <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl ${
        isHumanWinner ? 'bg-accent-gold/20' : 'bg-accent-ice/10'
      }`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-center"
      >
        {/* Trophy or crying emoji */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
          className="text-9xl mb-6"
        >
          {isHumanWinner ? '🏆' : '😢'}
        </motion.div>

        {/* Result text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-5xl font-serif font-bold mb-4 ${
            isHumanWinner ? 'text-accent-gold text-shadow-gold' : 'text-slate-300'
          }`}
        >
          {isHumanWinner ? 'Voitit!' : 'Hävisit!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-slate-400 mb-8"
        >
          {isHumanWinner 
            ? 'Onneksi olkoon! Olet mestari bluffaaja!' 
            : `${winner?.name ?? 'Botti'} voitti pelin`
          }
        </motion.p>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-6 mb-8 max-w-sm mx-auto"
        >
          <h3 className="text-lg font-medium text-slate-300 mb-4">Pelin tilastot</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-slate-400">Voittaja</div>
            <div className="text-white font-medium">{winner?.name}</div>
            <div className="text-slate-400">Vaikeustaso</div>
            <div className="text-white font-medium">{winner?.botDifficulty ?? 'Ihminen'}</div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            className="btn btn-primary text-lg"
          >
            Uusi peli
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

