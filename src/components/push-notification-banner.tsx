"use client";

import { useEffect, useState } from "react";
import { Bell, ShieldCheck, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VAPID_PUBLIC_KEY } from "@/lib/push-client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationBanner() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
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
      // 1. Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission was denied.");
        return;
      }

      // 2. Register Service Worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

        // 3. Subscribe to Web Push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        // 4. Save subscription to backend
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });

        if (!res.ok) throw new Error("Failed to save push subscription.");

        setSubscribed(true);
        toast.success("🔔 Background Alerts Enabled! You will now receive family alerts even when your browser is closed.");
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
