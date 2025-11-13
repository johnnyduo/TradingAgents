import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '@/src/db/supabase';
import { TradingGraph } from '@/src/graph/trading.graph';
import { nanoid } from 'nanoid';

const tradingGraph = new TradingGraph();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticker, date, selectedAnalysts, config } = req.body;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const userId = 'demo-user';
    const analysisDate = date || new Date().toISOString().split('T')[0];

    console.log(`Starting analysis for ${ticker}`);

    // Ensure demo user exists
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (!existingUser) {
      await supabase.from('User').insert({
        id: userId,
        email: 'demo@tradingagents.com',
        passwordHash: 'demo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Create analysis record
    const analysisId = nanoid();
    const { data: result, error: createError } = await supabase
      .from('AnalysisResult')
      .insert({
        id: analysisId,
        userId,
        ticker: ticker.toUpperCase(),
        date: analysisDate,
        config: config || {},
        state: {},
        decision: '',
        status: 'running',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError || !result) {
      throw new Error('Failed to create analysis result');
    }

    // Execute analysis asynchronously (non-blocking)
    executeAnalysisAsync(analysisId, ticker.toUpperCase(), analysisDate, config);

    // Return immediately with analysis ID
    return res.status(200).json({
      success: true,
      data: {
        id: result.id,
        status: 'running',
      },
    });
  } catch (error: any) {
    console.error(`Analysis error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start analysis',
    });
  }
}

// Background execution function (fire-and-forget)
async function executeAnalysisAsync(
  analysisId: string,
  ticker: string,
  date: string,
  config: any
) {
  try {
    console.log(`Starting execution for analysis ${analysisId}`);

    // Execute trading graph
    const finalState = await tradingGraph.execute({
      ticker,
      date,
      context: config?.context || '',
    });

    // Extract decision
    const decision = finalState.finalDecision?.decision || 'hold';

    // Update database
    await supabase
      .from('AnalysisResult')
      .update({
        state: finalState as any,
        decision,
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      .eq('id', analysisId);

    console.log(`✅ Analysis ${analysisId} completed: ${decision}`);
  } catch (error: any) {
    console.error(`❌ Analysis ${analysisId} failed:`, error);

    // Update status to failed
    await supabase
      .from('AnalysisResult')
      .update({
        status: 'failed',
        completedAt: new Date().toISOString(),
      })
      .eq('id', analysisId);
  }
}
