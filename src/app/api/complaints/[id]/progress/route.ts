import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";

const schema = z.object({
  stepId: z.string().min(1).max(80).optional(),
  done: z.boolean().optional(),
  ackNumber: z.string().trim().max(100).optional(),
  bankTicket: z.string().trim().max(100).optional(),
  remindersEnabled: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const { data: row } = await admin
    .from("complaints")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!row) return jsonError("Complaint not found.", 404);

  const progress = { ...(row.progress as Record<string, boolean>) };
  if (parsed.data.stepId !== undefined && parsed.data.done !== undefined) {
    progress[parsed.data.stepId] = parsed.data.done;
  }

  const incident = { ...(row.incident as Record<string, unknown>) };
  if (parsed.data.ackNumber !== undefined) incident.ack_number = parsed.data.ackNumber;
  if (parsed.data.bankTicket !== undefined) incident.bank_ticket = parsed.data.bankTicket;
  if (parsed.data.remindersEnabled !== undefined) incident.reminders_enabled = parsed.data.remindersEnabled;

  const { data, error } = await admin
    .from("complaints")
    .update({ progress, incident, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ complaint: data });
}
