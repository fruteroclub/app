'use client'

import { useEffect } from 'react'
import { track } from '@/lib/analytics'

/**
 * CTA / signup event tracker (T7).
 *
 * The conversion CTAs ("Crea tu perfil" → `/perfil`) live in T5/T6-owned
 * components (Masthead, CtaBand, /enterprise) which T7 must not edit (disjoint
 * task files). Rather than reach into those files, this client island attaches a
 * single delegated click listener at the document root and recognises the
 * signup CTA by its destination — every link whose resolved path ends in
 * `/perfil` is a signup entry point. This keeps ALL analytics wiring inside
 * T7-owned files while still capturing the real conversion clicks.
 *
 * Events:
 *  - `cta_click`    — any tracked CTA click, with the destination + a `cta` label.
 *  - `signup_start` — specifically a click that navigates to `/perfil`.
 *
 * (`signup_complete` is emitted by the perfil flow itself; `contact_submit` by
 * the contact form — those call `track()` directly from their own client code.)
 *
 * Delegation means it survives client navigation without re-binding and adds no
 * coupling to sibling components. No-op + no throw on the server.
 */
export function CtaTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      let path: string
      try {
        path = new URL(anchor.href, window.location.origin).pathname
      } catch {
        return
      }

      // Signup CTA: the locale-aware `/perfil` route (bare ES or `/en/perfil`).
      if (/(^|\/)perfil$/.test(path)) {
        track('cta_click', { cta: 'signup', href: path })
        track('signup_start', { href: path })
      }
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
