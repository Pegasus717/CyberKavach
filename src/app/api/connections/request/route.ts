import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { normalizeShareCode } from "@/lib/share-code";

const schema = z.object({
  code: z.string().min(4).max(20),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const code = normalizeShareCode(parsed.data.code);
  const { data: target } = await admin.from("profiles").select("*").eq("share_code", code).maybeSingle();
  if (!target) return jsonError("That share code was not found.", 404);
  if (target.id === auth.user.id) return jsonError("You cannot connect with yourself.", 400);

  const { data: existing } = await admin
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${auth.user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${auth.user.id})`,
    )
    .maybeSingle();

  if (existing?.status === "accepted" || existing?.status === "pending") {
    return jsonError(
      existing.status === "accepted" ? "You are already connected." : "A request is already pending.",
      409,
    );
  }

  if (existing?.status === "declined") {
    const { data, error } = await admin
      .from("connections")
      .update({
        requester_id: auth.user.id,
        addressee_id: target.id,
        status: "pending",
        responded_at: null,
        requester_shares: true,
        addressee_shares: true,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);
    return Response.json({ connection: data });
  }

  const { data, error } = await admin
    .from("connections")
    .insert({
      requester_id: auth.user.id,
      addressee_id: target.id,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ connection: data });
}
