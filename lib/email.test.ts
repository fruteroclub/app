import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for the Resend lead-email wrapper (T6). It is BEST-EFFORT: returns
 * a result object and NEVER throws, so an email outage can't turn a saved lead
 * into a 500. The `resend` SDK is mocked.
 */

const sendMock = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

import { sendLeadEmail, getFallbackEmail } from './email'

const LEAD = {
  name: 'Ana López',
  email: 'ana@example.com',
  org: 'Acme',
  message: 'Hola',
  source: 'enterprise' as const,
  locale: 'es' as const,
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  sendMock.mockReset()
  process.env.RESEND_API_KEY = 'test-key'
  process.env.RESEND_FROM = 'no-reply@frutero.club'
  process.env.CONTACT_FALLBACK_EMAIL = 'hola@frutero.club'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('sendLeadEmail', () => {
  it('returns sent:true when Resend accepts the message', async () => {
    sendMock.mockResolvedValueOnce({ data: { id: 'email-1' }, error: null })
    const r = await sendLeadEmail(LEAD)
    expect(r.sent).toBe(true)
    if (r.sent) expect(r.id).toBe('email-1')
  })

  it('returns sent:false (unconfigured) when env is missing — never throws', async () => {
    delete process.env.RESEND_API_KEY
    const r = await sendLeadEmail(LEAD)
    expect(r.sent).toBe(false)
    if (!r.sent) expect(r.reason).toBe('unconfigured')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns sent:false (error) when Resend returns an error — never throws', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'boom' } })
    const r = await sendLeadEmail(LEAD)
    expect(r.sent).toBe(false)
    if (!r.sent) expect(r.reason).toBe('error')
  })

  it('returns sent:false (error) when the SDK throws — never throws', async () => {
    sendMock.mockRejectedValueOnce(new Error('network'))
    const r = await sendLeadEmail(LEAD)
    expect(r.sent).toBe(false)
    if (!r.sent) expect(r.reason).toBe('error')
  })
})

describe('getFallbackEmail', () => {
  it('returns the configured fallback address', () => {
    expect(getFallbackEmail()).toBe('hola@frutero.club')
  })

  it('returns undefined when not configured', () => {
    delete process.env.CONTACT_FALLBACK_EMAIL
    expect(getFallbackEmail()).toBeUndefined()
  })
})
