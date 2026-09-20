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
  const scanId = params.get("scan");
  const { scans, me } = useFamily();
  const scan = scans.find((s) => s.id === scanId);
  const { t, lang } = useI18n();
  const [chips, setChips] = useState<string[]>([]);
  const [description, setDescription] = useState(scan ? `${scan.verdict.summary}\n${scan.masked_text}` : "");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    setBusy(true);
    try {
      const res = await api<{ complaint: Complaint }>("/api/complaints/plan", {
        method: "POST",
        body: JSON.stringify({
          language: lang,
          country: me?.country || "IN",
          scanId,
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
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">{t("newComplaint")}</h1>
      <p className="text-sm text-muted-foreground">{t("recoveryDisclaimer")}</p>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setChips((c) => (c.includes(chip) ? c.filter((x) => x !== chip) : [...c, chip]))}
          >
            <Badge variant={chips.includes(chip) ? "default" : "outline"}>{chip}</Badge>
          </button>
        ))}
      </div>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} maxLength={2000} />
      <Button disabled={busy || description.length < 8} onClick={submit}>
        Build plan
      </Button>
    </div>
  );
}
