import type { VercelRequest, VercelResponse} from '@vercel/node';
import { supabase } from '../../../src/db/supabase';

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
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const userId = 'demo-user'; // Use demo user for serverless

    console.log(`Fetching analysis history (limit: ${limitNum})`);

    const { data: results, error } = await supabase
      .from('AnalysisResult')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limitNum);

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: results || [],
    });
  } catch (error: any) {
    console.error(`Get history error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis history',
    });
  }
}
