import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../db/prisma';
import { z } from 'zod';

const router = Router();

const configSchema = z.object({
  llmProvider: z.enum(['openai', 'anthropic', 'google', 'ollama']).optional(),
  deepThinkLLM: z.string().optional(),
  quickThinkLLM: z.string().optional(),
  maxDebateRounds: z.number().int().min(1).max(10).optional(),
  maxRiskDiscussRounds: z.number().int().min(1).max(10).optional(),
  coreStockApis: z.string().optional(),
  technicalIndicators: z.string().optional(),
  fundamentalData: z.string().optional(),
  newsData: z.string().optional(),
});

// Get user configuration
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;

    let config = await prisma.userConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      // Create default config
      config = await prisma.userConfig.create({
        data: {
          userId,
        },
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

// Update user configuration
router.put('/', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const validated = configSchema.parse(req.body);

    const config = await prisma.userConfig.upsert({
      where: { userId },
      update: validated,
      create: {
        userId,
        ...validated,
      },
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Test LLM connection
router.post('/test-llm', authenticate, async (req, res, next) => {
  try {
    const { provider, model, apiKey } = req.body;

    // TODO: Implement LLM testing logic
    // For now, return success
    res.json({
      success: true,
      message: 'LLM test not yet implemented',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
