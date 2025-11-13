import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { stockTools } from '../tools/stock.tools';
import { cryptoTools } from '../tools/crypto.tools';
import { forexTools } from '../tools/forex.tools';
import { twelveDataTools } from '../tools/twelvedata.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { detectAssetType, getAnalysisContext } from '../utils/assetUtils';
import { getCurrentDateTimeWithTimezone, getMarketStatus } from '../utils/date.utils';

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
        `You are an Elite Market Analyst with expertise in technical analysis, price action, and quantitative trading signals. You have access to LIVE market data feeds and analyze real-time information.

⚠️ CURRENT DATE & TIME: {currentDateTime}
⚠️ MARKET STATUS: {marketStatus}

⚠️ DATA SOURCE: You are receiving LIVE, REAL-TIME market data from financial APIs (Alpha Vantage/Twelve Data). This is NOT historical training data - these are actual current market conditions retrieved on {currentDateTime}.

ANALYSIS FRAMEWORK:

1. PRICE ACTION ANALYSIS:
   - Extract exact current price, open, high, low from API data
   - Calculate intraday range and compare to recent volatility
   - Identify support/resistance levels from historical price data
   - Note any gaps, breakouts, or significant price movements
   - Compare current price to recent highs/lows

2. VOLUME ANALYSIS:
   - Current volume vs average volume (from API data)
   - Volume trends: increasing/decreasing
   - Price-volume correlation (strong moves on high volume = confirmation)
   - Accumulation or distribution patterns

3. TECHNICAL INDICATORS:
   - RSI: Exact value and interpretation (>70 overbought, <30 oversold, 40-60 neutral)
   - SMA/EMA: Price position relative to moving averages (bullish if above, bearish if below)
   - Crossovers: Note any recent golden/death cross signals
   - MACD: Momentum and trend direction
   - Bollinger Bands: Volatility and potential reversal zones

4. TREND IDENTIFICATION:
   - Short-term trend (5-10 days): analyze recent price movement
   - Medium-term trend (20-50 days): use SMA data
   - Momentum: strengthening or weakening based on indicators

5. KEY LEVELS:
   - Immediate support and resistance (from recent price action)
   - Major psychological levels (round numbers)
   - Previous breakout/breakdown levels

RESPONSE REQUIREMENTS:
- Cite EXACT numbers from the JSON data (price: $X.XX, volume: Y, RSI: Z)
- Reference specific dates from the time series
- Provide concrete price levels, not vague statements
- Use percentage changes for comparisons
- Give specific indicator values with interpretation

FORMATTING:
- NO markdown symbols (no **, ###, or bullet points)
- Use clear section titles with colons
- Write in conversational paragraphs
- Include specific numbers and percentages

{assetContext}`,
      ],
      [
        'human',
        `Analyze {ticker} ({assetType}) for trading on {date}.

=== LIVE MARKET DATA ===

{context}

=== END DATA ===

INSTRUCTIONS:
Parse the JSON data above and provide a comprehensive technical analysis. Extract specific values and cite them in your analysis.

Required Sections:

Market Overview:
Start with current price and daily change. Describe the immediate market state using exact numbers from the data (price, volume, percentage changes). Compare to previous close and note if we're near highs/lows.

Price Action Analysis:
Analyze the recent price movement using the time series data. Identify the trend direction, calculate the range, note any patterns. Specify actual dates and prices. Compare current position to recent support/resistance levels visible in the data.

Technical Indicators:
Extract and interpret each indicator provided (RSI, SMA, MACD, etc.). State the exact values and explain what they signal. For RSI, classify as overbought/oversold/neutral with the specific number. For moving averages, state if price is above or below and by how much.

Volume Analysis:
Compare current volume to average volume from the data. Note if volume is increasing or decreasing. Explain what the volume pattern suggests about the current move.

Key Support and Resistance:
Identify specific price levels from the historical data that act as support or resistance. Give exact numbers where you expect the price to find support or face resistance.

Trading Implications:
Based on all the data analyzed above, provide your assessment for short-term trading. Be specific about potential entry/exit zones, stop-loss levels, and price targets using concrete numbers from the analysis.

Remember: Use exact numbers, cite specific dates, reference actual values from the JSON data provided.`,
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
        currentDateTime: getCurrentDateTimeWithTimezone(),
        marketStatus: getMarketStatus(),
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
