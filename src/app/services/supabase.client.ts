import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oiehijtugtdgycoarier.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PWHnUiVPpZPsc2NKwJS9ag_sEbS7jlt';

let client: SupabaseClient;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      }
    });
  }
  return client;
}
