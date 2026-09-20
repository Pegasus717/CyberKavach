"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { maskText } from "@/lib/mask";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { useFamily } from "@/components/family-realtime";
import Link from "next/link";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Connection, Scan } from "@/lib/types";

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
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const raw = String(reader.result || "");
          resolve(raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw);
        };
        reader.onerror = () => reject(new Error("Could not read that image."));
        reader.readAsDataURL(file);
      });
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

  const { scans, connections, profiles } = useFamily();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 pb-2 border-b border-border/40">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("appName")}</h1>
        <p className="text-base text-muted-foreground">{t("tagline")}</p>
      </div>

      {/* 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Input Card & Screenshot Upload */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="relative overflow-hidden rounded-[20px] border border-border shadow-sm bg-card">
            {busy ? (
              <motion.div
                className="scan-beam pointer-events-none absolute inset-y-0 w-1/3 z-10"
                animate={{ x: ["-40%", "140%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              />
            ) : null}
            <CardContent className="space-y-4 p-6">
              {/* Elder Voice Mode Quick Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand/10 border border-brand/20">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand text-white font-bold text-xs">
                    <Mic className="size-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-foreground">Elder Voice Mode (वरिष्ठ नागरिक मोड)</p>
                    <p className="text-[11px] text-muted-foreground">Prefer speaking instead of typing? Use Hindi voice check.</p>
                  </div>
                </div>
                <Button asChild size="sm" className="rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover">
                  <Link href="/app/elder">Open Voice Check</Link>
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="msg" className="text-base font-semibold">{t("paste")}</Label>
                <Textarea
                  id="msg"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste SMS, WhatsApp message, email, or suspicious text here..."
                  maxLength={2000}
                  rows={7}
                  className="rounded-xl border-border bg-background/50 resize-none text-base"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{text.length}/2000</span>
                <span>🔒 {t("privacy")}</span>
              </div>

              {localMask.hits.length ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">Masked PII:</span>
                  {localMask.hits.map((hit) => (
                    <Badge key={hit.original + hit.token} variant="secondary" className="text-xs px-2 py-0.5 rounded-lg bg-secondary text-secondary-foreground">
                      {hit.token}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {step > 0 && (
                <ol className="flex flex-wrap gap-3 text-xs pt-1">
                  {["maskedLocally", "sentToAi", "buildingAdvice"].map((key, i) => (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-1 font-medium",
                        step > i ? "text-safe font-semibold" : "text-muted"
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {t(key as "maskedLocally")}
                    </li>
                  ))}
                </ol>
              )}

              <Button
                className="h-12 w-full rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-hover transition-colors shadow-md"
                disabled={busy || text.trim().length < 3}
                onClick={analyze}
              >
                {busy ? "Analyzing Message..." : t("analyze")}
              </Button>
            </CardContent>
          </Card>

          {/* Screenshot Upload Card */}
          <Card className="rounded-[20px] border border-border shadow-sm bg-card">
            <CardContent className="space-y-4 p-6">
              <Label className="text-base font-semibold">{t("analyzeShot")}</Label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(Boolean(v))}
                  className="mt-0.5"
                />
                <span>{t("screenshotConsent")}</span>
              </label>
              <Button
                variant="secondary"
                className="w-full rounded-xl font-medium"
                disabled={!file || !consent || busy}
                onClick={analyzeImage}
              >
                {t("analyzeShot")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Recent Scans + Family Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Scans Rail Card */}
          <Card className="rounded-[20px] border border-border shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-semibold tracking-tight text-foreground border-b border-border/50 pb-2">
                Recent Scans
              </h3>
              {scans.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent scans yet. Paste a message to start.</p>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {scans.slice(0, 5).map((scan: Scan) => (
                    <button
                      key={scan.id}
                      onClick={() => router.push(`/app/scan/${scan.id}`)}
                      className="w-full text-left p-2.5 rounded-xl border border-border/60 hover:bg-secondary/60 transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate text-foreground group-hover:text-brand transition-colors">
                          {scan.verdict.summary || scan.scam_type}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {scan.masked_text.substring(0, 45)}...
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase font-bold shrink-0 px-2 py-0.5 rounded-md",
                          scan.level === "safe"
                            ? "bg-safe-tint text-safe border-safe/30"
                            : scan.level === "dangerous"
                            ? "bg-danger-tint text-danger border-danger/30"
                            : "bg-careful-tint text-careful border-careful/30"
                        )}
                      >
                        {scan.level}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Family Status Rail Card */}
          <Card className="rounded-[20px] border border-border shadow-sm bg-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Family Shield Status
                </h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-brand" onClick={() => router.push("/app/family")}>
                  Manage
                </Button>
              </div>

              {connections.length === 0 ? (
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>No family members connected yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-xl"
                    onClick={() => router.push("/app/family")}
                  >
                    Connect Family
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {connections.slice(0, 4).map((con: Connection) => {
                    const otherId = con.requester_id === me?.id ? con.addressee_id : con.requester_id;
                    const other = profiles[otherId];
                    return (
                      <div key={con.id} className="flex items-center justify-between p-2 rounded-xl bg-surface-2 text-xs">
                        <span className="font-medium truncate text-foreground">
                          {other?.display_name || "Family Member"}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            con.status === "accepted" ? "bg-safe-tint text-safe" : "bg-careful-tint text-careful"
                          )}
                        >
                          {con.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
