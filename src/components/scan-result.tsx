"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { Scan } from "@/lib/types";
import { levelClass, levelLabel, speak } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { WarningCard } from "@/components/warning-card";

function IconFor(level: string) {
  if (level === "safe") return CheckCircle2;
  if (level === "careful") return ShieldQuestion;
  if (level === "likely_scam") return AlertTriangle;
  return ShieldAlert;
}

export function ScanResult({ scan }: { scan: Scan }) {
  const { t, lang } = useI18n();
  const reduce = useReducedMotion();
  const [score, setScore] = useState(reduce ? scan.risk_score : 0);
  const Icon = IconFor(scan.level);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setScore(Math.round(scan.risk_score * p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    if (scan.level === "dangerous" && navigator.vibrate) navigator.vibrate(80);
  }, [scan.risk_score, scan.level, reduce]);

  const flags = scan.verdict.redFlags || [];
  const highlighted = highlight(scan.masked_text, flags.map((f) => f.quote));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {scan.source === "fallback" ? (
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">Basic check only (AI unavailable)</Badge>
        ) : (
          <Badge variant="default" className="bg-brand/15 text-brand hover:bg-brand/25 border border-brand/20 px-3 py-1 text-sm font-medium">✨ Analyzed by AI</Badge>
        )}
      </div>

      {/* Full-width Hero Card */}
      <Card className="overflow-hidden rounded-[20px] shadow-sm border border-border bg-card">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-6 pb-4">
          <div className="flex items-center gap-6 flex-1">
            <Gauge score={score} level={scan.level} />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${levelClass(scan.level)}`}>
                  <Icon className="size-3.5" aria-hidden />
                  {levelLabel(scan.level, lang)}
                </span>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold leading-tight text-foreground">{scan.verdict.summary}</CardTitle>
              <p className="text-muted-foreground font-medium text-sm">{scan.scam_type.replaceAll("_", " ")}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="rounded-[16px] bg-secondary/60 p-4 text-[1.05rem] leading-7 border border-border/50" aria-live="polite">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original Message</p>
            {highlighted}
          </div>
        </CardContent>
      </Card>

      {/* 12-Column Grid: Content (8 cols) + Actions & Ask Kavach (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Content (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <ListCard title={t("redFlags")} items={flags.map((f) => `"${f.quote}" — ${f.reason}`)} />
          <ListCard title={t("whatToDo")} items={scan.verdict.whatToDoNow} check />
          <ListCard title={t("whatNot")} items={scan.verdict.whatNotToDo} />
          <ListCard title={t("ifActed")} items={scan.verdict.ifAlreadyActed} />
        </div>

        {/* Actions & Ask Kavach Rail (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <Card className="rounded-[20px] border border-border shadow-sm bg-card p-5 space-y-3">
            <h3 className="text-base font-semibold text-foreground border-b border-border/50 pb-2">Quick Actions</h3>
            <Button
              variant="outline"
              className="w-full rounded-xl flex items-center justify-center gap-2"
              onClick={() =>
                speak(`${levelLabel(scan.level, lang)}. ${scan.verdict.summary}. ${scan.verdict.whatToDoNow.join(". ")}`, lang)
              }
            >
              🔊 {t("readAloud")}
            </Button>
            {scan.verdict.needsComplaintHelp ? (
              <Button asChild className="w-full rounded-xl bg-brand text-white hover:bg-brand-hover">
                <Link href={`/app/complaint/new?scan=${scan.id}`}>{t("complaintHelp")}</Link>
              </Button>
            ) : null}
          </Card>

          <WarningCard scan={scan} />
          <AskKavach scanId={scan.id} />
        </div>
      </div>
    </motion.div>
  );
}

function AskKavach({ scanId }: { scanId: string }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnswer(data.answer);
      setQuestion("");
    } catch (err: any) {
      setAnswer("Sorry, I could not answer that. " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-3xl border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldQuestion className="size-5 text-primary" /> Ask Kavach
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {answer && (
          <div className="rounded-xl bg-background p-3 text-sm leading-relaxed border border-primary/10">
            {answer}
          </div>
        )}
        <form onSubmit={ask} className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Is this link safe? What if I paid?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading} size="sm" className="rounded-xl">
            {loading ? "..." : "Ask"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, items, check }: { title: string; items: string[]; check?: boolean }) {
  if (!items?.length) return null;
  return (
    <Card className="rounded-[1.2rem] shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-lg text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-4">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", duration: 0.35 }}
              className="flex items-start gap-3"
            >
              {check ? (
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              ) : (
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
              )}
              <span className="leading-relaxed text-[15px]">{item}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Gauge({ score, level }: { score: number; level: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const color =
    level === "safe" ? "var(--safe)" : level === "careful" ? "var(--careful)" : level === "likely_scam" ? "var(--scam)" : "var(--danger)";
  return (
    <svg viewBox="0 0 110 110" className="size-28 shrink-0" role="img" aria-label={`Risk score ${score}`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="currentColor" className="text-muted" strokeWidth="10" />
      <circle
        cx="55"
        cy="55"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="60" textAnchor="middle" className="fill-foreground text-2xl font-semibold">
        {score}
      </text>
    </svg>
  );
}

function highlight(text: string, quotes: string[]) {
  if (!quotes.length) return text;
  const parts: ReactNode[] = [];
  let rest = text;
  quotes.forEach((q, i) => {
    const idx = rest.indexOf(q);
    if (idx < 0) return;
    parts.push(rest.slice(0, idx));
    parts.push(
      <motion.mark
        key={`${q}-${i}`}
        initial={{ backgroundColor: "transparent" }}
        animate={{ backgroundColor: "color-mix(in oklch, var(--danger) 28%, transparent)" }}
        transition={{ delay: 0.2 + i * 0.12 }}
        className="rounded px-0.5"
      >
        {q}
      </motion.mark>,
    );
    rest = rest.slice(idx + q.length);
  });
  parts.push(rest);
  return parts;
}
