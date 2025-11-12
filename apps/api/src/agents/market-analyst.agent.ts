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

      // Manually gather market data using tools
      const toolResults: any[] = [];
      
      // Get current price
      try {
        const priceResult = await this.tools[0].invoke({ ticker: state.ticker });
        toolResults.push({ tool: 'get_stock_price', result: priceResult });
      } catch (error: any) {
        logger.warn(`Price fetch failed: ${error.message}`);
      }

      // Get historical prices
      try {
        const histResult = await this.tools[1].invoke({ ticker: state.ticker, outputsize: 'compact' });
        toolResults.push({ tool: 'get_historical_prices', result: histResult });
      } catch (error: any) {
        logger.warn(`Historical fetch failed: ${error.message}`);
      }

      // Calculate SMA
      try {
        const smaResult = await this.tools[2].invoke({ ticker: state.ticker, interval: 'daily', timePeriod: 20, seriesType: 'close' });
        toolResults.push({ tool: 'calculate_sma', result: smaResult });
      } catch (error: any) {
        logger.warn(`SMA calculation failed: ${error.message}`);
      }

      // Calculate RSI
      try {
        const rsiResult = await this.tools[3].invoke({ ticker: state.ticker, interval: 'daily', timePeriod: 14, seriesType: 'close' });
        toolResults.push({ tool: 'calculate_rsi', result: rsiResult });
      } catch (error: any) {
        logger.warn(`RSI calculation failed: ${error.message}`);
      }

      // Prepare context with tool results
      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        date: state.date,
        context: `${state.context || ''}\n\nMarket Data:\n${dataContext}`,
      });

      // Invoke LLM to analyze the data
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;

      logger.info(`✅ Market Analyst completed analysis for ${state.ticker}`);

      this.updateStatus('completed');

      return {
        ...state,
        marketAnalysis: {
          agent: this.name,
          report: content,
          toolCalls: toolResults,
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
