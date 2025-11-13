import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

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
        `You are an experienced Trader making final investment decisions.

Your role is to:
1. Review all analyst reports and debate conclusions
2. Weigh bullish vs bearish arguments
3. Consider risk/reward ratio
4. Make a clear BUY, SELL, or HOLD decision
5. Determine position size based on confidence

Decision Framework:
- BUY: Strong bullish case with manageable risks
- SELL: Strong bearish case or better opportunities elsewhere
- HOLD: Insufficient conviction or balanced arguments

Position Sizing:
- High Confidence: 3-5% of portfolio
- Medium Confidence: 1-3% of portfolio
- Low Confidence: <1% or avoid

Guidelines:
- Be decisive but not reckless
- NO markdown formatting (**, ###, -)
- Use clear section titles with colons
- Include specific numbers (targets, stops, percentages)

FORMATTING:
- Section titles: "Trading Decision:", "Confidence Level:", etc.
- Separate sections with blank lines
- Write in complete paragraphs`,
      ],
      [
        'human',
        `Make a trading decision for {ticker} based on:

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

Investment Debate Result:
{investDebate}

Structure your response:

Trading Decision:
[BUY/SELL/HOLD with clear reasoning]

Confidence Level:
[High/Medium/Low with percentage if possible]

Position Sizing:
[Recommended position size and why]

Price Targets:
[Entry, target, and stop loss with specific numbers]

Risk Assessment:
[Key risks and how to manage them]

No markdown symbols, just natural paragraphs with specific data.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`💰 Trader making decision for ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
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
