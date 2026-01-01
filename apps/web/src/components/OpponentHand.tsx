import { motion } from 'framer-motion';

interface OpponentHandProps {
  cardCount: number;
  isCurrentPlayer?: boolean;
  position?: 'top' | 'left' | 'right';
}

export function OpponentHand({ 
  cardCount, 
  isCurrentPlayer = false,
  position = 'top',
}: OpponentHandProps) {
  const displayCount = Math.min(cardCount, 7);
  
  const getCardStyle = (index: number) => {
    const centerIndex = (displayCount - 1) / 2;
    const offset = index - centerIndex;
    
    switch (position) {
      case 'left':
        return {
          transform: `translateY(${offset * 12}px) rotate(${90 + offset * 3}deg)`,
        };
      case 'right':
        return {
          transform: `translateY(${offset * 12}px) rotate(${-90 + offset * 3}deg)`,
        };
      case 'top':
      default:
        return {
          transform: `translateX(${offset * 20}px) rotate(${180 + offset * 3}deg)`,
        };
    }
  };

  return (
    <motion.div
      animate={isCurrentPlayer ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 1.5, repeat: isCurrentPlayer ? Infinity : 0 }}
      className={`relative flex items-center justify-center ${
        position === 'left' || position === 'right' ? 'flex-col' : 'flex-row'
      }`}
    >
      {Array.from({ length: displayCount }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="absolute w-14 h-20"
          style={getCardStyle(index)}
        >
          <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 border border-blue-600/30 shadow-card">
            <div 
              className="w-full h-full rounded-lg p-0.5"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 3px,
                    rgba(255,255,255,0.03) 3px,
                    rgba(255,255,255,0.03) 6px
                  )
                `,
              }}
            />
          </div>
        </motion.div>
      ))}
      
      {/* Card count indicator */}
      {cardCount > displayCount && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400">
          +{cardCount - displayCount} muuta
        </div>
      )}
    </motion.div>
  );
}




