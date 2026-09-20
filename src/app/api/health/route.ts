import { NextResponse } from "next/server";
import { getEnvFlags, getSupabaseAnonKey, getSupabaseUrl, getServiceRoleKey, getGeminiApiKey, getGeminiModel } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const deep = urlObj.searchParams.get("deep") === "1";
  const flags = getEnvFlags();
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const roleKey = getServiceRoleKey();
  
  let supabaseReachable = false;
  let dbStatus = { profiles: { ok: false, error: "Not checked" }, connections: { ok: false, error: "Not checked" }, scans: { ok: false, error: "Not checked" }, complaints: { ok: false, error: "Not checked" } };
  let geminiStatus = { ok: false, error: "Not checked" };

  if (url && key) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: key },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      supabaseReachable = res.ok;
    } catch {
      supabaseReachable = false;
    }
  }

  if (deep) {
    // Check DB Tables
    if (url && roleKey) {
      // Use standard supabase-js via SSR for standard fetch
      const admin = createServerClient(url, roleKey, { cookies: { getAll: () => [], setAll: () => {} } });
      for (const table of ["profiles", "connections", "scans", "complaints"] as const) {
        const { error } = await admin.from(table).select("id").limit(1);
        if (error) {
           dbStatus[table] = { ok: false, error: error.message };
        } else {
           dbStatus[table] = { ok: true, error: "None" };
        }
      }
    } else {
      dbStatus = { profiles: { ok: false, error: "Missing keys" }, connections: { ok: false, error: "Missing keys" }, scans: { ok: false, error: "Missing keys" }, complaints: { ok: false, error: "Missing keys" } };
    }

    // Check Gemini
    const geminiKey = getGeminiApiKey();
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        await ai.models.generateContent({ model: getGeminiModel(), contents: "reply 'ok'" });
        geminiStatus = { ok: true, error: "None" };
      } catch (e: any) {
        geminiStatus = { ok: false, error: e.message || String(e) };
      }
    } else {
      geminiStatus = { ok: false, error: "Missing GEMINI_API_KEY" };
    }
  }

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: flags.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: flags.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: flags.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: flags.GEMINI_API_KEY,
    GEMINI_MODEL: flags.GEMINI_MODEL,
    supabaseReachable,
    ...(deep ? { dbStatus, geminiStatus } : {})
  });
}
