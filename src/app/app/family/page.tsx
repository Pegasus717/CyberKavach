"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { formatShareCode } from "@/lib/share-code";
import { api, initials } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Connection } from "@/lib/types";

export default function FamilyPage() {
  const { me, userId, connections, profiles, scans, reload } = useFamily();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [flip, setFlip] = useState(false);
  const [copied, setCopied] = useState(false);
  const formatted = me ? formatShareCode(me.share_code) : "---- ----";
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const invite = me ? `${origin}/join/${me.share_code}` : "";

  const incoming = connections.filter((c) => c.status === "pending" && c.addressee_id === userId);
  const outgoing = connections.filter((c) => c.status === "pending" && c.requester_id === userId);
  const accepted = connections.filter((c) => c.status === "accepted");

  async function sendRequest() {
    try {
      await api("/api/connections/request", { method: "POST", body: JSON.stringify({ code }) });
      toast.success("Request sent");
      setCode("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    await api(`/api/connections/${id}/respond`, { method: "POST", body: JSON.stringify({ action }) });
    await reload();
  }

  async function toggleShare(c: Connection, shares: boolean) {
    await api(`/api/connections/${c.id}/sharing`, { method: "PATCH", body: JSON.stringify({ shares }) });
    await reload();
  }

  async function remove(id: string) {
    await api(`/api/connections/${id}`, { method: "DELETE" });
    await reload();
  }

  const threatCounts = useMemo(() => {
    const map: Record<string, number> = {};
    scans.forEach((s) => {
      if (s.user_id !== userId && (s.level === "dangerous" || s.level === "likely_scam")) {
        map[s.user_id] = (map[s.user_id] || 0) + 1;
      }
    });
    return map;
  }, [scans, userId]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{t("family")}</h1>
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>{t("shareCode")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <button className="w-full text-left" onClick={() => setFlip((v) => !v)}>
            <motion.div animate={{ rotateY: flip ? 180 : 0 }} transition={{ type: "spring", duration: 0.4 }} className="relative h-40">
              <div className={`absolute inset-0 grid place-items-center rounded-3xl bg-primary/10 text-4xl font-semibold tracking-widest ${flip ? "invisible" : ""}`}>
                {formatted}
              </div>
              <div className={`absolute inset-0 grid place-items-center ${flip ? "" : "invisible"}`} style={{ transform: "rotateY(180deg)" }}>
                {invite ? <QRCodeSVG value={invite} size={128} /> : null}
              </div>
            </motion.div>
          </button>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={async () => {
                if (!formatted) return;
                await navigator.clipboard.writeText(formatted);
                setCopied(true);
                toast.success(t("copied"));
              }}
            >
              {copied ? "✓ " : ""}
              {t("copy")}
            </Button>
            <Button variant="outline" onClick={() => invite && navigator.clipboard.writeText(invite)}>
              Invite link
            </Button>
          </div>
        </CardContent>
      </Card>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendRequest();
        }}
      >
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX" />
        <Button type="submit">{t("addByCode")}</Button>
      </form>

      <Section title={t("incoming")}>
        {incoming.map((c) => (
          <Row key={c.id} name={profiles[c.requester_id]?.display_name || "Someone"}>
            <Button size="sm" onClick={() => respond(c.id, "accept")}>
              {t("accept")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => respond(c.id, "decline")}>
              {t("decline")}
            </Button>
          </Row>
        ))}
      </Section>
      <Section title={t("outgoing")}>
        {outgoing.map((c) => (
          <Row key={c.id} name={profiles[c.addressee_id]?.display_name || "Someone"} />
        ))}
      </Section>
      <Section title={t("connected")}>
        {accepted.length === 0 ? <p className="text-muted-foreground">{t("emptyFamily")}</p> : null}
        {accepted.map((c) => {
          const otherId = c.requester_id === userId ? c.addressee_id : c.requester_id;
          const shares = userId === c.requester_id ? c.requester_shares : c.addressee_shares;
          return (
            <Row key={c.id} name={profiles[otherId]?.display_name || "Family"}>
              <span className="text-sm text-muted-foreground">{threatCounts[otherId] || 0} shared</span>
              <label className="flex items-center gap-2 text-sm">
                {t("shareThreats")}
                <Switch checked={shares} onCheckedChange={(v) => toggleShare(c, Boolean(v))} />
              </label>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                {t("remove")}
              </Button>
            </Row>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ name, children }: { name: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-3">
      <Avatar>
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{name}</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
