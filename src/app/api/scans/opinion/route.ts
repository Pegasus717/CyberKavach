import { z } from "zod";
import { fromZod, jsonError, readJson } from "@/lib/api";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sendSecondOpinionRequest, sendSecondOpinionVoteNotification } from "@/lib/family-notifications";
import type { FamilyOpinion } from "@/lib/types";

const schema = z.object({
  scanId: z.string().min(1),
  action: z.enum(["ask", "vote"]),
  vote: z.enum(["safe", "scam", "call_me"]).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson<unknown>(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);

  const { admin, response } = requireAdmin();
  if (!admin) return response;

  const { data: scan } = await admin
    .from("scans")
    .select("*")
    .eq("id", parsed.data.scanId)
    .maybeSingle();

  if (!scan) return jsonError("Scan not found.", 404);

  const { data: userProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  const userName = userProfile?.display_name || "Family Member";
  const verdict = { ...(scan.verdict || {}) };

  if (parsed.data.action === "ask") {
    verdict.askedFamilyAt = new Date().toISOString();
    const { data: updated, error } = await admin
      .from("scans")
      .update({ verdict, updated_at: new Date().toISOString() })
      .eq("id", scan.id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    // Send background push notification to connected family members
    void sendSecondOpinionRequest(updated as any, userName);

    return Response.json({ scan: updated });
  }

  if (parsed.data.action === "vote") {
    if (!parsed.data.vote) return jsonError("Vote parameter required.", 400);

    const opinions: FamilyOpinion[] = Array.isArray(verdict.opinions) ? [...verdict.opinions] : [];
    const existingIndex = opinions.findIndex((o) => o.userId === auth.user.id);
    const newOpinion: FamilyOpinion = {
      userId: auth.user.id,
      userName,
      vote: parsed.data.vote,
      votedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      opinions[existingIndex] = newOpinion;
    } else {
      opinions.push(newOpinion);
    }

    verdict.opinions = opinions;

    const { data: updated, error } = await admin
      .from("scans")
      .update({ verdict, updated_at: new Date().toISOString() })
      .eq("id", scan.id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 500);

    // Send background push notification to requester
    void sendSecondOpinionVoteNotification(updated as any, userName, parsed.data.vote);

    return Response.json({ scan: updated });
  }

  return jsonError("Invalid action.", 400);
}
