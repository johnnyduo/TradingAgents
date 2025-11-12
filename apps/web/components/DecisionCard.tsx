'use client';

import { motion } from 'framer-motion';

interface DecisionCardProps {
  ticker: string;
  decision: string;
  duration?: number;
}

export default function DecisionCard({ ticker, decision, duration }: DecisionCardProps) {
  const getDecisionConfig = () => {
    switch (decision.toLowerCase()) {
      case 'buy':
        return {
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          shadow: 'shadow-2xl shadow-emerald-500/50',
          emoji: '🚀',
          textShadow: 'drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]',
        };
      case 'sell':
        return {
          gradient: 'from-rose-500 via-red-500 to-pink-500',
          shadow: 'shadow-2xl shadow-rose-500/50',
          emoji: '📉',
          textShadow: 'drop-shadow-[0_2px_8px_rgba(244,63,94,0.5)]',
        };
      case 'hold':
        return {
          gradient: 'from-amber-500 via-yellow-500 to-orange-500',
          shadow: 'shadow-2xl shadow-amber-500/50',
          emoji: '⚖️',
          textShadow: 'drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]',
        };
      default:
        return {
          gradient: 'from-slate-500 via-gray-500 to-zinc-500',
          shadow: 'shadow-2xl shadow-slate-500/50',
          emoji: '❓',
          textShadow: '',
        };
    }
  };

  const config = getDecisionConfig();

  return (
    <motion.div
      initial={{ scale: 0, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay: 0.2,
      }}
      className="relative"
    >
      {/* Animated background glow */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute inset-0 bg-gradient-to-r ${config.gradient} opacity-30 blur-3xl rounded-3xl`}
      />

      {/* Main card */}
      <div className={`relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl rounded-3xl border-2 border-white/10 ${config.shadow} overflow-hidden`}>
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -500],
                x: [
                  Math.random() * 400 - 200,
                  Math.random() * 400 - 200,
                ],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: 'linear',
              }}
              className={`absolute bottom-0 w-1 h-1 bg-gradient-to-t ${config.gradient} rounded-full`}
              style={{ left: `${Math.random() * 100}%` }}
            />
          ))}
        </div>

        <div className="relative p-12 text-center">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-2">
              Investment Decision for {ticker}
            </div>
            {duration && (
              <div className="text-xs text-white/40">
                Analysis completed in {duration}s
              </div>
            )}
          </motion.div>

          {/* Decision */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: 0.5,
            }}
            whileHover={{ scale: 1.05 }}
            className={`inline-flex items-center gap-6 px-12 py-8 rounded-2xl bg-gradient-to-r ${config.gradient} ${config.shadow} mb-6`}
          >
            <motion.span
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`text-7xl filter ${config.textShadow}`}
            >
              {config.emoji}
            </motion.span>
            <span className="text-6xl font-black text-white uppercase tracking-tight drop-shadow-2xl">
              {decision}
            </span>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-white/50"
          >
            Based on comprehensive analysis from 6 specialized AI agents
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
