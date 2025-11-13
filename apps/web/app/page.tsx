'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../lib/api-client';
import AgentCard from '../components/AgentCard';
import DecisionCard from '../components/DecisionCard';
import AnalysisHistory from '../components/AnalysisHistory';
import ReportRenderer from '../components/ReportRenderer';
import { detectAssetType, formatReport, getAgentEmoji, type AssetInfo } from '../lib/assetUtils';

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
  createdAt: string;
  completedAt?: string;
}

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [backendOnline, setBackendOnline] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [assetInfo, setAssetInfo] = useState<AssetInfo | null>(null);
  const getInitialAgents = (assetType: string = 'stock', fastMode: boolean = false): AgentStatus[] => {
    const type = assetType as 'stock' | 'crypto' | 'forex';
    
    // Fast mode: 3 agents (optimized for quick demo)
    if (fastMode) {
      return [
        { name: 'Market Analyst', icon: getAgentEmoji('Market Analyst', type), status: 'pending' },
        { name: 'Fundamentals Analyst', icon: getAgentEmoji('Fundamentals Analyst', type), status: 'pending' },
        { name: 'Trader', icon: getAgentEmoji('Trader', type), status: 'pending' },
      ];
    }
    
    // Full mode: 6 agents (default - comprehensive analysis)
    return [
      { name: 'Market Analyst', icon: getAgentEmoji('Market Analyst', type), status: 'pending' },
      { name: 'News Analyst', icon: getAgentEmoji('News Analyst', type), status: 'pending' },
      { name: 'Fundamentals Analyst', icon: getAgentEmoji('Fundamentals Analyst', type), status: 'pending' },
      { name: 'Bull Researcher', icon: getAgentEmoji('Bull Researcher', type), status: 'pending' },
      { name: 'Bear Researcher', icon: getAgentEmoji('Bear Researcher', type), status: 'pending' },
      { name: 'Trader', icon: getAgentEmoji('Trader', type), status: 'pending' },
    ];
  };

  const [agents, setAgents] = useState<AgentStatus[]>(getInitialAgents('stock', false)); // Default to full mode (6 agents)
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
    
    // Detect asset type and update agent icons
    const currentAssetInfo = detectAssetType(ticker);
    setAssetInfo(currentAssetInfo);
    
    // Reset agents with appropriate icons for asset type
    setAgents(getInitialAgents(currentAssetInfo.type, false)); // Use full mode (6 agents)

    try {
      const response = await apiClient.startAnalysis({
        ticker: ticker.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
      });

      if (!response.data?.id) {
        throw new Error('No analysis ID returned');
      }

      const analysisId = response.data.id;

      // Start agent at index 0
      updateAgentStatus(0, 'running');
      let currentAgent = 0;
      
      // Poll for results
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes max (increased for safety)
      const isFastMode = agents.length === 3; // Detect fast mode

      pollIntervalRef.current = setInterval(async () => {
        attempts++;

        if (attempts > maxAttempts) {
          clearInterval(pollIntervalRef.current!);
          setError('Analysis timed out. Please try again.');
          setLoading(false);
          return;
        }

        try {
          const statusRes = await apiClient.getAnalysisStatus(analysisId);

          // Update agent status based on elapsed time (approximate)
          const elapsed = attempts * 2; // seconds
          
          if (isFastMode) {
            // Fast mode: 3 agents (~10-15s each)
            if (elapsed > 12 && currentAgent === 0) {
              updateAgentStatus(0, 'completed');
              updateAgentStatus(1, 'running');
              currentAgent = 1;
            }
            if (elapsed > 25 && currentAgent === 1) {
              updateAgentStatus(1, 'completed');
              updateAgentStatus(2, 'running');
              currentAgent = 2;
            }
          } else {
            // Full mode: 6 agents (~12-18s each = ~90-120s total)
            if (elapsed > 15 && currentAgent === 0) {
              updateAgentStatus(0, 'completed');
              updateAgentStatus(1, 'running');
              currentAgent = 1;
            }
            if (elapsed > 30 && currentAgent === 1) {
              updateAgentStatus(1, 'completed');
              updateAgentStatus(2, 'running');
              currentAgent = 2;
            }
            if (elapsed > 48 && currentAgent === 2) {
              updateAgentStatus(2, 'completed');
              updateAgentStatus(3, 'running');
              currentAgent = 3;
            }
            if (elapsed > 66 && currentAgent === 3) {
              updateAgentStatus(3, 'completed');
              updateAgentStatus(4, 'running');
              currentAgent = 4;
            }
            if (elapsed > 84 && currentAgent === 4) {
              updateAgentStatus(4, 'completed');
              updateAgentStatus(5, 'running');
              currentAgent = 5;
            }
          }

          if (statusRes.data?.status === 'completed') {
            clearInterval(pollIntervalRef.current!);
            const finalResult = await apiClient.getAnalysisResult(analysisId);
            
            if (finalResult.data) {
              setResult(finalResult.data);
              
              // Mark all agents as completed
              setAgents(prev => prev.map((a, idx) => ({
                ...a,
                status: 'completed' as const,
                endTime: Date.now(),
                report: getAgentReport(finalResult.data!, idx)
              })));
              
              setActiveTab(agents[0].name); // Auto-select first tab
            }
            
            setLoading(false);
          } else if (statusRes.data?.status === 'failed') {
            clearInterval(pollIntervalRef.current!);
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
    
    // Detect mode based on current agents length
    const isFastMode = agents.length === 3;
    
    const reports = isFastMode
      ? [
          result.state.marketAnalysis?.report,
          result.state.fundamentalAnalysis?.report,
          result.state.traderDecision?.reasoning
        ]
      : [
          result.state.marketAnalysis?.report,
          result.state.newsAnalysis?.report,
          result.state.fundamentalAnalysis?.report,
          result.state.bullCase?.thesis,
          result.state.bearCase?.thesis,
          result.state.traderDecision?.reasoning
        ];
    
    const rawReport = reports[index] || 'No report available';
    // Format report to remove markdown and make it natural
    return formatReport(rawReport);
  };

  const handleSelectHistoryItem = async (id: string) => {
    setShowHistory(false);
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getAnalysisResult(id);
      if (response.data) {
        setResult(response.data);
        setTicker(response.data.ticker);
        setAgents(prev => prev.map((a, idx) => ({
          ...a,
          status: 'completed' as const,
          report: getAgentReport(response.data!, idx)
        })));
        setActiveTab(agents[0].name);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const analysisDuration = result?.completedAt && result?.createdAt
    ? Math.floor((new Date(result.completedAt).getTime() - new Date(result.createdAt).getTime()) / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="text-4xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              📈
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Trading Agents</h1>
              <p className="text-sm text-slate-400 mt-1">AI-Powered Stock Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <motion.div 
                className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
                animate={backendOnline ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm text-slate-300">{backendOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>📜</span>
              <span>History</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Search Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={ticker}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setTicker(value);
                  if (value) {
                    setAssetInfo(detectAssetType(value));
                  } else {
                    setAssetInfo(null);
                  }
                }}
                placeholder="Enter ticker (e.g., AAPL, BTC-USD, EURUSD)"
                className="w-full px-6 py-4 pr-36 text-lg bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <motion.button
                type="submit"
                disabled={loading || !ticker.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ 
                  boxShadow: '0 20px 40px -12px rgba(168, 85, 247, 0.6)'
                }}
                whileTap={{ scale: 0.98 }}
                style={{
                  boxShadow: '0 10px 30px -12px rgba(168, 85, 247, 0.3)'
                }}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </motion.button>
            </div>

            {/* Asset Type Badge - Fixed height container to prevent layout shift */}
            <div className="h-8 mt-2">
              <AnimatePresence>
                {assetInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${
                        assetInfo.type === 'stock' ? 'rgba(147, 51, 234, 0.2), rgba(59, 130, 246, 0.2)' :
                        assetInfo.type === 'crypto' ? 'rgba(249, 115, 22, 0.2), rgba(251, 191, 36, 0.2)' :
                        'rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)'
                      })`,
                      color: assetInfo.type === 'stock' ? 'rgb(167, 139, 250)' :
                             assetInfo.type === 'crypto' ? 'rgb(251, 191, 36)' :
                             'rgb(52, 211, 153)'
                    }}
                  >
                    <span>{assetInfo.icon}</span>
                    <span className="uppercase font-semibold">{assetInfo.type}</span>
                    <span className="opacity-60">• {assetInfo.displayName}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  className="mt-4 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-400 text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Agent Grid */}
        <AnimatePresence>
          {loading && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.h2 
                className="text-2xl font-bold text-white mb-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                AI Agents at Work
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent, index) => (
                  <AgentCard key={agent.name} agent={agent} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decision Card */}
        <AnimatePresence>
          {result && result.status === 'completed' && (
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DecisionCard 
                ticker={result.ticker} 
                decision={result.decision} 
                duration={analysisDuration} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results - Keep reports section */}
        {result && !loading && (
          <div className="space-y-6"
          >

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
                    <ReportRenderer
                      content={agents.find(a => a.name === activeTab)?.report || 'Loading report...'}
                      agentName={activeTab}
                      agentIcon={agents.find(a => a.name === activeTab)?.icon || '📋'}
                    />
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
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="text-8xl mb-6"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🤖
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Analyze</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Enter a stock ticker above and let our AI agents provide comprehensive investment analysis
            </p>
          </motion.div>
        )}
      </main>

      {/* History Sidebar */}
      <AnalysisHistory 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelectAnalysis={handleSelectHistoryItem} 
      />
    </div>
  );
}
