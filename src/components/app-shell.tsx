"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  FileText, 
  LogOut, 
  Mic,
  Plus, 
  Settings, 
  Shield, 
  Users, 
  UserRound,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { useUnread } from "@/components/unread-store";
import { useFamily } from "@/components/family-realtime";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/app", key: "check" as const, label: "Check", icon: Shield },
  { href: "/app/elder", key: "elder" as const, label: "Elder Mode", icon: Mic },
  { href: "/app/feed", key: "feed" as const, label: "Threat Feed", icon: Bell },
  { href: "/app/family", key: "family" as const, label: "Family", icon: Users },
  { href: "/app/complaints", key: "help" as const, label: "Complaints", icon: FileText },
];

function getPageTitle(pathname: string, t: (key: any) => string): string {
  if (pathname === "/app") return t("checkMessage");
  if (pathname === "/app/elder") return "Elder Voice Mode (वरिष्ठ नागरिक मोड)";
  if (pathname === "/app/feed") return t("threatFeed");
  if (pathname === "/app/family") return t("familySafety");
  if (pathname === "/app/complaints") return t("complaints");
  if (pathname === "/app/settings") return t("settings");
  if (pathname.startsWith("/app/scan/")) return t("scanAnalysis");
  if (pathname.startsWith("/app/complaint/")) return t("complaintPlan");
  if (pathname === "/app/eval") return t("modelEval");
  return t("appName");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const unread = useUnread((s) => s.count);
  const { me, userId, connections } = useFamily();

  const [collapsed, setCollapsed] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kavach-sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("kavach-sidebar-collapsed", String(next));
  };

  const pendingCount = connections.filter(
    (c) => c.addressee_id === userId && c.status === "pending"
  ).length;

  const copyShareCode = () => {
    if (me?.share_code) {
      navigator.clipboard.writeText(me.share_code);
      setCopiedCode(true);
      toast.success("Share code copied");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore auth cleanup errors
    }
    router.push("/");
  };

  const title = getPageTitle(pathname, t);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      {/* Desktop Left Sidebar (flush to far left edge) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[#223058] bg-gradient-to-b from-[#0C1633] to-[#122250] text-[#DCE4FA] transition-all duration-300 lg:flex z-30",
          collapsed ? "w-[76px] p-3" : "w-[264px] p-5"
        )}
      >
        {/* Logo & Wordmark + Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <Link href="/app" className="flex items-center gap-3 overflow-hidden">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-md">
              <Shield className="size-6" />
            </span>
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                Cyber Kavach
              </span>
            )}
          </Link>
          <button
            onClick={toggleCollapsed}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </button>
        </div>

        {/* Prominent New Scan Button */}
        <Link
          href="/app"
          className={cn(
            "mb-6 flex items-center justify-center gap-2 rounded-2xl bg-brand font-semibold text-white shadow-lg transition-all hover:bg-brand-hover active:scale-[0.98]",
            collapsed ? "size-12 p-0 mx-auto" : "w-full py-3 px-4"
          )}
          title={collapsed ? "New scan" : undefined}
        >
          <Plus className="size-5" />
          {!collapsed && <span>New Scan</span>}
        </Link>

        {/* Nav list */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badgeCount =
              item.key === "feed" ? unread : item.key === "family" ? pendingCount : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? t(item.key) : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-base font-medium transition-colors",
                  active
                    ? "bg-brand-tint text-white font-semibold"
                    : "text-[#DCE4FA]/80 hover:bg-white/10 hover:text-white"
                )}
              >
                {/* 3px left accent in --calm for active item */}
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-calm" />
                )}
                <Icon className={cn("size-5 shrink-0", active ? "text-calm" : "")} />
                {!collapsed && <span className="truncate">{t(item.key)}</span>}

                {/* Badge */}
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "grid place-items-center rounded-full bg-danger text-white text-xs font-bold animate-bounce",
                      collapsed
                        ? "absolute top-1 right-1 size-4 text-[10px]"
                        : "ml-auto min-w-5 h-5 px-1.5"
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Settings link */}
        <Link
          href="/app/settings"
          title={collapsed ? t("settings") : undefined}
          className={cn(
            "mb-3 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-base font-medium transition-colors",
            pathname === "/app/settings"
              ? "bg-brand-tint text-white font-semibold"
              : "text-[#DCE4FA]/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings className="size-5 shrink-0" />
          {!collapsed && <span>{t("settings")}</span>}
        </Link>

        {/* User Card */}
        <div
          className={cn(
            "rounded-2xl bg-white/5 border border-white/10 p-3 mb-2 flex items-center gap-3",
            collapsed && "justify-center p-2"
          )}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/30 text-white font-bold text-sm">
            {me?.display_name ? me.display_name.substring(0, 2).toUpperCase() : "CK"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {me?.display_name || "User"}
              </p>
              {me?.share_code && (
                <button
                  onClick={copyShareCode}
                  className="flex items-center gap-1 text-xs text-[#DCE4FA]/70 hover:text-white transition-colors"
                  title="Click to copy share code"
                >
                  <span className="font-mono">{me.share_code}</span>
                  {copiedCode ? <Check className="size-3 text-safe" /> : <Copy className="size-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          title={collapsed ? t("signOut") : undefined}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-danger/90 hover:bg-danger/10 hover:text-danger transition-colors w-full",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>{t("signOut")}</span>}
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-6 backdrop-blur lg:px-10">
          {/* Left: Page Title */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {title}
            </span>
          </div>

          {/* Right: Language, Theme Toggle, Notifications */}
          <div className="flex items-center gap-3">
            {/* Elder Mode Shortcut */}
            <Link href="/app/elder">
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-brand/40 bg-brand/10 text-brand font-semibold hover:bg-brand/20 flex items-center gap-1.5">
                <Mic className="size-4" />
                <span className="hidden sm:inline">Elder Mode</span>
              </Button>
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center rounded-xl border border-border bg-surface-2 p-0.5 text-xs font-medium">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "rounded-lg px-2.5 py-1 transition-colors",
                  lang === "en" ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("hi")}
                className={cn(
                  "rounded-lg px-2.5 py-1 transition-colors",
                  lang === "hi" ? "bg-brand text-white shadow-sm" : "text-muted hover:text-foreground"
                )}
              >
                HI
              </button>
            </div>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-xl border-border bg-surface-2"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Notifications Button */}
            <Link href="/app/feed" className="relative">
              <Button variant="outline" size="icon" className="size-9 rounded-xl border-border bg-surface-2">
                <Bell className="size-4" />
              </Button>
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Content Container (mx-auto max-w-[1120px] px-6 lg:px-10 py-8) */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1120px] px-6 lg:px-10 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (< 1024px) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5 h-16 items-center">
          {[
            { href: "/app", key: "check" as const, label: "Check", icon: Shield },
            { href: "/app/feed", key: "feed" as const, label: "Feed", icon: Bell },
            { href: "/app/family", key: "family" as const, label: "Family", icon: Users },
            { href: "/app/complaints", key: "help" as const, label: "Complaints", icon: FileText },
            { href: "/app/settings", key: "me" as const, label: "Me", icon: UserRound },
          ].map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badgeCount =
              item.key === "feed" ? unread : item.key === "family" ? pendingCount : 0;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-1.5 text-xs font-medium transition-colors",
                    active ? "text-brand" : "text-muted hover:text-foreground"
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" />
                    {badgeCount > 0 && (
                      <span className="absolute -right-2 -top-1 grid size-3.5 place-items-center rounded-full bg-danger text-[9px] font-bold text-white">
                        {badgeCount}
                      </span>
                    )}
                  </span>
                  <span>{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

