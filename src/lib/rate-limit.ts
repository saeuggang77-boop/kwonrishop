/**
 * Simple in-memory rate limiter
 * Maps IP/identifier -> { count, resetTime }
 *
 * ⚠️ PRODUCTION TODO: Vercel Lambda 환경에서 인스턴스 간 Map 공유 불가.
 * 분산 환경에서 실질 무제한 → Upstash Redis 또는 Vercel KV로 교체 필요.
 * 현재는 단일 인스턴스 내에서만 동작 (casual abuse 방어 수준).
 * 참고: https://github.com/upstash/ratelimit
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Rate limit a request by identifier
 * @param identifier - Unique identifier (e.g., IP address)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns { success: boolean, remaining: number }
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    const keysToDelete: string[] = [];
    rateLimitMap.forEach((value, key) => {
      if (value.resetTime < now) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => rateLimitMap.delete(key));
  }

  // No entry or expired - create new
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1 };
  }

  // Increment count
  entry.count++;

  // Check if over limit
  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}

/**
 * Get client IP from request headers
 * @param request - Next.js Request object
 * @returns IP address string
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);

  // Check x-real-ip first (more reliable on Vercel)
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // Check common headers for real IP (behind proxy/CDN)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Fallback to a default identifier
  return "unknown";
}

/**
 * Rate limit a request with automatic route isolation.
 * Builds a composite key from IP + HTTP method + URL pathname,
 * so each API endpoint has its own independent rate limit counter.
 * Returns NextResponse with 429 status if rate limit exceeded, null otherwise.
 */
export async function rateLimitRequest(
  request: Request,
  limit: number,
  windowMs: number
): Promise<Response | null> {
  const ip = getClientIp(request);
  const url = new URL(request.url);
  const key = `${request.method}:${url.pathname}:${ip}`;
  const result = rateLimit(key, limit, windowMs);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return null;
}
