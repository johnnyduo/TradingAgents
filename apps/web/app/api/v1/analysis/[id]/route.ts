import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '@/src/db/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Analysis ID is required' });
    }

    const { data: result, error } = await supabase
      .from('AnalysisResult')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !result) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(`Get analysis error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis result',
    });
  }
}
