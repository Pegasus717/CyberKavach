"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Flame, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [totalCampaigns, setTotalCampaigns] = useState(5);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

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
    <Card className="rounded-[20px] border border-border shadow-sm bg-card overflow-hidden transition-all duration-200">
      {/* Header with Open/Close Collapse Toggle */}
      <CardHeader
        className="p-4 sm:p-5 border-b border-border/50 bg-secondary/30 flex flex-row items-center justify-between cursor-pointer select-none hover:bg-secondary/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <Flame className="size-5 text-likely" /> Trending Scams This Week
          </CardTitle>
          {trending.length > 0 && (
            <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              {trending.length} Campaigns
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:flex items-center gap-1 font-medium">
            <Users className="size-3.5 text-brand" /> Network Protection Active
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            title={isOpen ? "Collapse panel" : "Expand panel"}
          >
            {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </CardHeader>

      {/* Collapsible Content */}
      {isOpen && (
        <CardContent className="p-4 sm:p-5 space-y-4">
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

          {/* Trending List Container Capped to Max 5 Visible Items with Inner Scroll */}
          {loading ? (
            <p className="text-xs text-muted-foreground p-2">Loading network threat intelligence...</p>
          ) : trending.length === 0 ? (
            <div className="text-xs text-muted-foreground space-y-1 p-2">
              <p className="font-semibold text-foreground">No repeat campaigns detected yet today.</p>
              <p>Every scan you run automatically checks against repeat scam fingerprints to protect the network.</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              {trending.map((campaign, idx) => (
                <div
                  key={campaign.fingerprint + idx}
                  className="p-3.5 rounded-xl border border-border/60 bg-background/50 space-y-2 hover:border-brand/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-foreground line-clamp-2">{campaign.summary}</span>
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
                      Seen {campaign.count} time{campaign.count > 1 ? "s" : ""}
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
      )}
    </Card>
  );
}
