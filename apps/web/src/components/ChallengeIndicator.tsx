import { motion, AnimatePresence } from 'framer-motion';
import type { PlayerId } from '@valepaska/core';
import type { PlayerPosition } from '../types';

interface ChallengeIndicatorProps {
  challengerId: PlayerId;
  challengerName: string;
  challengerPosition: PlayerPosition;
  accusedName: string;
  onComplete?: () => void;
}

// Position-based starting points for the challenge animation
const POSITION_ORIGINS: Record<PlayerPosition, { x: string; y: string }> = {
  bottom: { x: '50%', y: '100%' },
  top: { x: '50%', y: '0%' },
  left: { x: '0%', y: '50%' },
  right: { x: '100%', y: '50%' },
  'top-left': { x: '15%', y: '15%' },
  'top-right': { x: '85%', y: '15%' },
};

/**
 * Visual indicator that shows when a player challenges another
 * Animates from the challenger's position to the center
 */
export function ChallengeIndicator({
  challengerId,
  challengerName,
  challengerPosition,
  accusedName,
  onComplete,
}: ChallengeIndicatorProps) {
  const origin = POSITION_ORIGINS[challengerPosition];

  return (
    <AnimatePresence {...(onComplete && { onExitComplete: onComplete })}>
      <motion.div
        key={challengerId}
        className="absolute inset-0 pointer-events-none z-50 overflow-hidden"
      >
        {/* Background flash */}
        <motion.div
          className="absolute inset-0 bg-red-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.8 }}
        />

        {/* Challenge text flying from player position */}
        <motion.div
          className="absolute left-1/2 top-1/2"
          initial={{
            x: `calc(${origin.x} - 50%)`,
            y: `calc(${origin.y} - 50%)`,
            scale: 0.5,
            opacity: 0,
          }}
          animate={{
            x: '-50%',
            y: '-50%',
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: 1.5,
            opacity: 0,
          }}
          transition={{
            type: 'spring',
            damping: 15,
            stiffness: 200,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {/* Main challenge badge */}
            <motion.div
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-red-400"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(239, 68, 68, 0.5)',
                  '0 0 40px rgba(239, 68, 68, 0.8)',
                  '0 0 20px rgba(239, 68, 68, 0.5)',
                ],
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
              }}
            >
              <div className="text-4xl font-black tracking-wider">
                ⚡ HAASTO! ⚡
              </div>
            </motion.div>

            {/* Challenger info */}
            <motion.div
              className="bg-slate-900/90 text-white px-6 py-3 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-yellow-400 font-bold">{challengerName}</span>
              <span className="text-slate-300"> haastaa </span>
              <span className="text-red-400 font-bold">{accusedName}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Directional line from challenger */}
        <motion.div
          className="absolute"
          style={{
            left: origin.x,
            top: origin.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-4 h-4 bg-red-500 rounded-full animate-ping" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

