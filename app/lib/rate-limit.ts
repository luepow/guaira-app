/**
 * Rate Limiting System
 * PCI-DSS Requirement 8.2.4 - Lock user ID after not more than six failed login attempts
 *
 * Compliance:
 * - PCI-DSS 8.2.4 (Account lockout)
 * - OWASP API Security Top 10 - API4:2023 Unrestricted Resource Consumption
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitStore {
  attempts: number;
  resetAt: number;
  blockedUntil?: number;
}

// In-memory store (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Check if request is within rate limit
 *
 * @param key - Unique identifier (IP, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns True if request is allowed
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<boolean> {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Check if blocked
  if (record?.blockedUntil && now < record.blockedUntil) {
    return false;
  }

  // Reset if window expired
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      attempts: 1,
      resetAt: now + config.windowMs,
    });
    return true;
  }

  // Increment attempts
  record.attempts++;

  // Block if exceeded
  if (record.attempts > config.maxAttempts) {
    record.blockedUntil = now + (config.blockDurationMs || config.windowMs);
    rateLimitStore.set(key, record);
    return false;
  }

  rateLimitStore.set(key, record);
  return true;
}

/**
 * Reset rate limit for a key
 *
 * @param key - Rate limit key
 */
export async function resetRateLimit(key: string): Promise<void> {
  rateLimitStore.delete(key);
}

/**
 * Get rate limit status
 *
 * @param key - Rate limit key
 * @returns Rate limit info
 */
export async function getRateLimitInfo(key: string): Promise<{
  attempts: number;
  remaining: number;
  resetAt: number;
  isBlocked: boolean;
} | null> {
  const record = rateLimitStore.get(key);
  if (!record) return null;

  const now = Date.now();
  const isBlocked = !!(record.blockedUntil && now < record.blockedUntil);

  return {
    attempts: record.attempts,
    remaining: Math.max(0, 5 - record.attempts),
    resetAt: record.resetAt,
    isBlocked,
  };
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupRateLimits(): Promise<void> {
  const now = Date.now();

  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt && (!record.blockedUntil || now > record.blockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
