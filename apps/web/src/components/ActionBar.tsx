import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/game-store';
import { RANK_DISPLAY } from '../types';

export function ActionBar() {
  const { t: tCommon } = useTranslation('common');
  const { t: tGame } = useTranslation('game');
  const { t: tUi } = useTranslation('ui');
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

  const isMyTurn = observation.currentPlayerId === humanPlayerId;
  const canPlay = isMyTurn && observation.phase === 'WAITING_FOR_PLAY';
  const hasSelection = selectedCards.length > 0;
  const canSubmit = hasSelection && selectedRank !== null;
  const validRanks = observation.validClaimRanks ?? [];
  const isOwnClaim = observation.lastClaim?.playerId === humanPlayerId;

  const handlePlay = () => {
    if (canSubmit) {
      playCards();
    }
  };

  // Challenge Mode UI - floating centered panel (cards still visible below)
  const challengePanel = showChallengeModal && observation.lastClaim && !isOwnClaim ? (
    <div className="fixed inset-x-0 top-1/3 z-50 flex justify-center pointer-events-none px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl p-4 shadow-2xl border border-accent-gold/30 pointer-events-auto max-w-xs w-full"
      >
        {/* Timer Progress */}
        <div className="h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full bg-accent-gold rounded-full"
          />
        </div>

        {/* Claim info */}
        <div className="text-center mb-3">
          <div className="text-xs text-slate-400">
            {tGame('claims.playerClaims', {
              player: playerConfigs.find((p) => p.id === observation.lastClaim?.playerId)?.name ?? 'Joku'
            })}
          </div>
          <div className="text-xl font-bold text-white">
            {observation.lastClaim.count}× {RANK_DISPLAY[observation.lastClaim.rank]}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={pass}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-xl font-bold text-sm"
          >
            {tCommon('buttons.believe')} ({challengeTimeLeft}s)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={challenge}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-red-900/50"
          >
            🔥 {tCommon('buttons.challenge')}
          </motion.button>
        </div>
      </motion.div>
    </div>
  ) : null;

  return (
    <>
      {/* Floating challenge panel (doesn't block cards) */}
      <AnimatePresence>{challengePanel}</AnimatePresence>

      {/* Normal ActionBar - always visible */}
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
                    {tUi('gameScreen.actionBar.selectRank', { count: selectedCards.length })}
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
                    {tCommon('buttons.cancel')}
                  </motion.button>
                  <motion.button
                    {...(canSubmit && { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}
                    onClick={handlePlay}
                    disabled={!canSubmit}
                    className={`btn btn-primary ${!canSubmit ? 'btn-disabled' : ''}`}
                  >
                    {tUi('gameScreen.actionBar.play', {
                      count: selectedCards.length,
                      rank: selectedRank ? RANK_DISPLAY[selectedRank] : '?'
                    })}
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
                {tUi('gameScreen.actionBar.selectCards')}
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
                    ? tGame('phases.waitingForChallenges')
                    : tGame('phases.waitingForPlay')
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
    </>
  );
}




