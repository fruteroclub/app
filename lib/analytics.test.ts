import { describe, it, expect, vi, afterEach } from 'vitest'

import { track } from './analytics'

/**
 * Unit tests for the analytics event wrapper (T7). The key guarantee (Hard rule
 * #6 — no silent failures): an event is EITHER dispatched to the Vercel runtime
 * global `window.va` OR traced to the console; it is never silently dropped, and
 * `track()` never throws even when the runtime is absent.
 */
afterEach(() => {
  delete (window as unknown as { va?: unknown }).va
  vi.restoreAllMocks()
})

describe('track', () => {
  it('dispatches to window.va when the Vercel runtime is present', () => {
    const va = vi.fn()
    ;(window as unknown as { va: typeof va }).va = va

    track('signup_start', { href: '/perfil' })

    expect(va).toHaveBeenCalledWith('event', {
      name: 'signup_start',
      href: '/perfil',
    })
  })

  it('falls back to a console trace when the runtime is absent (no silent drop)', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    // jsdom sets NODE_ENV=test, so the dev-trace branch is active.
    track('cta_click', { cta: 'signup' })

    expect(info).toHaveBeenCalled()
    expect(info.mock.calls[0]?.[0]).toContain('cta_click')
  })

  it('never throws', () => {
    expect(() => track('contact_submit')).not.toThrow()
  })
})
