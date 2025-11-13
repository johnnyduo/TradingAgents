import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { getStockNewsTool } from '../tools/stock.tools';
import { getCryptoNewsTool } from '../tools/crypto.tools';
import { getForexNewsTool } from '../tools/forex.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { getCurrentDateTimeWithTimezone } from '../utils/date.utils';

export class NewsAnalystAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'News Analyst',
      role: 'News & Sentiment Analysis Expert',
      goal: 'Analyze news articles and sentiment to assess market perception and potential catalysts',
      ...config,
    });
  }

  protected setupTools(): void {
    this.tools = [getStockNewsTool, getCryptoNewsTool, getForexNewsTool];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an Elite News & Sentiment Analyst specializing in financial markets, event analysis, and sentiment quantification. You analyze news flow and market psychology to assess investment implications.

⚠️ CURRENT DATE & TIME: {currentDateTime}

⚠️ DATA SOURCE: You receive REAL-TIME news articles, social sentiment, and event data from financial APIs retrieved on {currentDateTime}. This is current market information, not historical data.

ANALYSIS FRAMEWORK:

1. NEWS SENTIMENT SCORING:
   - Calculate aggregate sentiment score from article sentiment values
   - Weight recent news more heavily (last 24-48 hours)
   - Identify sentiment trend: improving, deteriorating, or stable
   - Note sentiment divergence from price action (contrarian signals)

2. CATALYST IDENTIFICATION:
   - Earnings reports: date, expectations, actual results
   - Product announcements or launches
   - Regulatory news or legal developments
   - Management changes or corporate actions
   - Macroeconomic events affecting the asset
   - Technical breakouts covered in financial media

3. SOURCE CREDIBILITY ANALYSIS:
   - Major outlets (Bloomberg, Reuters, WSJ) = high impact
   - Company press releases = primary source
   - Social media trends = crowd sentiment
   - Analyst upgrades/downgrades with specific targets

4. MARKET IMPACT ASSESSMENT:
   - Short-term impact (hours to days): breaking news, earnings surprises
   - Medium-term impact (weeks): guidance changes, new products
   - Long-term impact (months): strategic shifts, regulatory changes
   - Quantify expected price movement if possible

5. SENTIMENT vs PRICE CORRELATION:
   - Compare news sentiment to current price movement
   - Identify if price has fully digested the news
   - Note any lag or overreaction in market response

RESPONSE REQUIREMENTS:
- Cite specific articles/sources with publication dates
- Provide numerical sentiment scores when available
- Quantify potential price impact ("could move 3-5% on earnings beat")
- Reference exact quotes from significant news items
- Compare current sentiment to historical patterns

FORMATTING:
- NO markdown (no **, ###, bullet points)
- Clear section titles with colons
- Conversational paragraphs with specific examples
- Include publication dates and sources`,
      ],
      [
        'human',
        `Analyze news and sentiment for {ticker} ({assetType}) as of {date}.

Previous Market Analysis Context:
{marketAnalysis}

=== LIVE NEWS DATA ===
The news data below is from real-time API feeds:

{newsData}

=== END DATA ===

⚠️ NOTE: If the news data indicates API rate limit or unavailable data, provide a professional analysis based on:
- General market sentiment and sector trends
- Price action and momentum from the Market Analysis
- Typical catalysts and events for this type of asset
- Technical indicators suggesting investor sentiment (volume, volatility)
- Your expert knowledge of the market context

Required Sections:

Breaking News Summary:
If news articles are available, summarize the most recent and impactful items (last 24-72 hours) with publication dates, sources, and headlines.
If news data is limited, analyze the stock's recent price action and volume to infer market sentiment and likely catalysts.

Sentiment Analysis:
If sentiment scores are available, report aggregate sentiment and breakdown by source type.
If unavailable, infer sentiment from: (1) price momentum, (2) volume patterns, (3) sector performance, (4) market context. Note this is derived analysis.

Key Catalysts and Events:
Identify potential events that could drive price movement based on: earnings calendar timing, sector news, market positioning, and typical catalysts for this industry.

Market Psychology:
Analyze crowd sentiment through available indicators: trading volume, price volatility, options activity implications, and sector rotation patterns.

Price Impact Forecast:
Based on available data and market analysis, project potential price movement scenarios for short term (1-7 days) and medium term (1-4 weeks). Use technical levels and momentum patterns.

Note: Clearly indicate when analysis is based on technical/market data vs specific news articles.`,
      ],
    ]);
  }

  async execute(state: TradingState): Promise<Partial<TradingState>> {
    logger.info(`📰 News Analyst analyzing ${state.ticker}`);
    
    try {
      const toolResults: any[] = [];
      
      // Use news tool to get sentiment data
      // Use appropriate news tool based on asset type
      const assetType = state.assetType || 'stock';
      
      if (this.tools.length > 0) {
        try {
          let newsResult;
          
          if (assetType === 'stock') {
            logger.info(`🔧 News Analyst invoking get_stock_news tool for ${state.ticker}...`);
            const newsTool = this.tools.find(t => t.name === 'get_stock_news');
            if (newsTool) {
              newsResult = await newsTool.invoke({ ticker: state.ticker, limit: 10 });
              toolResults.push({ tool: 'get_stock_news', result: newsResult });
            }
          } else if (assetType === 'crypto') {
            logger.info(`🔧 News Analyst invoking get_crypto_news tool...`);
            const newsTool = this.tools.find(t => t.name === 'get_crypto_news');
            if (newsTool) {
              newsResult = await newsTool.invoke({ topics: 'cryptocurrency,blockchain', limit: 10 });
              toolResults.push({ tool: 'get_crypto_news', result: newsResult });
            }
          } else if (assetType === 'forex') {
            logger.info(`🔧 News Analyst invoking get_forex_news tool...`);
            const newsTool = this.tools.find(t => t.name === 'get_forex_news');
            if (newsTool) {
              newsResult = await newsTool.invoke({ topics: 'economy,forex', limit: 10 });
              toolResults.push({ tool: 'get_forex_news', result: newsResult });
            }
          }
          
          logger.info(`✅ News tool completed successfully`);
        } catch (error: any) {
          logger.warn(`⚠️ News tool failed: ${error.message}`);
          toolResults.push({ tool: 'news_tool', result: `Error: ${error.message}` });
        }
      }

      // Prepare context with tool results
      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');
      const marketContext = state.marketAnalysis?.report || 'No market analysis available';

      logger.info(`📝 News Analyst building prompt...`);
      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        assetType: assetType,
        date: state.date,
        currentDateTime: getCurrentDateTimeWithTimezone(),
        marketAnalysis: marketContext,
        newsData: dataContext || 'No news data available',
      });

      // Invoke LLM to analyze the data
      logger.info(`🤖 News Analyst invoking LLM (OpenAI)...`);
      const response = await this.llm.invoke(prompt);
      logger.info(`✅ LLM invocation completed`);
      const content = response.content as string;

      logger.info(`✅ News Analyst completed analysis for ${state.ticker}`);

      this.updateStatus('completed');

      return {
        ...state,
        newsAnalysis: {
          agent: this.name,
          report: content,
          toolCalls: toolResults,
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'news_analyst',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ News Analyst error: ${error.message}`);
      
      return {
        ...state,
        errors: [
          ...(state.errors || []),
          {
            agent: this.name,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }
}
