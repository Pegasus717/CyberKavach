import { z } from "zod";
import { analyzeMaskedText } from "@/lib/analyze";
import { jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { EVAL_CASES } from "@/lib/eval-cases";

const querySchema = z.object({
  language: z.enum(["en", "hi"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const language = querySchema.parse({ language: url.searchParams.get("language") || "en" }).language ?? "en";

  const results = [];
  for (const item of EVAL_CASES) {
    const out = await analyzeMaskedText({
      text: item.text,
      language,
      country: "IN",
    });
    const predictedDangerous = out.level === "likely_scam" || out.level === "dangerous";
    const expectedDangerous = item.label === "scam";
    results.push({
      id: item.id,
      label: item.label,
      predictedLevel: out.level,
      predictedScore: out.verdict.riskScore,
      source: out.source,
      match: predictedDangerous === expectedDangerous,
      synthetic: true,
    });
  }
  const accuracy = results.filter((r) => r.match).length / results.length;
  return Response.json({ accuracy, results, note: "This set is synthetic and labeled for demo evaluation only." });
}

export function GET() {
  return jsonError("POST this endpoint while signed in.", 405);
}
