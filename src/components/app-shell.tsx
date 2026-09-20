"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, HelpCircle, Shield, Users, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { useUnread } from "@/components/unread-store";

const items = [
  { href: "/app", key: "check" as const, icon: Shield },
  { href: "/app/feed", key: "feed" as const, icon: Bell },
  { href: "/app/family", key: "family" as const, icon: Users },
  { href: "/app/complaints", key: "help" as const, icon: HelpCircle },
  { href: "/app/settings", key: "me" as const, icon: UserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const unread = useUnread((s) => s.count);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
      <aside className="hidden w-60 shrink-0 border-r border-border/70 p-4 md:flex md:flex-col">
        <Link href="/app" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Shield className="size-5" />
          </span>
          Kavach
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-base transition-colors",
                  active ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-5" />
                {t(item.key)}
                {item.key === "feed" && unread > 0 ? (
                  <span className="ml-auto grid min-w-6 place-items-center rounded-full bg-danger px-1.5 text-xs text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-5" />
                    {item.key === "feed" && unread > 0 ? (
                      <span className="absolute -right-2 -top-1 size-2 rounded-full bg-danger" />
                    ) : null}
                  </span>
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
