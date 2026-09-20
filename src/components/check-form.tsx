"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { maskText } from "@/lib/mask";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { useFamily } from "@/components/family-realtime";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Scan } from "@/lib/types";

export function CheckForm() {
  const params = useSearchParams();
  const shared = params.get("text") || "";
  const [text, setText] = useState(shared);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { t, lang } = useI18n();
  const { me } = useFamily();
  const router = useRouter();
  const localMask = useMemo(() => maskText(text), [text]);

  useEffect(() => {
    if (shared) setText(shared);
  }, [shared]);

  async function analyze() {
    setBusy(true);
    setStep(1);
    try {
      setTimeout(() => setStep(2), 200);
      const res = await api<{ scan: Scan }>("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ text, language: lang, country: me?.country || "IN" }),
      });
      setStep(3);
      router.push(`/app/scan/${res.scan.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyse");
      setStep(0);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeImage() {
    if (!file || !consent) return;
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const res = await api<{ scan: Scan }>("/api/analyze/image", {
        method: "POST",
        body: JSON.stringify({
          imageBase64: b64,
          mimeType: file.type,
          language: lang,
          country: me?.country || "IN",
          consent: true,
        }),
      });
      router.push(`/app/scan/${res.scan.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not analyse screenshot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("appName")}</h1>
        <p className="text-muted-foreground">{t("tagline")}</p>
      </div>
      <Card className="relative overflow-hidden rounded-3xl shadow-lg">
        {busy ? (
          <motion.div
            className="scan-beam pointer-events-none absolute inset-y-0 w-1/3"
            animate={{ x: ["-40%", "140%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        ) : null}
        <CardContent className="space-y-3 pt-6">
          <Label htmlFor="msg">{t("paste")}</Label>
          <Textarea id="msg" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={8} />
          <p className="text-sm text-muted-foreground">{text.length}/2000 · {t("privacy")}</p>
          {localMask.hits.length ? (
            <div className="flex flex-wrap gap-2">
              {localMask.hits.map((hit) => (
                <Badge key={hit.original + hit.token} variant="secondary">
                  {hit.token}
                </Badge>
              ))}
            </div>
          ) : null}
          <ol className="flex flex-wrap gap-2 text-sm">
            {["maskedLocally", "sentToAi", "buildingAdvice"].map((key, i) => (
              <li
                key={key}
                className={step > i ? "text-primary" : "text-muted-foreground"}
              >
                {i + 1}. {t(key as "maskedLocally")}
              </li>
            ))}
          </ol>
          <Button className="h-11 w-full rounded-2xl text-base" disabled={busy || text.trim().length < 3} onClick={analyze}>
            {t("analyze")}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="space-y-3 pt-6">
          <Label>{t("analyzeShot")}</Label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} />
            {t("screenshotConsent")}
          </label>
          <Button variant="outline" disabled={!file || !consent || busy} onClick={analyzeImage}>
            {t("analyzeShot")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
