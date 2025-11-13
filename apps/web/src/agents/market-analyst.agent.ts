import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { stockTools } from '../tools/stock.tools';
import { cryptoTools } from '../tools/crypto.tools';
import { forexTools } from '../tools/forex.tools';
import { twelveDataTools } from '../tools/twelvedata.tools';
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
    // Combine all tools including Twelve Data fallback
    this.tools = [...stockTools, ...cryptoTools, ...forexTools, ...twelveDataTools];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Market Analyst specializing in technical analysis and market data interpretation for stocks, cryptocurrencies, and forex.

⚠️ CRITICAL: The data you see below is LIVE, REAL-TIME market data retrieved directly from financial APIs (Alpha Vantage and/or Twelve Data) RIGHT NOW (not from your training data). This includes:
- Current Price: Real-time quote with volume, change, high/low
- Time Series: Recent trading history (daily/intraday)
- Technical Indicators (SMA, RSI, etc.): Calculated from live data

The "Market Data:" section contains actual API responses in JSON format. YOU MUST analyze this live data - it represents the current market state as of the analysis date.

DO NOT say "I cannot access real-time data" or "I'm limited by my training cutoff" - you ARE receiving live API data in the context below. The data source will be indicated (AlphaVantage, TwelveData, etc.) but ALL sources provide current market data. Simply analyze the data provided.

Your role is to:
1. Parse and analyze the JSON data from Alpha Vantage API calls
2. Extract current price, volume, change data from GLOBAL_QUOTE
3. Analyze price trends from TIME_SERIES_DAILY historical data
4. Interpret technical indicators (SMA, RSI) calculated from live data
5. Provide insights based on the actual numbers you see

Guidelines:
- The data in "Market Data:" section is LIVE from Alpha Vantage API
- Extract specific numbers (price, volume, RSI, etc.) from the JSON
- Reference actual dates from the time series data
- Compare current price to historical data provided
- Analyze the technical indicators you receive
- Write in natural, conversational language without markdown formatting
- NO asterisks (**), NO hashtags (###), NO dashes for bullets
- Structure with clear section titles followed by paragraphs

IMPORTANT FORMATTING:
- Use section titles like "Overview:", "Technical Analysis:", "Key Findings:"
- Separate sections with blank lines (double newline)
- Write in complete sentences and paragraphs
- Include specific numbers (price, percentages, volume) from the data

{assetContext}`,
      ],
      [
        'human',
        `Analyze {ticker} ({assetType}) for trading on {date}.

Below is LIVE market data retrieved from Alpha Vantage API:

{context}

⚠️ IMPORTANT: The "Market Data:" section above contains actual API responses with current prices, volume, and indicators. Analyze this real data - do not say you cannot access it.

Structure your response with these sections (use exact titles with colon):

Overview:
[Brief summary using actual numbers from the API data above]

Technical Analysis:
[Price action, indicators, trends - cite specific values from the data]

Key Findings:
[Important observations based on the actual data provided]

Trading Outlook:
[Your assessment based on the live data you received]

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
        // Stock analysis tools with Twelve Data fallback
        try {
          // Use fallback tool that tries Alpha Vantage first, then Twelve Data
          const fallbackTool = this.tools.find(t => t.name === 'get_price_with_fallback');
          if (fallbackTool) {
            const priceResult = await fallbackTool.invoke({ symbol: state.ticker });
            if (priceResult) {
              toolResults.push({ tool: 'get_price_with_fallback', result: priceResult });
              logger.info(`✓ Got price data for ${state.ticker} (with auto-fallback)`);
            }
          } else {
            // Fallback to old method if new tool not available
            const priceResult = await this.tools.find(t => t.name === 'get_stock_price')?.invoke({ ticker: state.ticker });
            if (priceResult) toolResults.push({ tool: 'get_stock_price', result: priceResult });
          }
        } catch (error: any) {
          logger.warn(`Price fetch failed: ${error.message}`);
        }

        try {
          // Try Alpha Vantage historical first
          const histResult = await this.tools.find(t => t.name === 'get_historical_prices')?.invoke({ ticker: state.ticker, outputsize: 'compact' });
          if (histResult && !histResult.includes('Error')) {
            toolResults.push({ tool: 'get_historical_prices', result: histResult });
          } else {
            // Fallback to Twelve Data
            logger.info(`Trying Twelve Data for historical prices of ${state.ticker}`);
            const twelveResult = await this.tools.find(t => t.name === 'get_twelvedata_timeseries')?.invoke({ 
              symbol: state.ticker, 
              interval: '1day',
              outputsize: 100 
            });
            if (twelveResult) {
              toolResults.push({ tool: 'get_twelvedata_timeseries', result: twelveResult });
              logger.info(`✓ Got historical data from Twelve Data for ${state.ticker}`);
            }
          }
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
      const dataContext = toolResults.map(tr => {
        return `Tool: ${tr.tool}\nResult: ${tr.result}`;
      }).join('\n\n---\n\n');

      // Add explicit instruction
      const contextWithData = toolResults.length > 0 
        ? `${state.context || ''}\n\n=== LIVE API DATA FROM ALPHA VANTAGE ===\n\nThe following is real-time market data retrieved from Alpha Vantage API:\n\n${dataContext}\n\n=== END OF LIVE DATA ===\n\nYou MUST analyze the data above. Do NOT say you cannot access real-time data - it's right there in JSON format.`
        : `${state.context || ''}\n\nNote: No API data was retrieved. Please provide a general analysis.`;

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        assetType: assetInfo.type,
        assetContext,
        date: state.date,
        context: contextWithData,
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
