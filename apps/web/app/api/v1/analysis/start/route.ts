import { NextRequest, NextResponse } from 'next/server';
// Lazy imports to prevent module initialization errors
// import { supabase } from '@/src/db/supabase';
// import { TradingGraph } from '@/src/graph/trading.graph';
import { nanoid } from 'nanoid';

// Route segment config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API] POST /api/v1/analysis/start - Request received');
    
    const body = await req.json();
    console.log('[API] Request body parsed:', { ticker: body.ticker });
    
    const { ticker, date, selectedAnalysts, config } = body;

    if (!ticker) {
      console.log('[API] Error: Ticker is required');
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const userId = 'demo-user';
    const analysisDate = date || new Date().toISOString().split('T')[0];

    console.log(`[API] Starting analysis for ${ticker}`);

    // Lazy load Supabase to prevent initialization errors
    const { supabase } = await import('@/src/db/supabase');

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
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        status: 'running',
      },
    });
  } catch (error: any) {
    console.error('[API] Analysis error:', error);
    console.error('[API] Error stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start analysis',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
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

    // Lazy load TradingGraph to prevent initialization errors
    const { TradingGraph } = await import('@/src/graph/trading.graph');
    
    // Initialize trading graph at runtime
    const tradingGraph = new TradingGraph();

    // Execute trading graph
    const finalState = await tradingGraph.execute({
      ticker,
      date,
      context: config?.context || '',
    });

    // Extract decision
    const decision = finalState.finalDecision?.decision || 'hold';

    // Lazy load Supabase for update
    const { supabase: supabaseClient } = await import('@/src/db/supabase');

    // Update database
    await supabaseClient
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
    console.error(`Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    // Lazy load Supabase for error handling
    const { supabase } = await import('@/src/db/supabase');
    
    // Update status to failed with error message
    await supabase
      .from('AnalysisResult')
      .update({
        status: 'failed',
        completedAt: new Date().toISOString(),
        error: error.message || 'Unknown error',
      })
      .eq('id', analysisId);
  }
}
