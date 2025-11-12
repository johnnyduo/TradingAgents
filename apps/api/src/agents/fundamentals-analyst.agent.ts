import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { getCompanyFundamentalsTool } from '../tools/stock.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

export class FundamentalsAnalystAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'Fundamentals Analyst',
      role: 'Fundamental Analysis Expert',
      goal: 'Analyze company financials, valuation metrics, and long-term business fundamentals',
      ...config,
    });
  }

  protected setupTools(): void {
    this.tools = [getCompanyFundamentalsTool];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Fundamentals Analyst specializing in company financial analysis and valuation.

Your role is to:
1. Analyze financial statements and key metrics
2. Evaluate company valuation (P/E, PEG, P/B ratios)
3. Assess profitability and margins
4. Analyze growth trends and business quality
5. Compare metrics to industry standards

Key metrics to consider:
- P/E Ratio (Price-to-Earnings)
- PEG Ratio (Price/Earnings-to-Growth)
- ROE (Return on Equity)
- ROA (Return on Assets)
- Profit Margins
- Revenue Growth
- Debt Levels

Guidelines:
- Use quantitative data to support conclusions
- Consider both absolute values and relative comparisons
- Identify strengths and weaknesses
- Assess long-term investment viability
- Note any red flags in financials

Format your response as a comprehensive fundamental analysis report.`,
      ],
      [
        'human',
        `Analyze company fundamentals for {ticker} as of {date}.

Context from previous analyses:
Market Analysis: {marketAnalysis}
News Analysis: {newsAnalysis}

Provide:
1. Company overview and business model
2. Valuation assessment (fairly valued, overvalued, undervalued)
3. Financial health analysis
4. Growth prospects
5. Investment quality rating`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`💼 Fundamentals Analyst analyzing ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        date: state.date,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
        newsAnalysis: JSON.stringify(state.newsAnalysis || {}),
      });

      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      const toolCalls = (response as any).tool_calls || [];

      logger.info(`✅ Fundamentals Analyst completed for ${state.ticker}`);
      this.updateStatus('completed');

      return {
        ...state,
        fundamentalAnalysis: {
          agent: this.name,
          report: content,
          toolCalls: this.formatToolCalls(toolCalls),
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'fundamentals_analyst',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ Fundamentals Analyst error: ${error.message}`);
      
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
