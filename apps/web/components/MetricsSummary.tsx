'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface MetricsSummaryProps {
  analysisState: any;
  ticker: string;
  decision: string;
}

export default function MetricsSummary({ analysisState, ticker, decision }: MetricsSummaryProps) {
  const metrics = useMemo(() => {
    if (!analysisState?.marketAnalysis?.report) return null;

    const marketText = analysisState.marketAnalysis.report || '';
    const traderText = analysisState.traderDecision?.report || '';
    
    // Extract key metrics - use more specific patterns
    // Look for "current price", "trading at", "price:", etc. followed by a dollar amount
    const priceMatch = marketText.match(/(?:current\s+price|trading\s+at|price\s+is|price:)\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i) ||
                       marketText.match(/\$(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:per\s+share|current|today)/i);
    
    // Look for percentage change with +/- sign
    const changeMatch = marketText.match(/(?:change|move|up|down|gain|loss)[^\d]*([-+]\d+\.?\d*)%/i) ||
                        marketText.match(/([-+]\d+\.?\d*)%\s*(?:change|move|today|daily)/i);
    
    const rsiMatch = marketText.match(/RSI[:\s]+(\d{1,3}\.?\d*)/i);
    const volumeMatch = marketText.match(/volume[:\s]+(\d{1,3}(?:,\d{3})*(?:,\d{3})?)/i);
    
    // Extract conviction score
    const convictionMatch = traderText.match(/conviction[:\s]+(\d{1,2})(?:\/10)?/i);
    
    // Extract R:R ratio
    const rrMatch = traderText.match(/(?:R:R|risk[:\s]*reward)[:\s]+([\d.]+)[:]\s*([\d.]+)|(\d+\.?\d*)\s*:\s*1/i);
    
    // Extract position size
    const positionMatch = traderText.match(/position[:\s]*size[:\s]+(\d+\.?\d*)%/i);

    return {
      price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null,
      change: changeMatch ? parseFloat(changeMatch[1]) : null,
      rsi: rsiMatch ? parseFloat(rsiMatch[1]) : null,
      volume: volumeMatch ? parseInt(volumeMatch[1].replace(/,/g, '')) : null,
      conviction: convictionMatch ? parseInt(convictionMatch[1]) : null,
      riskReward: rrMatch ? (rrMatch[2] ? `${rrMatch[1]}:${rrMatch[2]}` : `${rrMatch[3]}:1`) : null,
      positionSize: positionMatch ? parseFloat(positionMatch[1]) : null,
    };
  }, [analysisState]);

  if (!metrics) return null;

  const getDecisionColor = () => {
    const d = decision.toLowerCase();
    if (d.includes('buy') || d.includes('bullish')) return 'from-green-500 to-green-600';
    if (d.includes('sell') || d.includes('bearish')) return 'from-red-500 to-red-600';
    return 'from-yellow-500 to-yellow-600';
  };

  const getDecisionEmoji = () => {
    const d = decision.toLowerCase();
    if (d.includes('strong buy')) return '🚀';
    if (d.includes('buy')) return '📈';
    if (d.includes('sell')) return '📉';
    return '⏸️';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header with gradient matching the theme */}
        <div className={`bg-gradient-to-r ${getDecisionColor()} p-8 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-white/90 text-sm font-medium mb-2 uppercase tracking-wider">Analysis Complete</div>
              <div className="text-5xl font-bold text-white mb-1">{ticker.toUpperCase()}</div>
              <div className="text-white/80 text-base">
                {decision}
              </div>
            </div>
            <motion.div 
              className="text-7xl"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {getDecisionEmoji()}
            </motion.div>
          </div>
        </div>

        {/* Metrics Grid - Glassmorphism cards matching theme */}
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {/* Current Price */}
            {metrics.price && (
              <motion.div 
                className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm p-5 rounded-xl border border-blue-400/20 hover:border-blue-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-blue-300 text-xs font-semibold mb-2 uppercase tracking-wider">Price</div>
                <div className="text-white text-3xl font-bold mb-1">${metrics.price.toFixed(2)}</div>
              </motion.div>
            )}

            {/* Price Change */}
            {metrics.change !== null && (
              <motion.div 
                className={`bg-gradient-to-br ${metrics.change >= 0 ? 'from-emerald-500/10 to-emerald-600/10' : 'from-rose-500/10 to-rose-600/10'} backdrop-blur-sm p-5 rounded-xl border ${metrics.change >= 0 ? 'border-emerald-400/20 hover:border-emerald-400/40' : 'border-rose-400/20 hover:border-rose-400/40'} transition-all hover:scale-105`}
                whileHover={{ y: -2 }}
              >
                <div className={`${metrics.change >= 0 ? 'text-emerald-300' : 'text-rose-300'} text-xs font-semibold mb-2 uppercase tracking-wider`}>
                  Change
                </div>
                <div className="text-white text-3xl font-bold mb-1">
                  {metrics.change >= 0 ? '+' : ''}{metrics.change.toFixed(2)}%
                </div>
              </motion.div>
            )}

            {/* RSI */}
            {metrics.rsi && (
              <motion.div 
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm p-5 rounded-xl border border-purple-400/20 hover:border-purple-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-purple-300 text-xs font-semibold mb-2 uppercase tracking-wider">RSI</div>
                <div className="text-white text-3xl font-bold mb-1">{metrics.rsi.toFixed(1)}</div>
                <div className="text-purple-300/80 text-xs font-medium">
                  {metrics.rsi > 70 ? 'Overbought' : metrics.rsi < 30 ? 'Oversold' : 'Neutral'}
                </div>
              </motion.div>
            )}

            {/* Volume */}
            {metrics.volume && (
              <motion.div 
                className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 backdrop-blur-sm p-5 rounded-xl border border-amber-400/20 hover:border-amber-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-amber-300 text-xs font-semibold mb-2 uppercase tracking-wider">Volume</div>
                <div className="text-white text-3xl font-bold">
                  {metrics.volume >= 1000000
                    ? `${(metrics.volume / 1000000).toFixed(1)}M`
                    : `${(metrics.volume / 1000).toFixed(0)}K`}
                </div>
              </motion.div>
            )}

            {/* Conviction */}
            {metrics.conviction && (
              <motion.div 
                className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 backdrop-blur-sm p-5 rounded-xl border border-indigo-400/20 hover:border-indigo-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-indigo-300 text-xs font-semibold mb-2 uppercase tracking-wider">Conviction</div>
                <div className="text-white text-3xl font-bold mb-1">{metrics.conviction}/10</div>
                <div className="text-indigo-300/80 text-xs font-medium">
                  {metrics.conviction >= 8 ? 'High' : metrics.conviction >= 6 ? 'Medium' : 'Low'}
                </div>
              </motion.div>
            )}

            {/* Risk:Reward */}
            {metrics.riskReward && (
              <motion.div 
                className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 backdrop-blur-sm p-5 rounded-xl border border-cyan-400/20 hover:border-cyan-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-cyan-300 text-xs font-semibold mb-2 uppercase tracking-wider">R:R Ratio</div>
                <div className="text-white text-3xl font-bold">{metrics.riskReward}</div>
              </motion.div>
            )}

            {/* Position Size */}
            {metrics.positionSize && (
              <motion.div 
                className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-600/10 backdrop-blur-sm p-5 rounded-xl border border-fuchsia-400/20 hover:border-fuchsia-400/40 transition-all hover:scale-105"
                whileHover={{ y: -2 }}
              >
                <div className="text-fuchsia-300 text-xs font-semibold mb-2 uppercase tracking-wider">Position</div>
                <div className="text-white text-3xl font-bold mb-1">{metrics.positionSize}%</div>
                <div className="text-fuchsia-300/80 text-xs font-medium">of portfolio</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
