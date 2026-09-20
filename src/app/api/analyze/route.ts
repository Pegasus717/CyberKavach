import { z } from "zod";
import { analyzeMaskedText } from "@/lib/analyze";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  text: z.string().trim().min(1, "Paste a message to check.").max(2000, "Keep the message under 2000 characters."),
  language: z.enum(["en", "hi"]).default("en"),
  country: z.string().min(2).max(8).default("IN"),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  if (!checkRateLimit(auth.user.id)) {
    return jsonError("Slow down — you can check 20 messages each minute.", 429);
  }
  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);

  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const result = await analyzeMaskedText(parsed.data);
  const { data, error } = await admin
    .from("scans")
    .insert({
      user_id: auth.user.id,
      masked_text: result.masked,
      risk_score: result.verdict.riskScore,
      level: result.level,
      scam_type: result.verdict.scamType,
      verdict: result.verdict,
      source: result.source,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);

  return Response.json({
    scan: data,
    hits: result.hits,
    signals: result.signals,
  });
}
