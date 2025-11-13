import { StateGraph } from '@langchain/langgraph';
import { AgentState } from '@tradingagents/types';
import { MarketAnalystAgent } from '../agents/market-analyst.agent';
import { FundamentalsAnalystAgent } from '../agents/fundamentals-analyst.agent';
import { TraderAgent } from '../agents/trader.agent';
import { logger } from '../utils/logger';

/**
 * Fast Trading Graph - Optimized for serverless deployment
 * Runs only 3 essential agents instead of 6 for faster execution:
 * 1. Market Analyst (technical analysis)
 * 2. Fundamentals Analyst (company fundamentals)
 * 3. Trader (final decision)
 * 
 * Expected execution time: 20-40 seconds (vs 60-180 for full graph)
 */
export class FastTradingGraph {
  private graph: StateGraph<AgentState>;
  private marketAnalyst: MarketAnalystAgent;
  private fundamentalsAnalyst: FundamentalsAnalystAgent;
  private trader: TraderAgent;

  constructor() {
    logger.info('[FastGraph] Initializing Fast Trading Graph (3 agents)');
    
    // Initialize only essential agents
    this.marketAnalyst = new MarketAnalystAgent();
    this.fundamentalsAnalyst = new FundamentalsAnalystAgent();
    this.trader = new TraderAgent();

    // Create state graph
    this.graph = new StateGraph<AgentState>({
      channels: {
        ticker: null,
        date: null,
        context: null,
        messages: null,
        marketAnalysis: null,
        socialAnalysis: null,
        newsAnalysis: null,
        fundamentalAnalysis: null,
        bullCase: null,
        bearCase: null,
        investDebate: null,
        traderDecision: null,
        riskDebate: null,
        finalDecision: null,
        reflection: null,
        errors: null,
      },
    });

    this.setupNodes();
    this.setupEdges();
  }

  private setupNodes(): void {
    // Market Analyst Node
    this.graph.addNode('market_analyst', async (state: AgentState) => {
      logger.info('[FastGraph] 📊 Executing Market Analyst');
      return await this.marketAnalyst.execute(state);
    });

    // Fundamentals Analyst Node
    this.graph.addNode('fundamentals_analyst', async (state: AgentState) => {
      logger.info('[FastGraph] 💼 Executing Fundamentals Analyst');
      return await this.fundamentalsAnalyst.execute(state);
    });

    // Trader Node
    this.graph.addNode('trader', async (state: AgentState) => {
      logger.info('[FastGraph] 💰 Executing Trader');
      return await this.trader.execute(state);
    });

    // Final Decision Node
    this.graph.addNode('final_decision', async (state: AgentState) => {
      logger.info('[FastGraph] 🎯 Final Decision');
      return {
        ...state,
        finalDecision: {
          decision: state.traderDecision?.decision || 'hold',
          reasoning: state.traderDecision?.reasoning || '',
          timestamp: new Date().toISOString(),
        },
      };
    });
  }

  private setupEdges(): void {
    // Linear flow: market -> fundamentals -> trader -> final
    this.graph.addEdge('__start__', 'market_analyst');
    this.graph.addEdge('market_analyst', 'fundamentals_analyst');
    this.graph.addEdge('fundamentals_analyst', 'trader');
    this.graph.addEdge('trader', 'final_decision');
    this.graph.addEdge('final_decision', '__end__');
  }

  async compile() {
    return this.graph.compile();
  }

  async execute(initialState: Partial<AgentState>): Promise<AgentState> {
    try {
      logger.info(`[FastGraph] 🚀 Starting fast analysis for ${initialState.ticker}`);

      const app = await this.compile();

      const finalState = await app.invoke({
        ticker: initialState.ticker || '',
        date: initialState.date || new Date().toISOString().split('T')[0],
        context: initialState.context || '',
        messages: [],
        errors: [],
      });

      logger.info(`[FastGraph] ✅ Fast analysis completed for ${initialState.ticker}`);
      return finalState;
    } catch (error: any) {
      logger.error(`[FastGraph] ❌ Fast analysis failed: ${error.message}`);
      throw error;
    }
  }
}
