/**
 * Input sanitization utilities to prevent XSS and validate inputs
 */

/**
 * Strip HTML tags and prevent XSS
 * @param input - User input string
 * @returns Sanitized string without HTML
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Encode dangerous characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  return sanitized;
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
