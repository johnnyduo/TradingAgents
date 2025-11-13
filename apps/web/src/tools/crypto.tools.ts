import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Get current crypto price
 */
export const getCryptoPriceTool = new DynamicStructuredTool({
  name: 'get_crypto_price',
  description: 'Get the current cryptocurrency price and exchange rate data',
  schema: z.object({
    symbol: z.string().describe('Crypto symbol (e.g., BTC, ETH, BTC-USD)'),
    market: z.string().default('USD').describe('Market currency (USD, EUR, etc.)'),
  }),
  func: async ({ symbol, market }) => {
    try {
      // Extract base symbol (BTC from BTC-USD)
      const baseSymbol = symbol.replace(/-USD|-USDT|-EUR|-BTC|-ETH/g, '');
      logger.debug(`Fetching crypto price for ${baseSymbol} in ${market}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: baseSymbol,
          to_currency: market,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const data = response.data['Realtime Currency Exchange Rate'];
      
      if (!data) {
        return `No data found for crypto symbol ${baseSymbol}`;
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
      logger.error(`Error fetching crypto price: ${error.message}`);
      return `Error fetching crypto price: ${error.message}`;
    }
  },
});

/**
 * Get historical crypto prices
 */
export const getHistoricalCryptoPricesTool = new DynamicStructuredTool({
  name: 'get_historical_crypto_prices',
  description: 'Get historical daily cryptocurrency prices',
  schema: z.object({
    symbol: z.string().describe('Crypto symbol (e.g., BTC, ETH)'),
    market: z.string().default('USD').describe('Market currency'),
  }),
  func: async ({ symbol, market }) => {
    try {
      const baseSymbol = symbol.replace(/-USD|-USDT|-EUR|-BTC|-ETH/g, '');
      logger.debug(`Fetching historical crypto prices for ${baseSymbol}`);
      
      if (!config.ALPHA_VANTAGE_API_KEY) {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'DIGITAL_CURRENCY_DAILY',
          symbol: baseSymbol,
          market: market,
          apikey: config.ALPHA_VANTAGE_API_KEY,
        },
        timeout: 30000,
      });

      const timeSeries = response.data['Time Series (Digital Currency Daily)'];
      
      if (!timeSeries) {
        return `No historical data found for ${baseSymbol}`;
      }

      // Convert to array and limit to last 100 entries
      const entries = Object.entries(timeSeries)
        .slice(0, 100)
        .map(([date, data]: [string, any]) => ({
          date,
          open: parseFloat(data[`1a. open (${market})`]),
          high: parseFloat(data[`2a. high (${market})`]),
          low: parseFloat(data[`3a. low (${market})`]),
          close: parseFloat(data[`4a. close (${market})`]),
          volume: parseFloat(data['5. volume']),
          marketCap: parseFloat(data['6. market cap (USD)']),
        }));

      return JSON.stringify({ symbol: baseSymbol, market, data: entries });
    } catch (error: any) {
      logger.error(`Error fetching historical crypto prices: ${error.message}`);
      return `Error fetching historical crypto prices: ${error.message}`;
    }
  },
});

/**
 * Get crypto market sentiment and news
 */
export const getCryptoNewsTool = new DynamicStructuredTool({
  name: 'get_crypto_news',
  description: 'Get latest news and sentiment for cryptocurrencies',
  schema: z.object({
    topics: z.string().default('cryptocurrency,blockchain').describe('News topics'),
    limit: z.number().default(10).describe('Number of articles'),
  }),
  func: async ({ topics, limit }) => {
    try {
      logger.debug(`Fetching crypto news for topics: ${topics}`);
      
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
        return 'No crypto news found';
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
      logger.error(`Error fetching crypto news: ${error.message}`);
      return `Error fetching crypto news: ${error.message}`;
    }
  },
});

export const cryptoTools = [
  getCryptoPriceTool,
  getHistoricalCryptoPricesTool,
  getCryptoNewsTool,
];
