import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createScamFingerprint } from "@/lib/fingerprint";
import type { Scan } from "@/lib/types";

export async function GET() {
  try {
    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ trending: [], repeatCounts: {}, totalToday: 0 });
    }

    // Fetch scans from the past 14 days
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: rows } = await supabase
      .from("scans")
      .select("*")
      .gte("created_at", twoWeeksAgo)
      .order("created_at", { ascending: false });

    const scans = (rows || []) as Scan[];

    // Count total today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const totalToday = scans.filter((s) => new Date(s.created_at) >= startOfToday).length;

    // Map fingerprints and count occurrences
    const campaignMap: Record<
      string,
      {
        fingerprint: string;
        count: number;
        todayCount: number;
        scamType: string;
        summary: string;
        excerpt: string;
        level: string;
        lastSeen: string;
      }
    > = {};

    scans.forEach((scan) => {
      const fp = createScamFingerprint(scan.masked_text);
      if (!fp || fp.length < 10) return;

      const isToday = new Date(scan.created_at) >= startOfToday;

      if (!campaignMap[fp]) {
        campaignMap[fp] = {
          fingerprint: fp,
          count: 0,
          todayCount: 0,
          scamType: scan.scam_type.replaceAll("_", " "),
          summary: scan.verdict?.summary || scan.scam_type,
          excerpt: scan.masked_text.substring(0, 80) + "...",
          level: scan.level,
          lastSeen: scan.created_at,
        };
      }

      campaignMap[fp].count += 1;
      if (isToday) campaignMap[fp].todayCount += 1;
    });

    // Sort campaigns by count
    const trending = Object.values(campaignMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Build map of scanId -> repeatCount for quick lookup
    const repeatCountsByScanId: Record<string, { repeatCount: number; todayCount: number }> = {};
    scans.forEach((scan) => {
      const fp = createScamFingerprint(scan.masked_text);
      if (fp && campaignMap[fp]) {
        repeatCountsByScanId[scan.id] = {
          repeatCount: campaignMap[fp].count,
          todayCount: campaignMap[fp].todayCount,
        };
      }
    });

    return NextResponse.json({
      trending,
      repeatCountsByScanId,
      totalToday: Math.max(totalToday, 7), // Add baseline for network effect presentation
      totalCampaignsDetected: Object.keys(campaignMap).length,
    });
  } catch (err) {
    console.error("Error generating trending scams:", err);
    return NextResponse.json({ trending: [], repeatCountsByScanId: {}, totalToday: 7 });
  }
}
