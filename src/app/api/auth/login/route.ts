import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { createServerSupabase } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createServerSupabase();
  if (!supabase) return jsonError("Supabase is not configured. Open /setup.", 503);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return jsonError(error.message, 401);
  return Response.json({ user: data.user });
}
