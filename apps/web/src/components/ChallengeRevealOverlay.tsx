import { motion, AnimatePresence } from 'framer-motion';
import type { Card as CardType, Rank } from '@valepaska/core';
import { RANK_DISPLAY, SUIT_SYMBOLS, SUIT_COLORS } from '../types';

interface ChallengeRevealOverlayProps {
  revealedCards: readonly CardType[];
  wasLie: boolean;
  claimedRank: Rank;
  claimedCount: number;
  accusedName: string;
  receiverName: string;
  onComplete?: () => void;
}

/**
 * Overlay that shows revealed cards when a challenge is resolved
 * Cards flip from back to front, then shows result
 */
export function ChallengeRevealOverlay({
  revealedCards,
  wasLie,
  claimedRank,
  claimedCount,
  accusedName,
  receiverName,
  onComplete,
}: ChallengeRevealOverlayProps) {
  return (
    <AnimatePresence {...(onComplete && { onExitComplete: onComplete })}>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        {...(onComplete && { onClick: onComplete })}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 20 }}
        >
          {/* Claim info */}
          <motion.div
            className="text-center"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-slate-400 text-sm mb-1">
              {accusedName} väitti
            </div>
            <div className="text-2xl font-bold text-white">
              {claimedCount}× {RANK_DISPLAY[claimedRank]}
            </div>
          </motion.div>

          {/* Revealed cards with flip animation */}
          <div className="flex gap-3 perspective-1000">
            {revealedCards.map((card, index) => (
              <FlipCard
                key={card.id}
                card={card}
                delay={0.5 + index * 0.15}
                claimedRank={claimedRank}
              />
            ))}
          </div>

          {/* Result */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 + revealedCards.length * 0.15 + 0.3, type: 'spring', bounce: 0.5 }}
            className={`text-center px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-md ${wasLie
                ? 'bg-gradient-to-br from-red-900/90 to-slate-900/90 border-2 border-red-500'
                : 'bg-gradient-to-br from-green-900/90 to-slate-900/90 border-2 border-green-500'
              }`}
          >
            <div className={`text-5xl font-black mb-2 ${wasLie ? 'text-red-400 drop-shadow-glow' : 'text-green-400 drop-shadow-glow'}`}>
              {wasLie ? '🎭 VALE!' : '✨ TOTTA!'}
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
              <span className="text-slate-300 text-xs uppercase tracking-widest font-bold opacity-80">Rangaistus</span>
              <div className="text-xl sm:text-2xl font-bold text-white bg-black/40 px-6 py-3 rounded-xl border border-white/10 flex items-center gap-3">
                <span className="text-2xl">🃏</span>
                <span>{receiverName} <span className="font-normal text-slate-300">nostaa pakan</span></span>
              </div>
            </div>
          </motion.div>

          {/* Tap to continue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="text-slate-500 text-sm"
          >
            Klikkaa jatkaaksesi...
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface FlipCardProps {
  card: CardType;
  delay: number;
  claimedRank: Rank;
}

/**
 * Card that flips from back to front
 */
function FlipCard({ card, delay, claimedRank }: FlipCardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? '?';
  const rankDisplay = RANK_DISPLAY[card.rank];
  const colorClass = SUIT_COLORS[card.suit] ?? 'text-slate-800';
  const isMatchingRank = card.rank === claimedRank;

  return (
    <motion.div
      className="relative w-20 h-28 perspective-1000"
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ delay, duration: 0.6, type: 'spring', damping: 20 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Card front */}
      <motion.div
        className={`absolute inset-0 rounded-lg bg-white shadow-xl overflow-hidden backface-hidden ${isMatchingRank ? 'ring-2 ring-green-400' : 'ring-2 ring-red-400'
          }`}
        style={{ backfaceVisibility: 'hidden' }}
      >
        <div className="w-full h-full p-2 flex flex-col justify-between">
          {/* Top left */}
          <div className={`${colorClass} text-left leading-none`}>
            <div className="text-lg font-bold">{rankDisplay}</div>
            <div className="text-xl">{suitSymbol}</div>
          </div>

          {/* Center */}
          <div className={`${colorClass} text-4xl text-center`}>
            {suitSymbol}
          </div>

          {/* Bottom right */}
          <div className={`${colorClass} text-right leading-none rotate-180`}>
            <div className="text-lg font-bold">{rankDisplay}</div>
            <div className="text-xl">{suitSymbol}</div>
          </div>
        </div>

        {/* Match indicator */}
        {isMatchingRank && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5 }}
            className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs">✓</span>
          </motion.div>
        )}
        {!isMatchingRank && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.5 }}
            className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs">✗</span>
          </motion.div>
        )}
      </motion.div>

      {/* Card back */}
      <div
        className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 border-2 border-blue-600 shadow-xl backface-hidden"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-12 h-16 rounded border-2 border-blue-400/50 flex items-center justify-center">
            <span className="text-blue-300 text-2xl">♠</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

