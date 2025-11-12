'use client';

import { motion } from 'framer-motion';

interface AgentCardProps {
  agent: {
    name: string;
    icon: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    startTime?: number;
    endTime?: number;
  };
  index: number;
}

export default function AgentCard({ agent, index }: AgentCardProps) {
  const getStatusConfig = () => {
    switch (agent.status) {
      case 'running':
        return {
          bg: 'from-cyan-500/20 via-blue-500/20 to-purple-500/20',
          border: 'border-cyan-400/60',
          shadow: 'shadow-lg shadow-cyan-500/30',
          iconScale: 1.15,
          glow: true,
        };
      case 'completed':
        return {
          bg: 'from-emerald-500/10 to-green-500/10',
          border: 'border-emerald-400/40',
          shadow: 'shadow-md shadow-emerald-500/20',
          iconScale: 1,
          glow: false,
        };
      case 'error':
        return {
          bg: 'from-rose-500/10 to-red-500/10',
          border: 'border-rose-400/40',
          shadow: 'shadow-md shadow-rose-500/20',
          iconScale: 1,
          glow: false,
        };
      default:
        return {
          bg: 'from-slate-800/30 to-slate-700/20',
          border: 'border-slate-600/30',
          shadow: '',
          iconScale: 1,
          glow: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 150,
        damping: 20,
      }}
      whileHover={{
        scale: 1.05,
        y: -8,
        transition: { type: 'spring', stiffness: 400, damping: 10 },
      }}
      className="relative"
    >
      {/* Glow effect for running agent */}
      {config.glow && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-blue-400/30 to-purple-400/30 rounded-2xl blur-xl"
        />
      )}

      {/* Card */}
      <div
        className={`relative p-6 rounded-2xl bg-gradient-to-br ${config.bg} border-2 ${config.border} ${config.shadow} backdrop-blur-sm transition-all duration-300 overflow-hidden`}
      >
        {/* Animated background for running state */}
        {agent.status === 'running' && (
          <motion.div
            animate={{
              x: ['0%', '100%'],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"
          />
        )}

        {/* Pulsing dot indicator */}
        {agent.status === 'running' && (
          <div className="absolute top-4 right-4">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-lg shadow-cyan-500/50"></span>
            </span>
          </div>
        )}

        <div className="relative flex items-start gap-4">
          {/* Animated Icon */}
          <motion.div
            animate={{
              scale: agent.status === 'running' ? [1, config.iconScale, 1] : 1,
              rotate: agent.status === 'running' ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: agent.status === 'running' ? 2 : 0.3,
              repeat: agent.status === 'running' ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className="text-5xl filter drop-shadow-lg"
          >
            {agent.icon}
          </motion.div>

          <div className="flex-1 min-w-0">
            {/* Agent Name */}
            <h3 className="text-lg font-bold text-white mb-1 truncate">
              {agent.name}
            </h3>

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {agent.status === 'running' && (
                <>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-cyan-400"
                  >
                    ⚡
                  </motion.span>
                  <span className="text-cyan-300">Analyzing...</span>
                </>
              )}
              {agent.status === 'completed' && (
                <>
                  <span className="text-emerald-400">✓</span>
                  <span className="text-emerald-300">Complete</span>
                  {agent.startTime && agent.endTime && (
                    <span className="text-emerald-400/60 text-xs ml-1">
                      ({((agent.endTime - agent.startTime) / 1000).toFixed(1)}s)
                    </span>
                  )}
                </>
              )}
              {agent.status === 'pending' && (
                <>
                  <span className="text-slate-500">○</span>
                  <span className="text-slate-400">Waiting</span>
                </>
              )}
              {agent.status === 'error' && (
                <>
                  <span className="text-rose-400">✕</span>
                  <span className="text-rose-300">Error</span>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Progress bar for running state */}
        {agent.status === 'running' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 20, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 origin-left"
          />
        )}
      </div>
    </motion.div>
  );
}
