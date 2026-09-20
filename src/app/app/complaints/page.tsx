"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { Complaint } from "@/lib/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ComplaintsPage() {
  const [rows, setRows] = useState<Complaint[]>([]);
  const { t } = useI18n();
  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    void supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data || []) as Complaint[]));
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("complaints")}</h1>
        <Button asChild>
          <Link href="/app/complaint/new">{t("newComplaint")}</Link>
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("recoveryDisclaimer")}</p>
      ) : (
        rows.map((row) => (
          <Link key={row.id} href={`/app/complaint/${row.id}`}>
            <Card className="mb-3 rounded-3xl">
              <CardContent className="pt-5">
                <p className="font-medium">{row.plan.urgency} · {row.status}</p>
                <p className="line-clamp-2 text-muted-foreground">{String((row.incident as { description?: string }).description || "")}</p>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
