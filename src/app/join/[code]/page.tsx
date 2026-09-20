"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOIN_CODE_KEY, formatShareCode, normalizeShareCode } from "@/lib/share-code";
import Link from "next/link";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const normalized = normalizeShareCode(code || "");
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (normalized) localStorage.setItem(JOIN_CODE_KEY, normalized);
  }, [normalized]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Shield className="text-primary" /> Kavach
      </div>
      <Card className="rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle>{t("joinTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-semibold tracking-widest">{formatShareCode(normalized)}</p>
          <p className="text-muted-foreground">
            Sign in or create an account. Kavach will send a family request to this code automatically.
          </p>
          <div className="flex gap-2">
            <Button className="h-11 flex-1 rounded-2xl" onClick={() => router.push("/signup")}>
              {t("signup")}
            </Button>
            <Button className="h-11 flex-1 rounded-2xl" variant="outline" onClick={() => router.push("/login")}>
              {t("login")}
            </Button>
          </div>
          <Link className="text-sm underline" href="/">
            Home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
