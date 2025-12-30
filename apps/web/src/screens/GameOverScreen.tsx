import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { Logo } from '../components/Logo';

export function GameOverScreen() {
  const winnerId = useGameStore((state) => state.winnerId);
  const standings = useGameStore((state) => state.standings);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const isSpectator = useGameStore((state) => state.isSpectator);
  const resetGame = useGameStore((state) => state.resetGame);

  const winner = playerConfigs.find((p) => p.id === winnerId);
  const isHumanWinner = !isSpectator && winnerId === humanPlayerId;
  
  // Get player info for each standing
  const standingsWithPlayers = standings.map(standing => ({
    ...standing,
    player: playerConfigs.find(p => p.id === standing.playerId),
  })).filter(s => s.player); // Filter out any missing players

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

      {/* Logo at top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
        <Logo size="sm" variant="dark" animate={false} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-center"
      >
        {/* Trophy, crying, or spectator emoji */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
          className="text-9xl mb-6"
        >
          {isSpectator ? '🏆' : isHumanWinner ? '🏆' : '😢'}
        </motion.div>

        {/* Result text */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`text-5xl font-serif font-bold mb-4 ${
            isSpectator ? 'text-accent-gold text-shadow-gold' : isHumanWinner ? 'text-accent-gold text-shadow-gold' : 'text-slate-300'
          }`}
        >
          {isSpectator ? 'Peli päättyi!' : isHumanWinner ? 'Voitit!' : 'Hävisit!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-slate-400 mb-8"
        >
          {isSpectator 
            ? `${winner?.name ?? 'Botti'} voitti pelin!`
            : isHumanWinner 
              ? 'Onneksi olkoon! Olet mestari bluffaaja!' 
              : `${winner?.name ?? 'Botti'} voitti pelin`
          }
        </motion.p>

        {/* Leaderboard */}
        {standingsWithPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-6 mb-8 max-w-2xl mx-auto w-full"
          >
            <h3 className="text-lg font-medium text-slate-300 mb-4 text-center">Tulostaulukko</h3>
            <div className="space-y-2">
              {standingsWithPlayers.map((standing, index) => {
                const isLoser = standing.position === standingsWithPlayers.length;
                const isHuman = !isSpectator && standing.playerId === humanPlayerId;
                return (
                  <motion.div
                    key={standing.playerId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isLoser 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : standing.position === 1
                        ? 'bg-accent-gold/10 border border-accent-gold/30'
                        : 'bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold ${
                        standing.position === 1 ? 'text-accent-gold' : 
                        isLoser ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {standing.position === 1 ? '🏆' : 
                         isLoser ? '😢' : 
                         standing.position === 2 ? '🥈' : 
                         standing.position === 3 ? '🥉' : 
                         `${standing.position}.`}
                      </div>
                      <div>
                        <div className={`font-medium ${
                          isHuman ? 'text-accent-ice' : 'text-white'
                        }`}>
                          {standing.player?.name}
                          {isHuman && ' (Sinä)'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {standing.player?.botDifficulty ?? 'Ihminen'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-accent-gold">
                        {standing.score}p
                      </div>
                      {isLoser && (
                        <div className="text-xs text-red-400 font-medium">Valepaska</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
        
        {/* Fallback stats card if no standings */}
        {standingsWithPlayers.length === 0 && (
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
        )}

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

