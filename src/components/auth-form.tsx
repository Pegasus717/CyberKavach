"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/app";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await api<{ needsEmailConfirmation?: boolean }>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify({ email, password, displayName }),
        });
        if (res.needsEmailConfirmation) {
          toast.message("Check your email to confirm, then sign in.");
          router.push("/login");
          return;
        }
      } else {
        await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not continue");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <Shield className="text-primary" /> Kavach
      </Link>
      <Card className="rounded-3xl shadow-xl">
        <CardHeader>
          <CardTitle>{mode === "signup" ? t("signup") : t("login")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="name">{t("displayName")}</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button className="h-11 w-full rounded-2xl" disabled={busy} type="submit">
              {mode === "signup" ? t("signup") : t("login")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {mode === "signup" ? (
              <Link className="underline" href="/login">
                {t("login")}
              </Link>
            ) : (
              <Link className="underline" href="/signup">
                {t("signup")}
              </Link>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
