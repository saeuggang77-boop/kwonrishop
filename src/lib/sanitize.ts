/**
 * Input sanitization utilities to prevent XSS and validate inputs
 * Pure JS implementation - no jsdom dependency (Vercel serverless compatible)
 */

/**
 * Strip HTML tags and prevent XSS
 * @param input - User input string
 * @returns Sanitized string without HTML (plain text only)
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Decode HTML entities first, then strip all tags
  let sanitized = input
    // Remove all HTML tags (including self-closing)
    .replace(/<[^>]*>/g, "")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    // Re-escape angle brackets from decoded entities to prevent XSS
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return sanitized.trim();
}

/**
 * Basic input sanitization - trim and remove control characters
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters (except newline, carriage return, tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return sanitized;
}

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Korean phone number format (010-xxxx-xxxx or similar)
 * @param phone - Phone number string
 * @returns true if valid Korean phone format
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove spaces and dashes for validation
  const cleaned = phone.replace(/[\s-]/g, "");

  // Korean phone: 010-3xxx-4xxx or 010-4xxx-4xxx (10-11 digits)
  // Also accept landlines: 02-xxx-xxxx, 031-xxx-xxxx, etc.
  const phoneRegex = /^(01[016789]|02|0[3-6][1-5])\d{7,8}$/;

  return phoneRegex.test(cleaned);
}
