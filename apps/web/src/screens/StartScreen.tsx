import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/game-store';
import { Logo } from '../components/Logo';
import type { BotDifficulty, PlayerConfig } from '../types';

const AVATARS = ['👤', '🤖', '🎩', '🃏', '🦊', '🎭'];
const DIFFICULTIES: BotDifficulty[] = ['Easy', 'Normal', 'Hard', 'Pro'];

interface PlayerSlotConfig {
  enabled: boolean;
  isHuman: boolean;
  difficulty: BotDifficulty;
  name: string;
}

const DEFAULT_SLOTS: PlayerSlotConfig[] = [
  { enabled: true, isHuman: true, difficulty: 'Normal', name: 'Pelaaja 1' },
  { enabled: true, isHuman: false, difficulty: 'Normal', name: 'Botti 1' },
  { enabled: true, isHuman: false, difficulty: 'Hard', name: 'Botti 2' },
  { enabled: true, isHuman: false, difficulty: 'Pro', name: 'Botti 3' },
  { enabled: false, isHuman: false, difficulty: 'Easy', name: 'Botti 4' },
  { enabled: false, isHuman: false, difficulty: 'Normal', name: 'Botti 5' },
];

export function StartScreen() {
  const startGame = useGameStore((state) => state.startGame);
  const [slots, setSlots] = useState<PlayerSlotConfig[]>(DEFAULT_SLOTS);
  const [debugMode, setDebugMode] = useState(false);

  const enabledCount = slots.filter(s => s.enabled).length;
  const humanCount = slots.filter(s => s.enabled && s.isHuman).length;
  const canStart = enabledCount >= 2 && humanCount <= 1;

  const updateSlot = (index: number, updates: Partial<PlayerSlotConfig>) => {
    setSlots(prev => prev.map((slot, i) => {
      if (i !== index) return slot;

      const newSlot = { ...slot, ...updates };

      // If switching to human, disable human on other slots
      if (updates.isHuman === true) {
        return newSlot;
      }
      return newSlot;
    }).map((slot, i) => {
      // Ensure only one human
      if (updates.isHuman === true && i !== index && slot.isHuman) {
        return { ...slot, isHuman: false };
      }
      return slot;
    }));
  };

  const handleStart = () => {
    const players: PlayerConfig[] = slots
      .filter(s => s.enabled)
      .map((slot, index) => ({
        id: `player-${index}`,
        name: slot.name,
        isHuman: slot.isHuman,
        botDifficulty: slot.isHuman ? undefined : slot.difficulty,
        avatar: AVATARS[index % AVATARS.length],
      }));

    startGame({
      players,
      seed: Date.now(),
      debugMode,
    });
  };

  // Quick preset buttons
  const setPreset = (preset: 'pvb' | 'bvb' | 'hard') => {
    switch (preset) {
      case 'pvb': // Player vs 3 bots
        setSlots([
          { enabled: true, isHuman: true, difficulty: 'Normal', name: 'Sinä' },
          { enabled: true, isHuman: false, difficulty: 'Easy', name: 'Easy Bot' },
          { enabled: true, isHuman: false, difficulty: 'Normal', name: 'Normal Bot' },
          { enabled: true, isHuman: false, difficulty: 'Hard', name: 'Hard Bot' },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: 'Botti 4' },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: 'Botti 5' },
        ]);
        break;
      case 'bvb': // All bots (spectator)
        setSlots([
          { enabled: true, isHuman: false, difficulty: 'Easy', name: 'Easy Bot' },
          { enabled: true, isHuman: false, difficulty: 'Normal', name: 'Normal Bot' },
          { enabled: true, isHuman: false, difficulty: 'Hard', name: 'Hard Bot' },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: 'Pro Bot' },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: 'Botti 4' },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: 'Botti 5' },
        ]);
        break;
      case 'hard': // Player vs 3 Pro bots
        setSlots([
          { enabled: true, isHuman: true, difficulty: 'Normal', name: 'Sinä' },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: 'Pro Bot 1' },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: 'Pro Bot 2' },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: 'Pro Bot 3' },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: 'Botti 4' },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: 'Botti 5' },
        ]);
        break;
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-start pt-safe-top pb-4 px-4 bg-bg-deep relative overflow-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-ice/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl px-4"
      >
        {/* Title with tilted card logo */}
        <Logo size="sm" variant="gold" className="mb-1" />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 text-center text-sm mb-3"
        >
          Suomalainen bluffikorttipeli
        </motion.p>

        {/* Quick presets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-2 justify-center mb-3"
        >
          <button
            onClick={() => setPreset('pvb')}
            className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors"
          >
            🎮 Pelaaja vs Botit
          </button>
          <button
            onClick={() => setPreset('bvb')}
            className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors"
          >
            🤖 Botit vs Botit
          </button>
          <button
            onClick={() => setPreset('hard')}
            className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors"
          >
            💀 Haaste-moodi
          </button>
        </motion.div>

        {/* Player slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-3 mb-3"
        >
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <span>Pelaajat</span>
            <span className="text-sm font-normal text-slate-400">
              ({enabledCount}/6 aktiivista)
            </span>
          </h2>

          <div className="space-y-2">
            <AnimatePresence>
              {slots.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-all ${slot.enabled
                      ? 'bg-bg-elevated'
                      : 'bg-bg-surface/50 opacity-50'
                    }`}
                >
                  {/* Enable checkbox */}
                  <button
                    onClick={() => updateSlot(index, { enabled: !slot.enabled })}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${slot.enabled
                        ? 'bg-accent-gold border-accent-gold text-bg-deep'
                        : 'border-slate-600 text-transparent hover:border-slate-500'
                      }`}
                  >
                    ✓
                  </button>

                  {/* Avatar */}
                  <span className="text-xl w-8 text-center">
                    {slot.isHuman ? '👤' : '🤖'}
                  </span>

                  {/* Name input */}
                  <input
                    type="text"
                    value={slot.name}
                    onChange={(e) => updateSlot(index, { name: e.target.value })}
                    disabled={!slot.enabled}
                    className="flex-1 bg-transparent text-white text-sm px-2 py-1 rounded border border-transparent focus:border-slate-600 focus:outline-none disabled:text-slate-500"
                    placeholder={`Pelaaja ${index + 1}`}
                  />

                  {/* Type toggle */}
                  <div className="flex rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateSlot(index, { isHuman: true })}
                      disabled={!slot.enabled || (humanCount >= 1 && !slot.isHuman)}
                      className={`px-2 py-1 text-xs transition-colors ${slot.isHuman
                          ? 'bg-accent-gold text-bg-deep'
                          : 'bg-bg-surface text-slate-400 hover:text-white disabled:opacity-50'
                        }`}
                    >
                      Ihminen
                    </button>
                    <button
                      onClick={() => updateSlot(index, { isHuman: false })}
                      disabled={!slot.enabled}
                      className={`px-2 py-1 text-xs transition-colors ${!slot.isHuman
                          ? 'bg-accent-ice text-bg-deep'
                          : 'bg-bg-surface text-slate-400 hover:text-white'
                        }`}
                    >
                      Botti
                    </button>
                  </div>

                  {/* Difficulty (only for bots) */}
                  {!slot.isHuman && (
                    <select
                      value={slot.difficulty}
                      onChange={(e) => updateSlot(index, { difficulty: e.target.value as BotDifficulty })}
                      disabled={!slot.enabled}
                      className="bg-bg-surface text-slate-300 text-xs px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-slate-500 disabled:opacity-50"
                    >
                      {DIFFICULTIES.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Warnings */}
          {humanCount === 0 && (
            <div className="mt-3 text-xs text-accent-ice flex items-center gap-2">
              <span>👁️</span>
              <span>Katselutila: Seuraat bottien peliä</span>
            </div>
          )}
          {enabledCount < 2 && (
            <div className="mt-3 text-xs text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              <span>Valitse vähintään 2 pelaajaa</span>
            </div>
          )}
        </motion.div>

        {/* Debug mode toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-lg p-2.5 mb-3"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`w-10 h-6 rounded-full transition-colors relative ${debugMode ? 'bg-accent-gold' : 'bg-bg-elevated'
                }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${debugMode ? 'left-5' : 'left-1'
                  }`}
              />
            </button>
            <div>
              <div className="text-sm text-white">Debug-tila</div>
              <div className="text-xs text-slate-400">Näytä pelin sisäinen tila ja tapahtumat</div>
            </div>
          </label>
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            whileHover={canStart ? { scale: 1.02 } : undefined}
            whileTap={canStart ? { scale: 0.98 } : undefined}
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full btn text-base py-3 ${canStart
                ? 'btn-primary'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
          >
            {humanCount === 0 ? '👁️ Aloita katselu' : '🎮 Aloita peli'}
          </motion.button>
        </motion.div>

        {/* Rules hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-500 text-xs mt-3 text-center"
        >
          Pelaa kortteja nurinpäin ja väitä niiden arvoa. Muut voivat haastaa!
        </motion.p>
      </motion.div>
    </div>
  );
}
