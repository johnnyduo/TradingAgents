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
- Clearly state your reasoning
- Quantify confidence level
- Set price targets and stop losses
- Consider market conditions`,
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

Provide your decision including:
1. Action (BUY/SELL/HOLD)
2. Confidence level (High/Medium/Low)
3. Position size recommendation
4. Price target
5. Stop loss level
6. Key reasoning
7. Risk factors`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`💰 Trader making decision for ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
        newsAnalysis: JSON.stringify(state.newsAnalysis || {}),
        fundamentalAnalysis: JSON.stringify(state.fundamentalAnalysis || {}),
        bullCase: JSON.stringify(state.bullCase || {}),
        bearCase: JSON.stringify(state.bearCase || {}),
        investDebate: JSON.stringify(state.investDebate || {}),
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
