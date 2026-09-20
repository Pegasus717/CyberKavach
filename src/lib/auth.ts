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
  return { user: data.user };
}

export function requireAdmin() {
  const admin = createAdminClient();
  if (!admin) {
    return {
      admin: null as ReturnType<typeof createAdminClient>,
      response: NextResponse.json(
        { error: "Supabase is not configured. Open /setup." },
        { status: 503 },
      ),
    };
  }
  return { admin, response: null };
}
