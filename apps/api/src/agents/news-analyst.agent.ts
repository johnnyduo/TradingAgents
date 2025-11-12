import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { getStockNewsTool } from '../tools/stock.tools';
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
    this.tools = [getStockNewsTool];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a News Analyst specializing in news sentiment analysis and market event interpretation.

Your role is to:
1. Analyze recent news articles about the company
2. Assess overall sentiment (bullish, bearish, neutral)
3. Identify key catalysts and events
4. Evaluate potential market impact
5. Consider credibility of news sources

Guidelines:
- Focus on recent, relevant news
- Distinguish between short-term noise and long-term trends
- Consider the timing and recency of news
- Identify both opportunities and risks
- Weight sentiment by source credibility

Format your response as a comprehensive news analysis report.`,
      ],
      [
        'human',
        `Analyze news and sentiment for {ticker} as of {date}.

Context from previous analyses:
Market Analysis: {marketAnalysis}

Provide:
1. Summary of recent news and events
2. Overall sentiment assessment
3. Key catalysts (positive and negative)
4. Potential market impact
5. Risk factors from news`,
      ],
    ]);
  }

  async execute(state: TradingState): Promise<Partial<TradingState>> {
    logger.info(`📰 News Analyst analyzing ${state.ticker}`);
    
    try {
      const toolResults: any[] = [];
      
      // Use news tool to get sentiment data
      if (this.tools.length > 0) {
        try {
          logger.info(`🔧 News Analyst invoking get_stock_news tool for ${state.ticker}...`);
          const newsTool = this.tools[0];
          const newsResult = await newsTool.invoke({ ticker: state.ticker, limit: 10 });
          logger.info(`✅ News tool completed successfully`);
          toolResults.push({ tool: 'get_stock_news', result: newsResult });
        } catch (error: any) {
          logger.warn(`⚠️ News tool failed: ${error.message}`);
          toolResults.push({ tool: 'get_stock_news', result: `Error: ${error.message}` });
        }
      }

      // Prepare context with tool results
      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');
      const marketContext = state.marketAnalysis?.report || 'No market analysis available';

      logger.info(`📝 News Analyst building prompt...`);
      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
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
