import { Server as SocketIOServer } from 'socket.io';
import { supabase } from '../db/supabase';
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

    // Ensure demo user exists
    if (userId === 'demo-user') {
      // Check if demo user exists first
      const { data: existingUser } = await supabase
        .from('User')
        .select('id')
        .eq('id', 'demo-user')
        .single();
      
      if (!existingUser) {
        // Create demo user if it doesn't exist
        const { error: insertError } = await supabase
          .from('User')
          .insert({
            id: 'demo-user',
            email: 'demo@tradingagents.com',
            passwordHash: 'demo', // Not used for demo
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        
        if (insertError) {
          logger.error('Failed to create demo user:', insertError);
        } else {
          logger.info('✅ Demo user created successfully');
        }
      }
    }

    // Create analysis result record
    const analysisId = nanoid();
    const { data: result, error: createError } = await supabase
      .from('AnalysisResult')
      .insert({
        id: analysisId,
        userId,
        ticker,
        date,
        config: config || {},
        state: {},
        decision: '',
        status: 'running',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !result) {
      logger.error('Failed to create analysis result:', createError);
      throw new Error('Failed to create analysis result');
    }

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
      const { error: updateError } = await supabase
        .from('AnalysisResult')
        .update({
          state: finalState as any,
          decision,
          status: 'completed',
          completedAt: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) {
        logger.error('Failed to update analysis result:', updateError);
      }

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
      const { error: updateError } = await supabase
        .from('AnalysisResult')
        .update({
          status: 'failed',
          completedAt: new Date().toISOString(),
        })
        .eq('id', analysisId);

      if (updateError) {
        logger.error('Failed to update failed analysis status:', updateError);
      }

      // Emit error event
      this.io.to(socketRoomId).emit('analysis:error', {
        analysisId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async getStatus(id: string) {
    const { data: result, error } = await supabase
      .from('AnalysisResult')
      .select('id, status, createdAt, completedAt')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to get analysis status:', error);
      return null;
    }

    return result;
  }

  async stopAnalysis(id: string) {
    // TODO: Implement analysis stopping logic
    // This would cancel the job in BullMQ
    logger.info(`Stop requested for analysis ${id}`);
  }

  async getResult(id: string, userId: string) {
    const { data: result, error } = await supabase
      .from('AnalysisResult')
      .select('*')
      .eq('id', id)
      .eq('userId', userId)
      .single();

    if (error) {
      logger.error('Failed to get analysis result:', error);
      return null;
    }

    return result;
  }

  async getHistory(params: {
    userId: string;
    limit: number;
    offset: number;
    ticker?: string;
  }) {
    const { userId, limit, offset, ticker } = params;

    let query = supabase
      .from('AnalysisResult')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ticker) {
      query = query.eq('ticker', ticker);
    }

    const { data: results, error } = await query;

    if (error) {
      logger.error('Failed to get analysis history:', error);
      return [];
    }

    return results || [];
  }
}
