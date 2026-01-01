import { motion } from 'framer-motion';
import type { Card as CardType } from '@valepaska/core';
import { RANK_DISPLAY, SUIT_SYMBOLS, SUIT_COLORS } from '../types';

interface CardProps {
  card?: CardType;
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-14 h-20',
  md: 'w-20 h-28',
  lg: 'w-24 h-34',
};

export function Card({ 
  card, 
  faceDown = false, 
  selected = false, 
  disabled = false,
  onClick,
  size = 'md',
  className = '',
}: CardProps) {
  const sizeClass = SIZE_CLASSES[size];
  const isClickable = onClick && !disabled;

  return (
    <motion.div
      layout
      whileHover={isClickable ? { y: -8 } : undefined}
      whileTap={isClickable ? { scale: 0.95 } : undefined}
      onClick={isClickable ? onClick : undefined}
      className={`
        relative rounded-lg shadow-card transition-shadow duration-200
        ${sizeClass}
        ${isClickable ? 'cursor-pointer hover:shadow-card-hover' : ''}
        ${selected ? 'ring-2 ring-accent-gold shadow-glow-gold -translate-y-4' : ''}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face */}
        <div 
          className="absolute inset-0 rounded-lg bg-white border border-slate-200 backface-hidden overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {card && (
            <CardFront card={card} size={size} />
          )}
        </div>

        {/* Back face */}
        <div 
          className="absolute inset-0 rounded-lg backface-hidden overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardBack />
        </div>
      </motion.div>
    </motion.div>
  );
}

function CardFront({ card, size }: { card: CardType; size: 'sm' | 'md' | 'lg' }) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? '?';
  const rankDisplay = RANK_DISPLAY[card.rank];
  const colorClass = SUIT_COLORS[card.suit] ?? 'text-slate-800';
  
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
  const symbolSize = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-4xl';

  return (
    <div className="w-full h-full p-1 flex flex-col justify-between">
      {/* Top left */}
      <div className={`${colorClass} ${textSize} font-bold leading-none`}>
        <div>{rankDisplay}</div>
        <div className="text-xs">{suitSymbol}</div>
      </div>

      {/* Center suit */}
      <div className={`${colorClass} ${symbolSize} text-center`}>
        {suitSymbol}
      </div>

      {/* Bottom right (rotated) */}
      <div className={`${colorClass} ${textSize} font-bold leading-none text-right rotate-180`}>
        <div>{rankDisplay}</div>
        <div className="text-xs">{suitSymbol}</div>
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div 
      className="w-full h-full bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900 p-1"
    >
      <div 
        className="w-full h-full rounded border border-blue-600/30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 4px,
              rgba(255,255,255,0.05) 4px,
              rgba(255,255,255,0.05) 8px
            )
          `,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center">
            <span className="text-blue-300/50 text-lg">♠</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pile card for showing stacked cards
export function PileCard({ count, className = '' }: { count: number; className?: string }) {
  if (count === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Stack effect */}
      {count > 2 && (
        <div className="absolute -top-2 -left-2 w-20 h-28 rounded-lg bg-blue-900/50 border border-blue-800/30" />
      )}
      {count > 1 && (
        <div className="absolute -top-1 -left-1 w-20 h-28 rounded-lg bg-blue-800/50 border border-blue-700/30" />
      )}
      <Card faceDown size="md" />
      
      {/* Count badge */}
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent-gold text-bg-deep text-xs font-bold flex items-center justify-center">
        {count}
      </div>
    </div>
  );
}



