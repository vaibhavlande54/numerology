// Supabase client initializer
// Replace the placeholders below with your Supabase project URL and anon key.
// Then the global `supabase` client will be available as `window.supabase`.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = '<REPLACE_WITH_SUPABASE_URL>'; // e.g. https://xyzcompany.supabase.co
const SUPABASE_ANON_KEY = '<REPLACE_WITH_SUPABASE_ANON_KEY>';

if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.indexOf('<REPLACE') === -1) {
    window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.info('Supabase client initialized');
} else {
    console.warn('Supabase client not initialized. Please set SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js');
}

// Optional helper: get current Supabase user (returns null if not available)
export async function getSupabaseUser() {
    if (!window.supabase) return null;
    try {
        const { data } = await window.supabase.auth.getUser();
        return data?.user || null;
    } catch (err) {
        return null;
    }
}
