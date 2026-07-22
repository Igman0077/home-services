/**
 * In-memory sliding-window rate limiter for edge/server routes.
 * Suitable for single-instance demos; replace with Redis for multi-instance prod.
 */
type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = input.now ?? Date.now();
  const bucket = buckets.get(input.key) ?? { timestamps: [] };
  const windowStart = now - input.windowMs;
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > windowStart);

  if (bucket.timestamps.length >= input.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + input.windowMs - now) / 1000),
    );
    buckets.set(input.key, bucket);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(input.key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, input.limit - bucket.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/** Test helper */
export function resetRateLimitBuckets() {
  buckets.clear();
}

export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
