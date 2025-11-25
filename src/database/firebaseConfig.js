import { createClient } from '@supabase/supabase-js';

// Supabase configuration — read credentials from environment only.
// Do NOT include secrets in source. Set these in your local `.env.local` (see .env.local.example).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For backward compatibility, export these as undefined to prevent errors during transition
export const db = null;
export const storage = null;
export const auth = null;
const legacyFirebaseCompat = null;
export default legacyFirebaseCompat;