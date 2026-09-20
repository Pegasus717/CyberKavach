import { jsonError } from "@/lib/api";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabase();
  if (!supabase) return jsonError("Supabase is not configured. Open /setup.", 503);
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
