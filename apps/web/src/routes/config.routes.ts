import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { supabase } from '../db/supabase';
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

    let { data: config } = await supabase
      .from('UserConfig')
      .select('*')
      .eq('userId', userId)
      .single();

    if (!config) {
      // Create default config
      const { data: newConfig, error } = await supabase
        .from('UserConfig')
        .insert({ userId })
        .select()
        .single();
      
      config = newConfig || undefined;
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

    const { data: config, error } = await supabase
      .from('UserConfig')
      .upsert({
        userId,
        ...validated,
      }, {
        onConflict: 'userId'
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update configuration',
      });
    }

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
