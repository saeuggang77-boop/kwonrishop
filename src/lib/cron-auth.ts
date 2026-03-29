import { timingSafeEqual } from "crypto";

/**
 * Verify Bearer token in a timing-safe manner to prevent timing attacks
 * @param authHeader - Authorization header value
 * @param secret - Expected secret value
 * @returns true if valid, false otherwise
 */
export function verifyBearerToken(
  authHeader: string | null,
  secret: string | undefined
): boolean {
  if (!authHeader || !secret) return false;

  const expected = `Bearer ${secret}`;

  // Length check first to avoid buffer allocation if lengths don't match
  if (authHeader.length !== expected.length) return false;

  // Timing-safe comparison
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}
