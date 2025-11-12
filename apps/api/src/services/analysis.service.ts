import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { nanoid } from 'nanoid';
import { TradingGraph } from '../graph/trading.graph';

interface StartAnalysisParams {
  ticker: string;
  date: string;
  selectedAnalysts?: string[];
  config?: any;
  userId: string;
}

export class AnalysisService {
  private tradingGraph: TradingGraph;

  constructor(private io: SocketIOServer) {
    this.tradingGraph = new TradingGraph();
  }

  async startAnalysis(params: StartAnalysisParams) {
    const { ticker, date, userId, selectedAnalysts, config } = params;

    // Generate room ID for WebSocket communication
    const socketRoomId = nanoid();

    // Create analysis result record
    const result = await prisma.analysisResult.create({
      data: {
        userId,
        ticker,
        date,
        config: config || {},
        state: {},
        decision: '',
        status: 'running',
      },
    });

    logger.info(`Created analysis ${result.id} for ${ticker} on ${date}`);

    // Execute analysis in background
    this.executeAnalysis(result.id, { ticker, date, selectedAnalysts, config }, socketRoomId)
      .catch((error) => {
        logger.error(`Analysis ${result.id} failed: ${error.message}`);
      });

    return {
      id: result.id,
      socketRoomId,
      status: 'running',
    };
  }

  private async executeAnalysis(
    analysisId: string,
    params: { ticker: string; date: string; selectedAnalysts?: string[]; config?: any },
    socketRoomId: string
  ) {
    try {
      logger.info(`Starting execution for analysis ${analysisId}`);

      // Emit start event
      this.io.to(socketRoomId).emit('analysis:started', {
        analysisId,
        ticker: params.ticker,
        timestamp: new Date().toISOString(),
      });

      // Execute trading graph
      const finalState = await this.tradingGraph.execute({
        ticker: params.ticker,
        date: params.date,
        context: params.config?.context || '',
      });

      // Extract decision
      const decision = finalState.finalDecision?.decision || 'hold';

      // Update database
      await prisma.analysisResult.update({
        where: { id: analysisId },
        data: {
          state: finalState as any,
          decision,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Emit completion event
      this.io.to(socketRoomId).emit('analysis:completed', {
        analysisId,
        decision,
        timestamp: new Date().toISOString(),
      });

      logger.info(`✅ Analysis ${analysisId} completed: ${decision}`);
    } catch (error: any) {
      logger.error(`❌ Analysis ${analysisId} failed: ${error.message}`);

      // Update status to failed
      await prisma.analysisResult.update({
        where: { id: analysisId },
        data: {
          status: 'failed',
          completedAt: new Date(),
        },
      });

      // Emit error event
      this.io.to(socketRoomId).emit('analysis:error', {
        analysisId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getStatus(id: string) {
    const result = await prisma.analysisResult.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return result;
  }

  async stopAnalysis(id: string) {
    // TODO: Implement analysis stopping logic
    // This would cancel the job in BullMQ
    logger.info(`Stop requested for analysis ${id}`);
  }

  async getResult(id: string, userId: string) {
    const result = await prisma.analysisResult.findFirst({
      where: {
        id,
        userId,
      },
    });

    return result;
  }

  async getHistory(params: {
    userId: string;
    limit: number;
    offset: number;
    ticker?: string;
  }) {
    const { userId, limit, offset, ticker } = params;

    const results = await prisma.analysisResult.findMany({
      where: {
        userId,
        ...(ticker && { ticker }),
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return results;
  }
}
