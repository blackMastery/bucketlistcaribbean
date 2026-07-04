import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role Supabase client — bypasses RLS and exposes auth.admin. SERVER
// ONLY: never import this from a Client Component or expose the key to the
// browser. Used by the admin access-management page + actions to list every
// admin (RLS hides other users' rows) and to create/promote auth users.

export const hasServiceRole = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
