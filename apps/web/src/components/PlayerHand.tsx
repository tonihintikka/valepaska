import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { Card } from './Card';

export function PlayerHand() {
  const observation = useGameStore((state) => state.observation);
  const selectedCards = useGameStore((state) => state.selectedCards);
  const selectCard = useGameStore((state) => state.selectCard);
  const deselectCard = useGameStore((state) => state.deselectCard);
  const humanPlayerId = useGameStore((state) => state.humanPlayerId);

  if (!observation) return null;

  const isMyTurn = observation.currentPlayerId === humanPlayerId;
  const canPlay = isMyTurn && observation.phase === 'WAITING_FOR_PLAY';

  const handleCardClick = (cardId: string) => {
    if (!canPlay) return;
    
    if (selectedCards.includes(cardId)) {
      deselectCard(cardId);
    } else {
      selectCard(cardId);
    }
  };

  const sortedHand = [...observation.hand].sort((a, b) => {
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
    if (rankDiff !== 0) return rankDiff;
    
    const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
  });

  return (
    <div className="bg-bg-surface/80 backdrop-blur-sm border-t border-slate-700/50 px-4 py-4">
      <div className="max-w-4xl mx-auto">
        {/* Hand label */}
        <div className="text-xs text-slate-400 mb-2 text-center">
          Sinun kätesi ({observation.hand.length} korttia)
          {selectedCards.length > 0 && (
            <span className="text-accent-gold ml-2">
              — {selectedCards.length} valittu
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="flex justify-center items-end gap-1 min-h-[120px]">
          <AnimatePresence mode="popLayout">
            {sortedHand.map((card, index) => {
              const isSelected = selectedCards.includes(card.id);
              const centerOffset = index - (sortedHand.length - 1) / 2;
              
              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ 
                    opacity: 1, 
                    y: isSelected ? -16 : 0,
                    rotate: centerOffset * 2,
                  }}
                  exit={{ opacity: 0, y: 50, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{
                    marginLeft: index === 0 ? 0 : '-12px',
                    zIndex: isSelected ? 100 : index,
                  }}
                >
                  <Card
                    card={card}
                    selected={isSelected}
                    disabled={!canPlay}
                    onClick={() => handleCardClick(card.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {observation.hand.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            Kätesi on tyhjä!
          </div>
        )}
      </div>
    </div>
  );
}

