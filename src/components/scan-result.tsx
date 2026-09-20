"use client";

import { useEffect, useState } from "react";
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
    <div className="space-y-5">
      {scan.source === "fallback" ? <Badge variant="secondary">{t("fallbackBadge")}</Badge> : null}
      <Card className="overflow-hidden rounded-3xl shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4">
          <Gauge score={score} level={scan.level} />
          <div>
            <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${levelClass(scan.level)}`}>
              <Icon className="size-4" aria-hidden />
              {levelLabel(scan.level, lang)}
            </p>
            <CardTitle className="mt-2 text-2xl">{scan.verdict.summary}</CardTitle>
            <p className="text-muted-foreground">{scan.scam_type.replaceAll("_", " ")}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("privacy")}
          </p>
          <div className="rounded-2xl bg-muted/60 p-4 text-[1.05rem] leading-7" aria-live="polite">
            {highlighted}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                speak(`${levelLabel(scan.level, lang)}. ${scan.verdict.summary}. ${scan.verdict.whatToDoNow.join(". ")}`, lang)
              }
            >
              {t("readAloud")}
            </Button>
            {scan.verdict.needsComplaintHelp ? (
              <Button asChild>
                <Link href={`/app/complaint/new?scan=${scan.id}`}>{t("complaintHelp")}</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <ListCard title={t("redFlags")} items={flags.map((f) => `"${f.quote}" — ${f.reason}`)} />
      <ListCard title={t("whatToDo")} items={scan.verdict.whatToDoNow} check />
      <ListCard title={t("whatNot")} items={scan.verdict.whatNotToDo} />
      <ListCard title={t("ifActed")} items={scan.verdict.ifAlreadyActed} />
      <WarningCard scan={scan} />
    </div>
  );
}

function ListCard({ title, items, check }: { title: string; items: string[]; check?: boolean }) {
  if (!items?.length) return null;
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", duration: 0.35 }}
              className="flex gap-2"
            >
              {check ? <input type="checkbox" className="mt-1 size-4 accent-[var(--primary)]" /> : null}
              <span>{item}</span>
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
  const parts: React.ReactNode[] = [];
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
