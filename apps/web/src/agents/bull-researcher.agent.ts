import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseAgent, AgentConfig } from './base.agent';
import { AgentState } from '@tradingagents/types';
import { logger } from '../utils/logger';

export class BullResearcherAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super({
      name: 'Bull Researcher',
      role: 'Bullish Investment Thesis Developer',
      goal: 'Build a comprehensive bullish case for investment based on all available analyses',
      ...config,
    });
  }

  protected setupTools(): void {
    // Bull researcher doesn't need tools, synthesizes existing analyses
    this.tools = [];
  }

  protected createPromptTemplate(): ChatPromptTemplate {
    return ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a Bull Researcher specializing in building strong bullish investment theses.

IMPORTANT: The analyst reports you receive contain LIVE, REAL-TIME market data, financial information, and news from APIs as of the current analysis date. This is current information, not historical - analyze it as such.

Your role is to:
1. Synthesize all real-time analyst reports into a coherent bullish narrative
2. Identify and emphasize positive catalysts from current data
3. Highlight growth opportunities based on live market information
4. Present the best-case investment scenario using actual data
5. Build conviction for a BUY recommendation with concrete evidence

Guidelines:
- You ARE working with current, live market and financial data
- Be optimistic but fact-based using the real data provided
- Use concrete data from analyst reports
- Identify multiple bullish themes from current information
- Address potential counterarguments preemptively
- NO markdown formatting (**, ###, -)
- Use clear section titles with colons
- Write in complete paragraphs with specific numbers

FORMATTING:
- Section titles: "Bullish Thesis:", "Key Catalysts:", etc.
- Separate sections with blank lines
- Include specific targets and percentages`,
      ],
      [
        'human',
        `Build a bullish investment case for {ticker} based on the following analyses:

Market Analysis:
{marketAnalysis}

News Analysis:
{newsAnalysis}

Fundamental Analysis:
{fundamentalAnalysis}

Structure your response:

Bullish Thesis:
[Main bullish arguments with specific data]

Key Catalysts:
[Events and factors that support upside]

Growth Opportunities:
[Potential for appreciation with targets]

Risk Assessment:
[Acknowledge risks but emphasize upside potential]

No markdown symbols, just natural paragraphs.`,
      ],
    ]);
  }

  async execute(state: AgentState): Promise<AgentState> {
    try {
      this.updateStatus('running');
      logger.info(`🐂 Bull Researcher building case for ${state.ticker}`);

      const prompt = await this.promptTemplate.format({
        ticker: state.ticker,
        marketAnalysis: JSON.stringify(state.marketAnalysis || {}),
        newsAnalysis: JSON.stringify(state.newsAnalysis || {}),
        fundamentalAnalysis: JSON.stringify(state.fundamentalAnalysis || {}),
      });

      const response = await this.llm.invoke(prompt);
      const content = response.content as string;

      logger.info(`✅ Bull Researcher completed for ${state.ticker}`);
      this.updateStatus('completed');

      return {
        ...state,
        bullCase: {
          agent: this.name,
          thesis: content,
          timestamp: new Date().toISOString(),
        },
        messages: [
          ...state.messages,
          {
            role: 'bull_researcher',
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error: any) {
      this.updateStatus('error');
      logger.error(`❌ Bull Researcher error: ${error.message}`);
      
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
