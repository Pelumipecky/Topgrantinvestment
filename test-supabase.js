require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Create .env.local from .env.local.example and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');

  // Test basic connection
  const { data, error } = await supabase.from('investments').select('count').limit(1);
  if (error) {
    console.error('Connection error:', error);
    return;
  }

  console.log('Connection successful');

  // Get a pending investment
  const { data: investments, error: investError } = await supabase
    .from('investments')
    .select('*')
    .eq('status', 'Pending')
    .limit(1);

  if (investError) {
    console.error('Error fetching investments:', investError);
    return;
  }

  if (investments.length === 0) {
    console.log('No pending investments found');
    return;
  }

  const investment = investments[0];
  console.log('Found pending investment:', investment);
  console.log('Investment ID type:', typeof investment.id, 'Value:', investment.id);

  // Try to update it
  console.log('Attempting to update investment...');
  const { error: updateError } = await supabase
    .from('investments')
    .update({
      status: 'Active',
      authStatus: 'seen',
      updated_at: new Date().toISOString()
    })
    .eq('id', investment.id);

  if (updateError) {
    console.error('Update error:', updateError);
    console.error('Error code:', updateError.code);
    console.error('Error message:', updateError.message);
  } else {
    console.log('Update successful!');
  }
}

testConnection().catch(console.error);