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

Required Sections:

Breaking News Summary:
Summarize the most recent and impactful news items (last 24-72 hours). Include publication dates, sources, and headlines. Focus on market-moving events.

Sentiment Analysis:
Calculate and report the aggregate sentiment score. Break down by source type (mainstream media, social media, analyst reports). Note the sentiment trend (improving/deteriorating) and compare to the price movement from the market analysis.

Key Catalysts and Events:
Identify specific events that could drive price movement. For earnings, include the date and expectations. For product launches or announcements, explain the significance. For regulatory news, assess the timeline and impact.

Credibility Assessment:
Evaluate the reliability of the news sources. Note which stories are from primary sources versus speculation. Identify any rumors that need verification.

Market Psychology:
Analyze the crowd sentiment. Is there fear, greed, or indifference? Are retail and institutional investors aligned or divergent? What does social media buzz indicate about retail interest?

Price Impact Forecast:
Based on the news and sentiment, project how this could affect the price in the short term (1-7 days) and medium term (1-4 weeks). Provide specific scenarios (e.g., "positive earnings could drive 5-8% rally") based on historical patterns and current sentiment intensity.

Include specific dates, sources, and sentiment scores. Reference actual headlines or quotes from the news data.`,
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
