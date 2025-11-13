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
- NO markdown formatting (**, ###, -)
- Use clear section titles with colons
- Include specific metrics and ratios

FORMATTING:
- Section titles: "Company Overview:", "Valuation:", etc.
- Separate sections with blank lines
- Write in complete paragraphs with numbers`,
      ],
      [
        'human',
        `Analyze company fundamentals for {ticker} as of {date}.

Context from previous analyses:
Market Analysis: {marketAnalysis}
News Analysis: {newsAnalysis}

Structure your response:

Company Overview:
[Business model and competitive position]

Valuation Analysis:
[P/E, PEG, and valuation assessment with numbers]

Financial Health:
[Revenue, margins, debt with specific metrics]

Growth Prospects:
[Growth rates and future potential]

Investment Quality:
[Overall rating and key takeaways]

No markdown symbols, just natural paragraphs with data.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`💼 Fundamentals Analyst analyzing ${state.ticker}`);

      // Fetch fundamentals data
      const toolResults: any[] = [];
      try {
        const fundResult = await this.tools[0].invoke({ ticker: state.ticker });
        toolResults.push({ tool: 'get_company_fundamentals', result: fundResult });
      } catch (error: any) {
        logger.warn(`Fundamentals fetch failed: ${error.message}`);
        toolResults.push({ tool: 'get_company_fundamentals', result: `Error: ${error.message}` });
      }

      const dataContext = toolResults.map(tr => `${tr.tool}: ${tr.result}`).join('\n\n');

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        date: state.date,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
        newsAnalysis: JSON.stringify(state.newsAnalysis || {}),
      });

      const response = await this.llm.invoke(`${prompt}\n\nFundamentals Data:\n${dataContext}`);
      const content = response.content as string;

      logger.info(`✅ Fundamentals Analyst completed for ${state.ticker}`);
      this.updateStatus('completed');

      return {
        ...state,
        fundamentalAnalysis: {
          agent: this.name,
          report: content,
          toolCalls: toolResults,
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
