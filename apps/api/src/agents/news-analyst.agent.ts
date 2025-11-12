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

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`📰 News Analyst analyzing ${state.ticker}`);

      // Fetch news data
      const toolResults: any[] = [];
      try {
        const newsResult = await this.tools[0].invoke({ ticker: state.ticker, limit: 10 });
        toolResults.push({ tool: 'get_stock_news', result: newsResult });
      } catch (error: any) {
        logger.warn(`News fetch failed: ${error.message}`);
        toolResults.push({ tool: 'get_stock_news', result: `Error: ${error.message}` });
      }

      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        date: state.date,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
      });

      const response = await this.llm.invoke(`${prompt}\n\nNews Data:\n${dataContext}`);
      const content = response.content as string;

      logger.info(`✅ News Analyst completed for ${state.ticker}`);
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
            error: error.message,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }
  }
}
