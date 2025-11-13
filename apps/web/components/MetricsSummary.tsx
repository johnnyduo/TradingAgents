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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getDecisionColor()} p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/80 text-sm font-medium mb-1">Analysis Complete for</div>
              <div className="text-3xl font-bold text-white">{ticker.toUpperCase()}</div>
            </div>
            <div className="text-6xl">{getDecisionEmoji()}</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* Current Price */}
          {metrics.price && (
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-xl border border-blue-500/30">
              <div className="text-blue-300 text-xs font-medium mb-1">Current Price</div>
              <div className="text-white text-2xl font-bold">${metrics.price.toFixed(2)}</div>
            </div>
          )}

          {/* Price Change */}
          {metrics.change !== null && (
            <div className={`bg-gradient-to-br ${metrics.change >= 0 ? 'from-green-500/20 to-green-600/20' : 'from-red-500/20 to-red-600/20'} p-4 rounded-xl border ${metrics.change >= 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className={`${metrics.change >= 0 ? 'text-green-300' : 'text-red-300'} text-xs font-medium mb-1`}>
                Daily Change
              </div>
              <div className="text-white text-2xl font-bold">
                {metrics.change >= 0 ? '+' : ''}{metrics.change.toFixed(2)}%
              </div>
            </div>
          )}

          {/* RSI */}
          {metrics.rsi && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-xl border border-purple-500/30">
              <div className="text-purple-300 text-xs font-medium mb-1">RSI</div>
              <div className="text-white text-2xl font-bold">{metrics.rsi.toFixed(1)}</div>
              <div className="text-purple-300 text-xs mt-1">
                {metrics.rsi > 70 ? 'Overbought' : metrics.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>
          )}

          {/* Volume */}
          {metrics.volume && (
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 rounded-xl border border-orange-500/30">
              <div className="text-orange-300 text-xs font-medium mb-1">Volume</div>
              <div className="text-white text-2xl font-bold">
                {metrics.volume >= 1000000
                  ? `${(metrics.volume / 1000000).toFixed(1)}M`
                  : `${(metrics.volume / 1000).toFixed(0)}K`}
              </div>
            </div>
          )}

          {/* Conviction */}
          {metrics.conviction && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 p-4 rounded-xl border border-indigo-500/30">
              <div className="text-indigo-300 text-xs font-medium mb-1">Conviction</div>
              <div className="text-white text-2xl font-bold">{metrics.conviction}/10</div>
              <div className="text-indigo-300 text-xs mt-1">
                {metrics.conviction >= 8 ? 'High' : metrics.conviction >= 6 ? 'Medium' : 'Low'}
              </div>
            </div>
          )}

          {/* Risk:Reward */}
          {metrics.riskReward && (
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 p-4 rounded-xl border border-cyan-500/30">
              <div className="text-cyan-300 text-xs font-medium mb-1">Risk:Reward</div>
              <div className="text-white text-2xl font-bold">{metrics.riskReward}</div>
            </div>
          )}

          {/* Position Size */}
          {metrics.positionSize && (
            <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 p-4 rounded-xl border border-pink-500/30">
              <div className="text-pink-300 text-xs font-medium mb-1">Position Size</div>
              <div className="text-white text-2xl font-bold">{metrics.positionSize}%</div>
              <div className="text-pink-300 text-xs mt-1">of portfolio</div>
            </div>
          )}
        </div>

        {/* Decision Summary */}
        <div className="px-6 pb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-white/60 text-xs font-medium mb-2">TRADING DECISION</div>
            <div className="text-white text-lg font-bold">{decision}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
