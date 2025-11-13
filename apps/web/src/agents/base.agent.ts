import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { StructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentStatus } from '@tradingagents/types';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface AgentConfig {
  name: string;
  role: string;
  goal: string;
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected llm: BaseChatModel;
  protected tools: StructuredTool[] = [];
  protected promptTemplate: ChatPromptTemplate;
  public name: string;
  public role: string;
  public goal: string;
  public status: AgentStatus = 'pending';

  constructor(agentConfig: AgentConfig) {
    this.name = agentConfig.name;
    this.role = agentConfig.role;
    this.goal = agentConfig.goal;

    // Initialize LLM based on provider
    this.llm = this.initializeLLM(agentConfig);

    // Initialize prompt template
    this.promptTemplate = this.createPromptTemplate();

    // Setup tools (available for agent to use)
    this.setupTools();

    logger.info(`✅ Initialized agent: ${this.name}`);
  }

  private initializeLLM(agentConfig: AgentConfig): BaseChatModel {
    const provider = agentConfig.provider || 'openai';
    const model = agentConfig.model || 'gpt-4-turbo-preview';
    const temperature = agentConfig.temperature ?? 0.7;
    const maxTokens = agentConfig.maxTokens || 4096;

    switch (provider) {
      case 'openai':
        if (!config.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured');
        }
        return new ChatOpenAI({
          openAIApiKey: config.OPENAI_API_KEY,
          modelName: model,
          temperature,
          maxTokens,
        });

      case 'anthropic':
        if (!config.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }
        return new ChatAnthropic({
          anthropicApiKey: config.ANTHROPIC_API_KEY,
          modelName: model,
          temperature,
          maxTokens,
        });

      case 'google':
        if (!config.GOOGLE_API_KEY) {
          throw new Error('GOOGLE_API_KEY not configured');
        }
        return new ChatGoogleGenerativeAI({
          apiKey: config.GOOGLE_API_KEY,
          modelName: model,
          temperature,
          maxTokens,
        });

      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  /**
   * Override this method to define agent-specific tools
   */
  protected setupTools(): void {
    // Base implementation - override in subclasses
  }

  /**
   * Override this method to define agent-specific prompt template
   */
  protected abstract createPromptTemplate(): ChatPromptTemplate;

  /**
   * Execute the agent with given state
   */
  abstract execute(state: any): Promise<any>;

  /**
   * Update agent status
   */
  updateStatus(status: AgentStatus): void {
    this.status = status;
    logger.debug(`Agent ${this.name} status: ${status}`);
  }

  /**
   * Format tool calls for logging/display
   */
  protected formatToolCalls(toolCalls: any[]): any[] {
    return toolCalls.map((call) => ({
      id: call.id,
      tool: call.name,
      args: call.args,
      result: null, // Will be filled after tool execution
    }));
  }
}
