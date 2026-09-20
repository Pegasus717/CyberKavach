"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { Connection, Profile, Scan } from "@/lib/types";
import { AlertBanner } from "@/components/alert-banner";
import { bumpUnread, setUnreadCount } from "@/components/unread-store";
import { JOIN_CODE_KEY } from "@/lib/share-code";
import { useI18n } from "@/components/i18n-provider";
import { api, levelLabel, playPing } from "@/lib/client";

type FamilyState = {
  me: Profile | null;
  userId: string | null;
  connections: Connection[];
  profiles: Record<string, Profile>;
  scans: Scan[];
  reload: () => Promise<void>;
};

const Ctx = createContext<FamilyState | null>(null);

export function useFamily() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFamily outside provider");
  return v;
}

export function FamilyRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [scans, setScans] = useState<Scan[]>([]);
  const [alert, setAlert] = useState<Scan | null>(null);
  const { lang, soundOn, setLang } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (profile) {
      setMe(profile as Profile);
      const stored = localStorage.getItem("kavach-lang") as "hi" | "en" | null;
      if (!stored && (profile.language === "hi" || profile.language === "en")) {
        setLang(profile.language);
      }
    }
    const { data: cons } = await supabase.from("connections").select("*").order("created_at", { ascending: false });
    setConnections((cons || []) as Connection[]);
    const ids = new Set<string>([uid]);
    (cons || []).forEach((c: Connection) => {
      ids.add(c.requester_id);
      ids.add(c.addressee_id);
    });
    const { data: people } = await supabase.from("profiles").select("*").in("id", [...ids]);
    const map: Record<string, Profile> = {};
    (people || []).forEach((p: Profile) => {
      map[p.id] = p;
    });
    setProfiles(map);
    const { data: scanRows } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(80);
    setScans((scanRows || []) as Scan[]);

    const lastSeenStr = typeof localStorage !== "undefined" ? localStorage.getItem("kavach-last-seen-feed") : null;
    const lastSeenTime = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
    const unseenScans = (scanRows || []).filter((s: Scan) => {
      return (
        s.user_id !== uid &&
        (s.level === "dangerous" || s.level === "likely_scam") &&
        new Date(s.created_at).getTime() > lastSeenTime
      );
    });
    if (unseenScans.length > 0) {
      setUnreadCount(unseenScans.length);
    }

    const pendingCode = localStorage.getItem(JOIN_CODE_KEY);
    if (pendingCode) {
      try {
        await api("/api/connections/request", {
          method: "POST",
          body: JSON.stringify({ code: pendingCode }),
        });
        localStorage.removeItem(JOIN_CODE_KEY);
        toast.success("Family request sent");
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        if (/already/i.test(message) || /pending/i.test(message) || /yourself/i.test(message)) {
          localStorage.removeItem(JOIN_CODE_KEY);
        }
      }
    }
  }, [setLang]);

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void reload();
    });

    const channel = supabase
      .channel("kavach-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "scans" }, (payload) => {
        const row = payload.new as Scan;
        setScans((prev) => (prev.some((s) => s.id === row.id) ? prev : [row, ...prev]));
        if (userId && row.user_id !== userId && (row.level === "dangerous" || row.level === "likely_scam")) {
          setAlert(row);
          bumpUnread();
          if (soundOn) playPing();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Kavach", { body: `${levelLabel(row.level, lang)}: ${row.scam_type}` });
          }
          if (pathname !== "/app/feed") {
            toast.message("Family alert", { description: "A connected person has a dangerous scan." });
          }
        }
      })
      .subscribe();

    return () => {
      sub.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [userId, soundOn, lang, pathname]);

  const value = useMemo(
    () => ({ me, userId, connections, profiles, scans, reload }),
    [me, userId, connections, profiles, scans],
  );

  return (
    <Ctx.Provider value={value}>
      {alert ? (
        <AlertBanner
          scan={alert}
          sender={profiles[alert.user_id]}
          onOpen={() => {
            router.push(`/app/scan/${alert.id}`);
            setAlert(null);
          }}
          onDismiss={() => setAlert(null)}
        />
      ) : null}
      {children}
    </Ctx.Provider>
  );
}
