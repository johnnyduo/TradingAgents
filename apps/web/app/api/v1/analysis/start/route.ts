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
  const TIMEOUT_MS = 280000; // 280 seconds (leave 20s buffer for Vercel's 300s limit)
  
  try {
    console.log(`[BG] Starting execution for analysis ${analysisId}`);
    console.log(`[BG] Environment check:`, {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasAlphaVantage: !!process.env.ALPHA_VANTAGE_API_KEY,
    });
    
    // Wrap execution in timeout
    const executionPromise = (async () => {
      // Lazy load TradingGraph to prevent initialization errors
      // Use FastTradingGraph by default for serverless (3 agents vs 6)
      const useFastMode = config?.fastMode !== false; // Default to fast mode
      
      console.log(`[BG] Loading graph module (${useFastMode ? 'Fast: 3 agents' : 'Full: 6 agents'})...`);
      
      let tradingGraph;
      if (useFastMode) {
        const { FastTradingGraph } = await import('@/src/graph/fast-trading.graph');
        console.log(`[BG] FastTradingGraph module loaded successfully`);
        tradingGraph = new FastTradingGraph();
        console.log(`[BG] FastTradingGraph initialized successfully`);
      } else {
        const { TradingGraph } = await import('@/src/graph/trading.graph');
        console.log(`[BG] TradingGraph module loaded successfully`);
        tradingGraph = new TradingGraph();
        console.log(`[BG] TradingGraph initialized successfully`);
      }

      // Execute trading graph
      console.log(`[BG] Executing trading graph for ${ticker}...`);
      const executionStart = Date.now();
      
      const finalState = await tradingGraph.execute({
        ticker,
        date,
        context: config?.context || '',
      });
      
      return { finalState, executionStart };
    })();
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout after 280 seconds')), TIMEOUT_MS);
    });
    
    // Race between execution and timeout
    const { finalState, executionStart } = await Promise.race([executionPromise, timeoutPromise]) as any;
    
    const executionTime = ((Date.now() - executionStart) / 1000).toFixed(2);
    console.log(`[BG] Trading graph execution completed in ${executionTime}s`);
    console.log(`[BG] Final state:`, {
      hasMarketAnalysis: !!finalState.marketAnalysis,
      hasFundamentalAnalysis: !!finalState.fundamentalAnalysis,
      hasTraderDecision: !!finalState.traderDecision,
      hasFinalDecision: !!finalState.finalDecision,
    });

    // Extract decision
    const decision = finalState.finalDecision?.decision || 'hold';
    console.log(`[BG] Decision extracted: ${decision}`);

    // Lazy load Supabase for update
    console.log(`[BG] Loading Supabase for database update...`);
    const { supabase: supabaseClient } = await import('@/src/db/supabase');

    // Update database
    console.log(`[BG] Updating database for analysis ${analysisId}...`);
    const { data: updateResult, error: updateError } = await supabaseClient
      .from('AnalysisResult')
      .update({
        state: finalState as any,
        decision,
        status: 'completed',
        completedAt: new Date().toISOString(),
      })
      .eq('id', analysisId);

    if (updateError) {
      console.error(`[BG] Database update error:`, updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log(`[BG] Database updated successfully`);
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
