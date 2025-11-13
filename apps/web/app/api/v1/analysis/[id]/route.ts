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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    const { data: result, error } = await supabase
      .from('AnalysisResult')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`Get analysis error: ${error.message}`);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get analysis result',
    }, { status: 500 });
  }
}
