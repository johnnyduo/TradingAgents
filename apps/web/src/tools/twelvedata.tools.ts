import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

const TWELVE_DATA_API_KEY = config.TWELVE_DATA_API_KEY || '87f2fa4ff46945ff84fef04b9edaee07';
const BASE_URL = 'https://api.twelvedata.com';

/**
 * Get current stock price from Twelve Data
 */
export const getTwelveDataPriceTool = new DynamicStructuredTool({
  name: 'get_twelvedata_price',
  description: 'Get current stock price from Twelve Data API (fallback for Alpha Vantage)',
  schema: z.object({
    symbol: z.string().describe('Stock ticker symbol (e.g., AAPL, GOOGL)'),
  }),
  func: async ({ symbol }) => {
    try {
      logger.debug(`Fetching Twelve Data price for ${symbol}`);

      const response = await axios.get(`${BASE_URL}/quote`, {
        params: {
          symbol,
          apikey: TWELVE_DATA_API_KEY,
        },
        timeout: 30000,
      });

      const data = response.data;

      if (data.status === 'error') {
        return `Error from Twelve Data: ${data.message}`;
      }

      return JSON.stringify({
        symbol: data.symbol,
        name: data.name,
        exchange: data.exchange,
        currency: data.currency,
        price: parseFloat(data.close),
        open: parseFloat(data.open),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
        volume: parseInt(data.volume),
        change: parseFloat(data.change),
        changePercent: parseFloat(data.percent_change),
        previousClose: parseFloat(data.previous_close),
        timestamp: data.datetime,
        source: 'TwelveData',
      });
    } catch (error: any) {
      logger.error(`Error fetching Twelve Data price: ${error.message}`);
      return `Error fetching price from Twelve Data: ${error.message}`;
    }
  },
});

/**
 * Get time series data from Twelve Data
 */
export const getTwelveDataTimeSeresTool = new DynamicStructuredTool({
  name: 'get_twelvedata_timeseries',
  description: 'Get historical time series data from Twelve Data',
  schema: z.object({
    symbol: z.string().describe('Stock ticker symbol'),
    interval: z.enum(['1min', '5min', '15min', '30min', '1h', '1day', '1week', '1month']).default('1day'),
    outputsize: z.number().default(30).describe('Number of data points (max 5000)'),
  }),
  func: async ({ symbol, interval, outputsize }) => {
    try {
      logger.debug(`Fetching Twelve Data time series for ${symbol}`);

      const response = await axios.get(`${BASE_URL}/time_series`, {
        params: {
          symbol,
          interval,
          outputsize,
          apikey: TWELVE_DATA_API_KEY,
        },
        timeout: 30000,
      });

      const data = response.data;

      if (data.status === 'error') {
        return `Error from Twelve Data: ${data.message}`;
      }

      const values = data.values?.map((v: any) => ({
        datetime: v.datetime,
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseInt(v.volume),
      }));

      return JSON.stringify({
        symbol: data.meta?.symbol,
        interval: data.meta?.interval,
        currency: data.meta?.currency,
        exchange: data.meta?.exchange,
        data: values,
        source: 'TwelveData',
      });
    } catch (error: any) {
      logger.error(`Error fetching Twelve Data time series: ${error.message}`);
      return `Error fetching time series from Twelve Data: ${error.message}`;
    }
  },
});

/**
 * Calculate technical indicators from Twelve Data
 */
export const getTwelveDataIndicatorTool = new DynamicStructuredTool({
  name: 'get_twelvedata_indicator',
  description: 'Calculate technical indicators (RSI, SMA, EMA, MACD, etc.) from Twelve Data',
  schema: z.object({
    symbol: z.string().describe('Stock ticker symbol'),
    indicator: z.enum(['rsi', 'sma', 'ema', 'macd', 'bbands', 'stoch']).describe('Technical indicator to calculate'),
    interval: z.enum(['1min', '5min', '15min', '30min', '1h', '1day']).default('1day'),
    timePeriod: z.number().default(14).describe('Time period for calculation'),
  }),
  func: async ({ symbol, indicator, interval, timePeriod }) => {
    try {
      logger.debug(`Calculating ${indicator.toUpperCase()} for ${symbol} from Twelve Data`);

      const response = await axios.get(`${BASE_URL}/${indicator}`, {
        params: {
          symbol,
          interval,
          time_period: timePeriod,
          apikey: TWELVE_DATA_API_KEY,
        },
        timeout: 30000,
      });

      const data = response.data;

      if (data.status === 'error') {
        return `Error from Twelve Data: ${data.message}`;
      }

      return JSON.stringify({
        symbol: data.meta?.symbol,
        indicator: indicator.toUpperCase(),
        interval: data.meta?.interval,
        timePeriod,
        values: data.values?.slice(0, 30),
        source: 'TwelveData',
      });
    } catch (error: any) {
      logger.error(`Error calculating ${indicator} from Twelve Data: ${error.message}`);
      return `Error calculating ${indicator} from Twelve Data: ${error.message}`;
    }
  },
});

/**
 * Get real-time price with automatic fallback
 * Tries Alpha Vantage first, falls back to Twelve Data
 */
export const getPriceWithFallbackTool = new DynamicStructuredTool({
  name: 'get_price_with_fallback',
  description: 'Get current price with automatic fallback between Alpha Vantage and Twelve Data',
  schema: z.object({
    symbol: z.string().describe('Stock ticker symbol'),
  }),
  func: async ({ symbol }) => {
    // Try Alpha Vantage first
    try {
      if (config.ALPHA_VANTAGE_API_KEY) {
        logger.debug(`Trying Alpha Vantage for ${symbol}`);
        
        const response = await axios.get('https://www.alphavantage.co/query', {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol,
            apikey: config.ALPHA_VANTAGE_API_KEY,
          },
          timeout: 10000,
        });

        const quote = response.data['Global Quote'];
        
        if (quote && Object.keys(quote).length > 0) {
          logger.debug(`✓ Got data from Alpha Vantage for ${symbol}`);
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
            source: 'AlphaVantage',
          });
        }
      }
    } catch (error: any) {
      logger.warn(`Alpha Vantage failed for ${symbol}: ${error.message}`);
    }

    // Fallback to Twelve Data
    try {
      logger.debug(`Falling back to Twelve Data for ${symbol}`);
      return await getTwelveDataPriceTool.func({ symbol });
    } catch (error: any) {
      logger.error(`Both Alpha Vantage and Twelve Data failed for ${symbol}`);
      return `Error: Unable to fetch price from both Alpha Vantage and Twelve Data`;
    }
  },
});

export const twelveDataTools = [
  getTwelveDataPriceTool,
  getTwelveDataTimeSeresTool,
  getTwelveDataIndicatorTool,
  getPriceWithFallbackTool,
];
