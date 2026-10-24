import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** The Supabase client, or null when the app runs without a backend (local demo). */
export const supabase = url && key ? createClient(url, key) : null;
/** Sign-in gates are on only when VITE_AUTH=on, so the UI can be reviewed without accounts. */
export const AUTH_ON = !!supabase && import.meta.env.VITE_AUTH === 'on';
export const SHOP_ID = import.meta.env.VITE_SHOP_ID || 'ryguys';
