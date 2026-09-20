"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, PhoneCall, ShieldAlert, Users, Vote } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { useFamily } from "@/components/family-realtime";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FamilyOpinion, Scan } from "@/lib/types";

export function SecondOpinion({ initialScan }: { initialScan: Scan }) {
  const [scan, setScan] = useState<Scan>(initialScan);
  const [asking, setAsking] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const { userId, profiles, connections } = useFamily();
  const { lang } = useI18n();

  useEffect(() => {
    setScan(initialScan);
  }, [initialScan]);

  const isOwner = userId === scan.user_id;
  const verdict = scan.verdict || {};
  const opinions: FamilyOpinion[] = verdict.opinions || [];
  const askedAt = verdict.askedFamilyAt;

  const myVote = opinions.find((o) => o.userId === userId)?.vote;

  async function askFamily() {
    setAsking(true);
    try {
      const res = await api<{ scan: Scan }>("/api/scans/opinion", {
        method: "POST",
        body: JSON.stringify({ scanId: scan.id, action: "ask" }),
      });
      setScan(res.scan);
      toast.success(
        lang === "hi"
          ? "परिजनों से द्वितीय राय मांगी गई!"
          : "Asked your family for a second opinion!"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setAsking(false);
    }
  }

  async function castVote(vote: "safe" | "scam" | "call_me") {
    setVoting(vote);
    try {
      const res = await api<{ scan: Scan }>("/api/scans/opinion", {
        method: "POST",
        body: JSON.stringify({ scanId: scan.id, action: "vote", vote }),
      });
      setScan(res.scan);
      const labels = {
        safe: lang === "hi" ? "सुरक्षित" : "Safe",
        scam: lang === "hi" ? "ठगी/धोखा" : "Scam",
        call_me: lang === "hi" ? "कॉल करें" : "Call me",
      };
      toast.success(`Voted "${labels[vote]}" on this message!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cast vote");
    } finally {
      setVoting(null);
    }
  }

  return (
    <Card className="rounded-[20px] border border-brand/30 shadow-sm bg-gradient-to-b from-brand/5 to-card overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Users className="size-5 text-brand" />
          {lang === "hi" ? "परिजनों की राय (Human Second Opinion)" : "Family Second Opinion"}
        </CardTitle>
        {askedAt && (
          <Badge variant="secondary" className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand">
            {opinions.length} Vote{opinions.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Scenario 1: Scan Owner hasn't asked yet */}
        {isOwner && !askedAt && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "hi"
                ? "क्या आप एआई जाँच के अलावा परिवार के लोगों की इंसानी राय भी चाहते हैं? अपने परिजनों से पूछें।"
                : "Want a human sanity check alongside the AI verdict? Ask your connected family members."}
            </p>
            <Button
              className="w-full rounded-xl font-bold bg-brand text-white hover:bg-brand-hover shadow-md h-11 flex items-center justify-center gap-2 text-sm"
              disabled={asking}
              onClick={askFamily}
            >
              <Vote className="size-4" />
              {asking
                ? lang === "hi" ? "अनुरोध भेजा जा रहा है..." : "Asking Family..."
                : lang === "hi" ? "👨‍👩‍👧‍👦 परिजनों से पूछें (Ask My Family)" : "👨‍👩‍👧‍👦 Ask My Family"}
            </Button>
          </div>
        )}

        {/* Scenario 2: Scan Owner has asked family */}
        {isOwner && askedAt && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <span className="grid size-5 place-items-center rounded-full bg-safe-tint text-safe text-[10px] font-bold">✓</span>
              <span>{lang === "hi" ? "परिवार से द्वितीय राय मांगी गई है" : "Asked Family for Second Opinion"}</span>
            </div>

            {opinions.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-dashed border-border/80 text-xs text-muted-foreground text-center space-y-1">
                <p className="font-semibold text-foreground">
                  {lang === "hi" ? "परिजनों के जवाब की प्रतीक्षा है..." : "Waiting for family members to reply..."}
                </p>
                <p className="text-[11px]">
                  {lang === "hi"
                    ? "जब आपका परिवार वोट करेगा, उनके जवाब यहाँ तुरंत लाइव दिखेंगे।"
                    : "When your family votes, their replies will appear here live."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {opinions.map((op, idx) => (
                  <div
                    key={op.userId + idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-background/60 text-xs"
                  >
                    <span className="font-bold text-foreground">{op.userName}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        op.vote === "safe"
                          ? "bg-safe-tint text-safe border-safe/30"
                          : op.vote === "scam"
                          ? "bg-danger-tint text-danger border-danger/30"
                          : "bg-careful-tint text-careful border-careful/30"
                      }`}
                    >
                      {op.vote === "safe" && <CheckCircle2 className="size-3.5" />}
                      {op.vote === "scam" && <ShieldAlert className="size-3.5" />}
                      {op.vote === "call_me" && <PhoneCall className="size-3.5" />}
                      {op.vote === "safe" ? "Safe (सुरक्षित)" : op.vote === "scam" ? "Scam (ठगी)" : "Call me (कॉल करें)"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scenario 3: Family Member viewing the scan */}
        {!isOwner && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-brand/10 border border-brand/20 text-xs space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <MessageCircle className="size-4 text-brand" />
                {lang === "hi" ? "क्या यह संदेश असली है? (Is this real?)" : "Is this real?"}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {profiles[scan.user_id]?.display_name || "Family Member"}{" "}
                {lang === "hi"
                  ? "ने इस संदेश पर आपकी द्वितीय राय मांगी है:"
                  : "asked for your family opinion on this message."}
              </p>
            </div>

            {/* 3 Interactive Quick Vote Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Button
                variant={myVote === "safe" ? "default" : "outline"}
                className={`rounded-xl h-11 text-xs font-bold transition-all ${
                  myVote === "safe"
                    ? "bg-safe text-white hover:bg-safe"
                    : "border-safe/40 text-safe hover:bg-safe-tint"
                }`}
                disabled={Boolean(voting)}
                onClick={() => castVote("safe")}
              >
                🟢 {lang === "hi" ? "सुरक्षित" : "Safe"}
              </Button>

              <Button
                variant={myVote === "scam" ? "default" : "outline"}
                className={`rounded-xl h-11 text-xs font-bold transition-all ${
                  myVote === "scam"
                    ? "bg-danger text-white hover:bg-danger"
                    : "border-danger/40 text-danger hover:bg-danger-tint"
                }`}
                disabled={Boolean(voting)}
                onClick={() => castVote("scam")}
              >
                🔴 {lang === "hi" ? "ठगी/Scam" : "Scam"}
              </Button>

              <Button
                variant={myVote === "call_me" ? "default" : "outline"}
                className={`rounded-xl h-11 text-xs font-bold transition-all ${
                  myVote === "call_me"
                    ? "bg-careful text-white hover:bg-careful"
                    : "border-careful/40 text-careful hover:bg-careful-tint"
                }`}
                disabled={Boolean(voting)}
                onClick={() => castVote("call_me")}
              >
                📞 {lang === "hi" ? "कॉल करें" : "Call me"}
              </Button>
            </div>

            {myVote && (
              <p className="text-[11px] text-center text-muted-foreground pt-1">
                {lang === "hi" ? "आपका वोट दर्ज हो गया है!" : "Your vote has been submitted!"}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
