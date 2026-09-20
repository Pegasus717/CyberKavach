export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export function levelLabel(level: string, lang: "en" | "hi") {
  const map: Record<string, [string, string]> = {
    safe: ["Safe", "सुरक्षित"],
    careful: ["Be careful", "सावधान रहें"],
    likely_scam: ["Likely scam", "संभावित ठगी"],
    dangerous: ["Dangerous", "खतरनाक"],
  };
  const pair = map[level] || [level, level];
  return lang === "hi" ? pair[1] : pair[0];
}

export function levelClass(level: string) {
  if (level === "safe") return "text-safe bg-safe/10";
  if (level === "careful") return "text-careful bg-careful/15";
  if (level === "likely_scam") return "text-scam bg-scam/12";
  return "text-danger bg-danger/12";
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; hint?: string };
  if (!res.ok) {
    if (data.hint?.includes("supabase/schema.sql")) {
      window.location.href = "/setup";
      // Let it throw to abort current render flow, but it won't matter as we redirect
    }
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function speak(text: string, lang: "en" | "hi") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
  window.speechSynthesis.speak(u);
}

export function playPing() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  gain.gain.value = 0.04;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.18);
}
