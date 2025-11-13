import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../../../src/db/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Analysis ID is required' 
      });
    }

    const { data: analysis, error } = await supabase
      .from('AnalysisResult')
      .select('id, status, createdAt, completedAt')
      .eq('id', id)
      .single();

    if (error || !analysis) {
      return res.status(404).json({ 
        success: false, 
        error: 'Analysis not found' 
      });
    }

    res.status(200).json({
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
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
