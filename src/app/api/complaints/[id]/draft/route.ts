import { z } from "zod";
import { channelsXml } from "@/lib/channels";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { generateJson } from "@/lib/gemini";
import { DOCS_JSON_SCHEMA } from "@/lib/verdict";
import type { ComplaintDocument } from "@/lib/types";

const schema = z.object({
  fields: z.record(z.string(), z.string().max(2000)).default({}),
});

const SYSTEM = `You are Kavach Complaint Writer. Draft first-person documents using ONLY the facts the user provided. Never invent facts, amounts, dates, IDs, legal sections or contacts. Omit unknown items. Write in the requested language. Recovery is not guaranteed; this is guidance, not legal advice.`;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const country = (row.incident as { country?: string })?.country || "IN";
  const userText = [
    `Language: ${row.language === "hi" ? "Hindi" : "English"}`,
    `<channels>\n${channelsXml(country)}\n</channels>`,
    `Incident: ${JSON.stringify(row.incident)}`,
    `User-provided fields (use only these facts): ${JSON.stringify(parsed.data.fields)}`,
  ].join("\n");

  let documents: ComplaintDocument[];
  try {
    const raw = (await generateJson({
      systemInstruction: SYSTEM,
      userText,
      schema: DOCS_JSON_SCHEMA,
    })) as { documents: ComplaintDocument[] };
    documents = raw.documents;
  } catch {
    return jsonError("Could not draft documents just now. Try again.", 502);
  }

  const { data, error } = await admin
    .from("complaints")
    .update({
      fields: parsed.data.fields,
      documents,
      status: "drafted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ complaint: data });
}
