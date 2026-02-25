import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config.js";

let _client: SupabaseClient | null = null;

/**
 * Lazy-initialised Supabase client using service-role key.
 */
export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(env.supabaseUrl(), env.supabaseServiceKey(), {
      auth: { persistSession: false },
    });
  }
  return _client;
}
