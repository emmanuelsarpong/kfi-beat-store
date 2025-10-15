import { createClient } from "@supabase/supabase-js";

// Read env vars (Vite exposes only VITE_* to the client)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl) {
  // Early, readable error to help during local dev
  throw new Error("Missing VITE_SUPABASE_URL in environment");
}

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY in environment");
}

// Optionally, you can configure global options here (e.g., auth storage)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
