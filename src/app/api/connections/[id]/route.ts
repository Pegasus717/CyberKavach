import { jsonError } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const { admin, response } = await Promise.resolve(requireAdmin());
  if (!admin) return response;

  const { data: row } = await admin.from("connections").select("*").eq("id", id).maybeSingle();
  if (!row) return jsonError("Connection not found.", 404);
  if (row.requester_id !== auth.user.id && row.addressee_id !== auth.user.id) {
    return jsonError("You are not part of this connection.", 403);
  }
  const { error } = await admin.from("connections").delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return Response.json({ ok: true });
}
