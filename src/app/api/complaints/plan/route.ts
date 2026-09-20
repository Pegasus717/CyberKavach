import { z } from "zod";
import { channelsXml } from "@/lib/channels";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { generateJson } from "@/lib/gemini";
import { PLAN_JSON_SCHEMA } from "@/lib/verdict";
import type { ComplaintPlan } from "@/lib/types";

const schema = z.object({
  language: z.enum(["en", "hi"]).default("en"),
  country: z.string().min(2).max(8).default("IN"),
  scanId: z.string().uuid().nullable().optional(),
  chips: z.array(z.string()).max(12),
  description: z.string().trim().min(8).max(2000),
});

const SYSTEM = `You are Kavach Complaint Writer. Create a recovery plan for an ordinary person. Use only official contacts in <channels>. Never invent phone numbers, URLs or legal sections. Put time-critical steps first (bank freeze, national helpline after money loss). Fields must match this incident, not a generic form. Write in the requested language at a Class-6 reading level. Recovery is not guaranteed; this is guidance, not legal advice.`;

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);
  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const userText = [
    `Language: ${parsed.data.language === "hi" ? "Hindi" : "English"}`,
    `Country: ${parsed.data.country}`,
    `<channels>\n${channelsXml(parsed.data.country)}\n</channels>`,
    `Incident chips: ${parsed.data.chips.join(", ") || "none"}`,
    `<incident>${parsed.data.description}</incident>`,
  ].join("\n");

  let plan: ComplaintPlan;
  try {
    plan = (await generateJson({
      systemInstruction: SYSTEM,
      userText,
      schema: PLAN_JSON_SCHEMA,
    })) as ComplaintPlan;
  } catch {
    return jsonError("Could not build a plan just now. Try again in a moment.", 502);
  }

  plan.steps = [...plan.steps].sort((a, b) => Number(b.timeCritical) - Number(a.timeCritical));

  const { data, error } = await admin
    .from("complaints")
    .insert({
      user_id: auth.user.id,
      scan_id: parsed.data.scanId ?? null,
      incident: { chips: parsed.data.chips, description: parsed.data.description, country: parsed.data.country },
      plan,
      language: parsed.data.language,
      status: "planning",
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return Response.json({ complaint: data });
}
