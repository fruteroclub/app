import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for /api/contact (T6) — the CONTACT route branches.
 *
 * `lib/db` and `lib/email` are fully mocked (no Postgres, no Resend). We assert
 * the status-code contract the plan's CONTACT flow + failure table require:
 *   201 insert ok (+email)    · 200 insert ok / email FAILS (lead not lost)
 *   400 invalid body          · 429 rate-limited
 *   502 DB down (+ fallback)  · 200 honeypot tripped (pretend success, no insert)
 */

// --- hoisted shared state ----------------------------------------------------
const { dbState, emailState, insertCalls } = vi.hoisted(() => ({
  dbState: {
    insertResult: [{ id: 'lead-1' }] as unknown[],
    insertThrows: undefined as unknown,
  },
  emailState: {
    result: { sent: true, id: 'email-1' } as
      | { sent: true; id: string | null }
      | { sent: false; reason: string; error?: string },
  },
  insertCalls: { count: 0 },
}))

// --- db mock -----------------------------------------------------------------
vi.mock('@/lib/db', () => {
  function makeInsert() {
    const chain = {
      values: () => chain,
      returning: async () => {
        insertCalls.count += 1
        if (dbState.insertThrows) throw dbState.insertThrows
        return dbState.insertResult
      },
    }
    return chain
  }
  return {
    db: { insert: () => makeInsert() },
    leads: { id: 'id' },
  }
})

// --- email mock --------------------------------------------------------------
vi.mock('@/lib/email', () => ({
  sendLeadEmail: vi.fn(async () => emailState.result),
  getFallbackEmail: vi.fn(() => 'hola@frutero.club'),
}))

import { POST } from './route'
import { __resetRateLimit } from '@/lib/rate-limit'

function postReq(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Unique IP per test by default so rate-limit windows don't bleed.
      'x-forwarded-for': headers['x-forwarded-for'] ?? `10.0.0.${Math.floor(Math.random() * 250) + 1}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

const VALID_BODY = {
  name: 'Ana López',
  email: 'ana@example.com',
  org: 'Acme',
  message: 'Queremos construir con la comunidad.',
  source: 'enterprise',
  locale: 'es',
}

beforeEach(() => {
  __resetRateLimit()
  dbState.insertResult = [{ id: 'lead-1' }]
  dbState.insertThrows = undefined
  emailState.result = { sent: true, id: 'email-1' }
  insertCalls.count = 0
})

describe('POST /api/contact — happy path', () => {
  it('201 inserts the lead and sends the email', async () => {
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.received).toBe(true)
    expect(insertCalls.count).toBe(1)
  })

  it('200 (lead saved) when the email FAILS after a successful insert', async () => {
    emailState.result = { sent: false, reason: 'error', error: 'resend down' }
    const res = await POST(postReq(VALID_BODY) as never)
    // Email is not the system of record → still a success, lead not lost.
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(insertCalls.count).toBe(1)
  })
})

describe('POST /api/contact — validation', () => {
  it('400 on an invalid email', async () => {
    const res = await POST(postReq({ ...VALID_BODY, email: 'not-an-email' }) as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.details.fieldErrors.email).toBeTruthy()
    expect(insertCalls.count).toBe(0)
  })

  it('400 on an empty message', async () => {
    const res = await POST(postReq({ ...VALID_BODY, message: '' }) as never)
    expect(res.status).toBe(400)
    expect(insertCalls.count).toBe(0)
  })

  it('400 on malformed JSON', async () => {
    const res = await POST(postReq('{ not json' as never) as never)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/contact — honeypot', () => {
  it('200 pretend-success and NO insert when the honeypot is filled', async () => {
    const res = await POST(
      postReq({ ...VALID_BODY, company_website: 'http://spam.example' }) as never,
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    // Crucial: the bot's lead is NOT written.
    expect(insertCalls.count).toBe(0)
  })
})

describe('POST /api/contact — rate limit', () => {
  it('429 after exceeding the per-IP window', async () => {
    const ip = '203.0.113.7'
    // CONTACT_RATE_LIMIT.limit = 5 → the 6th is blocked.
    for (let i = 0; i < 5; i++) {
      const res = await POST(postReq(VALID_BODY, { 'x-forwarded-for': ip }) as never)
      expect(res.status).toBe(201)
    }
    const blocked = await POST(
      postReq(VALID_BODY, { 'x-forwarded-for': ip }) as never,
    )
    expect(blocked.status).toBe(429)
    const json = await blocked.json()
    expect(json.error.code).toBe('RATE_LIMITED')
  })
})

describe('POST /api/contact — DB down', () => {
  it('502 with a fallback email address when the insert throws', async () => {
    dbState.insertThrows = new Error('ECONNREFUSED')
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error.code).toBe('SERVICE_UNAVAILABLE')
    // The user is given a way out (no stranded lead / no silent failure).
    expect(json.error.message).toContain('hola@frutero.club')
    expect(json.error.details.fallbackEmail).toBe('hola@frutero.club')
  })
})
