import { NextResponse } from "next/server";
import { getEnvFlags, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const flags = getEnvFlags();
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  let supabaseReachable = false;
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

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: flags.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: flags.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: flags.SUPABASE_SERVICE_ROLE_KEY,
    GEMINI_API_KEY: flags.GEMINI_API_KEY,
    GEMINI_MODEL: flags.GEMINI_MODEL,
    supabaseReachable,
  });
}
