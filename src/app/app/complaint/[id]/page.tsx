"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { CHANNELS } from "@/lib/channels";
import type { Complaint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CaseTracker } from "@/components/case-tracker";

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Complaint | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const { t } = useI18n();

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    void supabase
      .from("complaints")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRow(data as Complaint);
          setFields((data.fields as Record<string, string>) || {});
        }
      });
  }, [id]);

  const elapsed = useMemo(() => {
    const dt = Object.values(fields).find((v) => /^\d{4}-\d{2}-\d{2}T/.test(v));
    if (!dt) return null;
    const ms = Date.now() - new Date(dt).getTime();
    if (!Number.isFinite(ms) || ms < 0) return null;
    const mins = Math.floor(ms / 60000);
    return mins < 60 ? `${mins} min since incident` : `${Math.floor(mins / 60)} h since incident`;
  }, [fields]);

  if (!row) return null;

  const steps = row.plan?.steps ?? [];
  const fieldsNeeded = row.plan?.fieldsNeeded ?? [];
  const progress = row.progress ?? {};
  const urgencyLabel = row.plan?.urgency
    ? { critical: "🔴 CRITICAL", high: "🟠 HIGH URGENCY", normal: "🟢 Normal" }[row.plan.urgency] ?? row.plan.urgency.toUpperCase()
    : "Loading…";

  async function toggle(stepId: string, done: boolean) {
    const res = await api<{ complaint: Complaint }>(`/api/complaints/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ stepId, done }),
    });
    setRow(res.complaint);
  }

  async function draft() {
    try {
      const res = await api<{ complaint: Complaint }>(`/api/complaints/${id}/draft`, {
        method: "POST",
        body: JSON.stringify({ fields }),
      });
      setRow(res.complaint);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Draft failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{urgencyLabel}</h1>
          {elapsed ? <span className="rounded-xl bg-danger-tint px-3 py-1 text-xs font-bold text-danger border border-danger/30">{elapsed}</span> : null}
        </div>
        {row.plan?.urgencyNote ? <p className="text-sm text-foreground/90 leading-relaxed">{row.plan.urgencyNote}</p> : null}
        <p className="text-xs text-muted-foreground">{t("recoveryDisclaimer")}</p>
      </div>

      {/* 12-Column Grid: Steps (7 cols) + Document (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Case Tracker, Steps & Facts Needed */}
        <div className="lg:col-span-7 space-y-6">
          <CaseTracker complaint={row} onUpdate={setRow} />

          <Card className="rounded-[20px] border border-border shadow-sm bg-card p-5 space-y-4">
            <h2 className="text-lg font-bold text-foreground border-b border-border/50 pb-2">
              Guided Recovery Action Plan
            </h2>
            <ol className="space-y-3">
              {steps.map((step, i) => {
                const channel = CHANNELS.find((c) => c.id === step.channelId);
                return (
                  <motion.li
                    key={step.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-border/70 p-4 bg-surface-2/40 hover:bg-surface-2 transition-colors"
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={Boolean(progress[step.id])}
                        onCheckedChange={(v) => toggle(step.id, Boolean(v))}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-foreground leading-snug">
                          {step.timeCritical ? "⏱ " : ""}
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                          {channel?.phone ? (
                            <a className="text-brand font-medium hover:underline flex items-center gap-1" href={`tel:${channel.phone}`}>
                              📞 {channel.phone}
                            </a>
                          ) : null}
                          {channel?.url ? (
                            <a className="text-brand font-medium hover:underline flex items-center gap-1" href={channel.url} target="_blank" rel="noreferrer">
                              🌐 Official Portal
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </label>
                  </motion.li>
                );
              })}
            </ol>
          </Card>

          {fieldsNeeded.length > 0 && (
            <Card className="rounded-[20px] border border-border shadow-sm bg-card p-5 space-y-4">
              <h2 className="text-lg font-bold text-foreground border-b border-border/50 pb-2">
                Facts needed for Complaint Draft
              </h2>
              <div className="space-y-3">
                {fieldsNeeded.map((field) => (
                  <label key={field.key} className="block space-y-1 text-xs font-semibold text-foreground">
                    <span>
                      {field.label}
                      {field.required ? " *" : ""}
                    </span>
                    {field.type === "longtext" ? (
                      <Textarea
                        value={fields[field.key] || ""}
                        onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                        className="rounded-xl border-border bg-background text-xs"
                      />
                    ) : (
                      <Input
                        type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text"}
                        value={fields[field.key] || ""}
                        onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                        className="rounded-xl border-border bg-background text-xs"
                      />
                    )}
                    <span className="text-[11px] text-muted-foreground font-normal">{field.hint}</span>
                  </label>
                ))}
                <Button className="w-full rounded-xl bg-brand text-white hover:bg-brand-hover font-semibold" onClick={draft}>
                  {t("draftDocs")}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (5 cols): Draft Documents */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Generated Complaints
            </h2>
            {(row.documents || []).length === 0 ? (
              <Card className="rounded-[20px] border border-border shadow-sm bg-card p-5 text-center text-xs text-muted-foreground">
                Complete the facts on the left to generate formal complaint letters for Police, Banks, and Portals.
              </Card>
            ) : (
              (row.documents || []).map((doc) => (
                <DocumentBlock key={doc.kind} title={doc.title} body={doc.body} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentBlock({ title, body }: { title: string; body: string }) {
  const { t } = useI18n();
  const [text, setText] = useState(body);
  return (
    <Card className="print-doc rounded-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea className="min-h-48 font-[family-name:var(--font-devanagari)]" value={text} onChange={(e) => setText(e.target.value)} />
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(text)}>
            {t("copy")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([text], { type: "text/plain" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${title}.txt`;
              a.click();
            }}
          >
            Download TXT
          </Button>
          <Button variant="default" onClick={() => window.print()}>
            Save as PDF
          </Button>

        </div>
      </CardContent>
    </Card>
  );
}
