import type { StateCreator } from 'zustand';
import type { Rank, Card, PlayerId } from '@valepaska/core';

export interface ChallengeReveal {
  revealedCards: readonly Card[];
  wasLie: boolean;
  claimedRank: Rank;
  claimedCount: number;
  challengerId: PlayerId;
  accusedId: PlayerId;
  receiverId: PlayerId; // Who receives the pile (loser)
}

export interface UISlice {
  // Card selection
  selectedCards: string[];
  selectedRank: Rank | null;
  
  // Challenge modal
  showChallengeModal: boolean;
  challengeTimeLeft: number;
  
  // Overlays
  showVictoryOverlay: boolean;
  pendingWinnerId: PlayerId | null;
  activeChallenge: { challengerId: PlayerId; accusedId: PlayerId } | null;
  challengeReveal: ChallengeReveal | null;
  
  // Processing state
  isProcessingBots: boolean;
  
  // Actions
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  clearSelection: () => void;
  setSelectedRank: (rank: Rank | null) => void;
  setShowChallengeModal: (show: boolean) => void;
  setChallengeTimeLeft: (time: number) => void;
  setShowVictoryOverlay: (show: boolean) => void;
  setPendingWinnerId: (id: PlayerId | null) => void;
  setActiveChallenge: (challenge: { challengerId: PlayerId; accusedId: PlayerId } | null) => void;
  setChallengeReveal: (reveal: ChallengeReveal | null) => void;
  setIsProcessingBots: (processing: boolean) => void;
  dismissVictoryOverlay: (onDismiss?: () => void) => void;
  dismissChallenge: () => void;
  dismissChallengeReveal: () => void;
}

export const createUISlice: StateCreator<
  UISlice,
  [],
  [],
  UISlice
> = (set, get, _store) => ({
  // Initial state
  selectedCards: [],
  selectedRank: null,
  showChallengeModal: false,
  challengeTimeLeft: 0,
  showVictoryOverlay: false,
  pendingWinnerId: null,
  activeChallenge: null,
  challengeReveal: null,
  isProcessingBots: false,
  
  // Actions
  selectCard: (cardId) => {
    const { selectedCards } = get();
    if (selectedCards.length < 4 && !selectedCards.includes(cardId)) {
      set({ selectedCards: [...selectedCards, cardId] });
    }
  },
  
  deselectCard: (cardId) => {
    const { selectedCards } = get();
    set({ selectedCards: selectedCards.filter(id => id !== cardId) });
  },
  
  clearSelection: () => {
    set({ selectedCards: [], selectedRank: null });
  },
  
  setSelectedRank: (rank) => set({ selectedRank: rank }),
  setShowChallengeModal: (show) => set({ showChallengeModal: show }),
  setChallengeTimeLeft: (time) => set({ challengeTimeLeft: time }),
  setShowVictoryOverlay: (show) => set({ showVictoryOverlay: show }),
  setPendingWinnerId: (id) => set({ pendingWinnerId: id }),
  setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),
  setChallengeReveal: (reveal) => set({ challengeReveal: reveal }),
  setIsProcessingBots: (processing) => set({ isProcessingBots: processing }),
  
  dismissVictoryOverlay: (onDismiss) => {
    set({ 
      showVictoryOverlay: false,
      pendingWinnerId: null,
    });
    onDismiss?.();
  },
  
  dismissChallenge: () => set({ activeChallenge: null }),
  dismissChallengeReveal: () => set({ challengeReveal: null }),
});

