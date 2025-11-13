import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { stockTools } from '../tools/stock.tools';
import { cryptoTools } from '../tools/crypto.tools';
import { forexTools } from '../tools/forex.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { detectAssetType, getAnalysisContext } from '../utils/assetUtils';

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
    // Combine all tools - will select appropriate ones at runtime
    this.tools = [...stockTools, ...cryptoTools, ...forexTools];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Market Analyst specializing in technical analysis and market data interpretation for stocks, cryptocurrencies, and forex.

IMPORTANT: You will receive LIVE, REAL-TIME market data from Alpha Vantage and other financial APIs. This data is current as of the analysis date provided. You are NOT limited by your training data cutoff - analyze the actual live data provided to you.

Your role is to:
1. Analyze real-time price movements and trends from the API data
2. Calculate and interpret technical indicators from live market data
3. Identify support and resistance levels using current price action
4. Assess market momentum and volatility from actual trading data
5. Provide data-driven insights based on live market information

Guidelines:
- You ARE analyzing current, live market data from financial APIs
- Trust the data provided - it's real-time market information
- Adapt your analysis based on the asset type (stock, crypto, or forex)
- Always back your analysis with specific data points from the API
- Consider multiple timeframes when analyzing trends
- Be objective and focus on what the data shows
- Write in natural, conversational language without markdown formatting
- NO asterisks (**), NO hashtags (###), NO dashes for bullets
- Structure with clear section titles followed by paragraphs

IMPORTANT FORMATTING:
- Use section titles like "Overview:", "Technical Analysis:", "Key Findings:"
- Separate sections with blank lines (double newline)
- Write in complete sentences and paragraphs
- Include specific numbers (price, percentages, volume)

{assetContext}`,
      ],
      [
        'human',
        `Analyze {ticker} ({assetType}) for trading on {date}.

Context: {context}

Structure your response with these sections (use exact titles with colon):

Overview:
[Brief summary of current situation with key metrics]

Technical Analysis:
[Price action, indicators, trends with specific numbers]

Key Findings:
[Important observations and what they mean]

Trading Outlook:
[Your assessment and reasoning]

Remember: No markdown symbols, just natural paragraphs with clear section titles.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      
      // Detect asset type
      const assetInfo = detectAssetType(state.ticker);
      const assetContext = getAnalysisContext(assetInfo.type);
      
      logger.info(`🔍 Market Analyst analyzing ${state.ticker} (${assetInfo.type})`);

      // Gather market data using appropriate tools based on asset type
      const toolResults: any[] = [];
      
      if (assetInfo.type === 'stock') {
        // Stock analysis tools
        try {
          const priceResult = await this.tools.find(t => t.name === 'get_stock_price')?.invoke({ ticker: state.ticker });
          if (priceResult) toolResults.push({ tool: 'get_stock_price', result: priceResult });
        } catch (error: any) {
          logger.warn(`Stock price fetch failed: ${error.message}`);
        }

        try {
          const histResult = await this.tools.find(t => t.name === 'get_historical_prices')?.invoke({ ticker: state.ticker, outputsize: 'compact' });
          if (histResult) toolResults.push({ tool: 'get_historical_prices', result: histResult });
        } catch (error: any) {
          logger.warn(`Historical prices fetch failed: ${error.message}`);
        }

        try {
          const smaResult = await this.tools.find(t => t.name === 'calculate_sma')?.invoke({ ticker: state.ticker, interval: 'daily', timePeriod: 20, seriesType: 'close' });
          if (smaResult) toolResults.push({ tool: 'calculate_sma', result: smaResult });
        } catch (error: any) {
          logger.warn(`SMA calculation failed: ${error.message}`);
        }

        try {
          const rsiResult = await this.tools.find(t => t.name === 'calculate_rsi')?.invoke({ ticker: state.ticker, interval: 'daily', timePeriod: 14, seriesType: 'close' });
          if (rsiResult) toolResults.push({ tool: 'calculate_rsi', result: rsiResult });
        } catch (error: any) {
          logger.warn(`RSI calculation failed: ${error.message}`);
        }
      } else if (assetInfo.type === 'crypto') {
        // Crypto analysis tools
        try {
          const priceResult = await this.tools.find(t => t.name === 'get_crypto_price')?.invoke({ symbol: state.ticker, market: 'USD' });
          if (priceResult) toolResults.push({ tool: 'get_crypto_price', result: priceResult });
        } catch (error: any) {
          logger.warn(`Crypto price fetch failed: ${error.message}`);
        }

        try {
          const histResult = await this.tools.find(t => t.name === 'get_historical_crypto_prices')?.invoke({ symbol: state.ticker, market: 'USD' });
          if (histResult) toolResults.push({ tool: 'get_historical_crypto_prices', result: histResult });
        } catch (error: any) {
          logger.warn(`Crypto historical fetch failed: ${error.message}`);
        }
      } else if (assetInfo.type === 'forex') {
        // Forex analysis tools
        try {
          const rateResult = await this.tools.find(t => t.name === 'get_forex_rate')?.invoke({ pair: state.ticker });
          if (rateResult) toolResults.push({ tool: 'get_forex_rate', result: rateResult });
        } catch (error: any) {
          logger.warn(`Forex rate fetch failed: ${error.message}`);
        }

        try {
          const histResult = await this.tools.find(t => t.name === 'get_historical_forex_rates')?.invoke({ pair: state.ticker, outputsize: 'compact' });
          if (histResult) toolResults.push({ tool: 'get_historical_forex_rates', result: histResult });
        } catch (error: any) {
          logger.warn(`Forex historical fetch failed: ${error.message}`);
        }

        try {
          const intradayResult = await this.tools.find(t => t.name === 'get_intraday_forex_rates')?.invoke({ pair: state.ticker, interval: '60min', outputsize: 'compact' });
          if (intradayResult) toolResults.push({ tool: 'get_intraday_forex_rates', result: intradayResult });
        } catch (error: any) {
          logger.warn(`Forex intraday fetch failed: ${error.message}`);
        }
      }

      // Prepare context with tool results
      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        assetType: assetInfo.type,
        assetContext,
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
        assetType: assetInfo.type,
        assetInfo,
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
