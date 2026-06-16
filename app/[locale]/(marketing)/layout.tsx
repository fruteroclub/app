import type { ReactNode } from 'react'

/**
 * Marketing route group. Public pages are PAPER-ONLY (D-mode, LOCKED): no MODO
 * toggle here — arcade mode lives only in the authed (app) group. Pages in this
 * group render as static SSG (the only island is the ContactForm on /enterprise).
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children
}
