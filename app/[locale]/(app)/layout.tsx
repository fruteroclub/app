import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import AppPrivyProvider from './privy-provider'
import AuthGuard from './auth-guard'
import { AppMasthead } from '@/components/app/AppMasthead'

/**
 * The authed app surface is intentionally NOT indexable (T7): it is private,
 * dynamic, and behind auth. robots.ts also disallows `/perfil`; this is the
 * belt-and-suspenders meta-level signal.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

/**
 * Authed (app) route group layout.
 *
 * Composition (D0 + D-mode + D-signup):
 *   <html data-mode> is owned by the parent `[locale]/layout.tsx`; here we
 *   - flip the document into arcade-dark mode (app-only; marketing stays paper),
 *   - wrap the subtree in the Privy provider (auth + silent embedded wallet,
 *     NO wagmi/viem — Hard rule #4),
 *   - gate access with the client AuthGuard (UX gate; route handlers re-verify).
 *
 * This group is dynamic (authed), unlike the static marketing group.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    // The app LEADS EDITORIAL (warm paper), like the marketing publication — the
    // arcade-dark "console" is no longer the app's background. Arcade is reserved
    // as an opt-in accent for specific game moments (the way the marketing
    // leaderboard sets data-mode="arcade" locally), not the whole surface. So the
    // old global ThemeScript/ArcadeMode forcing is intentionally removed here.
    <AppPrivyProvider>
      <AppMasthead />
      <AuthGuard>{children}</AuthGuard>
    </AppPrivyProvider>
  )
}
