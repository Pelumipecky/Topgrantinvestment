require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Create .env.local from .env.local.example and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(async () => {
  try {
    console.log('Looking up a non-admin user with idnum...');
    const { data: user, error: userErr } = await supabase
      .from('userlogs')
      .select('id, idnum, email')
      .neq('admin', true)
      .not('idnum', 'is', null)
      .limit(1)
      .maybeSingle();

    if (userErr) {
      console.error('Error fetching user:', userErr);
      process.exit(1);
    }

    if (!user || !user.idnum) {
      console.error('No suitable user found for test. Please create a user with an idnum first.');
      process.exit(1);
    }

    console.log('Using user:', user);

    const investment = {
      idnum: user.idnum,
      plan: 'Starter',
      status: 'Pending',
      capital: 100.00,
      roi: 0,
      bonus: 0,
      duration: 5,
      paymentoption: 'Bitcoin',
      authstatus: 'unseen',
      credited_roi: 0,
      credited_bonus: 0,
      created_at: new Date().toISOString()
    };

    console.log('Creating test investment for user idnum', user.idnum);
    const { data, error } = await supabase.from('investments').insert([investment]).select().single();

    if (error) {
      console.error('Error creating investment:', error);
      process.exit(1);
    }

    console.log('Created investment:', data);

    // Clean up: delete inserted test investment
    console.log('Cleaning up test investment...');
    const { error: delErr } = await supabase.from('investments').delete().eq('id', data.id);
    if (delErr) {
      console.error('Error deleting test investment:', delErr);
      process.exit(1);
    }

    console.log('Cleanup successful. Test complete.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
