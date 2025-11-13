import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Get current stock price
 */
export const getStockPriceTool = new DynamicStructuredTool({
  name: 'get_stock_price',
  description: 'Get the current stock price and basic quote data for a ticker symbol',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol (e.g., AAPL, GOOGL)'),
  }),
  func: async ({ ticker }) => {
    try {
      logger.debug(`Fetching price for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: ticker,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const quote = response.data['Global Quote'];
      
      if (!quote || Object.keys(quote).length === 0) {
        return `No data found for ticker ${ticker}`;
      }

      return JSON.stringify({
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        latestTradingDay: quote['07. latest trading day'],
        previousClose: parseFloat(quote['08. previous close']),
        open: parseFloat(quote['02. open']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
      });
    } catch (error: any) {
      logger.error(`Error fetching stock price: ${error.message}`);
      return `Error fetching stock price: ${error.message}`;
    }
  },
});

/**
 * Get historical stock prices
 */
export const getHistoricalPricesTool = new DynamicStructuredTool({
  name: 'get_historical_prices',
  description: 'Get historical daily stock prices for technical analysis',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
    outputsize: z.enum(['compact', 'full']).default('compact').describe('compact = last 100 days, full = 20+ years'),
  }),
  func: async ({ ticker, outputsize }) => {
    try {
      logger.debug(`Fetching historical prices for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: ticker,
          outputsize,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const timeSeries = response.data['Time Series (Daily)'];
      
      if (!timeSeries) {
        return `No historical data found for ticker ${ticker}`;
      }

      // Convert to array and limit to last 100 entries for context window
      const entries = Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume']),
        }));

      return JSON.stringify({ ticker, data: entries });
    } catch (error: any) {
      logger.error(`Error fetching historical prices: ${error.message}`);
      return `Error fetching historical prices: ${error.message}`;
    }
  },
});

/**
 * Calculate Simple Moving Average
 */
export const calculateSMATool = new DynamicStructuredTool({
  name: 'calculate_sma',
  description: 'Calculate Simple Moving Average for a stock',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
    interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    timePeriod: z.number().default(20).describe('Number of periods for SMA (e.g., 20, 50, 200)'),
    seriesType: z.enum(['close', 'open', 'high', 'low']).default('close'),
  }),
  func: async ({ ticker, interval, timePeriod, seriesType }) => {
    try {
      logger.debug(`Calculating SMA for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'SMA',
          symbol: ticker,
          interval,
          time_period: timePeriod,
          series_type: seriesType,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const data = response.data['Technical Analysis: SMA'];
      
      if (!data) {
        return `No SMA data found for ticker ${ticker}`;
      }

      // Get last 30 values
      const entries = Object.entries(data)
        .slice(0, 30)
        .map(([date, value]: [string, any]) => ({
          date,
          sma: parseFloat(value.SMA),
        }));

      return JSON.stringify({ 
        ticker, 
        indicator: 'SMA', 
        timePeriod,
        data: entries 
      });
    } catch (error: any) {
      logger.error(`Error calculating SMA: ${error.message}`);
      return `Error calculating SMA: ${error.message}`;
    }
  },
});

/**
 * Calculate RSI (Relative Strength Index)
 */
export const calculateRSITool = new DynamicStructuredTool({
  name: 'calculate_rsi',
  description: 'Calculate Relative Strength Index (RSI) for a stock. RSI > 70 suggests overbought, RSI < 30 suggests oversold',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
    interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    timePeriod: z.number().default(14).describe('Number of periods for RSI calculation'),
    seriesType: z.enum(['close', 'open', 'high', 'low']).default('close'),
  }),
  func: async ({ ticker, interval, timePeriod, seriesType }) => {
    try {
      logger.debug(`Calculating RSI for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'RSI',
          symbol: ticker,
          interval,
          time_period: timePeriod,
          series_type: seriesType,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const data = response.data['Technical Analysis: RSI'];
      
      if (!data) {
        return `No RSI data found for ticker ${ticker}`;
      }

      const entries = Object.entries(data)
        .slice(0, 30)
        .map(([date, value]: [string, any]) => ({
          date,
          rsi: parseFloat(value.RSI),
        }));

      return JSON.stringify({ 
        ticker, 
        indicator: 'RSI', 
        timePeriod,
        data: entries 
      });
    } catch (error: any) {
      logger.error(`Error calculating RSI: ${error.message}`);
      return `Error calculating RSI: ${error.message}`;
    }
  },
});

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export const calculateMACDTool = new DynamicStructuredTool({
  name: 'calculate_macd',
  description: 'Calculate MACD indicator for trend analysis. Positive MACD suggests bullish trend',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
    interval: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    seriesType: z.enum(['close', 'open', 'high', 'low']).default('close'),
  }),
  func: async ({ ticker, interval, seriesType }) => {
    try {
      logger.debug(`Calculating MACD for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'MACD',
          symbol: ticker,
          interval,
          series_type: seriesType,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const data = response.data['Technical Analysis: MACD'];
      
      if (!data) {
        return `No MACD data found for ticker ${ticker}`;
      }

      const entries = Object.entries(data)
        .slice(0, 30)
        .map(([date, value]: [string, any]) => ({
          date,
          macd: parseFloat(value.MACD),
          macdSignal: parseFloat(value.MACD_Signal),
          macdHist: parseFloat(value.MACD_Hist),
        }));

      return JSON.stringify({ 
        ticker, 
        indicator: 'MACD',
        data: entries 
      });
    } catch (error: any) {
      logger.error(`Error calculating MACD: ${error.message}`);
      return `Error calculating MACD: ${error.message}`;
    }
  },
});

/**
 * Get company fundamentals
 */
export const getCompanyFundamentalsTool = new DynamicStructuredTool({
  name: 'get_company_fundamentals',
  description: 'Get company fundamentals including P/E ratio, market cap, earnings, etc.',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
  }),
  func: async ({ ticker }) => {
    try {
      logger.debug(`Fetching fundamentals for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'OVERVIEW',
          symbol: ticker,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const data = response.data;
      
      // Check for rate limit or empty response
      if (!data || !data.Symbol || data.Note || data.Information) {
        logger.warn(`Alpha Vantage fundamentals API rate limited or empty for ${ticker}. Using fallback analysis.`);
        return JSON.stringify({
          symbol: ticker,
          note: 'API_RATE_LIMITED',
          message: 'Alpha Vantage API rate limit reached. Fundamental analysis will proceed with relative valuation approach.',
          fallback: true,
          suggestion: `Analyst should provide analysis based on: (1) sector average P/E ratios and valuation multiples, (2) comparison to peers in the same industry, (3) market cap and trading patterns, (4) general business model assessment. Use qualitative analysis and market positioning instead of specific financial statement metrics.`
        });
      }

      return JSON.stringify({
        symbol: data.Symbol,
        name: data.Name,
        description: data.Description,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: data.MarketCapitalization,
        peRatio: parseFloat(data.PERatio),
        pegRatio: parseFloat(data.PEGRatio),
        bookValue: parseFloat(data.BookValue),
        dividendPerShare: parseFloat(data.DividendPerShare),
        dividendYield: parseFloat(data.DividendYield),
        eps: parseFloat(data.EPS),
        revenuePerShareTTM: parseFloat(data.RevenuePerShareTTM),
        profitMargin: parseFloat(data.ProfitMargin),
        operatingMarginTTM: parseFloat(data.OperatingMarginTTM),
        returnOnAssetsTTM: parseFloat(data.ReturnOnAssetsTTM),
        returnOnEquityTTM: parseFloat(data.ReturnOnEquityTTM),
        revenueTTM: data.RevenueTTM,
        grossProfitTTM: data.GrossProfitTTM,
        week52High: parseFloat(data['52WeekHigh']),
        week52Low: parseFloat(data['52WeekLow']),
      });
    } catch (error: any) {
      logger.error(`Error fetching fundamentals: ${error.message}`);
      // Return fallback instead of error
      return JSON.stringify({
        symbol: ticker,
        note: 'API_ERROR',
        message: `Fundamentals API unavailable: ${error.message}`,
        fallback: true,
        suggestion: `Analyst should provide qualitative fundamental analysis for ${ticker} based on: sector positioning, business model strength, competitive advantages, market share, and relative valuation to sector peers. Focus on strategic assessment rather than specific financial metrics.`
      });
    }
  },
});

/**
 * Get news for a stock
 */
export const getStockNewsTool = new DynamicStructuredTool({
  name: 'get_stock_news',
  description: 'Get recent news articles about a stock',
  schema: z.object({
    ticker: z.string().describe('Stock ticker symbol'),
    limit: z.number().default(10).describe('Number of news articles to retrieve'),
  }),
  func: async ({ ticker, limit }) => {
    try {
      logger.debug(`Fetching news for ${ticker}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: ticker,
          limit,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000, // 30 second timeout
      });

      const feed = response.data.feed;
      
      // Check for rate limit or empty response
      if (!feed || feed.length === 0 || response.data.Note || response.data.Information) {
        logger.warn(`Alpha Vantage news API rate limited or empty for ${ticker}. Using fallback analysis.`);
        return JSON.stringify({
          ticker,
          note: 'API_RATE_LIMITED',
          message: 'Alpha Vantage API rate limit reached. Analysis will proceed with general market context and available technical data.',
          fallback: true,
          suggestion: `Analyst should analyze ${ticker} based on: (1) current technical indicators from market data, (2) recent price action and momentum, (3) broader market sentiment, (4) sector trends. Focus on what can be determined from price/volume data without specific news articles.`
        });
      }

      const articles = feed.slice(0, limit).map((article: any) => ({
        title: article.title,
        url: article.url,
        timePublished: article.time_published,
        summary: article.summary,
        source: article.source,
        sentiment: {
          label: article.overall_sentiment_label,
          score: parseFloat(article.overall_sentiment_score),
        },
        tickerSentiment: article.ticker_sentiment?.find((ts: any) => ts.ticker === ticker),
      }));

      return JSON.stringify({ ticker, articles });
    } catch (error: any) {
      logger.error(`Error fetching news: ${error.message}`);
      // Return fallback instead of error
      return JSON.stringify({
        ticker,
        note: 'API_ERROR',
        message: `News API unavailable: ${error.message}`,
        fallback: true,
        suggestion: `Analyst should provide analysis based on available market and technical data. Note that specific news sentiment is unavailable but analysis can focus on price action, technical indicators, and broader market context for ${ticker}.`
      });
    }
  },
});

export const stockTools = [
  getStockPriceTool,
  getHistoricalPricesTool,
  calculateSMATool,
  calculateRSITool,
  calculateMACDTool,
  getCompanyFundamentalsTool,
  getStockNewsTool,
];
