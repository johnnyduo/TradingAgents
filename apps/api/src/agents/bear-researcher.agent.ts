import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

export class BearResearcherAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'Bear Researcher',
      role: 'Bearish Investment Thesis Developer',
      goal: 'Build a comprehensive bearish case highlighting risks and reasons to avoid investment',
      ...config,
    });
  }

  protected setupTools(): void {
    // Bear researcher doesn't need tools, synthesizes existing analyses
    this.tools = [];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Bear Researcher specializing in risk analysis and building bearish investment theses.

Your role is to:
1. Synthesize all analyst reports to identify risks and concerns
2. Emphasize negative catalysts and headwinds
3. Highlight vulnerabilities and weaknesses
4. Present the worst-case investment scenario
5. Build conviction for a SELL or AVOID recommendation

Guidelines:
- Be skeptical but fact-based
- Use concrete data from analyst reports
- Identify multiple bearish themes
- Challenge overly optimistic assumptions
- NO markdown formatting (**, ###, -)
- Use clear section titles with colons
- Include specific risk percentages

FORMATTING:
- Section titles: "Bearish Thesis:", "Risk Factors:", etc.
- Separate sections with blank lines
- Write in complete paragraphs with data`,
      ],
      [
        'human',
        `Build a bearish investment case for {ticker} based on the following analyses:

Market Analysis:
{marketAnalysis}

News Analysis:
{newsAnalysis}

Fundamental Analysis:
{fundamentalAnalysis}

Bull Case (to counter):
{bullCase}

Structure your response:

Bearish Thesis:
[Main bearish arguments with specific concerns]

Risk Factors:
[Key risks and red flags with data]

Downside Catalysts:
[Events that could trigger decline]

Counter Arguments:
[Challenge bullish claims with facts]

No markdown symbols, just natural paragraphs.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`🐻 Bear Researcher building case for ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
        newsAnalysis: JSON.stringify(state.newsAnalysis || {}),
        fundamentalAnalysis: JSON.stringify(state.fundamentalAnalysis || {}),
        bullCase: JSON.stringify(state.bullCase || {}),
      });

      const response = await this.llm.invoke(prompt);
      const content = response.content as string;

      logger.info(`✅ Bear Researcher completed for ${state.ticker}`);
      this.updateStatus('completed');

      return {
        ...state,
        bearCase: {
          agent: this.name,
          thesis: content,
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'bear_researcher',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ Bear Researcher error: ${error.message}`);
      
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
