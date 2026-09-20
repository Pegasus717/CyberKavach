"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import type { Scan } from "@/lib/types";
import { levelLabel } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";

export function WarningCard({ scan }: { scan: Scan }) {
  const ref = useRef<HTMLDivElement>(null);
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { width: 1080, height: 1080, pixelRatio: 1, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "kavach-warning.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Kavach warning", text: scan.verdict.summary });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "kavach-warning.png";
        a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(scan.verdict.summary)}`, "_blank");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-auto">
        <div
          ref={ref}
          className="mx-auto grid aspect-square w-[320px] place-content-center rounded-3xl border bg-background p-8 text-center shadow-lg"
        >
          <p className="text-sm tracking-widest text-primary">KAVACH</p>
          <h3 className="mt-3 text-3xl font-semibold">{levelLabel(scan.level, lang)}</h3>
          <p className="mt-4 text-lg">{scan.verdict.summary}</p>
          <p className="mt-6 text-sm text-muted-foreground">{scan.verdict.whatToDoNow[0]}</p>
        </div>
      </div>
      <Button onClick={share} disabled={busy} variant="outline">
        {t("warningCard")}
      </Button>
    </div>
  );
}
