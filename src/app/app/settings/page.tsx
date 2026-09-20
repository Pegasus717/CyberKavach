"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  const { me, reload } = useFamily();
  const { t, lang, setLang, largeText, setLargeText, soundOn, setSoundOn } = useI18n();
  const [name, setName] = useState(me?.display_name || "");
  const router = useRouter();

  async function save() {
    await api("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ displayName: name, language: lang, country: me?.country || "IN" }),
    });
    toast.success("Saved");
    await reload();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-semibold">{t("settings")}</h1>
      <Card className="rounded-3xl">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>{t("displayName")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant={lang === "en" ? "default" : "outline"} onClick={() => setLang("en")}>
              English
            </Button>
            <Button variant={lang === "hi" ? "default" : "outline"} onClick={() => setLang("hi")}>
              हिन्दी
            </Button>
          </div>
          <div className="space-y-2">
            <Label>{t("country")}</Label>
            <select
              className="h-10 w-full rounded-xl border bg-transparent px-3"
              value={me?.country || "IN"}
              onChange={(e) =>
                api("/api/profile", { method: "PATCH", body: JSON.stringify({ country: e.target.value }) }).then(() => reload())
              }
            >
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>
          <label className="flex items-center justify-between">
            {t("largeText")}
            <Switch checked={largeText} onCheckedChange={setLargeText} />
          </label>
          <label className="flex items-center justify-between">
            {t("sound")}
            <Switch checked={soundOn} onCheckedChange={setSoundOn} />
          </label>
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/app/eval">{t("evalTitle")}</Link>
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            await api("/api/auth/logout", { method: "POST" });
            router.push("/");
          }}
        >
          {t("signOut")}
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            if (!confirm("Delete your scans and complaints?")) return;
            await api("/api/profile", { method: "DELETE" });
            toast.success("Deleted");
            await reload();
          }}
        >
          {t("deleteData")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("privacy")}</p>
    </div>
  );
}
