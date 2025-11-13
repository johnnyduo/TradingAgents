import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Parse forex pair from various formats (EUR/USD, EURUSD -> EUR, USD)
 */
function parseForexPair(pair: string): { from: string; to: string } {
  const clean = pair.replace(/\s/g, '');
  
  if (clean.includes('/')) {
    const [from, to] = clean.split('/');
    return { from: from.toUpperCase(), to: to.toUpperCase() };
  }
  
  if (clean.length === 6) {
    return {
      from: clean.slice(0, 3).toUpperCase(),
      to: clean.slice(3).toUpperCase(),
    };
  }
  
  throw new Error(`Invalid forex pair format: ${pair}. Use EUR/USD or EURUSD`);
}

/**
 * Get current forex exchange rate
 */
export const getForexRateTool = new DynamicStructuredTool({
  name: 'get_forex_rate',
  description: 'Get the current exchange rate for a currency pair',
  schema: z.object({
    pair: z.string().describe('Currency pair (e.g., EUR/USD, EURUSD, GBP/JPY)'),
  }),
  func: async ({ pair }) => {
    try {
      const { from, to } = parseForexPair(pair);
      logger.debug(`Fetching forex rate for ${from}/${to}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: from,
          to_currency: to,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      
      if (!data) {
        return `No data found for currency pair ${from}/${to}`;
      }

      return JSON.stringify({
        fromCurrency: data['1. From_Currency Code'],
        fromName: data['2. From_Currency Name'],
        toCurrency: data['3. To_Currency Code'],
        toName: data['4. To_Currency Name'],
        exchangeRate: parseFloat(data['5. Exchange Rate']),
        lastRefreshed: data['6. Last Refreshed'],
        timeZone: data['7. Time Zone'],
        bidPrice: parseFloat(data['8. Bid Price']),
        askPrice: parseFloat(data['9. Ask Price']),
      });
    } catch (error: any) {
      logger.error(`Error fetching forex rate: ${error.message}`);
      return `Error fetching forex rate: ${error.message}`;
    }
  },
});

/**
 * Get historical forex rates
 */
export const getHistoricalForexRatesTool = new DynamicStructuredTool({
  name: 'get_historical_forex_rates',
  description: 'Get historical daily exchange rates for a currency pair',
  schema: z.object({
    pair: z.string().describe('Currency pair (e.g., EUR/USD, GBPJPY)'),
    outputsize: z.enum(['compact', 'full']).default('compact').describe('compact = last 100 days, full = 20+ years'),
  }),
  func: async ({ pair, outputsize }) => {
    try {
      const { from, to } = parseForexPair(pair);
      logger.debug(`Fetching historical forex rates for ${from}/${to}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'FX_DAILY',
          from_symbol: from,
          to_symbol: to,
          outputsize,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const timeSeries = response.data['Time Series FX (Daily)'];
      
      if (!timeSeries) {
        return `No historical data found for ${from}/${to}`;
      }

      // Convert to array and limit to last 100 entries
      const entries = Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
        }));

      return JSON.stringify({ 
        pair: `${from}/${to}`, 
        from, 
        to, 
        data: entries 
      });
    } catch (error: any) {
      logger.error(`Error fetching historical forex rates: ${error.message}`);
      return `Error fetching historical forex rates: ${error.message}`;
    }
  },
});

/**
 * Get forex intraday rates for short-term trading
 */
export const getIntradayForexRatesTool = new DynamicStructuredTool({
  name: 'get_intraday_forex_rates',
  description: 'Get intraday exchange rates for forex trading (intervals: 1min, 5min, 15min, 30min, 60min)',
  schema: z.object({
    pair: z.string().describe('Currency pair'),
    interval: z.enum(['1min', '5min', '15min', '30min', '60min']).default('60min'),
    outputsize: z.enum(['compact', 'full']).default('compact'),
  }),
  func: async ({ pair, interval, outputsize }) => {
    try {
      const { from, to } = parseForexPair(pair);
      logger.debug(`Fetching intraday forex rates for ${from}/${to}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'FX_INTRADAY',
          from_symbol: from,
          to_symbol: to,
          interval,
          outputsize,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const timeSeries = response.data[`Time Series FX (${interval})`];
      
      if (!timeSeries) {
        return `No intraday data found for ${from}/${to}`;
      }

      // Limit to last 50 entries for context window
      const entries = Object.entries(timeSeries)
        .slice(0, 50)
        .map(([timestamp, data]: [string, any]) => ({
          timestamp,
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
        }));

      return JSON.stringify({ 
        pair: `${from}/${to}`,
        interval,
        data: entries 
      });
    } catch (error: any) {
      logger.error(`Error fetching intraday forex rates: ${error.message}`);
      return `Error fetching intraday forex rates: ${error.message}`;
    }
  },
});

/**
 * Get economic news and indicators affecting forex
 */
export const getForexNewsTool = new DynamicStructuredTool({
  name: 'get_forex_news',
  description: 'Get latest news and economic indicators affecting forex markets',
  schema: z.object({
    topics: z.string().default('economy,forex').describe('News topics'),
    limit: z.number().default(10).describe('Number of articles'),
  }),
  func: async ({ topics, limit }) => {
    try {
      logger.debug(`Fetching forex news for topics: ${topics}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          topics: topics,
          limit: limit,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const feed = response.data.feed;
      
      if (!feed || feed.length === 0) {
        return 'No forex news found';
      }

      const articles = feed.slice(0, limit).map((item: any) => ({
        title: item.title,
        url: item.url,
        timePublished: item.time_published,
        summary: item.summary,
        source: item.source,
        sentiment: {
          score: parseFloat(item.overall_sentiment_score),
          label: item.overall_sentiment_label,
        },
        topics: item.topics?.map((t: any) => ({
          topic: t.topic,
          relevance: parseFloat(t.relevance_score),
        })) || [],
      }));

      return JSON.stringify({ articles, count: articles.length });
    } catch (error: any) {
      logger.error(`Error fetching forex news: ${error.message}`);
      return `Error fetching forex news: ${error.message}`;
    }
  },
});

export const forexTools = [
  getForexRateTool,
  getHistoricalForexRatesTool,
  getIntradayForexRatesTool,
  getForexNewsTool,
];
