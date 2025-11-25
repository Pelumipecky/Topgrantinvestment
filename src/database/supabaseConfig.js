import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const envLabel = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
const missingVars = [
	!supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
	!supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
].filter(Boolean);
const isProductionLike = envLabel === 'production';

const createNoopClient = () => new Proxy({}, {
	get(_, prop) {
		throw new Error(
			`Supabase client is unavailable (${missingVars.join(', ') || 'unknown missing vars'}). ` +
			'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use this API.'
		);
	}
});

let supabaseInstance = null;

if (missingVars.length) {
	if (isProductionLike) {
		throw new Error(`Missing Supabase env vars: ${missingVars.join(', ')}. Set them in .env.local and Vercel project settings.`);
	}
	console.warn(
		`[supabaseConfig] Continuing without Supabase because ${missingVars.join(', ')} is missing in ${envLabel}.`
	);
	supabaseInstance = createNoopClient();
} else {
	const maskedSupabaseUrl = supabaseUrl.trim();
	const invalidUrlHints = ['supabase.com/dashboard', 'supabase.com/project'];
	if (invalidUrlHints.some((hint) => maskedSupabaseUrl.includes(hint))) {
		throw new Error('NEXT_PUBLIC_SUPABASE_URL must point to your project API endpoint (e.g. https://<project-ref>.supabase.co), not the dashboard URL.');
	}
	supabaseInstance = createClient(maskedSupabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = missingVars.length === 0;

// For backward compatibility, export these as undefined to prevent errors during transition
export const db = null;
export const storage = null;
export const auth = null;
const legacyDefault = null;
export default legacyDefault;