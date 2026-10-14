import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** The Supabase client, or null when the app runs without a backend (local demo). */
export const supabase = url && key ? createClient(url, key) : null;
export const SHOP_ID = import.meta.env.VITE_SHOP_ID || 'ryguys';
