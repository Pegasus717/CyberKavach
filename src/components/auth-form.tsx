"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, CheckCircle2, ArrowRight, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      {/* Left Branding Hero Panel (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-[#0C1633] via-[#101A33] to-[#122250] text-[#DCE4FA] relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-brand/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-calm/20 blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand text-white shadow-lg">
            <Shield className="size-7" />
          </span>
          <span className="text-2xl font-bold tracking-tight text-white">
            Cyber Kavach
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand/20 text-brand-tint border border-brand/30">
            🛡️ AI Fraud & Scam Defense
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Protect your messages and family from cyber fraud.
          </h1>
          <p className="text-base text-[#DCE4FA]/80 leading-relaxed">
            Realtime AI scam analysis, digital arrest warning detection, family shield alerts, and automated official recovery complaints.
          </p>

          <div className="space-y-3 pt-4">
            {[
              "Instant Gemini AI verdict on SMS, WhatsApp & links",
              "Family realtime alert network for connected loved ones",
              "Official recovery complaint letter generation (Police & Banks)",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium text-white/90">
                <div className="grid size-6 shrink-0 place-items-center rounded-full bg-calm/20 text-calm">
                  <CheckCircle2 className="size-4" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-[#DCE4FA]/60 border-t border-white/10 pt-6">
          © {new Date().getFullYear()} Cyber Kavach. Built for citizen protection against cybercrime.
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
        {/* Mobile Header Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand text-white shadow-md">
            <Shield className="size-6" />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Cyber Kavach
          </span>
        </Link>

        {/* Spacious Auth Card */}
        <Card className="w-full max-w-[440px] rounded-[24px] border border-border shadow-2xl bg-card p-2 sm:p-4">
          <CardHeader className="space-y-2 text-center pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {mode === "signup" ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {mode === "signup"
                ? "Sign up for Cyber Kavach to protect yourself and your family."
                : "Sign in to access your Cyber Kavach scam dashboard."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            <form className="space-y-4" onSubmit={onSubmit}>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                    {t("displayName")}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="e.g. Rahul Sharma"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      minLength={2}
                      className="h-12 rounded-xl border-border bg-background/50 pl-10 text-sm font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  {t("email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-border bg-background/50 pl-10 text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  {t("password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-xl border-border bg-background/50 pl-10 text-sm font-medium"
                  />
                </div>
                {mode === "signup" && (
                  <p className="text-[11px] text-muted-foreground">Must be at least 8 characters</p>
                )}
              </div>

              <Button
                className="h-12 w-full rounded-xl text-base font-semibold bg-brand text-white hover:bg-brand-hover transition-colors shadow-md mt-2 flex items-center justify-center gap-2"
                disabled={busy}
                type="submit"
              >
                <span>{busy ? "Processing..." : mode === "signup" ? "Create Account" : "Sign In"}</span>
                {!busy && <ArrowRight className="size-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm border-t border-border/50 pt-4">
              <span className="text-muted-foreground">
                {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
              </span>
              <Link
                className="font-bold text-brand hover:underline"
                href={mode === "signup" ? "/login" : "/signup"}
              >
                {mode === "signup" ? "Sign In" : "Create one now"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
