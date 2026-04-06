import { createClient } from '@supabase/supabase-js';

// Prefer Vite env at build time; fall back to a GH Pages-friendly window.__ENV__
const url = import.meta?.env?.VITE_SUPABASE_URL || window?.__ENV__?.SUPABASE_URL;
const anonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY || window?.__ENV__?.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env missing. Set VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or provide public/env.js'
  );
}

export const supabase = createClient(url || '', anonKey || '');

