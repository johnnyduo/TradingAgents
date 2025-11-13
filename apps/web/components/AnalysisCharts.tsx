'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AnalysisChartsProps {
  analysisState: any;
}

// Extract numerical data from text analysis
const extractMetrics = (text: string) => {
  const metrics: any = {
    price: null,
    change: null,
    volume: null,
    rsi: null,
    sentiment: null,
  };

  // Extract price - look for specific contexts
  const priceMatch = text.match(/(?:current\s+price|trading\s+at|price\s+is|price:)\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i) ||
                     text.match(/\$(\d{1,3}(?:,\d{3})*\.\d{2})\s*(?:per\s+share|current|today)/i);
  if (priceMatch) metrics.price = parseFloat(priceMatch[1].replace(/,/g, ''));

  // Extract percentage change - look for +/- sign
  const changeMatch = text.match(/(?:change|move|up|down|gain|loss)[^\d]*([-+]\d+\.?\d*)%/i) ||
                      text.match(/([-+]\d+\.?\d*)%\s*(?:change|move|today|daily)/i);
  if (changeMatch) metrics.change = parseFloat(changeMatch[1]);

  // Extract RSI
  const rsiMatch = text.match(/RSI[:\s]+(\d{1,3}\.?\d*)/i);
  if (rsiMatch) metrics.rsi = parseFloat(rsiMatch[1]);

  // Extract volume
  const volumeMatch = text.match(/volume[:\s]+(\d{1,3}(?:,\d{3})*(?:,\d{3})?)/i);
  if (volumeMatch) metrics.volume = parseInt(volumeMatch[1].replace(/,/g, ''));

  return metrics;
};

// Extract technical indicators
const extractIndicators = (text: string) => {
  const indicators: any[] = [];
  
  const rsiMatch = text.match(/RSI[:\s]+(\d{1,3}\.?\d*)/i);
  if (rsiMatch) {
    indicators.push({ name: 'RSI', value: parseFloat(rsiMatch[1]), target: 50 });
  }

  const smaMatch = text.match(/SMA[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (smaMatch) {
    indicators.push({ name: 'SMA', value: parseFloat(smaMatch[1].replace(/,/g, '')), target: 0 });
  }

  const macdMatch = text.match(/MACD[:\s]+([-+]?\d+\.?\d*)/i);
  if (macdMatch) {
    indicators.push({ name: 'MACD', value: parseFloat(macdMatch[1]), target: 0 });
  }

  return indicators;
};

// Extract sentiment scores
const extractSentiment = (text: string) => {
  let bullish = 0, bearish = 0, neutral = 0;

  const bullishMatch = text.match(/bullish[:\s]+(\d{1,3})%/i);
  if (bullishMatch) bullish = parseInt(bullishMatch[1]);

  const bearishMatch = text.match(/bearish[:\s]+(\d{1,3})%/i);
  if (bearishMatch) bearish = parseInt(bearishMatch[1]);

  const neutralMatch = text.match(/neutral[:\s]+(\d{1,3})%/i);
  if (neutralMatch) neutral = parseInt(neutralMatch[1]);

  // If not found, estimate from keywords
  if (bullish === 0 && bearish === 0 && neutral === 0) {
    const lowerText = text.toLowerCase();
    const bullishWords = (lowerText.match(/\b(bullish|buy|positive|strong|rally|uptrend|breakout)\b/g) || []).length;
    const bearishWords = (lowerText.match(/\b(bearish|sell|negative|weak|decline|downtrend|breakdown)\b/g) || []).length;
    const neutralWords = (lowerText.match(/\b(neutral|hold|sideways|range|consolidat)\b/g) || []).length;
    
    const total = bullishWords + bearishWords + neutralWords || 1;
    bullish = Math.round((bullishWords / total) * 100);
    bearish = Math.round((bearishWords / total) * 100);
    neutral = Math.round((neutralWords / total) * 100);
  }

  return [
    { name: 'Bullish', value: bullish, color: '#10b981' },
    { name: 'Bearish', value: bearish, color: '#ef4444' },
    { name: 'Neutral', value: neutral, color: '#6b7280' },
  ];
};

// Extract price targets and stop loss
const extractPriceTargets = (text: string, currentPrice: number) => {
  const targets: any[] = [{ name: 'Current', price: currentPrice }];

  const stopLossMatch = text.match(/stop\s*loss[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (stopLossMatch) {
    targets.push({ name: 'Stop Loss', price: parseFloat(stopLossMatch[1].replace(/,/g, '')) });
  }

  const target1Match = text.match(/target\s*1[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (target1Match) {
    targets.push({ name: 'Target 1', price: parseFloat(target1Match[1].replace(/,/g, '')) });
  }

  const target2Match = text.match(/target\s*2[:\s]+\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  if (target2Match) {
    targets.push({ name: 'Target 2', price: parseFloat(target2Match[1].replace(/,/g, '')) });
  }

  return targets.sort((a, b) => a.price - b.price);
};

// Extract conviction/confidence scores
const extractConvictionScores = (text: string) => {
  const scores: any[] = [];

  const technicalMatch = text.match(/technical[:\s]+(\d{1,2})(?:\/10)?/i);
  if (technicalMatch) scores.push({ category: 'Technical', score: parseInt(technicalMatch[1]) * 10, fullMark: 100 });

  const fundamentalMatch = text.match(/fundamental[:\s]+(\d{1,2})(?:\/10)?/i);
  if (fundamentalMatch) scores.push({ category: 'Fundamental', score: parseInt(fundamentalMatch[1]) * 10, fullMark: 100 });

  const sentimentMatch = text.match(/sentiment[:\s]+(\d{1,2})(?:\/10)?/i);
  if (sentimentMatch) scores.push({ category: 'Sentiment', score: parseInt(sentimentMatch[1]) * 10, fullMark: 100 });

  const riskMatch = text.match(/risk[:\s]+(\d{1,2})(?:\/10)?/i);
  if (riskMatch) scores.push({ category: 'Risk', score: parseInt(riskMatch[1]) * 10, fullMark: 100 });

  return scores;
};

// Extract valuation metrics
const extractValuationMetrics = (text: string) => {
  const metrics: any[] = [];

  const peMatch = text.match(/P\/E[:\s]+(\d{1,3}\.?\d*)/i);
  if (peMatch) metrics.push({ name: 'P/E Ratio', value: parseFloat(peMatch[1]) });

  const pegMatch = text.match(/PEG[:\s]+(\d{1,3}\.?\d*)/i);
  if (pegMatch) metrics.push({ name: 'PEG Ratio', value: parseFloat(pegMatch[1]) });

  const pbMatch = text.match(/P\/B[:\s]+(\d{1,3}\.?\d*)/i);
  if (pbMatch) metrics.push({ name: 'P/B Ratio', value: parseFloat(pbMatch[1]) });

  const roeMatch = text.match(/ROE[:\s]+(\d{1,3}\.?\d*)%/i);
  if (roeMatch) metrics.push({ name: 'ROE %', value: parseFloat(roeMatch[1]) });

  return metrics;
};

export default function AnalysisCharts({ analysisState }: AnalysisChartsProps) {
  const { marketAnalysis, newsAnalysis, fundamentalAnalysis, traderDecision } = analysisState || {};

  const chartData = useMemo(() => {
    if (!marketAnalysis?.report) return null;

    const marketText = marketAnalysis.report || '';
    const newsText = newsAnalysis?.report || '';
    const fundamentalText = fundamentalAnalysis?.report || '';
    const traderText = traderDecision?.report || '';

    const metrics = extractMetrics(marketText);
    const indicators = extractIndicators(marketText);
    const sentiment = extractSentiment(newsText);
    const priceTargets = metrics.price ? extractPriceTargets(traderText, metrics.price) : [];
    const convictionScores = extractConvictionScores(traderText);
    const valuationMetrics = extractValuationMetrics(fundamentalText);

    return {
      hasData: metrics.price || indicators.length > 0 || sentiment.some(s => s.value > 0),
      metrics,
      indicators,
      sentiment,
      priceTargets,
      convictionScores,
      valuationMetrics,
    };
  }, [marketAnalysis, newsAnalysis, fundamentalAnalysis, traderDecision]);

  if (!chartData?.hasData) return null;

  const COLORS = ['#10b981', '#ef4444', '#6b7280'];

  return (
    <div className="mt-8 space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 text-white">📊 Data Visualization</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Targets Chart */}
        {chartData.priceTargets.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              🎯 Price Levels & Targets
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.priceTargets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="price" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Sentiment Pie Chart */}
        {chartData.sentiment.some(s => s.value > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              💭 Market Sentiment
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.sentiment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.sentiment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Technical Indicators */}
        {chartData.indicators.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              📈 Technical Indicators
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.indicators} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Conviction Scores Radar */}
        {chartData.convictionScores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              🎯 Conviction Analysis
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={chartData.convictionScores}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="category" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Valuation Metrics */}
        {chartData.valuationMetrics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg md:col-span-2"
          >
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              💰 Valuation Metrics
            </h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.valuationMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                />
                <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Key Metrics Summary Cards */}
      {chartData.metrics.price && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {chartData.metrics.price && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-sm opacity-80">Current Price</div>
              <div className="text-2xl font-bold">${chartData.metrics.price.toFixed(2)}</div>
            </div>
          )}
          {chartData.metrics.change !== null && (
            <div className={`bg-gradient-to-br ${chartData.metrics.change >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-6 rounded-xl shadow-lg text-white`}>
              <div className="text-sm opacity-80">Change</div>
              <div className="text-2xl font-bold">
                {chartData.metrics.change >= 0 ? '+' : ''}{chartData.metrics.change.toFixed(2)}%
              </div>
            </div>
          )}
          {chartData.metrics.rsi && (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-sm opacity-80">RSI</div>
              <div className="text-2xl font-bold">{chartData.metrics.rsi.toFixed(1)}</div>
              <div className="text-xs opacity-80">
                {chartData.metrics.rsi > 70 ? 'Overbought' : chartData.metrics.rsi < 30 ? 'Oversold' : 'Neutral'}
              </div>
            </div>
          )}
          {chartData.metrics.volume && (
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
              <div className="text-sm opacity-80">Volume</div>
              <div className="text-2xl font-bold">
                {chartData.metrics.volume >= 1000000
                  ? `${(chartData.metrics.volume / 1000000).toFixed(1)}M`
                  : `${(chartData.metrics.volume / 1000).toFixed(0)}K`}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
