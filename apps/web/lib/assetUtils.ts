/**
 * Asset type detection and utilities
 */

export type AssetType = 'stock' | 'crypto' | 'forex';

export interface AssetInfo {
  type: AssetType;
  symbol: string;
  displayName: string;
  icon: string;
  color: string;
}

/**
 * Detect asset type from ticker symbol
 * Examples:
 * - AAPL, TSLA, NVDA = stock
 * - BTC-USD, ETH-USD, BTC = crypto
 * - EUR/USD, EURUSD, GBP/JPY = forex
 */
export function detectAssetType(ticker: string): AssetInfo {
  const upperTicker = ticker.toUpperCase().trim();
  
  // Crypto patterns
  const cryptoPatterns = [
    /^(BTC|ETH|USDT|BNB|XRP|ADA|DOGE|SOL|DOT|MATIC|AVAX|LINK|UNI|LTC|BCH|XLM|ALGO|ATOM|VET|FIL|TRX|ETC|XMR|AAVE|THETA|EOS|XTZ|CAKE|MKR|COMP|SNX|SUSHI|YFI|BAT|ENJ|ZEC|DASH|WAVES|ZRX|ICX|ONT|ZIL|QTUM|LSK|NANO|SC|DGB|RVN|HBAR|HOT|CHZ|BTT|WIN|STEEM|STMX|CVC|STORJ|ANKR|FET|SAND|MANA|AXS|GALA|ENS|IMX|APE|GMT|GST|OP|ARB|BLUR|PENDLE|PEPE|WLD|SUI|SEI|TIA)(-USD|-USDT|-EUR|-BTC)?$/,
    /^.+(-USD|-USDT|-BTC|-ETH)$/  // Any token ending with -USD, -USDT, etc.
  ];
  
  for (const pattern of cryptoPatterns) {
    if (pattern.test(upperTicker)) {
      return {
        type: 'crypto',
        symbol: upperTicker,
        displayName: upperTicker.replace(/-USD|-USDT|-BTC|-ETH/g, ''),
        icon: '₿',
        color: 'from-orange-500 to-amber-500'
      };
    }
  }
  
  // Forex patterns
  const forexPatterns = [
    /^[A-Z]{3}\/[A-Z]{3}$/,  // EUR/USD format
    /^[A-Z]{6}$/              // EURUSD format
  ];
  
  for (const pattern of forexPatterns) {
    if (pattern.test(upperTicker)) {
      // Convert EURUSD to EUR/USD for display
      const displayName = upperTicker.length === 6 
        ? `${upperTicker.slice(0, 3)}/${upperTicker.slice(3)}`
        : upperTicker;
      
      return {
        type: 'forex',
        symbol: upperTicker,
        displayName,
        icon: '💱',
        color: 'from-green-500 to-emerald-500'
      };
    }
  }
  
  // Default to stock
  return {
    type: 'stock',
    symbol: upperTicker,
    displayName: upperTicker,
    icon: '📈',
    color: 'from-purple-500 to-blue-500'
  };
}

/**
 * Format markdown report to natural, human-readable text
 * Removes markdown symbols like ###, **, -, etc. and formats nicely
 */
export function formatReport(content: string): string {
  if (!content) return '';
  
  let formatted = content;
  
  // Remove markdown headers (### -> just text)
  formatted = formatted.replace(/^#{1,6}\s+/gm, '');
  
  // Remove bold/italic markers (** and *)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '$1');
  formatted = formatted.replace(/\*(.+?)\*/g, '$1');
  
  // Convert markdown lists to proper format
  formatted = formatted.replace(/^[\-\*]\s+/gm, '• ');
  formatted = formatted.replace(/^\d+\.\s+/gm, (match) => match);
  
  // Clean up excessive newlines (more than 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  formatted = formatted.trim();
  
  return formatted;
}

/**
 * Get appropriate agent emoji based on role and asset type
 */
export function getAgentEmoji(agentName: string, assetType: AssetType): string {
  const emojiMap: Record<string, Record<AssetType, string>> = {
    'Market Analyst': {
      stock: '📊',
      crypto: '🪙',
      forex: '💹'
    },
    'News Analyst': {
      stock: '📰',
      crypto: '📱',
      forex: '🌍'
    },
    'Fundamentals Analyst': {
      stock: '📈',
      crypto: '⛓️',
      forex: '🏦'
    },
    'Bull Researcher': {
      stock: '🐂',
      crypto: '🚀',
      forex: '📈'
    },
    'Bear Researcher': {
      stock: '🐻',
      crypto: '📉',
      forex: '📉'
    },
    'Trader': {
      stock: '💼',
      crypto: '💰',
      forex: '💱'
    }
  };
  
  return emojiMap[agentName]?.[assetType] || '🤖';
}
