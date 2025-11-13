import { NextRequest, NextResponse } from 'next/server';

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
    // Lazy load Supabase
    const { supabase } = await import('@/src/db/supabase');
    const id = params.id;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis ID is required' 
      }, { status: 400 });
    }

    const { data: analysis, error } = await supabase
      .from('AnalysisResult')
      .select('id, status, createdAt, completedAt')
      .eq('id', id)
      .single();

    if (error || !analysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Analysis not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        status: analysis.status,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
      },
    });
  } catch (error: any) {
    console.error('Error getting analysis status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
