import { StateGraph, END } from '@langchain/langgraph';
import { AgentState } from '@tradingagents/types';
import { MarketAnalystAgent } from '../agents/market-analyst.agent';
import { logger } from '../utils/logger';

export class TradingGraph {
  private graph: StateGraph<AgentState>;
  private marketAnalyst: MarketAnalystAgent;

  constructor() {
    // Initialize agents
    this.marketAnalyst = new MarketAnalystAgent();

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
      logger.info('📊 Executing Market Analyst Node');
      return await this.marketAnalyst.execute(state);
    });

    // Placeholder nodes for other agents (to be implemented)
    this.graph.addNode('social_analyst', async (state: AgentState) => {
      logger.info('📱 Social Analyst Node (placeholder)');
      return state;
    });

    this.graph.addNode('news_analyst', async (state: AgentState) => {
      logger.info('📰 News Analyst Node (placeholder)');
      return state;
    });

    this.graph.addNode('fundamentals_analyst', async (state: AgentState) => {
      logger.info('💼 Fundamentals Analyst Node (placeholder)');
      return state;
    });

    this.graph.addNode('bull_researcher', async (state: AgentState) => {
      logger.info('🐂 Bull Researcher Node (placeholder)');
      return state;
    });

    this.graph.addNode('bear_researcher', async (state: AgentState) => {
      logger.info('🐻 Bear Researcher Node (placeholder)');
      return state;
    });

    this.graph.addNode('invest_debate', async (state: AgentState) => {
      logger.info('⚖️ Investment Debate Node (placeholder)');
      return state;
    });

    this.graph.addNode('trader', async (state: AgentState) => {
      logger.info('💰 Trader Node (placeholder)');
      return state;
    });

    this.graph.addNode('risk_debate', async (state: AgentState) => {
      logger.info('🎯 Risk Debate Node (placeholder)');
      return state;
    });

    this.graph.addNode('reflection', async (state: AgentState) => {
      logger.info('🔄 Reflection Node (placeholder)');
      return state;
    });
  }

  private setupEdges(): void {
    // Set entry point
    this.graph.setEntryPoint('market_analyst');

    // Analysis phase: analysts run in parallel (for now, sequential)
    this.graph.addEdge('market_analyst', 'social_analyst');
    this.graph.addEdge('social_analyst', 'news_analyst');
    this.graph.addEdge('news_analyst', 'fundamentals_analyst');

    // Research phase: bull and bear researchers
    this.graph.addEdge('fundamentals_analyst', 'bull_researcher');
    this.graph.addEdge('bull_researcher', 'bear_researcher');

    // Investment debate
    this.graph.addEdge('bear_researcher', 'invest_debate');

    // Conditional: should we proceed to trading?
    this.graph.addConditionalEdges(
      'invest_debate',
      (state: AgentState) => {
        // If debate decided not to invest, end early
        if (state.investDebate?.decision === 'no_invest') {
          return 'end';
        }
        return 'trader';
      },
      {
        trader: 'trader',
        end: END,
      }
    );

    // Trader makes decision
    this.graph.addEdge('trader', 'risk_debate');

    // Risk debate
    this.graph.addEdge('risk_debate', 'reflection');

    // Reflection and end
    this.graph.addEdge('reflection', END);
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
