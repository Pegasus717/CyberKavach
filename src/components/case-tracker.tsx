"use client";

import { useState } from "react";
import { Bell, BellRing, CheckCircle2, Clock, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client";
import { subscribeUserToPush } from "@/lib/push-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Complaint } from "@/lib/types";

export function CaseTracker({ complaint, onUpdate }: { complaint: Complaint; onUpdate: (c: Complaint) => void }) {
  const incident = (complaint.incident || {}) as Record<string, any>;
  const [ackNumber, setAckNumber] = useState(incident.ack_number || "");
  const [bankTicket, setBankTicket] = useState(incident.bank_ticket || "");
  const [reminders, setReminders] = useState(Boolean(incident.reminders_enabled));
  const [saving, setSaving] = useState(false);

  async function saveTracking() {
    setSaving(true);
    try {
      if (reminders && typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        await subscribeUserToPush();
      }

      const res = await api<{ complaint: Complaint }>(`/api/complaints/${complaint.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({
          ackNumber,
          bankTicket,
          remindersEnabled: reminders,
        }),
      });

      onUpdate(res.complaint);
      toast.success("Case tracking numbers and reminder settings saved!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update tracking info");
    } finally {
      setSaving(false);
    }
  }

  async function triggerReminderNow() {
    if (!ackNumber && !bankTicket) {
      toast.error("Please enter an Acknowledgement or Bank Ticket number first.");
      return;
    }

    const title = "Cyber Kavach Case Follow-Up Reminder";
    const body = `Reminder: Call bank nodal officer today regarding Ticket #${bankTicket || "N/A"} (Cyber Crime ACK #${ackNumber || "N/A"}). Check portal status!`;

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.png" });
    }

    toast.message(title, { description: body });
  }

  return (
    <Card className="rounded-[20px] border border-border shadow-sm bg-card overflow-hidden space-y-4 p-5">
      <CardHeader className="p-0 pb-3 border-b border-border/50 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
          <Clock className="size-5 text-brand" /> Case Tracker & Follow-Up Reminders
        </CardTitle>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20">
          Scam to Recovery Journey
        </span>
      </CardHeader>

      <CardContent className="p-0 space-y-5">
        {/* Tracking Numbers Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-2/60 border border-border/60">
          <div className="space-y-1.5">
            <Label htmlFor="ack" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>🏛️ Cyber Crime Portal ACK Number</span>
            </Label>
            <Input
              id="ack"
              placeholder="e.g. 238912903123 (1930 Portal)"
              value={ackNumber}
              onChange={(e) => setAckNumber(e.target.value)}
              className="rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>🏦 Bank Dispute Ticket Number</span>
            </Label>
            <Input
              id="ticket"
              placeholder="e.g. HDFC-DISP-9921"
              value={bankTicket}
              onChange={(e) => setBankTicket(e.target.value)}
              className="rounded-xl border-border bg-background text-xs"
            />
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground">
              <Switch checked={reminders} onCheckedChange={setReminders} />
              <span>Enable Scheduled Follow-Up Push Reminders</span>
            </label>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-semibold flex items-center gap-1.5 border-brand/40 text-brand hover:bg-brand/10"
                onClick={triggerReminderNow}
              >
                <BellRing className="size-3.5" />
                Test Reminder Now
              </Button>
              <Button
                size="sm"
                className="rounded-xl text-xs font-semibold bg-brand text-white hover:bg-brand-hover shadow-sm"
                disabled={saving}
                onClick={saveTracking}
              >
                {saving ? "Saving..." : "Save Case Tracking"}
              </Button>
            </div>
          </div>
        </div>

        {/* AI Escalation Roadmap & Timelines */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-4 text-brand" /> AI Escalation Roadmap
            </h3>
            <span className="text-[11px] text-muted-foreground font-medium">Timeline based on case facts</span>
          </div>

          <div className="space-y-2.5">
            {/* Step 1: Day 0 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 flex items-start gap-3">
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-safe-tint text-safe font-bold text-xs">
                0d
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <span>Report on Cyber Crime Helpline (1930 / cybercrime.gov.in)</span>
                  {ackNumber ? <CheckCircle2 className="size-3.5 text-safe shrink-0" /> : null}
                </p>
                <p className="text-muted-foreground">
                  ACK Number: <span className="font-mono font-semibold text-foreground">{ackNumber || "Not logged yet"}</span>.
                </p>
              </div>
            </div>

            {/* Step 2: Day 1 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 flex items-start gap-3">
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand font-bold text-xs">
                1d
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-foreground flex items-center gap-2">
                  <span>Notify Bank & File Chargeback Dispute Ticket</span>
                  {bankTicket ? <CheckCircle2 className="size-3.5 text-safe shrink-0" /> : null}
                </p>
                <p className="text-muted-foreground">
                  Ticket Number: <span className="font-mono font-semibold text-foreground">{bankTicket || "Not logged yet"}</span>. Request immediate account freeze & reversal.
                </p>
              </div>
            </div>

            {/* Step 3: Day 7 */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-background/50 flex items-start gap-3">
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-careful-tint text-careful font-bold text-xs">
                7d
              </div>
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-foreground">Follow-Up with Bank Nodal Officer & Cyber Cell</p>
                <p className="text-muted-foreground">
                  "Call the bank again today" & check status of frozen fraud accounts with police Cyber Cell.
                </p>
              </div>
            </div>

            {/* Step 4: Day 30 */}
            <div className="p-3.5 rounded-xl border border-danger/30 bg-danger-tint/30 flex items-start gap-3">
              <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-danger/20 text-danger font-bold text-xs">
                30d
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-danger">Escalate to RBI Banking Ombudsman (RBI CMS)</p>
                  <a
                    href="https://cms.rbi.org.in"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-brand hover:underline flex items-center gap-1 shrink-0"
                  >
                    Open RBI CMS <ExternalLink className="size-3" />
                  </a>
                </div>
                <p className="text-muted-foreground">
                  If the bank fails to resolve or refund within 30 days, submit a formal grievance with your Bank Ticket & Cyber ACK to RBI Ombudsman.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldAlert className="size-4 text-brand shrink-0" />
          <span>
            <b>Official Timeline Notice:</b> Please verify exact resolution deadlines and official procedures on{" "}
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="text-brand underline">
              cybercrime.gov.in
            </a>{" "}
            and{" "}
            <a href="https://rbi.org.in" target="_blank" rel="noreferrer" className="text-brand underline">
              rbi.org.in
            </a>.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
