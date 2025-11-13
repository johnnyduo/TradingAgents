import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { getCurrentDateTimeWithTimezone } from '../utils/date.utils';

export class TraderAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'Trader',
      role: 'Trading Decision Maker',
      goal: 'Make final trading decision based on all analyses and debates',
      ...config,
    });
  }

  protected setupTools(): void {
    this.tools = [];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Professional Trader and Portfolio Manager making final investment decisions. You synthesize technical, fundamental, and sentiment analysis to make high-probability trades with optimal risk/reward ratios.

⚠️ CURRENT DATE & TIME: {currentDateTime}

⚠️ DECISION CONTEXT: All analyst reports contain LIVE, REAL-TIME data from financial APIs retrieved on {currentDateTime}. This includes current prices, live news sentiment, real-time fundamentals, and actual market conditions. You are making decisions on current market data, not historical information.

DECISION-MAKING FRAMEWORK:

1. SIGNAL CONFLUENCE ANALYSIS:
   Score each dimension from the analyst reports:
   - Technical Score: Trend, momentum, support/resistance alignment (0-10)
   - Fundamental Score: Valuation, growth, financial health (0-10)
   - Sentiment Score: News, social media, institutional positioning (0-10)
   - Risk Score: Volatility, liquidity, downside protection (0-10)
   
   Calculate weighted average for overall conviction level

2. TRADE DECISION CRITERIA:

   STRONG BUY (8-10 conviction):
   - Technical: Clear uptrend, bullish indicators, strong momentum
   - Fundamental: Undervalued with growth catalysts
   - Sentiment: Positive news flow, improving sentiment
   - Risk/Reward: 3:1 or better ratio
   - Position Size: 4-5% of portfolio
   
   BUY (6-7.9 conviction):
   - Technical: Bullish setup forming or consolidating
   - Fundamental: Fair value with positive outlook
   - Sentiment: Neutral to positive
   - Risk/Reward: 2:1 ratio minimum
   - Position Size: 2-3% of portfolio
   
   HOLD (4-5.9 conviction):
   - Mixed signals across analysis dimensions
   - Awaiting catalyst or breakout confirmation
   - Risk/reward not compelling enough
   - Position Size: Maintain existing if held, otherwise skip
   
   SELL (2-3.9 conviction):
   - Technical: Downtrend or broken support
   - Fundamental: Overvalued or deteriorating metrics
   - Sentiment: Negative news or sentiment shift
   - Risk/Reward: Unfavorable
   
   STRONG SELL (0-1.9 conviction):
   - Multiple bearish signals aligned
   - Significant downside risk
   - Better opportunities elsewhere

3. PRICE TARGET METHODOLOGY:
   - Entry Price: Specify exact level based on current price and support
   - Stop Loss: Place below key support (1-2 ATR), state exact price
   - Target 1: First resistance level or 1.5x risk
   - Target 2: Major resistance or 2-3x risk
   - Time Horizon: Days/weeks for expected move
   
   Calculate actual R:R ratio: (Target - Entry) / (Entry - Stop)

4. POSITION SIZING FORMULA:
   Base Size = Conviction Score × Base Risk Percentage
   Adjust for: Volatility (reduce if high), Liquidity, Portfolio correlation
   
   Max Position: 5% per trade
   Max Sector: 20% total exposure

5. RISK MANAGEMENT:
   - Identify specific risks from each analysis
   - Quantify potential downside ($ or %)
   - Define exit conditions beyond stop loss
   - Note correlation with market indices
   - Consider black swan scenarios

RESPONSE REQUIREMENTS:
- State numerical conviction score (0-10)
- Provide exact price levels (entry, stop, targets)
- Calculate and state R:R ratio
- Give specific position size percentage
- Cite specific data points from analyst reports
- Quantify potential upside/downside in dollars or percentages

FORMATTING:
- NO markdown (no **, ###, bullets)
- Section titles with colons
- Conversational but precise paragraphs
- Include specific numbers and prices`,
      ],
      [
        'human',
        `Make a trading decision for {ticker} as of {date}.

=== ANALYST REPORTS (LIVE DATA) ===

Market Analysis:
{marketAnalysis}

News Analysis:
{newsAnalysis}

Fundamental Analysis:
{fundamentalAnalysis}

Bull Case:
{bullCase}

Bear Case:
{bearCase}

Investment Debate Conclusion:
{investDebate}

=== END REPORTS ===

Required Sections:

Signal Confluence Analysis:
Score each dimension (Technical, Fundamental, Sentiment, Risk) from 0-10 based on the analyst reports above. Explain your scoring for each. Calculate the weighted average conviction score. State the specific data points from each report that influenced your scores.

Trading Decision:
State your decision: STRONG BUY, BUY, HOLD, SELL, or STRONG SELL. Explain your reasoning by referencing specific findings from the analyst reports. State your conviction score (0-10) and what level qualifies this decision.

Entry Strategy:
Specify the exact entry price or price range based on current price and technical levels from the market analysis. Explain whether to enter immediately at market or wait for a pullback/breakout to a specific level. State the exact price.

Price Targets:
Set two price targets with exact numbers. Target 1 should be the first major resistance or a conservative profit level. Target 2 should be the extended target if the move continues. Reference specific levels from the technical analysis. State expected timeframe for reaching each target.

Stop Loss Placement:
Specify the exact stop loss price based on technical support levels from the market analysis. Calculate the distance from entry in dollars and percentage terms. Explain the rationale (e.g., "below key support at $X identified in technical analysis").

Risk-Reward Calculation:
Calculate the actual R:R ratio: (Target Price - Entry Price) / (Entry Price - Stop Loss). Show your math with the specific numbers. State if this meets the minimum requirement (should be at least 2:1 for BUY decisions).

Position Sizing:
Based on your conviction score and the R:R ratio, recommend a specific position size as a percentage of portfolio (e.g., "3.5% of total portfolio value"). Explain your sizing based on conviction level and risk parameters.

Risk Factors:
List the top 3-5 specific risks identified in the bear case and other analyses. Quantify potential impact where possible (e.g., "earnings miss could cause 10-15% drop"). Explain how the stop loss and position sizing mitigate these risks.

Execution Plan:
Provide a step-by-step execution plan: When to enter (now vs wait), how to scale in (all at once vs multiple entries), when to take profits (sell half at Target 1?), and under what conditions to exit early beyond the stop loss.

Use exact prices, specific percentages, and concrete numbers throughout. Reference data points from the analyst reports to support each decision.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`💰 Trader making decision for ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        currentDateTime: getCurrentDateTimeWithTimezone(),
        marketAnalysis: state.marketAnalysis?.report || 'Not available',
        newsAnalysis: state.newsAnalysis?.report || 'Not available',
        fundamentalAnalysis: state.fundamentalAnalysis?.report || 'Not available',
        bullCase: state.bullCase?.thesis || 'Not available',
        bearCase: state.bearCase?.thesis || 'Not available',
        investDebate: state.investDebate?.summary || 'Not available',
      });

      const response = await this.llm.invoke(prompt);
      const content = response.content as string;

      // Parse decision from content
      let decision = 'hold';
      const contentLower = content.toLowerCase();
      if (contentLower.includes('buy') || contentLower.includes('bullish')) {
        decision = 'buy';
      } else if (contentLower.includes('sell') || contentLower.includes('bearish')) {
        decision = 'sell';
      }

      logger.info(`✅ Trader decision for ${state.ticker}: ${decision.toUpperCase()}`);
      this.updateStatus('completed');

      return {
        ...state,
        traderDecision: {
          agent: this.name,
          decision,
          reasoning: content,
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'trader',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ Trader error: ${error.message}`);
      
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
