'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/api-client';

interface AgentStatus {
  name: string;
  icon: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  report?: string;
  startTime?: number;
  endTime?: number;
}

interface AnalysisResult {
  id: string;
  ticker: string;
  decision: string;
  status: string;
  state?: any;
}

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Market Analyst', icon: '📊', status: 'pending' },
    { name: 'News Analyst', icon: '📰', status: 'pending' },
    { name: 'Fundamentals Analyst', icon: '💼', status: 'pending' },
    { name: 'Bull Researcher', icon: '🐂', status: 'pending' },
    { name: 'Bear Researcher', icon: '🐻', status: 'pending' },
    { name: 'Trader', icon: '💰', status: 'pending' },
  ]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  // Check backend health
  useEffect(() => {
    apiClient.health()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!ticker.trim()) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setActiveTab(null);
    setAnalysisStartTime(Date.now());
    
    // Reset agents
    setAgents(prev => prev.map(a => ({ ...a, status: 'pending' as const, report: undefined, startTime: undefined, endTime: undefined })));

    try {
      const response = await apiClient.startAnalysis({
        ticker: ticker.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
      });

      if (!response.data?.id) {
        throw new Error('No analysis ID returned');
      }

      // Start agent at index 0
      updateAgentStatus(0, 'running');
      let currentAgent = 0;
      
      // Poll for results
      let attempts = 0;
      const maxAttempts = 120; // 4 minutes max

      pollIntervalRef.current = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollIntervalRef.current);
          setError('Analysis timed out. Please try again.');
          setLoading(false);
          return;
        }

        try {
          const statusRes = await apiClient.getAnalysisStatus(response.data.id);

          // Update agent status based on elapsed time (approximate)
          const elapsed = attempts * 2; // seconds
          if (elapsed > 18 && currentAgent === 0) {
            updateAgentStatus(0, 'completed');
            updateAgentStatus(1, 'running');
            currentAgent = 1;
          }
          if (elapsed > 38 && currentAgent === 1) {
            updateAgentStatus(1, 'completed');
            updateAgentStatus(2, 'running');
            currentAgent = 2;
          }
          if (elapsed > 53 && currentAgent === 2) {
            updateAgentStatus(2, 'completed');
            updateAgentStatus(3, 'running');
            currentAgent = 3;
          }
          if (elapsed > 78 && currentAgent === 3) {
            updateAgentStatus(3, 'completed');
            updateAgentStatus(4, 'running');
            currentAgent = 4;
          }
          if (elapsed > 103 && currentAgent === 4) {
            updateAgentStatus(4, 'completed');
            updateAgentStatus(5, 'running');
            currentAgent = 5;
          }

          if (statusRes.data?.status === 'completed') {
            clearInterval(pollIntervalRef.current);
            const finalResult = await apiClient.getAnalysisResult(response.data.id);
            setResult(finalResult.data);
            
            // Mark all as completed and populate reports
            setAgents(prev => prev.map((a, idx) => ({
              ...a,
              status: 'completed' as const,
              endTime: Date.now(),
              report: getAgentReport(finalResult.data, idx)
            })));
            
            setLoading(false);
            setActiveTab(agents[0].name); // Auto-select first tab
          } else if (statusRes.data?.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setError('Analysis failed. Please try again.');
            setLoading(false);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to start analysis');
      setLoading(false);
    }
  };

  const updateAgentStatus = (index: number, status: AgentStatus['status']) => {
    setAgents(prev => prev.map((a, idx) => 
      idx === index ? { 
        ...a, 
        status,
        startTime: status === 'running' ? Date.now() : a.startTime,
        endTime: status === 'completed' ? Date.now() : a.endTime
      } : a
    ));
  };

  const getAgentReport = (result: AnalysisResult, index: number): string => {
    if (!result.state) return 'No report available';
    
    const reports = [
      result.state.marketAnalysis?.report,
      result.state.newsAnalysis?.report,
      result.state.fundamentalAnalysis?.report,
      result.state.bullCase?.report,
      result.state.bearCase?.report,
      result.state.traderDecision?.report
    ];
    
    return reports[index] || 'No report available';
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Trading Agents</h1>
                <p className="text-xs text-blue-300/80">AI-Powered Multi-Agent Investment Analysis</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                backendOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
                {backendOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleAnalyze} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="Enter stock ticker (e.g., AAPL, TSLA, GOOGL, NVDA)"
                  className="w-full pl-16 pr-6 py-4 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-lg font-medium transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !backendOnline}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Analyzing
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    Start Analysis
                  </span>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Agent Pipeline */}
        {loading && (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Agent Laboratory</h2>
                  <p className="text-sm text-blue-300/70">Analyzing {ticker} with 6 specialized AI agents</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-300">
                    {Math.floor((Date.now() - analysisStartTime) / 1000)}s elapsed
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {agents.map((agent, idx) => (
                  <div
                    key={idx}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-500 ${
                      agent.status === 'running'
                        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400 shadow-lg shadow-blue-500/50 scale-105'
                        : agent.status === 'completed'
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {agent.status === 'running' && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`text-4xl transition-all duration-500 ${
                        agent.status === 'running' ? 'animate-bounce' : ''
                      }`}>
                        {agent.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-base mb-1">{agent.name}</div>
                        <div className={`text-xs font-medium flex items-center gap-1.5 ${
                          agent.status === 'running' ? 'text-blue-400' :
                          agent.status === 'completed' ? 'text-green-400' :
                          'text-gray-500'
                        }`}>
                          {agent.status === 'running' && (
                            <>
                              <span className="animate-pulse">●</span>
                              <span>Analyzing data...</span>
                            </>
                          )}
                          {agent.status === 'completed' && (
                            <>
                              <span>✓</span>
                              <span>Analysis complete</span>
                            </>
                          )}
                          {agent.status === 'pending' && (
                            <>
                              <span>○</span>
                              <span>Waiting in queue</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {agent.status === 'running' && (
                      <div className="mt-3">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {agent.status === 'completed' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-green-400/70">
                        <span>⏱️</span>
                        <span>
                          {agent.startTime && agent.endTime 
                            ? `${((agent.endTime - agent.startTime) / 1000).toFixed(1)}s`
                            : 'Completed'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-300/70">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Running comprehensive analysis...</span>
                </div>
                <span className="text-white/30">•</span>
                <div className="text-blue-300/70">
                  Typically completes in 1-2 minutes
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Decision Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-10 shadow-2xl">
              <div className="text-center">
                <div className="text-xs text-white/50 uppercase tracking-widest mb-3 font-bold">
                  Final Investment Recommendation
                </div>
                <div className={`inline-flex items-center gap-4 px-10 py-5 rounded-2xl text-4xl font-bold mb-6 transition-all ${
                  result.decision === 'buy' 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-400 border-2 border-green-500 shadow-lg shadow-green-500/30' 
                    : result.decision === 'sell' 
                    ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20 text-red-400 border-2 border-red-500 shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-400 border-2 border-yellow-500 shadow-lg shadow-yellow-500/30'
                }`}>
                  <span className="text-5xl">
                    {result.decision === 'buy' ? '📈' : result.decision === 'sell' ? '📉' : '↔️'}
                  </span>
                  <span className="uppercase tracking-tight">{result.decision}</span>
                </div>
                <div className="text-white/60 text-sm">
                  Consensus decision from 6 specialized AI agents analyzing market data, news, fundamentals, and risk factors
                </div>
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span> Multi-agent Analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span> Real-time Market Data
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">✓</span> Bull vs Bear Debate
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Reports */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10 px-6 py-5">
                <h2 className="text-2xl font-bold text-white">Detailed Analysis Reports</h2>
                <p className="text-sm text-white/60 mt-1">Click each agent to view their comprehensive analysis</p>
              </div>
              
              <div className="flex border-b border-white/10 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                {agents.map((agent, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(agent.name)}
                    className={`flex-shrink-0 px-6 py-4 font-medium transition-all border-b-2 ${
                      activeTab === agent.name
                        ? 'text-blue-400 border-blue-400 bg-blue-500/10'
                        : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{agent.icon}</span>
                      <span className="whitespace-nowrap text-sm font-semibold">{agent.name}</span>
                      {agent.status === 'completed' && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-8">
                {activeTab ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">
                        {agents.find(a => a.name === activeTab)?.icon}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{activeTab}</h3>
                        <p className="text-sm text-white/50">Comprehensive analysis report</p>
                      </div>
                    </div>
                    <div className="bg-black/40 rounded-xl p-8 text-white/90 leading-relaxed whitespace-pre-wrap font-light text-sm border border-white/10">
                      {agents.find(a => a.name === activeTab)?.report || 'Loading report...'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📋</div>
                    <div className="text-white/40 text-sm">
                      Select an agent tab above to view their detailed analysis report
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && (
          <div className="text-center py-24 animate-in fade-in duration-1000">
            <div className="text-7xl mb-6 animate-bounce">🤖</div>
            <h3 className="text-3xl font-bold text-white mb-3">AI Agent Laboratory</h3>
            <p className="text-white/60 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              Enter a stock ticker above to start a comprehensive multi-agent investment analysis. 
              Our AI agents will analyze market data, news sentiment, fundamentals, and debate investment strategies in real-time.
            </p>
            <div className="flex items-center justify-center gap-10 text-sm text-white/40">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-xl border border-blue-500/30">
                  🔍
                </div>
                <span>6 Specialized Agents</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-xl border border-purple-500/30">
                  ⚡
                </div>
                <span>Real-time Analysis</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center text-xl border border-pink-500/30">
                  🎯
                </div>
                <span>Multi-perspective Research</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
