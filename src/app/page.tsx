"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";

const EXAMPLE = "Your account will be blocked. This is Inspector Sharma. You are under DIGITAL ARREST. Share OTP now.";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold">
          <Shield className="text-primary" /> Kavach
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setLang(lang === "en" ? "hi" : "en")}>
            {lang === "en" ? "हिन्दी" : "EN"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">{t("signup")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
      </header>
      <main className="grid flex-1 items-center gap-10 py-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{t("tagline")}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{t("privacy")}</p>
          <div className="mt-8 flex gap-3">
            <Button className="h-12 rounded-2xl px-6 text-base" asChild>
              <Link href="/signup">{t("getStarted")}</Link>
            </Button>
            <Button className="h-12 rounded-2xl px-6 text-base" variant="outline" asChild>
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <motion.div
            className="mx-auto grid size-40 place-items-center rounded-[2rem] bg-primary text-primary-foreground shadow-2xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.4 }}
          >
            <Shield className="size-20" />
          </motion.div>
          <div className="relative mt-8 overflow-hidden rounded-3xl border bg-card p-5 shadow-xl">
            <span className="mb-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide">
              {t("example")}
            </span>
            <p className="relative z-10">{EXAMPLE}</p>
            <motion.div
              className="scan-beam absolute inset-y-0 w-1/3"
              animate={{ x: ["-50%", "160%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
