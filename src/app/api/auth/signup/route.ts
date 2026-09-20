import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(80),
});

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createServerSupabase();
  if (!supabase) return jsonError("Supabase is not configured. Open /setup.", 503);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });
  if (error) return jsonError(error.message, 400);

  const { admin } = requireAdmin();
  if (admin && data.user) {
    await admin
      .from("profiles")
      .update({ display_name: parsed.data.displayName })
      .eq("id", data.user.id);
  }

  return Response.json({
    user: data.user,
    session: data.session,
    needsEmailConfirmation: !data.session,
  });
}
