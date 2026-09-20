"use client";

import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import type { Profile, Scan } from "@/lib/types";
import { initials, levelClass, levelLabel } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AlertBanner({
  scan,
  sender,
  onOpen,
  onDismiss,
}: {
  scan: Scan;
  sender?: Profile;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { lang } = useI18n();
  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 top-3 z-50 mx-auto w-[min(92%,42rem)]"
      role="status"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3 rounded-3xl border bg-card/95 p-3 shadow-xl backdrop-blur">
        <span className="relative grid size-11 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-danger/30" />
          <Avatar>
            <AvatarFallback>{initials(sender?.display_name || "?")}</AvatarFallback>
          </Avatar>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">
            {sender?.display_name || "Family"} · {levelLabel(scan.level, lang)}
          </p>
          <p className={`inline-flex rounded-full px-2 py-0.5 text-xs ${levelClass(scan.level)}`}>
            <ShieldAlert className="mr-1 size-3" />
            {scan.scam_type.replaceAll("_", " ")}
          </p>
        </div>
        <Button size="sm" onClick={onOpen}>
          Open
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          ×
        </Button>
      </div>
    </motion.div>
  );
}
