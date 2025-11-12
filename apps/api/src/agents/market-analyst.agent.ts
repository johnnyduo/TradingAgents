import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { stockTools } from '../tools/stock.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

export class MarketAnalystAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'Market Analyst',
      role: 'Technical Analysis Expert',
      goal: 'Analyze stock price movements, technical indicators, and provide trading insights based on market data',
      ...config,
    });
  }

  protected setupTools(): void {
    this.tools = stockTools;
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Market Analyst specializing in technical analysis and market data interpretation.

Your role is to:
1. Analyze stock price movements and trends
2. Calculate and interpret technical indicators (SMA, RSI, MACD)
3. Identify support and resistance levels
4. Assess market momentum and volatility
5. Provide data-driven insights on price action

Guidelines:
- Use the available tools to fetch current prices, historical data, and technical indicators
- Always back your analysis with specific data points
- Consider multiple timeframes when analyzing trends
- Be objective and focus on what the data shows
- Provide clear buy/sell/hold signals when appropriate

Available tools:
- get_stock_price: Get current price and quote data
- get_historical_prices: Get historical daily prices
- calculate_sma: Calculate Simple Moving Average
- calculate_rsi: Calculate Relative Strength Index
- calculate_macd: Calculate MACD indicator
- get_company_fundamentals: Get company overview and fundamentals
- get_stock_news: Get recent news with sentiment

Format your response as a comprehensive market analysis report.`,
      ],
      [
        'human',
        `Analyze {ticker} for trading on {date}.

Context: {context}

Provide a detailed technical analysis including:
1. Current price and recent price action
2. Key technical indicators (SMA, RSI, MACD)
3. Trend analysis (short-term and long-term)
4. Support and resistance levels
5. Trading recommendation with reasoning`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`🔍 Market Analyst analyzing ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        date: state.date,
        context: state.context || 'No additional context provided.',
      });

      // Invoke LLM with tools
      const response = await this.llm.invoke(prompt);

      // Extract content and tool calls
      const content = response.content as string;
      const toolCalls = (response as any).tool_calls || [];

      logger.info(`✅ Market Analyst completed analysis for ${state.ticker}`);
      logger.debug(`Generated ${toolCalls.length} tool calls`);

      this.updateStatus('completed');

      return {
        ...state,
        marketAnalysis: {
          agent: this.name,
          report: content,
          toolCalls: this.formatToolCalls(toolCalls),
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'market_analyst',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ Market Analyst error: ${error.message}`);
      
      return {
        ...state,
        errors: [
          ...(state.errors || []),
          {
            agent: this.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }
}
