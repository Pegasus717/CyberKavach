import type { Metadata, Viewport } from "next";
import { Noto_Sans_Devanagari, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kavach — AI scam shield",
  description: "Paste a suspicious message. Get a real risk verdict, family alerts, and a complaint plan.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kavach" },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${devanagari.variable} h-full`}>
      <body className="noise relative min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
