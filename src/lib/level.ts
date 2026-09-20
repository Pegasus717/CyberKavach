export type RiskLevel = "safe" | "careful" | "likely_scam" | "dangerous";

export function levelFromScore(score: number): RiskLevel {
  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  if (clamped <= 24) return "safe";
  if (clamped <= 49) return "careful";
  if (clamped <= 74) return "likely_scam";
  return "dangerous";
}

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 50;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function quoteIsSubstring(quote: string, maskedText: string): boolean {
  if (!quote.trim()) return false;
  return maskedText.includes(quote);
}

export function filterRedFlags<T extends { quote: string }>(
  flags: T[],
  maskedText: string,
  max = 6,
): T[] {
  return flags.filter((flag) => quoteIsSubstring(flag.quote, maskedText)).slice(0, max);
}
