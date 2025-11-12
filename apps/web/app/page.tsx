'use client';

import { useState } from 'react';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // TODO: Implement API call
      setError('API not yet connected. Backend server must be running on port 3001');
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            🤖 TradingAgents
          </h1>
          <p className="text-xl text-gray-300">
            AI-Powered Multi-Agent Trading Analysis System
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Powered by React, Next.js, LangChain.js & LangGraph
          </p>
        </div>

        {/* Analysis Form */}
        <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Start Trading Analysis
          </h2>

          <form onSubmit={handleAnalyze} className="space-y-6">
            {/* Ticker Input */}
            <div>
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-300 mb-2">
                Stock Ticker Symbol
              </label>
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, GOOGL, TSLA"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              disabled={loading || !ticker}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                '🚀 Start Analysis'
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-6 bg-gray-700/50 border border-gray-600 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">
              🎯 How it works
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">1.</span>
                <span><strong>Market Analyst</strong> analyzes technical indicators (SMA, RSI, MACD)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">2.</span>
                <span><strong>News Analyst</strong> evaluates sentiment from recent news</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">3.</span>
                <span><strong>Fundamentals Analyst</strong> reviews financial metrics and valuation</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">4.</span>
                <span><strong>Bull & Bear Researchers</strong> debate investment thesis</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">5.</span>
                <span><strong>Trader Agent</strong> makes final BUY/SELL/HOLD decision</span>
              </li>
            </ul>
          </div>

          {/* Status */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>
              💡 Make sure the backend API is running on{' '}
              <code className="bg-gray-700 px-2 py-1 rounded">http://localhost:3001</code>
            </p>
            <p className="mt-2">
              Run: <code className="bg-gray-700 px-2 py-1 rounded">pnpm dev</code> from project root
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>
            Built with ❤️ using React, Next.js 14, TypeScript, LangChain.js & LangGraph
          </p>
          <p className="mt-2">
            Original Python version converted to React • All agents operational
          </p>
        </div>
      </div>
    </main>
  );
}
