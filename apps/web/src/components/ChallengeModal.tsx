import { motion } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { RANK_DISPLAY } from '../types';

export function ChallengeModal() {
  const observation = useGameStore((state) => state.observation);
  const challengeTimeLeft = useGameStore((state) => state.challengeTimeLeft);
  const playerConfigs = useGameStore((state) => state.playerConfigs);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);
  const challenge = useGameStore((state) => state.challenge);
  const pass = useGameStore((state) => state.pass);

  if (!observation || !observation.lastClaim) return null;

  const lastClaim = observation.lastClaim;
  const claimingPlayer = playerConfigs.find((p) => p.id === lastClaim.playerId);
  const isOwnClaim = lastClaim.playerId === humanPlayerId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.3 }}
        className="glass rounded-2xl p-6 max-w-md w-full mx-4"
      >
        {/* Timer */}
        <div className="flex justify-center mb-4">
          <motion.div
            key={challengeTimeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center"
          >
            <span className={`text-3xl font-bold ${
              challengeTimeLeft <= 2 ? 'text-red-400' : 'text-accent-gold'
            }`}>
              {challengeTimeLeft}
            </span>
          </motion.div>
        </div>

        {/* Claim info */}
        <div className="text-center mb-6">
          <div className="text-slate-400 mb-2">
            {isOwnClaim ? 'Sinä väitit' : `${claimingPlayer?.name ?? 'Joku'} väittää`}
          </div>
          <div className="text-4xl font-bold text-white mb-2">
            {lastClaim.count}× {RANK_DISPLAY[lastClaim.rank]}
          </div>
          {!isOwnClaim && (
            <div className="text-sm text-slate-400">
              Onko tämä vale?
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-bg-elevated rounded-full mb-6 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full bg-accent-gold"
          />
        </div>

        {/* Actions */}
        {isOwnClaim ? (
          <div className="text-center text-slate-400">
            Odotetaan muiden reaktiota...
          </div>
        ) : (
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={pass}
              className="flex-1 btn btn-secondary"
            >
              Hyväksy
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={challenge}
              className="flex-1 btn btn-danger text-lg font-bold"
            >
              🔥 VALE!
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

