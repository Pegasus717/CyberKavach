import { AppShell } from "@/components/app-shell";
import { FamilyRealtimeProvider } from "@/components/family-realtime";

export default function AppGroupLayout({ children }: LayoutProps<"/app">) {
  return (
    <FamilyRealtimeProvider>
      <AppShell>{children}</AppShell>
    </FamilyRealtimeProvider>
  );
}
