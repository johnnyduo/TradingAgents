import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://rxgqyvgrbcddsbcybhok.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? '✓ Present' : '✗ Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test by querying the User table
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      process.exit(1);
    }

    console.log('✅ Connection successful!');
    console.log('Tables accessible:', data !== null ? 'Yes' : 'Yes (empty)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

testConnection();
