"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Complaint } from "@/lib/types";

const CHIPS = [
  "lost money",
  "shared OTP/PIN",
  "clicked a link",
  "installed an app",
  "gave remote access",
  "account hacked",
  "threatened/blackmailed",
  "nothing lost yet",
];

export default function NewComplaintPage() {
  const params = useSearchParams();
  const initialScanId = params.get("scan");
  const { scans, me } = useFamily();
  const { t, lang } = useI18n();

  const [selectedScanId, setSelectedScanId] = useState<string | null>(initialScanId);
  const [chips, setChips] = useState<string[]>([]);
  const [description, setDescription] = useState(() => {
    const s = scans.find((x) => x.id === initialScanId);
    return s ? `${s.verdict.summary}\n\nOriginal Text:\n${s.masked_text}` : "";
  });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSelectScan = (scanId: string) => {
    const scan = scans.find((s) => s.id === scanId);
    if (!scan) return;
    setSelectedScanId(scanId);
    setDescription(`${scan.verdict.summary}\n\nOriginal Message:\n${scan.masked_text}`);
    toast.success("Loaded details from selected scan");
  };

  async function submit() {
    setBusy(true);
    try {
      const res = await api<{ complaint: Complaint }>("/api/complaints/plan", {
        method: "POST",
        body: JSON.stringify({
          language: lang,
          country: me?.country || "IN",
          scanId: selectedScanId,
          chips,
          description,
        }),
      });
      router.push(`/app/complaint/${res.complaint.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1 pb-2 border-b border-border/50">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("newComplaint")}</h1>
        <p className="text-xs text-muted-foreground">{t("recoveryDisclaimer")}</p>
      </div>

      {/* Select from recent checks feed section */}
      {scans.length > 0 && (
        <div className="space-y-3 rounded-[20px] border border-border p-5 bg-card shadow-sm">
          <label className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span>Select from your Recent Checks Feed</span>
            <span className="text-xs text-muted-foreground font-normal">No retyping required</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {scans.slice(0, 6).map((scan) => {
              const isSelected = selectedScanId === scan.id;
              return (
                <button
                  key={scan.id}
                  type="button"
                  onClick={() => handleSelectScan(scan.id)}
                  className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? "border-brand bg-brand/10 ring-1 ring-brand text-foreground"
                      : "border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground truncate">{scan.verdict.summary || scan.scam_type}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                      {scan.level}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-[11px] opacity-80">{scan.masked_text}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Action Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">What happened?</label>
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setChips((c) => (c.includes(chip) ? c.filter((x) => x !== chip) : [...c, chip]))}
            >
              <Badge
                variant={chips.includes(chip) ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1 rounded-xl text-xs transition-colors ${
                  chips.includes(chip) ? "bg-brand text-white" : "hover:bg-secondary"
                }`}
              >
                {chip}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Incident Description */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Incident Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened, or select a message above from your recent checks..."
          rows={7}
          maxLength={2000}
          className="rounded-xl border-border bg-background/50 text-sm leading-relaxed"
        />
      </div>

      <Button
        className="w-full h-12 rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-hover shadow-md"
        disabled={busy || description.length < 8}
        onClick={submit}
      >
        {busy ? "Building Recovery Plan..." : "Build Recovery Plan & Draft Complaints"}
      </Button>
    </div>
  );
}
