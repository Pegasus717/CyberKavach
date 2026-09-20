"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

type Health = {
  NEXT_PUBLIC_SUPABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
  SUPABASE_SERVICE_ROLE_KEY: boolean;
  GEMINI_API_KEY: boolean;
  GEMINI_MODEL: boolean;
  supabaseReachable: boolean;
  dbStatus?: Record<string, { ok: boolean; error: string | null }>;
  geminiStatus?: { ok: boolean; error: string | null };
};

const LABELS: { key: keyof Health; required: boolean; label: string }[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true, label: "NEXT_PUBLIC_SUPABASE_URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, label: "NEXT_PUBLIC_SUPABASE_ANON_KEY" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, label: "SUPABASE_SERVICE_ROLE_KEY (server only)" },
  { key: "GEMINI_API_KEY", required: false, label: "GEMINI_API_KEY (server only — optional; fallback analyzer works without it)" },
  { key: "GEMINI_MODEL", required: false, label: "GEMINI_MODEL (optional; defaults to gemini-2.5-flash)" },
  { key: "supabaseReachable", required: true, label: "Supabase reachable" },
];

export default function SetupPage() {
  const { t } = useI18n();
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/health?deep=1", { cache: "no-store" });
      setHealth((await res.json()) as Health);
    } catch {
      setError("Could not read /api/health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const missing = health
    ? LABELS.filter((row) => row.required && !health[row.key]).map((row) => row.label)
    : [];
  
  const tables = health?.dbStatus ? Object.entries(health.dbStatus) : [];
  const dbOk = tables.length > 0 && tables.every(([_, st]) => st.ok);

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Shield className="text-primary" /> Kavach
      </div>
      <Card className="rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle>Diagnostics & Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Copy <code>.env.local.example</code> to <code>.env.local</code>, fill the keys, run the SQL schema, then restart <code>npm run dev</code>.
          </p>
          {error ? <p className="text-danger">{error}</p> : null}
          
          <h3 className="font-semibold mt-4">Environment Variables</h3>
          <ul className="space-y-2">
            {LABELS.map((row) => {
              const ok = health?.[row.key];
              return (
                <li key={row.key} className="flex items-start justify-between gap-4 rounded-2xl border px-3 py-2">
                  <span className="text-sm">{row.label}</span>
                  <span className={ok ? "text-safe" : "text-danger"}>{ok ? "Present" : "Missing"}</span>
                </li>
              );
            })}
          </ul>

          {health?.dbStatus && (
            <>
              <h3 className="font-semibold mt-4">Database Schema</h3>
              <ul className="space-y-2">
                {tables.map(([table, st]) => (
                  <li key={table} className="flex flex-col gap-1 rounded-2xl border px-3 py-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Table: {table}</span>
                      <span className={st.ok ? "text-safe" : "text-danger"}>{st.ok ? "OK" : "Missing / Error"}</span>
                    </div>
                    {!st.ok && <span className="text-xs text-danger">{st.error}</span>}
                  </li>
                ))}
              </ul>
              {!dbOk && (
                <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger mt-2">
                  <strong>Missing tables detected.</strong> Please run the <code>supabase/schema.sql</code> file in your Supabase SQL Editor.
                </div>
              )}
            </>
          )}

          {health?.geminiStatus && (
            <>
              <h3 className="font-semibold mt-4">Gemini API</h3>
              <div className="flex flex-col gap-1 rounded-2xl border px-3 py-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">GenerateContent Test</span>
                  <span className={health.geminiStatus.ok ? "text-safe" : "text-danger"}>{health.geminiStatus.ok ? "OK" : "Error"}</span>
                </div>
                {!health.geminiStatus.ok && <span className="text-xs text-danger">{health.geminiStatus.error}</span>}
              </div>
            </>
          )}

          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? "Checking..." : "Re-check"}
            </Button>
            {(missing.length === 0 && dbOk) && (
              <Button asChild className="rounded-2xl">
                <Link href="/signup">Proceed to App</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
