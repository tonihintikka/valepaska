import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import type { PlayerId } from '@valepaska/core';

interface VictoryOverlayProps {
  winnerId: PlayerId;
  winnerName: string;
  winnerAvatar?: string;
  onComplete: () => void;
  duration?: number; // Duration in seconds before auto-dismiss
}

/**
 * Victory overlay shown when a player wins
 * Displays prominently before transitioning to game over screen
 */
export function VictoryOverlay({
  winnerId,
  winnerName,
  winnerAvatar,
  onComplete,
  duration = 3,
}: VictoryOverlayProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/95 backdrop-blur-md"
        onClick={onComplete} // Allow click to dismiss
      >
        {/* Confetti particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: '50vw',
                y: '50vh',
                scale: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: `${50 + (Math.random() - 0.5) * 100}vw`,
                y: `${50 + (Math.random() - 0.5) * 100}vh`,
                scale: [0, 1.2, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2 + Math.random() * 1,
                delay: Math.random() * 0.5,
                ease: 'easeOut',
              }}
              className="absolute text-4xl"
            >
              {['✨', '🎉', '🏆', '⭐', '🎊'][i % 5]}
            </motion.div>
          ))}
        </div>

        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-gold/20 blur-3xl" />

        {/* Main content */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
          className="relative z-10 text-center"
        >
          {/* Trophy icon */}
          <motion.div
            initial={{ y: -50, rotate: -10 }}
            animate={{ y: 0, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
            className="text-9xl mb-6"
          >
            🏆
          </motion.div>

          {/* Winner name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-6xl font-serif font-bold mb-2 text-accent-gold text-shadow-gold"
          >
            {winnerName}
          </motion.h1>

          {/* Victory text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-white mb-8"
          >
            VOITTI!
          </motion.div>

          {/* Avatar if provided */}
          {winnerAvatar && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
              className="text-6xl mb-4"
            >
              {winnerAvatar}
            </motion.div>
          )}

          {/* Dismiss hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-slate-400 text-sm mt-8"
          >
            Klikkaa tai odota {duration} sekuntia...
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

