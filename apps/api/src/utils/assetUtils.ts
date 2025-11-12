/**
 * Asset type detection and utilities for backend
 */

export type AssetType = 'stock' | 'crypto' | 'forex';

export interface AssetInfo {
  type: AssetType;
  symbol: string;
  displayName: string;
}

/**
 * Detect asset type from ticker symbol
 */
export function detectAssetType(ticker: string): AssetInfo {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Crypto patterns
  const cryptoPatterns = [
    /^(BTC|ETH|USDT|BNB|XRP|ADA|DOGE|SOL|DOT|MATIC|AVAX|LINK|UNI|LTC|BCH|XLM|ALGO|ATOM|VET|FIL|TRX|ETC|XMR|AAVE|THETA|EOS|XTZ|CAKE|MKR|COMP|SNX|SUSHI|YFI|BAT|ENJ|ZEC|DASH|WAVES|ZRX|ICX|ONT|ZIL|QTUM|LSK|NANO|SC|DGB|RVN|HBAR|HOT|CHZ|BTT|WIN|STEEM|STMX|CVC|STORJ|ANKR|FET|SAND|MANA|AXS|GALA|ENS|IMX|APE|GMT|GST|OP|ARB|BLUR|PENDLE|PEPE|WLD|SUI|SEI|TIA)(-USD|-USDT|-EUR|-BTC)?$/,
    /^.+(-USD|-USDT|-BTC|-ETH)$/
  ];
  
  for (const pattern of cryptoPatterns) {
    if (pattern.test(upperTicker)) {
      return {
        type: 'crypto',
        symbol: upperTicker,
        displayName: upperTicker.replace(/-USD|-USDT|-BTC|-ETH/g, ''),
      };
    }
  }
  
  // Forex patterns
  const forexPatterns = [
    /^[A-Z]{3}\/[A-Z]{3}$/,  // EUR/USD
    /^[A-Z]{6}$/              // EURUSD
  ];
  
  for (const pattern of forexPatterns) {
    if (pattern.test(upperTicker)) {
      const displayName = upperTicker.length === 6 
        ? `${upperTicker.slice(0, 3)}/${upperTicker.slice(3)}`
        : upperTicker;
      
      return {
        type: 'forex',
        symbol: upperTicker,
        displayName,
      };
    }
  }
  
  // Default to stock
  return {
    type: 'stock',
    symbol: upperTicker,
    displayName: upperTicker,
  };
}

/**
 * Get appropriate tools based on asset type
 */
export function getToolsForAssetType(assetType: AssetType): string[] {
  switch (assetType) {
    case 'crypto':
      return [
        'get_crypto_price',
        'get_historical_crypto_prices',
        'get_crypto_news',
      ];
    case 'forex':
      return [
        'get_forex_rate',
        'get_historical_forex_rates',
        'get_intraday_forex_rates',
        'get_forex_news',
      ];
    case 'stock':
    default:
      return [
        'get_stock_price',
        'get_historical_prices',
        'get_stock_news',
        'calculate_sma',
        'calculate_rsi',
        'calculate_macd',
        'get_company_overview',
        'get_income_statement',
        'get_balance_sheet',
      ];
  }
}

/**
 * Get appropriate analysis context based on asset type
 */
export function getAnalysisContext(assetType: AssetType): string {
  switch (assetType) {
    case 'crypto':
      return `
This is a cryptocurrency analysis. Focus on:
- Blockchain fundamentals and adoption metrics
- Trading volume and liquidity across exchanges
- Network activity and on-chain metrics
- Regulatory developments and news
- Market sentiment and social media trends
- Technical indicators and price patterns
- Competitor cryptocurrencies
`;
    case 'forex':
      return `
This is a foreign exchange (forex) analysis. Focus on:
- Economic indicators (GDP, inflation, employment)
- Central bank policies and interest rates
- Political stability and geopolitical events
- Trade balances and current account
- Technical analysis of currency pair trends
- Market sentiment and positioning
- Correlation with commodities and other pairs
`;
    case 'stock':
    default:
      return `
This is a stock market analysis. Focus on:
- Company fundamentals (revenue, earnings, growth)
- Industry position and competitive advantages
- Financial health and ratios
- Market sentiment and news
- Technical indicators and price trends
- Management quality and strategy
- Economic factors affecting the sector
`;
  }
}
