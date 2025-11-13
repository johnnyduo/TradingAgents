import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { getStockNewsTool } from '../tools/stock.tools';
import { getCryptoNewsTool } from '../tools/crypto.tools';
import { getForexNewsTool } from '../tools/forex.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

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
        `You are a News Analyst specializing in news sentiment analysis and market event interpretation for stocks, cryptocurrencies, and forex.

IMPORTANT: You will receive LIVE, REAL-TIME data from Alpha Vantage API and other financial data sources. This data is current as of the analysis date provided. You are NOT limited by your training data cutoff - analyze the actual data provided to you.

Your role is to:
1. Analyze the real-time news articles and events provided by the API
2. Assess overall sentiment (bullish, bearish, neutral) from the actual data
3. Identify key catalysts and market-moving events from the news feed
4. Evaluate potential market impact based on current information
5. Consider credibility and recency of news sources

Guidelines:
- You ARE analyzing current, live data from financial APIs
- Trust the data provided - it's real-time market information
- Adapt your analysis based on the asset type
- Write in natural, conversational language
- NO markdown symbols (**, ###, -)
- Use clear section titles with colons
- Include specific sentiment scores and metrics from the data

FORMATTING:
- Section titles: "News Summary:", "Sentiment Analysis:", etc.
- Separate sections with blank lines
- Use complete paragraphs with specific data`,
      ],
      [
        'human',
        `Analyze news and sentiment for {ticker} ({assetType}) as of {date}.

Context from previous analyses:
Market Analysis: {marketAnalysis}

Structure your response with these sections:

News Summary:
[Brief overview of recent news and events]

Sentiment Analysis:
[Overall sentiment with specific scores/indicators]

Key Catalysts:
[Important events and their potential impact]

Market Impact:
[How news may affect price and trading]

No markdown formatting, just natural paragraphs with section titles.`,
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
