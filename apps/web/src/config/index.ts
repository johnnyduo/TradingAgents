import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Authentication
  JWT_SECRET: z.string().optional(),

  // LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),

  // Data Vendors
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  FINNHUB_API_KEY: z.string().optional(),
  POLYGON_API_KEY: z.string().optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),

  // ChromaDB
  CHROMADB_URL: z.string().default('http://localhost:8000'),
});

type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const config = validateEnv();

// Default trading configuration
export const defaultTradingConfig = {
  llm: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4096,
  },
  analysts: {
    market: true,
    social: true,
    news: true,
    fundamentals: true,
  },
  debate: {
    investDebate: {
      maxRounds: 3,
      votingThreshold: 0.6,
    },
    riskDebate: {
      maxRounds: 2,
      votingThreshold: 0.5,
    },
  },
  dataVendors: {
    stock: 'alpha_vantage',
    news: 'alpha_vantage',
    social: 'reddit',
    fundamentals: 'alpha_vantage',
  },
  memory: {
    enabled: true,
    maxResults: 5,
  },
};
