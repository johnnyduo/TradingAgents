# TradingAgents React Conversion - Complete Architecture Plan

## Executive Summary

This document outlines the complete conversion of the Python-based TradingAgents framework to a modern React.js web application. The conversion will maintain all functionality while providing a superior user experience with real-time updates, interactive visualizations, and a modern UI.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **State Management**: Zustand (lightweight, modern alternative to Redux)
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Real-time**: Socket.io Client
- **Charts**: Recharts + TradingView Lightweight Charts
- **Markdown**: react-markdown with remark-gfm
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Turbopack (Next.js built-in)

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **LLM Integration**: LangChain.js
- **Vector DB**: ChromaDB (via HTTP API)
- **Real-time**: Socket.io Server
- **Task Queue**: BullMQ + Redis (for long-running analyses)
- **Database**: PostgreSQL (user data, results) + Redis (caching)
- **ORM**: Prisma
- **API Documentation**: OpenAPI/Swagger
- **Authentication**: NextAuth.js

### DevOps & Tools
- **Package Manager**: pnpm (faster, more efficient)
- **Monorepo**: Turborepo (frontend + backend)
- **Testing**: Vitest (unit), Playwright (E2E)
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (frontend) + Railway/Render (backend)
- **Monitoring**: Sentry (errors) + Plausible (analytics)

## Project Structure

```
tradingagents-react/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App router
│   │   │   ├── (auth)/              # Auth routes
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/         # Main app routes
│   │   │   │   ├── analysis/        # Trading analysis
│   │   │   │   ├── history/         # Past results
│   │   │   │   ├── settings/        # Configuration
│   │   │   │   └── layout.tsx
│   │   │   ├── api/                 # API routes (proxy)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/              # React components
│   │   │   ├── ui/                  # shadcn components
│   │   │   ├── analysis/            # Analysis-specific
│   │   │   ├── agents/              # Agent visualizations
│   │   │   ├── charts/              # Trading charts
│   │   │   ├── debate/              # Debate viewers
│   │   │   ├── reports/             # Report displays
│   │   │   └── forms/               # Input forms
│   │   ├── lib/                     # Utilities
│   │   │   ├── api/                 # API client
│   │   │   ├── stores/              # Zustand stores
│   │   │   ├── hooks/               # Custom hooks
│   │   │   ├── utils/               # Helper functions
│   │   │   └── types/               # TypeScript types
│   │   ├── public/                  # Static assets
│   │   └── styles/                  # Global styles
│   │
│   └── api/                          # Backend API server
│       ├── src/
│       │   ├── agents/              # Agent implementations
│       │   │   ├── analysts/
│       │   │   │   ├── market.ts
│       │   │   │   ├── social.ts
│       │   │   │   ├── news.ts
│       │   │   │   └── fundamentals.ts
│       │   │   ├── researchers/
│       │   │   │   ├── bull.ts
│       │   │   │   ├── bear.ts
│       │   │   │   └── research-manager.ts
│       │   │   ├── trader/
│       │   │   │   └── trader.ts
│       │   │   ├── risk/
│       │   │   │   ├── risky.ts
│       │   │   │   ├── neutral.ts
│       │   │   │   ├── conservative.ts
│       │   │   │   └── risk-manager.ts
│       │   │   └── base/
│       │   │       ├── agent.base.ts
│       │   │       └── types.ts
│       │   ├── graph/               # State machine
│       │   │   ├── trading-graph.ts
│       │   │   ├── setup.ts
│       │   │   ├── conditional-logic.ts
│       │   │   ├── propagation.ts
│       │   │   ├── reflection.ts
│       │   │   └── signal-processing.ts
│       │   ├── dataflows/           # Data sources
│       │   │   ├── interface.ts
│       │   │   ├── vendors/
│       │   │   │   ├── alpha-vantage.ts
│       │   │   │   ├── finnhub.ts
│       │   │   │   ├── polygon.ts
│       │   │   │   └── openai.ts
│       │   │   ├── tools/
│       │   │   │   ├── stock-data.ts
│       │   │   │   ├── indicators.ts
│       │   │   │   ├── fundamentals.ts
│       │   │   │   └── news.ts
│       │   │   └── cache/
│       │   │       └── redis-cache.ts
│       │   ├── memory/              # Memory & learning
│       │   │   ├── financial-memory.ts
│       │   │   ├── chromadb-client.ts
│       │   │   └── embeddings.ts
│       │   ├── services/            # Business logic
│       │   │   ├── analysis.service.ts
│       │   │   ├── llm.service.ts
│       │   │   └── user.service.ts
│       │   ├── routes/              # API routes
│       │   │   ├── analysis.routes.ts
│       │   │   ├── config.routes.ts
│       │   │   ├── history.routes.ts
│       │   │   └── auth.routes.ts
│       │   ├── websocket/           # Socket.io handlers
│       │   │   ├── analysis.socket.ts
│       │   │   └── handlers.ts
│       │   ├── queue/               # Job processing
│       │   │   ├── analysis.queue.ts
│       │   │   └── processors.ts
│       │   ├── db/                  # Database
│       │   │   ├── prisma/
│       │   │   │   └── schema.prisma
│       │   │   └── migrations/
│       │   ├── middleware/          # Express middleware
│       │   │   ├── auth.ts
│       │   │   ├── error.ts
│       │   │   └── rate-limit.ts
│       │   ├── config/              # Configuration
│       │   │   ├── default.ts
│       │   │   ├── llm.ts
│       │   │   └── vendors.ts
│       │   └── index.ts             # Entry point
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       └── package.json
│
├── packages/                         # Shared packages
│   ├── types/                       # Shared TypeScript types
│   │   ├── agent-states.ts
│   │   ├── debate-states.ts
│   │   └── index.ts
│   ├── ui/                          # Shared UI components
│   └── config/                      # Shared configuration
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.api
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

## Detailed Architecture

### 1. Frontend Architecture (Next.js)

#### A. Component Structure

```typescript
// Main Analysis Page Component
components/analysis/TradingAnalysisPage.tsx
  ├── ConfigurationPanel          # Ticker, date, analyst selection
  ├── AnalysisControlBar          # Start/Stop/Reset buttons
  ├── AgentProgressGrid           # Real-time agent status
  │   ├── AgentCard (x12)         # Individual agent progress
  │   └── DebateVisualizer        # Debate flow diagram
  ├── ReportSections              # Generated reports
  │   ├── AnalystReports
  │   │   ├── MarketReportCard
  │   │   ├── SocialReportCard
  │   │   ├── NewsReportCard
  │   │   └── FundamentalsReportCard
  │   ├── ResearchDebateView      # Bull/Bear debate
  │   ├── TraderPlanView          # Trading plan
  │   ├── RiskDebateView          # Risk assessment debate
  │   └── FinalDecisionCard       # Final BUY/SELL/HOLD
  └── ToolCallsTimeline           # Real-time tool execution log
```

#### B. State Management (Zustand)

```typescript
// stores/analysisStore.ts
interface AnalysisState {
  // Configuration
  config: TradingConfig;
  updateConfig: (config: Partial<TradingConfig>) => void;
  
  // Execution state
  status: 'idle' | 'running' | 'completed' | 'error';
  currentAgent: string | null;
  progress: number;
  
  // Agent states
  agentStatuses: Record<AgentType, AgentStatus>;
  updateAgentStatus: (agent: AgentType, status: AgentStatus) => void;
  
  // Reports
  reports: {
    market?: string;
    social?: string;
    news?: string;
    fundamentals?: string;
  };
  addReport: (type: ReportType, content: string) => void;
  
  // Debates
  investmentDebate: InvestDebateState;
  riskDebate: RiskDebateState;
  updateDebate: (type: DebateType, state: any) => void;
  
  // Results
  finalDecision: string | null;
  tradingSignal: 'BUY' | 'SELL' | 'HOLD' | null;
  
  // Actions
  startAnalysis: (ticker: string, date: string) => Promise<void>;
  stopAnalysis: () => void;
  resetAnalysis: () => void;
}

// stores/historyStore.ts
interface HistoryState {
  results: AnalysisResult[];
  fetchHistory: (userId: string) => Promise<void>;
  getResult: (id: string) => AnalysisResult | undefined;
  compareResults: (ids: string[]) => ComparisonData;
}

// stores/configStore.ts
interface ConfigState {
  llmConfig: LLMConfig;
  dataVendors: VendorConfig;
  debateRounds: DebateConfig;
  updateLLMConfig: (config: Partial<LLMConfig>) => void;
  updateVendors: (vendors: Partial<VendorConfig>) => void;
  saveConfig: () => Promise<void>;
}

// stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  notifications: Notification[];
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
}
```

#### C. Real-time Communication

```typescript
// lib/socket/useAnalysisSocket.ts
export function useAnalysisSocket(analysisId: string) {
  const socket = useSocket();
  const { updateAgentStatus, addReport, updateDebate } = useAnalysisStore();
  
  useEffect(() => {
    // Agent status updates
    socket.on('agent:status', (data) => {
      updateAgentStatus(data.agent, data.status);
    });
    
    // Tool call events
    socket.on('tool:call', (data) => {
      // Log tool execution
    });
    
    // Report generation
    socket.on('report:generated', (data) => {
      addReport(data.type, data.content);
    });
    
    // Debate updates
    socket.on('debate:update', (data) => {
      updateDebate(data.type, data.state);
    });
    
    // Final decision
    socket.on('analysis:complete', (data) => {
      // Handle completion
    });
    
    return () => {
      socket.off('agent:status');
      socket.off('tool:call');
      socket.off('report:generated');
      socket.off('debate:update');
      socket.off('analysis:complete');
    };
  }, [analysisId]);
  
  return socket;
}
```

#### D. API Client Layer

```typescript
// lib/api/analysis.api.ts
export const analysisAPI = {
  start: async (params: AnalysisParams) => {
    return axios.post<AnalysisResponse>('/api/analysis/start', params);
  },
  
  getStatus: async (id: string) => {
    return axios.get<AnalysisStatus>(`/api/analysis/${id}/status`);
  },
  
  stop: async (id: string) => {
    return axios.post(`/api/analysis/${id}/stop`);
  },
  
  getResult: async (id: string) => {
    return axios.get<AnalysisResult>(`/api/analysis/${id}/result`);
  },
  
  getHistory: async (filters?: HistoryFilters) => {
    return axios.get<AnalysisResult[]>('/api/analysis/history', { params: filters });
  }
};

// lib/api/config.api.ts
export const configAPI = {
  get: async () => {
    return axios.get<UserConfig>('/api/config');
  },
  
  update: async (config: Partial<UserConfig>) => {
    return axios.put<UserConfig>('/api/config', config);
  },
  
  testLLM: async (config: LLMConfig) => {
    return axios.post('/api/config/test-llm', config);
  },
  
  testDataVendor: async (vendor: string) => {
    return axios.post('/api/config/test-vendor', { vendor });
  }
};
```

### 2. Backend Architecture (Node.js/Express)

#### A. Core Graph Engine (LangGraph.js Port)

```typescript
// graph/trading-graph.ts
export class TradingAgentsGraph {
  private deepThinkingLLM: ChatOpenAI;
  private quickThinkingLLM: ChatOpenAI;
  private config: TradingConfig;
  private io: Server; // Socket.io
  private memories: AgentMemories;
  
  constructor(config: TradingConfig, io: Server) {
    this.config = config;
    this.io = io;
    this.initializeLLMs();
    this.initializeMemories();
  }
  
  async propagate(
    ticker: string,
    date: string,
    socketRoomId: string
  ): Promise<{ state: AgentState; decision: string }> {
    // Initialize state
    const state = this.createInitialState(ticker, date);
    
    // Execute graph with real-time updates
    const graph = this.setupGraph();
    
    for await (const chunk of graph.stream(state)) {
      // Emit updates via socket
      this.emitProgress(socketRoomId, chunk);
    }
    
    return { state: finalState, decision: this.processSignal(finalState) };
  }
  
  private emitProgress(roomId: string, update: any) {
    this.io.to(roomId).emit('agent:status', {
      agent: update.agent,
      status: update.status
    });
    
    if (update.toolCall) {
      this.io.to(roomId).emit('tool:call', update.toolCall);
    }
    
    if (update.report) {
      this.io.to(roomId).emit('report:generated', update.report);
    }
  }
  
  private setupGraph(): StateGraph {
    const workflow = new StateGraph(AgentState);
    
    // Add analyst nodes
    this.config.selectedAnalysts.forEach(analyst => {
      workflow.addNode(analyst, this.createAnalystNode(analyst));
      workflow.addNode(`tools_${analyst}`, this.createToolNode(analyst));
      workflow.addNode(`clear_${analyst}`, this.createClearNode(analyst));
    });
    
    // Add researcher nodes
    workflow.addNode('bull', this.createBullNode());
    workflow.addNode('bear', this.createBearNode());
    workflow.addNode('research_manager', this.createResearchManagerNode());
    
    // Add trader node
    workflow.addNode('trader', this.createTraderNode());
    
    // Add risk nodes
    workflow.addNode('risky', this.createRiskyNode());
    workflow.addNode('neutral', this.createNeutralNode());
    workflow.addNode('safe', this.createSafeNode());
    workflow.addNode('risk_manager', this.createRiskManagerNode());
    
    // Define edges (same logic as Python version)
    this.defineGraphEdges(workflow);
    
    return workflow.compile();
  }
}
```

#### B. Agent Implementations

```typescript
// agents/analysts/market.ts
export class MarketAnalyst extends BaseAgent {
  async analyze(state: AgentState): Promise<AnalystResult> {
    const tools = [getStockData, getIndicators];
    
    const prompt = this.buildPrompt(state, MARKET_ANALYST_SYSTEM_PROMPT);
    
    const llm = this.quickThinkingLLM.bindTools(tools);
    const result = await llm.invoke(prompt);
    
    // Handle tool calls
    if (result.toolCalls?.length > 0) {
      const toolResults = await this.executeTools(result.toolCalls);
      // Continue with tool results
    }
    
    return {
      report: result.content,
      indicators: this.extractIndicators(result),
      confidence: this.calculateConfidence(result)
    };
  }
}

// agents/researchers/bull.ts
export class BullResearcher extends BaseAgent {
  async research(state: AgentState): Promise<string> {
    const { investmentDebateState, reports } = state;
    
    // Query memory for similar situations
    const pastMemories = await this.memory.getMemories(
      this.buildSituation(reports),
      2
    );
    
    const prompt = this.buildBullPrompt(
      reports,
      investmentDebateState.bearHistory,
      pastMemories
    );
    
    const response = await this.quickThinkingLLM.invoke(prompt);
    
    return `Bull Analyst: ${response.content}`;
  }
}

// agents/trader/trader.ts
export class TraderAgent extends BaseAgent {
  async decideTrade(state: AgentState): Promise<string> {
    const { investmentPlan, reports } = state;
    
    const pastMemories = await this.memory.getMemories(
      this.buildSituation(reports),
      2
    );
    
    const prompt = this.buildTraderPrompt(
      investmentPlan,
      pastMemories
    );
    
    const response = await this.quickThinkingLLM.invoke(prompt);
    
    return response.content;
  }
}
```

#### C. Data Flow System

```typescript
// dataflows/interface.ts
export class DataFlowRouter {
  private vendors: Map<string, DataVendor>;
  private cache: RedisCache;
  
  constructor(config: VendorConfig) {
    this.initializeVendors(config);
  }
  
  async routeToVendor(
    method: string,
    ...args: any[]
  ): Promise<any> {
    const category = this.getCategoryForMethod(method);
    const vendorConfig = this.getVendor(category, method);
    
    const primaryVendors = vendorConfig.split(',');
    const fallbackVendors = this.getAllVendors(method);
    
    for (const vendor of [...primaryVendors, ...fallbackVendors]) {
      try {
        const vendorImpl = this.vendors.get(vendor);
        if (!vendorImpl) continue;
        
        // Check cache first
        const cacheKey = this.buildCacheKey(method, args);
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;
        
        // Execute vendor method
        const result = await vendorImpl[method](...args);
        
        // Cache result
        await this.cache.set(cacheKey, result, 3600);
        
        return result;
      } catch (error) {
        if (this.isRateLimitError(error)) {
          console.log(`Rate limit hit for ${vendor}, falling back...`);
          continue;
        }
        throw error;
      }
    }
    
    throw new Error(`All vendors failed for method ${method}`);
  }
}

// dataflows/vendors/alpha-vantage.ts
export class AlphaVantageVendor implements DataVendor {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  
  async getStock(symbol: string, start: string, end: string): Promise<string> {
    await this.rateLimiter.wait();
    
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: this.apiKey,
        outputsize: 'full'
      }
    });
    
    return this.formatStockData(response.data, start, end);
  }
  
  async getIndicator(
    symbol: string,
    indicator: string,
    date: string,
    lookback: number
  ): Promise<string> {
    // Implementation
  }
  
  async getFundamentals(symbol: string): Promise<string> {
    // Implementation
  }
  
  async getNews(query: string, start: string, end: string): Promise<string> {
    // Implementation
  }
}
```

#### D. Memory System (ChromaDB)

```typescript
// memory/financial-memory.ts
export class FinancialSituationMemory {
  private chromaClient: ChromaClient;
  private collection: Collection;
  private openai: OpenAI;
  private embeddingModel: string;
  
  constructor(name: string, config: MemoryConfig) {
    this.chromaClient = new ChromaClient({
      path: config.chromaUrl
    });
    this.openai = new OpenAI({ apiKey: config.openaiKey });
    this.embeddingModel = config.embeddingModel;
    this.initializeCollection(name);
  }
  
  async addSituations(
    situationsAndAdvice: Array<[string, string]>
  ): Promise<void> {
    const situations: string[] = [];
    const advice: string[] = [];
    const ids: string[] = [];
    const embeddings: number[][] = [];
    
    const offset = await this.collection.count();
    
    for (let i = 0; i < situationsAndAdvice.length; i++) {
      const [situation, recommendation] = situationsAndAdvice[i];
      situations.push(situation);
      advice.push(recommendation);
      ids.push(String(offset + i));
      embeddings.push(await this.getEmbedding(situation));
    }
    
    await this.collection.add({
      documents: situations,
      metadatas: advice.map(rec => ({ recommendation: rec })),
      embeddings,
      ids
    });
  }
  
  async getMemories(
    currentSituation: string,
    nMatches: number = 1
  ): Promise<MemoryMatch[]> {
    const queryEmbedding = await this.getEmbedding(currentSituation);
    
    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nMatches,
      include: ['metadatas', 'documents', 'distances']
    });
    
    return results.documents[0].map((doc, i) => ({
      matchedSituation: doc,
      recommendation: results.metadatas[0][i].recommendation,
      similarityScore: 1 - results.distances[0][i]
    }));
  }
  
  private async getEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text
    });
    return response.data[0].embedding;
  }
}

// memory/reflection.ts
export class Reflector {
  async reflectBullResearcher(
    state: AgentState,
    returnsLosses: number,
    memory: FinancialSituationMemory
  ): Promise<void> {
    const situation = this.extractCurrentSituation(state);
    const bullHistory = state.investmentDebateState.bullHistory;
    
    const reflection = await this.generateReflection(
      'BULL',
      bullHistory,
      situation,
      returnsLosses
    );
    
    await memory.addSituations([[situation, reflection]]);
  }
  
  private async generateReflection(
    componentType: string,
    report: string,
    situation: string,
    returnsLosses: number
  ): Promise<string> {
    const prompt = this.buildReflectionPrompt(
      componentType,
      report,
      situation,
      returnsLosses
    );
    
    const response = await this.quickThinkingLLM.invoke(prompt);
    return response.content;
  }
}
```

#### E. Job Queue System (BullMQ)

```typescript
// queue/analysis.queue.ts
export class AnalysisQueue {
  private queue: Queue;
  private worker: Worker;
  private io: Server;
  
  constructor(io: Server) {
    this.io = io;
    this.queue = new Queue('analysis', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    
    this.setupWorker();
  }
  
  async addAnalysisJob(params: AnalysisJobParams): Promise<string> {
    const job = await this.queue.add('analyze', params, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
    
    return job.id;
  }
  
  private setupWorker() {
    this.worker = new Worker(
      'analysis',
      async (job) => {
        const { ticker, date, config, userId, socketRoomId } = job.data;
        
        // Create graph instance
        const graph = new TradingAgentsGraph(config, this.io);
        
        // Execute analysis
        const result = await graph.propagate(ticker, date, socketRoomId);
        
        // Save result to database
        await this.saveResult(userId, result);
        
        // Emit completion event
        this.io.to(socketRoomId).emit('analysis:complete', result);
        
        return result;
      },
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT || '6379')
        }
      }
    );
    
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });
    
    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
      if (job?.data.socketRoomId) {
        this.io.to(job.data.socketRoomId).emit('analysis:error', {
          message: err.message
        });
      }
    });
  }
}
```

#### F. API Routes

```typescript
// routes/analysis.routes.ts
export const analysisRouter = Router();

analysisRouter.post('/start', authenticateUser, async (req, res) => {
  try {
    const { ticker, date, config } = req.body;
    const userId = req.user.id;
    const socketRoomId = generateRoomId();
    
    // Validate inputs
    const validated = analysisSchema.parse({ ticker, date, config });
    
    // Add to queue
    const jobId = await analysisQueue.addAnalysisJob({
      ticker: validated.ticker,
      date: validated.date,
      config: validated.config,
      userId,
      socketRoomId
    });
    
    res.json({
      jobId,
      socketRoomId,
      status: 'queued'
    });
  } catch (error) {
    handleError(error, res);
  }
});

analysisRouter.get('/:id/status', authenticateUser, async (req, res) => {
  const { id } = req.params;
  const job = await analysisQueue.getJob(id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const state = await job.getState();
  const progress = job.progress;
  
  res.json({ state, progress });
});

analysisRouter.get('/history', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const { limit = 50, offset = 0, ticker } = req.query;
  
  const results = await prisma.analysisResult.findMany({
    where: {
      userId,
      ...(ticker && { ticker: ticker as string })
    },
    take: Number(limit),
    skip: Number(offset),
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(results);
});

// routes/config.routes.ts
export const configRouter = Router();

configRouter.get('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const config = await prisma.userConfig.findUnique({
    where: { userId }
  });
  
  res.json(config || DEFAULT_CONFIG);
});

configRouter.put('/', authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const updates = configSchema.parse(req.body);
  
  const config = await prisma.userConfig.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates }
  });
  
  res.json(config);
});

configRouter.post('/test-llm', authenticateUser, async (req, res) => {
  const { provider, model, apiKey } = req.body;
  
  try {
    const llm = new ChatOpenAI({
      modelName: model,
      openAIApiKey: apiKey,
      ...(provider !== 'openai' && { configuration: { baseURL: getBaseURL(provider) } })
    });
    
    const response = await llm.invoke('Test message');
    res.json({ success: true, response: response.content });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});
```

#### G. WebSocket Handlers

```typescript
// websocket/analysis.socket.ts
export function setupAnalysisSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join analysis room
    socket.on('join-analysis', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    
    // Leave analysis room
    socket.on('leave-analysis', (roomId: string) => {
      socket.leave(roomId);
    });
    
    // Request current status
    socket.on('request-status', async (jobId: string) => {
      const job = await analysisQueue.getJob(jobId);
      if (job) {
        const state = await job.getState();
        const progress = job.progress;
        socket.emit('status-update', { state, progress });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
```

### 3. Key UI Components

#### A. Trading Analysis Dashboard

```typescript
// components/analysis/TradingAnalysisPage.tsx
export function TradingAnalysisPage() {
  const {
    config,
    status,
    agentStatuses,
    reports,
    finalDecision,
    startAnalysis
  } = useAnalysisStore();
  
  const [ticker, setTicker] = useState('');
  const [date, setDate] = useState('');
  
  const socket = useAnalysisSocket(config.socketRoomId);
  
  const handleStart = async () => {
    await startAnalysis(ticker, date);
  };
  
  return (
    <div className="container mx-auto p-6">
      <ConfigurationPanel
        ticker={ticker}
        date={date}
        onTickerChange={setTicker}
        onDateChange={setDate}
        config={config}
      />
      
      <AnalysisControlBar
        status={status}
        onStart={handleStart}
        onStop={() => {}}
      />
      
      {status !== 'idle' && (
        <>
          <AgentProgressGrid agentStatuses={agentStatuses} />
          
          <ReportSections reports={reports} />
          
          {finalDecision && (
            <FinalDecisionCard decision={finalDecision} />
          )}
        </>
      )}
    </div>
  );
}
```

#### B. Agent Progress Visualization

```typescript
// components/analysis/AgentProgressGrid.tsx
export function AgentProgressGrid({ agentStatuses }: Props) {
  const agents = [
    { name: 'Market Analyst', type: 'analyst', icon: TrendingUp },
    { name: 'Social Analyst', type: 'analyst', icon: MessageSquare },
    { name: 'News Analyst', type: 'analyst', icon: Newspaper },
    { name: 'Fundamentals Analyst', type: 'analyst', icon: FileText },
    { name: 'Bull Researcher', type: 'researcher', icon: TrendingUp },
    { name: 'Bear Researcher', type: 'researcher', icon: TrendingDown },
    { name: 'Research Manager', type: 'manager', icon: Users },
    { name: 'Trader', type: 'trader', icon: DollarSign },
    { name: 'Risky Analyst', type: 'risk', icon: Zap },
    { name: 'Neutral Analyst', type: 'risk', icon: Minus },
    { name: 'Safe Analyst', type: 'risk', icon: Shield },
    { name: 'Risk Manager', type: 'manager', icon: AlertTriangle },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map(agent => (
        <AgentCard
          key={agent.name}
          name={agent.name}
          type={agent.type}
          icon={agent.icon}
          status={agentStatuses[agent.name]}
        />
      ))}
    </div>
  );
}

// components/analysis/AgentCard.tsx
export function AgentCard({ name, type, icon: Icon, status }: Props) {
  const statusConfig = {
    pending: { color: 'gray', icon: Clock },
    running: { color: 'blue', icon: Loader },
    completed: { color: 'green', icon: CheckCircle },
    error: { color: 'red', icon: XCircle }
  };
  
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  
  return (
    <Card className={cn('relative overflow-hidden', status === 'running' && 'animate-pulse')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <CardTitle className="text-sm font-medium">{name}</CardTitle>
        </div>
        <StatusIcon className={cn('h-5 w-5', `text-${config.color}-500`)} />
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        {status === 'running' && (
          <Progress value={undefined} className="mt-2" />
        )}
      </CardContent>
    </Card>
  );
}
```

#### C. Debate Visualization

```typescript
// components/debate/DebateView.tsx
export function DebateView({ debate, type }: Props) {
  const { history, bullHistory, bearHistory, judgeDecision } = debate;
  
  const messages = parseDebateHistory(history);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === 'investment' ? 'Investment Debate' : 'Risk Assessment Debate'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {messages.map((message, i) => (
              <DebateMessage
                key={i}
                speaker={message.speaker}
                content={message.content}
                side={message.side}
              />
            ))}
            
            {judgeDecision && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Manager's Decision</h4>
                <Markdown>{judgeDecision}</Markdown>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// components/debate/DebateMessage.tsx
export function DebateMessage({ speaker, content, side }: Props) {
  const sideColors = {
    bull: 'bg-green-100 dark:bg-green-900/20',
    bear: 'bg-red-100 dark:bg-red-900/20',
    risky: 'bg-orange-100 dark:bg-orange-900/20',
    neutral: 'bg-gray-100 dark:bg-gray-900/20',
    safe: 'bg-blue-100 dark:bg-blue-900/20',
  };
  
  return (
    <div className={cn('p-4 rounded-lg', sideColors[side])}>
      <div className="flex items-center space-x-2 mb-2">
        <Badge variant={side === 'bull' || side === 'risky' ? 'default' : 'secondary'}>
          {speaker}
        </Badge>
      </div>
      <Markdown className="prose dark:prose-invert max-w-none">
        {content}
      </Markdown>
    </div>
  );
}
```

#### D. Report Display Components

```typescript
// components/reports/ReportCard.tsx
export function ReportCard({ title, content, type, icon: Icon }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <Markdown className="prose dark:prose-invert max-w-none">
            {content}
          </Markdown>
        </CardContent>
      )}
    </Card>
  );
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Set up monorepo structure with Turborepo
2. Initialize Next.js frontend and Express backend
3. Configure TypeScript, ESLint, Prettier
4. Set up PostgreSQL + Prisma schema
5. Create basic authentication with NextAuth
6. Set up Redis for caching and job queue

### Phase 2: Backend Core (Week 3-4)
7. Port LangGraph state machine to Node.js
8. Implement base agent classes
9. Port all analyst agents (Market, Social, News, Fundamentals)
10. Implement data flow router and vendor abstractions
11. Integrate Alpha Vantage and alternative APIs
12. Set up ChromaDB connection and memory system

### Phase 3: Advanced Agents (Week 5-6)
13. Port researcher agents (Bull, Bear, Research Manager)
14. Port trader agent
15. Port risk management team (Risky, Neutral, Safe, Risk Manager)
16. Implement debate mechanisms
17. Build reflection and learning system
18. Create job queue with BullMQ

### Phase 4: Real-time & API (Week 7-8)
19. Implement Socket.io for real-time updates
20. Create all API routes
21. Build WebSocket event handlers
22. Implement comprehensive error handling
23. Add rate limiting and security middleware
24. Create API documentation with Swagger

### Phase 5: Frontend UI (Week 9-10)
25. Build main dashboard layout
26. Create configuration panel components
27. Implement agent progress grid
28. Build debate visualization components
29. Create report display components
30. Implement real-time updates with Socket.io client

### Phase 6: Advanced Features (Week 11-12)
31. Build history browsing interface
32. Implement result comparison tools
33. Create settings/configuration UI
34. Add data visualization (charts, indicators)
35. Implement export functionality (JSON, PDF)
36. Build notification system

### Phase 7: Polish & Testing (Week 13-14)
37. Write comprehensive unit tests
38. Create integration tests
39. Build E2E test suite with Playwright
40. Performance optimization
41. Accessibility improvements
42. Mobile responsiveness

### Phase 8: Deployment (Week 15-16)
43. Set up Docker containers
44. Configure CI/CD pipeline
45. Deploy to staging environment
46. Load testing and optimization
47. Production deployment
48. Documentation and user guides

## Git Strategy

### Branch Structure
```
main                          # Production-ready code
├── develop                   # Development branch
│   ├── feature/backend-core
│   ├── feature/agents
│   ├── feature/frontend-ui
│   ├── feature/real-time
│   └── feature/testing
└── react-conversion         # Main conversion branch (merges from develop)
```

### Commit Convention
```
feat: Add market analyst agent implementation
fix: Resolve rate limit handling in Alpha Vantage vendor
refactor: Improve debate state management
docs: Add API documentation for analysis endpoints
test: Add unit tests for memory system
chore: Update dependencies
```

## Testing Strategy

### Unit Tests
- Agent logic (Vitest)
- Data flow routing (Vitest)
- Memory operations (Vitest)
- State management (Vitest)
- Utility functions (Vitest)

### Integration Tests
- API endpoints (Supertest)
- Database operations (Prisma + PostgreSQL test DB)
- WebSocket connections (Socket.io test client)
- LLM integration (mocked)
- Vendor integrations (mocked)

### E2E Tests
- Complete analysis flow (Playwright)
- User authentication (Playwright)
- Configuration changes (Playwright)
- History browsing (Playwright)
- Real-time updates (Playwright)

### Performance Tests
- Load testing with Artillery
- Memory leak detection
- Database query optimization
- WebSocket scalability

## Success Criteria

### Functional Requirements
✅ All Python functionality ported to React/Node.js
✅ Real-time updates working correctly
✅ All agents producing equivalent or better results
✅ Memory and reflection system functioning
✅ Multi-vendor data routing with fallback
✅ User authentication and authorization
✅ History and results storage
✅ Configuration management
✅ Export functionality

### Performance Requirements
✅ Analysis completion time ≤ Python version
✅ UI response time < 100ms
✅ WebSocket message latency < 50ms
✅ Support 100+ concurrent analyses
✅ 99.9% uptime

### Quality Requirements
✅ >80% test coverage
✅ Zero critical security vulnerabilities
✅ Lighthouse score >90
✅ Accessibility (WCAG 2.1 Level AA)
✅ Mobile responsive
✅ Cross-browser compatible (Chrome, Firefox, Safari, Edge)

## Risk Mitigation

### Technical Risks
1. **LangGraph.js Limitations**: Mitigate by custom implementation if needed
2. **API Rate Limits**: Implement robust caching and fallback mechanisms
3. **LLM Response Variations**: Add retry logic and validation
4. **Real-time Scalability**: Use Redis pub/sub for horizontal scaling
5. **Memory System Performance**: Optimize ChromaDB queries, add caching

### Timeline Risks
1. **Underestimated Complexity**: Build MVP first, iterate
2. **Third-party Dependencies**: Have backup vendors ready
3. **Testing Delays**: Parallel development and testing

## Next Steps

1. Review and approve this plan
2. Set up project repository and branching strategy
3. Initialize development environment
4. Begin Phase 1: Foundation

---

**Estimated Total Duration**: 16 weeks (4 months)
**Team Size**: 2-3 developers + 1 QA engineer
**Budget Considerations**: API costs (OpenAI, Alpha Vantage), infrastructure (Vercel, Railway, Redis)

This plan ensures a production-ready, scalable, and maintainable React.js version of TradingAgents that matches or exceeds the original Python implementation's capabilities.
