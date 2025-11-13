import { StateGraph, END } from '@langchain/langgraph';
import { AgentState } from '@tradingagents/types';
import { MarketAnalystAgent } from '../agents/market-analyst.agent';
import { NewsAnalystAgent } from '../agents/news-analyst.agent';
import { FundamentalsAnalystAgent } from '../agents/fundamentals-analyst.agent';
import { BullResearcherAgent } from '../agents/bull-researcher.agent';
import { BearResearcherAgent } from '../agents/bear-researcher.agent';
import { TraderAgent } from '../agents/trader.agent';
import { logger } from '../utils/logger';

export class TradingGraph {
  private graph: StateGraph<AgentState>;
  private marketAnalyst: MarketAnalystAgent;
  private newsAnalyst: NewsAnalystAgent;
  private fundamentalsAnalyst: FundamentalsAnalystAgent;
  private bullResearcher: BullResearcherAgent;
  private bearResearcher: BearResearcherAgent;
  private trader: TraderAgent;

  constructor() {
    // Initialize agents
    this.marketAnalyst = new MarketAnalystAgent();
    this.newsAnalyst = new NewsAnalystAgent();
    this.fundamentalsAnalyst = new FundamentalsAnalystAgent();
    this.bullResearcher = new BullResearcherAgent();
    this.bearResearcher = new BearResearcherAgent();
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
    // Analyst Nodes
    this.graph.addNode('market_analyst', async (state: AgentState) => {
      logger.info('📊 Executing Market Analyst Node');
      return await this.marketAnalyst.execute(state);
    });

    this.graph.addNode('news_analyst', async (state: AgentState) => {
      logger.info('� Executing News Analyst Node');
      return await this.newsAnalyst.execute(state);
    });

    this.graph.addNode('fundamentals_analyst', async (state: AgentState) => {
      logger.info('💼 Executing Fundamentals Analyst Node');
      return await this.fundamentalsAnalyst.execute(state);
    });

    // Researcher Nodes
    this.graph.addNode('bull_researcher', async (state: AgentState) => {
      logger.info('🐂 Executing Bull Researcher Node');
      return await this.bullResearcher.execute(state);
    });

    this.graph.addNode('bear_researcher', async (state: AgentState) => {
      logger.info('🐻 Executing Bear Researcher Node');
      return await this.bearResearcher.execute(state);
    });

    // Debate Node (simplified for now)
    this.graph.addNode('invest_debate', async (state: AgentState) => {
      logger.info('⚖️ Investment Debate Node');
      // Simple voting mechanism - more sophisticated debate to be implemented
      return {
        ...state,
        investDebate: {
          decision: 'proceed',
          summary: 'Debate concluded, proceeding to trading decision',
          timestamp: new Date().toISOString(),
        },
      };
    });

    // Trader Node
    this.graph.addNode('trader', async (state: AgentState) => {
      logger.info('💰 Executing Trader Node');
      return await this.trader.execute(state);
    });

    // Final Decision Node (simplified)
    this.graph.addNode('final_decision', async (state: AgentState) => {
      logger.info('🎯 Final Decision Node');
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
    // Set entry point
    this.graph.addEdge('__start__', 'market_analyst');

    // Analysis phase: run analysts sequentially
    this.graph.addEdge('market_analyst', 'news_analyst');
    this.graph.addEdge('news_analyst', 'fundamentals_analyst');

    // Research phase: bull and bear researchers
    this.graph.addEdge('fundamentals_analyst', 'bull_researcher');
    this.graph.addEdge('bull_researcher', 'bear_researcher');

    // Investment debate
    this.graph.addEdge('bear_researcher', 'invest_debate');

    // Proceed to trader
    this.graph.addEdge('invest_debate', 'trader');

    // Trader to final decision
    this.graph.addEdge('trader', 'final_decision');

    // Final decision to end
    this.graph.addEdge('final_decision', '__end__');
  }

  async compile() {
    return this.graph.compile();
  }

  async execute(initialState: Partial<AgentState>): Promise<AgentState> {
    try {
      logger.info(`🚀 Starting trading graph execution for ${initialState.ticker}`);

      const app = await this.compile();

      const finalState = await app.invoke({
        ticker: initialState.ticker || '',
        date: initialState.date || new Date().toISOString().split('T')[0],
        context: initialState.context || '',
        messages: [],
        errors: [],
      });

      logger.info(`✅ Trading graph execution completed for ${initialState.ticker}`);
      return finalState;
    } catch (error: any) {
      logger.error(`❌ Trading graph execution failed: ${error.message}`);
      throw error;
    }
  }
}
