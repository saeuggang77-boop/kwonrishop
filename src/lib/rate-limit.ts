import { redis } from "@/lib/redis/client";

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Sliding window rate limiter using Redis.
 * @param key - Unique identifier (e.g., IP or user ID)
 * @param limit - Max requests per window
 * @param windowSec - Window size in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowMs = windowSec * 1000;

  const pipeline = redis.pipeline();
  // Remove old entries
  pipeline.zremrangebyscore(redisKey, 0, now - windowMs);
  // Add current request
  pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
  // Count entries in window
  pipeline.zcard(redisKey);
  // Set expiry
  pipeline.expire(redisKey, windowSec);

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count),
    reset: Math.ceil((now + windowMs) / 1000),
  };
}

/**
 * Check rate limit and return 429 response if exceeded.
 */
export async function checkRateLimit(
  identifier: string,
  limit = 60,
  windowSec = 60
): Promise<Response | null> {
  const result = await rateLimit(identifier, limit, windowSec);

  if (!result.success) {
    return Response.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
          "Retry-After": String(windowSec),
        },
      }
    );
  }

  return null;
}
