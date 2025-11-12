'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health on mount
  useEffect(() => {
    apiClient.health()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  // Poll for analysis status
  useEffect(() => {
    if (!analysisId) return;

    const interval = setInterval(async () => {
      try {
        const statusRes = await apiClient.getAnalysisStatus(analysisId);
        
        if (statusRes.data?.status === 'completed' || statusRes.data?.status === 'failed') {
          clearInterval(interval);
          
          // Fetch full result
          const resultRes = await apiClient.getAnalysisResult(analysisId);
          setResult(resultRes.data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Status poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analysisId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setAnalysisId(null);

    try {
      // For demo purposes, skip auth and use direct API call
      const response = await fetch('http://localhost:3001/api/v1/analysis/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticker: ticker,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Analysis failed to start');
      }

      const data = await response.json();
      
      if (data.success && data.data?.id) {
        setAnalysisId(data.data.id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
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

          {/* Backend Status */}
          <div className="mt-6 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={backendOnline ? 'text-green-400' : 'text-red-400'}>
                Backend {backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {!backendOnline && (
              <p className="mt-2 text-gray-400">
                Run: <code className="bg-gray-700 px-2 py-1 rounded">pnpm dev</code> from project root
              </p>
            )}
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className="max-w-4xl mx-auto mt-8 bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Analysis Results for {result.ticker}
            </h2>

            {/* Final Decision */}
            <div className={`p-6 rounded-lg mb-6 ${
              result.decision === 'buy' ? 'bg-green-900/30 border border-green-700' :
              result.decision === 'sell' ? 'bg-red-900/30 border border-red-700' :
              'bg-yellow-900/30 border border-yellow-700'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">
                  {result.decision === 'buy' ? '📈' : result.decision === 'sell' ? '📉' : '⏸️'}
                </span>
                <h3 className="text-2xl font-bold text-white uppercase">
                  {result.decision}
                </h3>
              </div>
              <p className="text-gray-300 text-sm">
                Status: {result.status} • Completed: {new Date(result.completedAt).toLocaleString()}
              </p>
            </div>

            {/* Agent Reports */}
            {result.state && (
              <div className="space-y-4">
                {result.state.marketAnalysis && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">📊 Market Analysis</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.marketAnalysis.report}
                    </p>
                  </div>
                )}

                {result.state.newsAnalysis && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-400 mb-2">📰 News Analysis</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.newsAnalysis.report}
                    </p>
                  </div>
                )}

                {result.state.fundamentalAnalysis && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">💼 Fundamental Analysis</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.fundamentalAnalysis.report}
                    </p>
                  </div>
                )}

                {result.state.bullCase && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-400 mb-2">🐂 Bull Case</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.bullCase.thesis}
                    </p>
                  </div>
                )}

                {result.state.bearCase && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-400 mb-2">🐻 Bear Case</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.bearCase.thesis}
                    </p>
                  </div>
                )}

                {result.state.traderDecision && (
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-400 mb-2">💰 Trader Decision</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap">
                      {result.state.traderDecision.reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setAnalysisId(null);
              }}
              className="mt-6 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              ← Back to Analysis
            </button>
          </div>
        )}

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
