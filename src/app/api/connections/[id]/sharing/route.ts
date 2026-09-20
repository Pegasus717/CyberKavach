import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sharingColumnFor } from "@/lib/share-code";

const schema = z.object({ shares: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const { data: row } = await admin.from("connections").select("*").eq("id", id).maybeSingle();
  if (!row) return jsonError("Connection not found.", 404);
  const column = sharingColumnFor({
    currentUserId: auth.user.id,
    requesterId: row.requester_id,
    addresseeId: row.addressee_id,
  });
  if (!column) return jsonError("You are not part of this connection.", 403);

  const { data, error } = await admin
    .from("connections")
    .update({ [column]: parsed.data.shares })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ connection: data });
}
