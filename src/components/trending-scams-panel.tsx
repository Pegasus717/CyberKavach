"use client";

import { useEffect, useState } from "react";
import { Flame, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TrendingCampaign = {
  fingerprint: string;
  count: number;
  todayCount: number;
  scamType: string;
  summary: string;
  excerpt: string;
  level: string;
  lastSeen: string;
};

export function TrendingScamsPanel() {
  const [trending, setTrending] = useState<TrendingCampaign[]>([]);
  const [totalToday, setTotalToday] = useState(7);
  const [totalCampaigns, setTotalCampaigns] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trending")
      .then((res) => res.json())
      .then((data) => {
        if (data.trending) setTrending(data.trending);
        if (data.totalToday) setTotalToday(data.totalToday);
        if (data.totalCampaignsDetected) setTotalCampaigns(data.totalCampaignsDetected);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card className="rounded-[20px] border border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Flame className="size-5 text-likely" /> Trending Scams This Week
        </CardTitle>
        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
          <Users className="size-3.5 text-brand" /> Network Protection Active
        </span>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Network Statistics Banner */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-2/60 border border-border/60 text-xs">
          <div>
            <p className="text-muted-foreground font-medium">Scans Today</p>
            <p className="text-lg font-extrabold text-foreground flex items-center gap-1">
              {totalToday} <span className="text-[10px] text-safe font-semibold">↑ Active</span>
            </p>
          </div>
          <div>
            <p className="text-muted-foreground font-medium">Repeat Campaigns</p>
            <p className="text-lg font-extrabold text-foreground flex items-center gap-1">
              {totalCampaigns} <span className="text-[10px] text-likely font-semibold">Identified</span>
            </p>
          </div>
        </div>

        {/* Trending List */}
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading network threat intelligence...</p>
        ) : trending.length === 0 ? (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">No repeat campaigns detected yet today.</p>
            <p>Every scan you run automatically checks against repeat scam fingerprints to protect the network.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trending.map((campaign, idx) => (
              <div
                key={campaign.fingerprint + idx}
                className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2 hover:border-brand/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground truncate">{campaign.summary}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1",
                      campaign.level === "safe"
                        ? "bg-safe-tint text-safe border-safe/30"
                        : campaign.level === "dangerous"
                        ? "bg-danger-tint text-danger border-danger/30"
                        : "bg-likely-tint text-likely border-likely/30"
                    )}
                  >
                    <TrendingUp className="size-3" />
                    Seen {campaign.count} times
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">
                  "{campaign.excerpt}"
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center border-t border-border/40 pt-3">
          🤝 <i>Every scan protects the next person. Anonymized fingerprints match repeat campaigns instantly.</i>
        </p>
      </CardContent>
    </Card>
  );
}
