"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { clearUnread } from "@/components/unread-store";
import { levelClass, levelLabel } from "@/lib/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingScamsPanel } from "@/components/trending-scams-panel";

export default function FeedPage() {
  const { scans, userId, profiles } = useFamily();
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState("family");

  useEffect(() => {
    clearUnread();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const rows = useMemo(() => {
    return scans.filter((s) => {
      if (filter === "mine") return s.user_id === userId;
      if (filter === "family") return s.user_id !== userId;
      return s.level === "dangerous";
    });
  }, [scans, filter, userId]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t("feed")}</h1>
      <TrendingScamsPanel />
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="mine">{t("mine")}</TabsTrigger>
          <TabsTrigger value="family">{t("familyFilter")}</TabsTrigger>
          <TabsTrigger value="dangerous">{t("dangerousOnly")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <AnimatePresence>
        {rows.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-3">
            {rows.map((scan) => (
              <motion.li layout key={scan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/app/scan/${scan.id}`}>
                  <Card className="rounded-3xl transition hover:shadow-md">
                    <CardContent className="flex items-start justify-between gap-3 pt-5">
                      <div>
                        <p className="font-medium">{profiles[scan.user_id]?.display_name || (scan.user_id === userId ? "You" : "Family")}</p>
                        <p className="line-clamp-2 text-muted-foreground">{scan.masked_text}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs ${levelClass(scan.level)}`}>
                        {levelLabel(scan.level, lang)}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Empty() {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed p-10 text-center">
      <svg viewBox="0 0 160 120" className="mb-4 w-40 text-primary" aria-hidden>
        <rect x="20" y="30" width="120" height="70" rx="16" fill="currentColor" opacity="0.12" />
        <path d="M80 18l28 12v22c0 18-12 30-28 34-16-4-28-16-28-34V30z" fill="currentColor" opacity="0.35" />
      </svg>
      <p className="max-w-sm text-muted-foreground">{t("emptyFeed")}</p>
    </div>
  );
}
