import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Locale proxy routing guard (T8 · plan "i18n/routing high — proxy redirects").
 *
 * The `as-needed` locale strategy (D-locale, LOCKED) has one non-obvious rule we
 * own: any `/es` or `/es/...` URL must 308-redirect to the bare, prefix-less
 * Spanish canonical so we never serve duplicate content at both `/es/x` and `/x`.
 * Everything else is delegated to next-intl's `createMiddleware`.
 *
 * We mock next-intl's middleware to a sentinel response so we can assert exactly
 * which paths WE redirect vs. which we hand off — without booting next-intl's
 * locale negotiation (which needs request headers / a running edge runtime).
 */
const { intlHandler } = vi.hoisted(() => ({
  intlHandler: vi.fn(() => new Response(null, { status: 200 })),
}))

vi.mock('next-intl/middleware', () => ({
  default: () => intlHandler,
}))

import { NextRequest } from 'next/server'
import { proxy } from './proxy'

function reqFor(path: string): NextRequest {
  return new NextRequest(new URL(`https://frutero.club${path}`))
}

beforeEach(() => {
  intlHandler.mockClear()
})

describe('proxy — /es canonicalization', () => {
  it('308-redirects the bare /es apex to /', () => {
    const res = proxy(reqFor('/es'))
    expect(res.status).toBe(308)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/')
    expect(intlHandler).not.toHaveBeenCalled()
  })

  it('308-redirects /es/perfil to /perfil (strips the default-locale prefix)', () => {
    const res = proxy(reqFor('/es/perfil'))
    expect(res.status).toBe(308)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/perfil')
  })

  it('preserves the query string when stripping /es', () => {
    const res = proxy(reqFor('/es/enterprise?ref=abc'))
    const loc = new URL(res.headers.get('location')!)
    expect(loc.pathname).toBe('/enterprise')
    expect(loc.search).toBe('?ref=abc')
  })

  it('does NOT treat /esp (a non-locale path that starts with "es") as /es', () => {
    proxy(reqFor('/esp/team'))
    // Not a redirect — handed off to next-intl.
    expect(intlHandler).toHaveBeenCalledOnce()
  })
})

describe('proxy — delegation', () => {
  it('hands the bare ES apex (/) to next-intl (no redirect)', () => {
    proxy(reqFor('/'))
    expect(intlHandler).toHaveBeenCalledOnce()
  })

  it('hands the English prefix (/en) to next-intl (no redirect)', () => {
    proxy(reqFor('/en'))
    expect(intlHandler).toHaveBeenCalledOnce()
  })

  it('hands a deep English path (/en/enterprise) to next-intl', () => {
    proxy(reqFor('/en/enterprise'))
    expect(intlHandler).toHaveBeenCalledOnce()
  })
})
