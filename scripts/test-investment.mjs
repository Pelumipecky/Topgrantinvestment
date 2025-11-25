import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, anonKey);

const investment = {
  idnum: 83088560,
  plan: '7-Day Plan',
  status: 'Pending',
  capital: 100,
  roi: 0,
  bonus: 0,
  duration: 7,
  paymentOption: 'Bitcoin',
  authStatus: 'unseen'
};

const { data, error } = await supabase.from('investments').insert([investment]).select();

console.log('result:', { data, error });
