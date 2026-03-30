/**
 * CSRF-like protection for mutation endpoints
 * Validates Origin header to prevent cross-origin attacks
 */

/**
 * Validate that the request origin matches the app's domain
 * @param request - Request object
 * @returns true if origin is valid (same-origin or allowed)
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // If no origin header, check Referer as fallback
  if (!origin) {
    const referer = request.headers.get("referer");
    if (!referer) {
      return false;
    }
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  // If no host header, reject
  if (!host) {
    return false;
  }

  // Parse origin URL
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  // Check if origin host matches request host
  // This handles both http://localhost:3000 and https://yourdomain.com
  return originUrl.host === host;
}
