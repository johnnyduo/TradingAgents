import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/db/supabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const userId = 'demo-user'; // Use demo user for serverless

    console.log(`Fetching analysis history (limit: ${limit})`);

    const { data: results, error } = await supabase
      .from('AnalysisResult')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: results || [],
    });
  } catch (error: any) {
    console.error(`Get history error: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get analysis history',
    }, { status: 500 });
  }
}
