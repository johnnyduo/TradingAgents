import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { AnalysisService } from '../services/analysis.service';
import { strictRateLimiter } from '../middleware/rate-limit';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { logger } from '../utils/logger';

const analysisSchema = z.object({
  ticker: z.string().min(1).max(10),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectedAnalysts: z.array(z.enum(['market', 'social', 'news', 'fundamentals'])).optional(),
  config: z.object({}).passthrough().optional(),
});

export default (io: SocketIOServer) => {
  const router = Router();
  const analysisService = new AnalysisService(io);

  // Start new analysis (auth disabled for demo)
  router.post('/start', strictRateLimiter, async (req, res, next) => {
    try {
      const validated = analysisSchema.parse(req.body);
      // For demo: use fixed userId or get from auth
      const userId = (req as any).user?.id || 'demo-user';

      logger.info(`Starting analysis for ${validated.ticker} by user ${userId}`);

      const result = await analysisService.startAnalysis({
        ...validated,
        userId,
      });

      res.json({
        success: true,
        data: result,
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

  // Get analysis status (auth disabled for demo)
  router.get('/:id/status', async (req, res, next) => {
    try {
      const { id } = req.params;
      const status = await analysisService.getStatus(id);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Analysis not found',
        });
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  });

  // Stop analysis (auth disabled for demo)
  router.post('/:id/stop', async (req, res, next) => {
    try {
      const { id } = req.params;
      await analysisService.stopAnalysis(id);

      res.json({
        success: true,
        message: 'Analysis stopped',
      });
    } catch (error) {
      next(error);
    }
  });

  // Get analysis result (auth disabled for demo)
  router.get('/:id/result', async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = 'demo-user'; // Use demo user for demo mode

      const result = await analysisService.getResult(id, userId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Result not found',
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get history (auth disabled for demo)
  router.get('/history', async (req, res, next) => {
    try {
      const userId = 'demo-user'; // Use demo user for demo mode
      const { limit = '50', offset = '0', ticker } = req.query;

      const results = await analysisService.getHistory({
        userId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        ticker: ticker as string | undefined,
      });

      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
