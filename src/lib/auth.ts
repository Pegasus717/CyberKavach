import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export async function requireUser(): Promise<
  | { user: User; response?: undefined }
  | { user?: undefined; response: NextResponse }
> {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return {
      response: NextResponse.json(
        { error: "Supabase is not configured. Open /setup." },
        { status: 503 },
      ),
    };
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { response: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }

  // Ensure profile row exists (sometimes auth triggers fail or are disabled)
  const admin = createAdminClient();
  if (admin) {
    const { data: profileExists, error: profileErr } = await admin
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
      
    if (!profileExists && !profileErr) {
      const { error: rpcErr } = await admin.rpc("handle_new_user", {});
      if (rpcErr) {
         // Fallback manual insert if RPC isn't trigger context
         const fallbackCode = Math.random().toString(36).substring(2, 10).toUpperCase();
         await admin.from("profiles").insert({
           id: data.user.id,
           display_name: data.user.email?.split("@")[0] || "User",
           share_code: fallbackCode
         });
      }
    }
  }

  return { user: data.user };
}

export function requireAdmin() {
  const admin = createAdminClient();
  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json(
        { error: "Supabase is not configured. Open /setup." },
        { status: 503 },
      ),
    };
  }
  return { admin, response: null as NextResponse | null };
}
