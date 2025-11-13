import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { getCompanyFundamentalsTool } from '../tools/stock.tools';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { getCurrentDateTimeWithTimezone } from '../utils/date.utils';

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
        `You are an Elite Fundamental Analyst and Valuation Expert specializing in financial statement analysis, business modeling, and intrinsic value calculations. You analyze company fundamentals to assess long-term investment merit.

⚠️ CURRENT DATE & TIME: {currentDateTime}

⚠️ DATA SOURCE: You receive REAL-TIME fundamental data from financial APIs including current quarterly/annual reports, balance sheets, income statements, and cash flow data retrieved on {currentDateTime}.

ANALYSIS FRAMEWORK:

1. VALUATION METRICS (cite exact values from data):
   - P/E Ratio: Current value, compare to sector average and 5-year average
   - PEG Ratio: Factor in growth rate to assess if P/E is justified
   - P/B Ratio: Book value vs market value
   - P/S Ratio: Revenue multiple comparison
   - EV/EBITDA: Enterprise value vs operating earnings
   - Dividend Yield (if applicable): Current yield and payout ratio
   
   Classify as: Undervalued, Fairly Valued, or Overvalued with specific numbers

2. PROFITABILITY ANALYSIS:
   - Gross Margin: Exact percentage, trend direction (improving/declining)
   - Operating Margin: Efficiency metric with YoY comparison
   - Net Profit Margin: Bottom line profitability
   - ROE (Return on Equity): How efficiently shareholder capital is used
   - ROA (Return on Assets): Asset utilization efficiency
   - ROIC (Return on Invested Capital): Quality of capital allocation

3. GROWTH METRICS:
   - Revenue Growth: QoQ and YoY percentage growth rates
   - Earnings Growth: EPS growth trend (3-5 years)
   - Free Cash Flow Growth: Quality of earnings
   - Compare to industry growth rates

4. FINANCIAL HEALTH:
   - Debt-to-Equity Ratio: Leverage level and trend
   - Current Ratio: Short-term liquidity (should be > 1.5)
   - Quick Ratio: Immediate liquidity test
   - Interest Coverage: Can the company service its debt?
   - Free Cash Flow: Positive and growing?

5. QUALITY INDICATORS:
   - Revenue quality: Recurring vs one-time
   - Cash conversion: Are earnings turning into cash?
   - Capital efficiency: ROIC > WACC indicates value creation
   - Management effectiveness: Track record and capital allocation

6. COMPETITIVE POSITION:
   - Market share trends
   - Moat strength: Pricing power, brand value, network effects
   - Industry dynamics: Growing or declining sector

RESPONSE REQUIREMENTS:
- State exact financial ratios with sources
- Provide YoY and QoQ comparisons with percentages
- Calculate fair value estimates based on multiples
- Reference specific quarters/years from the data
- Compare to industry benchmarks when available

FORMATTING:
- NO markdown (no **, ###, bullets)
- Section titles with colons
- Conversational paragraphs with precise numbers
- Include currency symbols and units`,
      ],
      [
        'human',
        `Analyze company fundamentals for {ticker} as of {date}.

Context from previous analyses:
Market Analysis: {marketAnalysis}
News Analysis: {newsAnalysis}

=== LIVE FUNDAMENTAL DATA ===
{fundamentalData}
=== END DATA ===

Required Sections:

Financial Health Overview:
Start with the company's current financial position. State exact revenue, earnings, and cash flow figures from the most recent quarter. Compare to the same quarter last year (YoY growth). Assess the balance sheet strength with specific debt and cash figures.

Valuation Analysis:
Calculate and state each valuation multiple: P/E ratio with the specific number, compare to the 5-year average and sector median. Do the same for P/B, P/S, and EV/EBITDA. Determine if the stock is trading at a premium or discount, and by how much (in percentage terms).

Profitability Metrics:
⚠️ NOTE: If fundamental data indicates API rate limit or is unavailable, provide professional analysis based on:
- Sector average valuation multiples (P/E, P/S, EV/EBITDA)
- Comparative analysis to peer companies
- Business model assessment and competitive positioning
- Market cap and liquidity analysis
- Qualitative factors (brand strength, market share, competitive moats)

Profitability Analysis:
If financial data available: Report exact margin percentages and YoY comparisons.
If limited data: Assess relative profitability vs sector peers, business model margins, and operational efficiency indicators.

Growth Assessment:
If growth metrics available: Calculate YoY and CAGR for revenue, EPS, and FCF.
If limited data: Evaluate growth based on market share trends, sector growth rates, expansion plans, and competitive positioning.

Balance Sheet Strength:
If balance sheet data available: Report D/E ratio, current ratio, interest coverage with exact numbers.
If limited data: Assess financial health through: trading patterns (institutional ownership), market cap stability, dividend history, credit market indicators.

Quality of Earnings:
If cash flow data available: Compare net income to FCF and assess capital efficiency.
If limited data: Evaluate earnings quality through: consistency of results, business model sustainability, competitive advantages.

Intrinsic Value Estimate:
Use available data to estimate fair value through: (1) Sector-relative valuation (P/E vs peers), (2) Market cap to revenue ratio, (3) Growth-adjusted multiples (PEG approach), (4) Comparable company analysis.

Clearly indicate which metrics are from specific financial statements vs estimated using sector comparisons.`,
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
        currentDateTime: getCurrentDateTimeWithTimezone(),
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
