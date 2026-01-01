import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/game-store';
import { Logo } from '../components/Logo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
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
  const { t: tCommon } = useTranslation('common');
  const { t: tUi } = useTranslation('ui');
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
        ...(!slot.isHuman && { botDifficulty: slot.difficulty }),
        avatar: AVATARS[index % AVATARS.length]!,
      }));

    startGame({
      players,
      seed: Date.now(),
      debugMode,
    });
  };

  // Quick preset buttons
  const setPreset = (preset: 'pvb' | 'bvb' | 'hard') => {
    const you = tCommon('player.you');
    const bot = tCommon('player.bot');
    switch (preset) {
      case 'pvb': // Player vs 3 bots
        setSlots([
          { enabled: true, isHuman: true, difficulty: 'Normal', name: you },
          { enabled: true, isHuman: false, difficulty: 'Easy', name: `${tCommon('difficulty.Easy')} ${bot}` },
          { enabled: true, isHuman: false, difficulty: 'Normal', name: `${tCommon('difficulty.Normal')} ${bot}` },
          { enabled: true, isHuman: false, difficulty: 'Hard', name: `${tCommon('difficulty.Hard')} ${bot}` },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: `${bot} 4` },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: `${bot} 5` },
        ]);
        break;
      case 'bvb': // All bots (spectator)
        setSlots([
          { enabled: true, isHuman: false, difficulty: 'Easy', name: `${tCommon('difficulty.Easy')} ${bot}` },
          { enabled: true, isHuman: false, difficulty: 'Normal', name: `${tCommon('difficulty.Normal')} ${bot}` },
          { enabled: true, isHuman: false, difficulty: 'Hard', name: `${tCommon('difficulty.Hard')} ${bot}` },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: `${tCommon('difficulty.Pro')} ${bot}` },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: `${bot} 4` },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: `${bot} 5` },
        ]);
        break;
      case 'hard': // Player vs 3 Pro bots
        setSlots([
          { enabled: true, isHuman: true, difficulty: 'Normal', name: you },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: `${tCommon('difficulty.Pro')} ${bot} 1` },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: `${tCommon('difficulty.Pro')} ${bot} 2` },
          { enabled: true, isHuman: false, difficulty: 'Pro', name: `${tCommon('difficulty.Pro')} ${bot} 3` },
          { enabled: false, isHuman: false, difficulty: 'Easy', name: `${bot} 4` },
          { enabled: false, isHuman: false, difficulty: 'Normal', name: `${bot} 5` },
        ]);
        break;
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-bg-deep relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-ice/5 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden px-4 pt-safe-top pb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl mx-auto"
        >
          {/* Title with tilted card logo */}
          <div className="flex flex-col items-center pt-2">
            <div className="absolute top-4 right-4">
              <LanguageSwitcher />
            </div>
            <Logo size="sm" variant="gold" className="mb-1" />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-400 text-center text-sm mb-4"
            >
              {tUi('startScreen.subtitle')}
            </motion.p>
          </div>

          {/* Quick presets */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center mb-4"
          >
            <button
              onClick={() => setPreset('pvb')}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors border border-slate-700/50"
            >
              🎮 {tUi('startScreen.presets.playerVsBots')}
            </button>
            <button
              onClick={() => setPreset('bvb')}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors border border-slate-700/50"
            >
              🤖 {tUi('startScreen.presets.botsVsBots')}
            </button>
            <button
              onClick={() => setPreset('hard')}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-surface text-slate-300 hover:bg-bg-elevated transition-colors border border-slate-700/50"
            >
              💀 {tUi('startScreen.presets.challengeMode')}
            </button>
          </motion.div>

          {/* Player slots */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-3 mb-3 overflow-hidden"
          >
            <h2 className="text-base font-semibold text-white mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>{tUi('startScreen.players.title')}</span>
                <span className="text-sm font-normal text-slate-400">
                  ({enabledCount}/6)
                </span>
              </span>
            </h2>

            <div className="space-y-2">
              <AnimatePresence>
                {slots.map((slot, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex flex-wrap items-center gap-2 p-2 rounded-lg transition-colors border ${slot.enabled
                        ? 'bg-bg-elevated border-slate-700/50'
                        : 'bg-bg-surface/30 border-transparent opacity-50'
                      }`}
                  >
                    {/* Enable checbox */}
                    <button
                      onClick={() => updateSlot(index, { enabled: !slot.enabled })}
                      className={`w-8 h-8 shrink-0 rounded flex items-center justify-center transition-colors ${slot.enabled
                          ? 'bg-accent-gold text-bg-deep font-bold'
                          : 'bg-bg-surface border border-slate-600 text-transparent'
                        }`}
                    >
                      {slot.enabled && '✓'}
                    </button>

                    <div className="flex-1 min-w-[120px] flex items-center gap-2">
                      {/* Name input */}
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateSlot(index, { name: e.target.value })}
                        disabled={!slot.enabled}
                        className="w-full bg-transparent text-white text-sm px-2 py-1.5 rounded focus:bg-bg-surface focus:outline-none focus:ring-1 focus:ring-accent-gold/50"
                        placeholder={tUi('startScreen.players.placeholder', { index: index + 1 })}
                      />
                    </div>

                    {/* Bot/Human Toggles */}
                    <div className="flex rounded-lg overflow-hidden shrink-0 border border-slate-700/50">
                      <button
                        onClick={() => updateSlot(index, { isHuman: true })}
                        disabled={!slot.enabled || (humanCount >= 1 && !slot.isHuman)}
                        className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${slot.isHuman
                            ? 'bg-accent-gold text-bg-deep'
                            : 'bg-bg-surface text-slate-500 hover:text-slate-300'
                          }`}
                        title={tCommon('player.human')}
                      >
                        👤
                      </button>
                      <button
                        onClick={() => updateSlot(index, { isHuman: false })}
                        disabled={!slot.enabled}
                        className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${!slot.isHuman
                            ? 'bg-accent-ice text-bg-deep'
                            : 'bg-bg-surface text-slate-500 hover:text-slate-300'
                          }`}
                        title={tCommon('player.bot')}
                      >
                        🤖
                      </button>
                    </div>

                    {/* Difficulty (only for bots) */}
                    {!slot.isHuman && slot.enabled && (
                      <select
                        value={slot.difficulty}
                        onChange={(e) => updateSlot(index, { difficulty: e.target.value as BotDifficulty })}
                        className="bg-bg-surface text-slate-300 text-xs px-2 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-accent-ice w-20"
                      >
                        {DIFFICULTIES.map(d => (
                          <option key={d} value={d}>{tCommon(`difficulty.${d}` as const)}</option>
                        ))}
                      </select>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Warnings */}
            <div className="mt-3 flex gap-4 min-h-[1.5em]">
              {humanCount === 0 && (
                <div className="text-xs text-accent-ice flex items-center gap-1.5">
                  <span>👁️</span> {tUi('startScreen.players.spectateMode')}
                </div>
              )}
              {enabledCount < 2 && (
                <div className="text-xs text-red-400 flex items-center gap-1.5">
                  <span>⚠️</span> {tUi('startScreen.players.minWarning')}
                </div>
              )}
            </div>
          </motion.div>

          {/* Debug mode toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center mb-6"
          >
            <label className="flex items-center gap-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity p-2">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={() => setDebugMode(!debugMode)}
                className="accent-accent-gold"
              />
              <span className="text-xs text-slate-400">{tUi('startScreen.settings.debugMode')}</span>
            </label>
          </motion.div>
        </motion.div>
      </div>

      {/* Fixed Sticky Footer for Start Game */}
      <div className="w-full shrink-0 z-20 bg-bg-deep/80 backdrop-blur-md border-t border-slate-800/50 pb-safe-bottom">
        <div className="p-4 flex flex-col items-center">
          <motion.button
            {...(canStart && { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } })}
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full max-w-md btn text-base font-bold py-3.5 shadow-lg ${canStart
                ? 'btn-primary shadow-glow-gold/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
          >
            {humanCount === 0 ? tCommon('buttons.startSpectate').toUpperCase() : tCommon('buttons.start').toUpperCase()}
          </motion.button>

          <p className="text-slate-500 text-[10px] mt-2 text-center">
            {tUi('startScreen.tagline')}
          </p>
        </div>
      </div>
    </div>
  );
}
