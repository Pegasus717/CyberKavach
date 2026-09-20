import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";

const schema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  language: z.enum(["en", "hi"]).optional(),
  country: z.enum(["IN", "US", "UK"]).optional(),
});

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const patch: Record<string, string> = {};
  if (parsed.data.displayName) patch.display_name = parsed.data.displayName;
  if (parsed.data.language) patch.language = parsed.data.language;
  if (parsed.data.country) patch.country = parsed.data.country;
  const { data, error } = await admin.from("profiles").update(patch).eq("id", auth.user.id).select("*").single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ profile: data });
}

export async function DELETE() {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { admin, response } = requireAdmin();
  if (!admin) return response;
  await admin.from("complaints").delete().eq("user_id", auth.user.id);
  await admin.from("scans").delete().eq("user_id", auth.user.id);
  return Response.json({ ok: true });
}
