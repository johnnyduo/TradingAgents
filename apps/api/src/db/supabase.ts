import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the api directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase credentials in environment variables');
  logger.error(`SUPABASE_URL: ${supabaseUrl ? 'set' : 'missing'}`);
  logger.error(`SUPABASE_ANON_KEY: ${supabaseKey ? 'set' : 'missing'}`);
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

logger.info('✅ Supabase client initialized');
