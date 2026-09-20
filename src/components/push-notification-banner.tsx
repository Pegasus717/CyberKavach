"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { subscribeUserToPush } from "@/lib/push-client";

export function PushNotificationBanner() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
          if (reg) {
            reg.pushManager.getSubscription().then((sub) => {
              if (sub) setSubscribed(true);
            });
          }
        });
      }
    }
  }, []);

  const enableBackgroundAlerts = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications are not supported in this browser.");
      return;
    }

    setLoading(true);
    try {
      const perm = await Notification.requestPermission();

      if (perm !== "granted") {
        toast.error("Notification permission was denied by your browser settings.");
        return;
      }

      const ok = await subscribeUserToPush();
      if (ok) {
        setSubscribed(true);
        toast.success("🔔 Background Alerts Enabled! You will receive family alerts even when your browser is closed.");
      } else {
        toast.error("Could not register Web Push subscription.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not enable background push alerts.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-safe/10 border border-safe/30 text-safe text-xs font-semibold">
        <Check className="size-4" />
        <span>Background Push & Email Alerts Active (Receives alerts even when app is closed)</span>
      </div>
    );
  }

  return (
    <Card className="rounded-[20px] border border-brand/30 bg-brand/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-md">
          <Bell className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            Enable Background Family Alerts (Tab Closed)
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get instant Push Notifications and Email Emergency Alerts whenever a connected family member encounters a dangerous scam, even when Cyber Kavach is closed.
          </p>
        </div>
      </div>

      <Button
        onClick={enableBackgroundAlerts}
        disabled={loading}
        className="w-full sm:w-auto shrink-0 rounded-xl bg-brand text-white hover:bg-brand-hover text-xs font-semibold h-10 px-4"
      >
        {loading ? "Enabling..." : "🔔 Enable Background Alerts"}
      </Button>
    </Card>
  );
}
