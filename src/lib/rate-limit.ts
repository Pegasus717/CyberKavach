const buckets = new Map<string, number[]>();

export function checkRateLimit(userId: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const stamps = (buckets.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (stamps.length >= limit) {
    buckets.set(userId, stamps);
    return false;
  }
  stamps.push(now);
  buckets.set(userId, stamps);
  return true;
}
