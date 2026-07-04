import { createClient } from "@/lib/supabase/server";
import { getFavoriteTourIds } from "@/lib/queries";

// Returns the signed-in user's favorited tour IDs as a Set (empty if signed out).
export async function getFavoriteSet(): Promise<Set<string>> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return new Set();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Set();
    return new Set(await getFavoriteTourIds(user.id));
  } catch {
    return new Set();
  }
}
