"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { ScanResult } from "@/components/scan-result";
import type { Scan } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ScanPage() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    void supabase
      .from("scans")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) setError("This scan is not available.");
        else setScan(data as Scan);
      });
  }, [id]);

  if (error) {
    return (
      <div className="space-y-3">
        <p>{error}</p>
        <Button onClick={() => location.reload()}>Retry</Button>
      </div>
    );
  }
  if (!scan) return <Skeleton className="h-80 w-full rounded-3xl" />;
  return <ScanResult scan={scan} />;
}
