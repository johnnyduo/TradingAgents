'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/api-client';

interface HistoryItem {
  id: string;
  ticker: string;
  decision: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface AnalysisHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (id: string) => void;
}

export default function AnalysisHistory({ isOpen, onClose, onSelectAnalysis }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Use apiClient which handles base URL properly
      const result = await apiClient.getAnalysisHistory({ limit: 50 });
      // API returns { success: true, data: [...] }
      const historyData = result.data || [];
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = Array.isArray(history) 
    ? history.filter(item =>
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getDecisionColor = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case 'buy': return 'from-emerald-500 to-green-600';
      case 'sell': return 'from-rose-500 to-red-600';
      case 'hold': return 'from-amber-500 to-yellow-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[480px] bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border-l border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-black/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Analysis History</h2>
                  <p className="text-sm text-purple-300/70 mt-1">Your saved investment analyses</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticker..."
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
              </div>
            </div>

            {/* History List */}
            <div className="overflow-y-auto h-[calc(100%-180px)] p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="text-white/40">No analyses found</p>
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => onSelectAnalysis(item.id)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-2xl font-bold text-white">{item.ticker}</div>
                        <div className="text-xs text-white/50 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      {item.decision && (
                        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getDecisionColor(item.decision)}`}>
                          {item.decision.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {item.status === 'completed' && item.completedAt && (
                      <div className="flex items-center gap-2 text-xs text-green-400/70">
                        <span>✓</span>
                        <span>Completed in {Math.round((new Date(item.completedAt).getTime() - new Date(item.createdAt).getTime()) / 1000)}s</span>
                      </div>
                    )}
                    {item.status === 'running' && (
                      <div className="flex items-center gap-2 text-xs text-blue-400/70">
                        <span className="animate-pulse">●</span>
                        <span>In progress...</span>
                      </div>
                    )}
                    {item.status === 'failed' && (
                      <div className="flex items-center gap-2 text-xs text-red-400/70">
                        <span>✕</span>
                        <span>Failed</span>
                      </div>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
