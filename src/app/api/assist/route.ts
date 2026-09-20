import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";
import { getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { jsonError, fromZod, readJson } from "@/lib/api";

const reqSchema = z.object({
  scanId: z.string().uuid(),
  question: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  if (!checkRateLimit(user.id)) return jsonError("Too many requests", 429);

  const body = await readJson(req);
  const parsed = reqSchema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createServerSupabase();
  const { data: scan } = await supabase!.from("scans").select("*").eq("id", parsed.data.scanId).single();
  
  if (!scan) return jsonError("Scan not found", 404);

  const key = getGeminiApiKey();
  if (!key) return jsonError("AI unavailable", 503);

  const ai = new GoogleGenAI({ apiKey: key });
  
  const prompt = `You are Kavach, an anti-fraud assistant. A user is asking a question about a message they scanned.
<scanned_message>${scan.masked_text}</scanned_message>
<ai_analysis>${JSON.stringify(scan.verdict)}</ai_analysis>
User's Question: "${parsed.data.question}"

Answer the user directly, in the same language as their question. Be extremely concise, max 3 short sentences. 
Do not invent facts. If they ask about a link, tell them if it looks safe or not based on the analysis. If they ask what to do, refer to the advice.`;

  try {
    const aiRes = await ai.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
    });
    
    return NextResponse.json({ answer: aiRes.text || "I'm not sure." });
  } catch (e: any) {
    return jsonError(e.message || "AI failed", 500);
  }
}
