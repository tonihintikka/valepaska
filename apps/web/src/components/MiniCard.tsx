import type { Card as CardType } from '@valepaska/core';
import { RANK_DISPLAY, SUIT_SYMBOLS, SUIT_COLORS } from '../types';

interface MiniCardProps {
  card: CardType;
  className?: string;
}

/**
 * Small card component for displaying opponent cards in spectator mode
 * Size: ~40x56px (smaller than regular cards)
 */
export function MiniCard({ card, className = '' }: MiniCardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? '?';
  const rankDisplay = RANK_DISPLAY[card.rank];
  const colorClass = SUIT_COLORS[card.suit] ?? 'text-slate-800';

  return (
    <div
      className={`
        relative w-10 h-14 rounded-md bg-white border border-slate-200 shadow-sm
        overflow-hidden ${className}
      `}
    >
      <div className="w-full h-full p-0.5 flex flex-col justify-between">
        {/* Top left */}
        <div className={`${colorClass} text-xs font-bold leading-none`}>
          <div className="text-[10px]">{rankDisplay}</div>
          <div className="text-[8px]">{suitSymbol}</div>
        </div>

        {/* Center suit */}
        <div className={`${colorClass} text-lg text-center leading-none`}>
          {suitSymbol}
        </div>

        {/* Bottom right (rotated) */}
        <div className={`${colorClass} text-xs font-bold leading-none text-right rotate-180`}>
          <div className="text-[10px]">{rankDisplay}</div>
          <div className="text-[8px]">{suitSymbol}</div>
        </div>
      </div>
    </div>
  );
}

