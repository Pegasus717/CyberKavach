"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/components/i18n-provider";

export default function EvalPage() {
  const { t } = useI18n();
  const [out, setOut] = useState<{ accuracy: number; results: { id: string; match: boolean; predictedLevel: string; label: string }[]; note: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      setOut(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">{t("evalTitle")}</h1>
      <p className="text-muted-foreground">This set is synthetic and labeled for demo evaluation only.</p>
      <Button disabled={busy} onClick={run}>
        Run labeled set
      </Button>
      {out ? (
        <Card className="rounded-3xl">
          <CardContent className="space-y-2 pt-5">
            <p className="text-2xl font-semibold">{Math.round(out.accuracy * 100)}%</p>
            <p>{out.note}</p>
            <ul className="text-sm">
              {out.results.map((r) => (
                <li key={r.id}>
                  {r.id}: {r.label} → {r.predictedLevel} {r.match ? "✓" : "✗"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
