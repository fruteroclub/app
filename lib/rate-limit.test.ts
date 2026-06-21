import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import {
  rateLimit,
  clientIpFromHeaders,
  __resetRateLimit,
} from './rate-limit'

/**
 * Unit tests for the best-effort in-memory rate limiter (T6). It is per-instance
 * and fails OPEN — a limiter bug must never block legitimate leads.
 */
describe('rateLimit', () => {
  beforeEach(() => __resetRateLimit())
  afterEach(() => vi.useRealTimers())

  const policy = { limit: 3, windowMs: 1000 }

  it('allows up to the limit, then blocks', () => {
    expect(rateLimit('a', policy).allowed).toBe(true)
    expect(rateLimit('a', policy).allowed).toBe(true)
    expect(rateLimit('a', policy).allowed).toBe(true)
    const blocked = rateLimit('a', policy)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keeps separate buckets per key', () => {
    rateLimit('a', policy)
    rateLimit('a', policy)
    rateLimit('a', policy)
    // A different key is unaffected.
    expect(rateLimit('b', policy).allowed).toBe(true)
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
    rateLimit('a', policy)
    rateLimit('a', policy)
    rateLimit('a', policy)
    expect(rateLimit('a', policy).allowed).toBe(false)
    // Advance past the window.
    vi.setSystemTime(1500)
    expect(rateLimit('a', policy).allowed).toBe(true)
  })

  it('reports remaining count', () => {
    expect(rateLimit('a', policy).remaining).toBe(2)
    expect(rateLimit('a', policy).remaining).toBe(1)
    expect(rateLimit('a', policy).remaining).toBe(0)
  })
})

describe('clientIpFromHeaders', () => {
  it('takes the first hop of x-forwarded-for', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(clientIpFromHeaders(h)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const h = new Headers({ 'x-real-ip': '9.9.9.9' })
    expect(clientIpFromHeaders(h)).toBe('9.9.9.9')
  })

  it('falls back to "unknown" when no IP header is present', () => {
    expect(clientIpFromHeaders(new Headers())).toBe('unknown')
  })
})
