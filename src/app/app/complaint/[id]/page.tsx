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
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">{row.plan.urgency.toUpperCase()}</h1>
      <p>{row.plan.urgencyNote}</p>
      <p className="text-sm text-muted-foreground">{t("recoveryDisclaimer")}</p>
      {elapsed ? <p className="rounded-2xl bg-danger/10 px-3 py-2 text-danger">{elapsed}</p> : null}

      <ol className="space-y-3">
        {row.plan.steps.map((step, i) => {
          const channel = CHANNELS.find((c) => c.id === step.channelId);
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border p-4"
            >
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={Boolean(row.progress[step.id])}
                  onCheckedChange={(v) => toggle(step.id, Boolean(v))}
                />
                <div>
                  <p className="font-medium">
                    {step.timeCritical ? "⏱ " : ""}
                    {step.title}
                  </p>
                  <p className="text-muted-foreground">{step.detail}</p>
                  {channel?.phone ? (
                    <a className="text-primary underline" href={`tel:${channel.phone}`}>
                      {channel.phone}
                    </a>
                  ) : null}
                  {channel?.url ? (
                    <a className="ml-2 text-primary underline" href={channel.url} target="_blank" rel="noreferrer">
                      {channel.url}
                    </a>
                  ) : null}
                </div>
              </label>
            </motion.li>
          );
        })}
      </ol>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Facts we still need</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {row.plan.fieldsNeeded.map((field) => (
            <label key={field.key} className="block space-y-1">
              <span>
                {field.label}
                {field.required ? " *" : ""}
              </span>
              {field.type === "longtext" ? (
                <Textarea value={fields[field.key] || ""} onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })} />
              ) : (
                <Input
                  type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : "text"}
                  value={fields[field.key] || ""}
                  onChange={(e) => setFields({ ...fields, [field.key]: e.target.value })}
                />
              )}
              <span className="text-sm text-muted-foreground">{field.hint}</span>
            </label>
          ))}
          <Button onClick={draft}>{t("draftDocs")}</Button>
        </CardContent>
      </Card>

      {(row.documents || []).map((doc) => (
        <DocumentBlock key={doc.kind} title={doc.title} body={doc.body} />
      ))}
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
            {t("downloadTxt")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            {t("printPdf")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
