import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const { data, error } = await supabase
  .from('userlogs')
  .select('id, email, idnum, name')
  .limit(10);

if (error) {
  console.error('Error fetching userlogs:', error);
  process.exit(1);
}

console.log('Userlogs sample:', data);
