// Agent State Types
export interface AgentState {
  companyOfInterest: string;
  tradeDate: string;
  sender?: string;
  messages: any[];
  
  // Reports
  marketReport: string;
  sentimentReport: string;
  newsReport: string;
  fundamentalsReport: string;
  
  // Debate states
  investmentDebateState: InvestDebateState;
  riskDebateState: RiskDebateState;
  
  // Plans and decisions
  investmentPlan: string;
  traderInvestmentPlan: string;
  finalTradeDecision: string;
}

export interface InvestDebateState {
  bullHistory: string;
  bearHistory: string;
  history: string;
  currentResponse: string;
  judgeDecision: string;
  count: number;
}

export interface RiskDebateState {
  riskyHistory: string;
  safeHistory: string;
  neutralHistory: string;
  history: string;
  latestSpeaker: string;
  currentRiskyResponse: string;
  currentSafeResponse: string;
  currentNeutralResponse: string;
  judgeDecision: string;
  count: number;
}

// Agent Status Types
export type AgentStatus = 'pending' | 'running' | 'completed' | 'error';

export type AgentType =
  | 'Market Analyst'
  | 'Social Analyst'
  | 'News Analyst'
  | 'Fundamentals Analyst'
  | 'Bull Researcher'
  | 'Bear Researcher'
  | 'Research Manager'
  | 'Trader'
  | 'Risky Analyst'
  | 'Neutral Analyst'
  | 'Safe Analyst'
  | 'Risk Manager';

export interface AgentStatusMap {
  [key: string]: AgentStatus;
}

// Configuration Types
export interface TradingConfig {
  projectDir: string;
  resultsDir: string;
  dataCacheDir: string;
  
  // LLM settings
  llmProvider: 'openai' | 'anthropic' | 'google' | 'ollama';
  deepThinkLLM: string;
  quickThinkLLM: string;
  backendUrl: string;
  
  // Debate settings
  maxDebateRounds: number;
  maxRiskDiscussRounds: number;
  maxRecurLimit: number;
  
  // Data vendors
  dataVendors: DataVendorConfig;
  toolVendors?: Record<string, string>;
}

export interface DataVendorConfig {
  coreStockApis: string;
  technicalIndicators: string;
  fundamentalData: string;
  newsData: string;
}

// Analysis Types
export interface AnalysisParams {
  ticker: string;
  date: string;
  selectedAnalysts: AnalystType[];
  config: Partial<TradingConfig>;
}

export type AnalystType = 'market' | 'social' | 'news' | 'fundamentals';

export interface AnalysisResult {
  id: string;
  userId: string;
  ticker: string;
  date: string;
  config: TradingConfig;
  state: AgentState;
  decision: 'BUY' | 'SELL' | 'HOLD';
  createdAt: Date;
  completedAt: Date;
}

// Tool Types
export interface ToolCall {
  id: string;
  tool: string;
  args: Record<string, any>;
  timestamp: Date;
  result?: any;
  error?: string;
}

// Memory Types
export interface MemoryMatch {
  matchedSituation: string;
  recommendation: string;
  similarityScore: number;
}

// Report Types
export type ReportType = 'market' | 'sentiment' | 'news' | 'fundamentals';

export interface Report {
  type: ReportType;
  content: string;
  timestamp: Date;
}

// WebSocket Event Types
export interface AgentStatusEvent {
  agent: AgentType;
  status: AgentStatus;
  timestamp: Date;
}

export interface ToolCallEvent {
  tool: string;
  args: Record<string, any>;
  timestamp: Date;
}

export interface ReportGeneratedEvent {
  type: ReportType;
  content: string;
  timestamp: Date;
}

export interface DebateUpdateEvent {
  type: 'investment' | 'risk';
  state: InvestDebateState | RiskDebateState;
  timestamp: Date;
}

export interface AnalysisCompleteEvent {
  result: AnalysisResult;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
