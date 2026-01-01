import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { RANK_DISPLAY } from '../types';

export function ActionBar() {
  const observation = useGameStore((state) => state.observation);
  const selectedCards = useGameStore((state) => state.selectedCards);
  const selectedRank = useGameStore((state) => state.selectedRank);
  const setSelectedRank = useGameStore((state) => state.setSelectedRank);
  const playCards = useGameStore((state) => state.playCards);
  const clearSelection = useGameStore((state) => state.clearSelection);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);

  const showChallengeModal = useGameStore((state) => state.showChallengeModal);
  const challengeTimeLeft = useGameStore((state) => state.challengeTimeLeft);
  const challenge = useGameStore((state) => state.challenge);
  const pass = useGameStore((state) => state.pass);
  const playerConfigs = useGameStore((state) => state.playerConfigs);

  if (!observation) return null;

  // Challenge Mode UI
  if (showChallengeModal && observation.lastClaim) {
    const lastClaim = observation.lastClaim;
    const claimingPlayer = playerConfigs.find((p) => p.id === lastClaim.playerId);

    return (
      <div className="bg-bg-deep/95 backdrop-blur border-t-2 border-accent-gold/50 px-4 py-4 fixed bottom-0 left-0 right-0 z-40 pb-safe-bottom">
        <div className="max-w-md mx-auto relative">
          {/* Timer Progress */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 -mt-4 overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
              className="h-full bg-accent-gold"
            />
          </div>

          <div className="flex flex-col items-center gap-4">
            {/* Info */}
            <div className="text-center">
              <div className="text-sm text-slate-400">
                {claimingPlayer?.name ?? 'Pelaaja'} väittää:
              </div>
              <div className="text-2xl font-bold text-white">
                {lastClaim.count}× {RANK_DISPLAY[lastClaim.rank]}
              </div>
            </div>

            {/* Actions */}
            <div className="flex w-full gap-4 items-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={pass}
                className="flex-1 btn bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold"
              >
                Usko ({challengeTimeLeft}s)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={challenge}
                className="flex-1 btn bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-900/50"
              >
                🔥 VALE!
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMyTurn = observation.currentPlayerId === humanPlayerId;
  const canPlay = isMyTurn && observation.phase === 'WAITING_FOR_PLAY';
  const hasSelection = selectedCards.length > 0;
  const canSubmit = hasSelection && selectedRank !== null;

  // Get valid ranks for claim
  const validRanks = observation.validClaimRanks ?? [];

  const handlePlay = () => {
    if (canSubmit) {
      playCards();
    }
  };

  return (
    <div className="bg-bg-deep border-t border-slate-800 px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {canPlay && hasSelection ? (
            <motion.div
              key="claim-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-4"
            >
              {/* Rank selection */}
              <div>
                <div className="text-xs text-slate-400 mb-2 text-center">
                  Valitse väitettävä arvo ({selectedCards.length} korttia)
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {validRanks.map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setSelectedRank(rank)}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${selectedRank === rank
                        ? 'bg-accent-gold text-bg-deep ring-2 ring-accent-gold/50'
                        : 'bg-bg-surface text-slate-300 hover:bg-bg-elevated'
                        }`}
                    >
                      {RANK_DISPLAY[rank]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearSelection}
                  className="btn btn-secondary"
                >
                  Peruuta
                </motion.button>
                <motion.button
                  whileHover={canSubmit ? { scale: 1.02 } : undefined}
                  whileTap={canSubmit ? { scale: 0.98 } : undefined}
                  onClick={handlePlay}
                  disabled={!canSubmit}
                  className={`btn btn-primary ${!canSubmit ? 'btn-disabled' : ''}`}
                >
                  Pelaa {selectedCards.length}× {selectedRank ? RANK_DISPLAY[selectedRank] : '?'}
                </motion.button>
              </div>
            </motion.div>
          ) : canPlay ? (
            <motion.div
              key="select-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-slate-400"
            >
              Valitse 1-4 korttia pelataksesi
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-slate-400">
                {observation.phase === 'WAITING_FOR_CHALLENGES'
                  ? 'Odotetaan haastoikkunaa...'
                  : 'Odotetaan muita pelaajia...'
                }
              </div>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex justify-center gap-1 mt-2"
              >
                <div className="w-2 h-2 rounded-full bg-accent-gold" />
                <div className="w-2 h-2 rounded-full bg-accent-gold" />
                <div className="w-2 h-2 rounded-full bg-accent-gold" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



