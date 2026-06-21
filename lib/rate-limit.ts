/**
 * Best-effort in-memory rate limiter (T6).
 *
 * Plan D-leads / "Rendering & perf": rate-limit is BEST-EFFORT — the honeypot is
 * the real spam defense. This is a fixed-window counter keyed by IP, held in a
 * module-level Map. It is intentionally simple and has a known caveat: in a
 * serverless deployment each instance has its own memory, so the limit is
 * per-instance, not global. That is acceptable for v0; the plan notes escalating
 * to Upstash if the form is actually abused.
 *
 * No silent failure: the limiter NEVER throws — if anything goes wrong it fails
 * OPEN (allows the request) so a limiter bug can't take the contact form down.
 * The DB unique/insert + honeypot remain the real guardrails.
 */

export interface RateLimitResult {
  /** Whether this request is allowed. */
  allowed: boolean
  /** Seconds until the window resets (for a `Retry-After` header). */
  retryAfterSeconds: number
  /** Requests remaining in the current window. */
  remaining: number
}

interface Bucket {
  count: number
  /** Epoch ms when the current window ends. */
  resetAt: number
}

/** Fixed-window store. Keyed by `${key}` (typically the client IP + route). */
const store = new Map<string, Bucket>()

/** Default policy: 5 submissions per 10 minutes per IP. */
export const CONTACT_RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 } as const

/**
 * Check + consume one unit against a fixed-window bucket. Fails open on any
 * unexpected error (returns `allowed: true`).
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number } = CONTACT_RATE_LIMIT,
): RateLimitResult {
  try {
    const now = Date.now()
    const existing = store.get(key)

    if (!existing || existing.resetAt <= now) {
      // New window.
      store.set(key, { count: 1, resetAt: now + options.windowMs })
      return {
        allowed: true,
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
        remaining: options.limit - 1,
      }
    }

    if (existing.count >= options.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((existing.resetAt - now) / 1000),
        ),
        remaining: 0,
      }
    }

    existing.count += 1
    return {
      allowed: true,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: options.limit - existing.count,
    }
  } catch {
    // Fail open — a limiter bug must never block legitimate leads.
    return { allowed: true, retryAfterSeconds: 0, remaining: 0 }
  }
}

/**
 * Best-effort client IP from a Next.js request's headers. Prefers
 * `x-forwarded-for` (Vercel sets it), then `x-real-ip`. Falls back to a constant
 * bucket so the limiter still applies coarse pressure when the IP is unknown.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // First hop is the client.
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

/** Test helper — clear the in-memory store between tests. */
export function __resetRateLimit(): void {
  store.clear()
}
