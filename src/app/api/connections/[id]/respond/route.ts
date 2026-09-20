import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { canRespondToRequest } from "@/lib/share-code";

const schema = z.object({
  action: z.enum(["accept", "decline"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const { data: row } = await admin.from("connections").select("*").eq("id", id).maybeSingle();
  if (!row) return jsonError("Request not found.", 404);
  if (!canRespondToRequest({ currentUserId: auth.user.id, addresseeId: row.addressee_id, status: row.status })) {
    return jsonError("Only the person who received this request can respond while it is pending.", 403);
  }

  const { data, error } = await admin
    .from("connections")
    .update({
      status: parsed.data.action === "accept" ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ connection: data });
}
