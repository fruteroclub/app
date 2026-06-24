'use client'

import { type ReactNode } from 'react'
import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useTranslations } from 'next-intl'

import { usePathname, useRouter } from '@/i18n/navigation'
import { SIGNUP_HREF } from '@/content/landing'

/**
 * Client auth guard for the authed (app) group.
 *
 * Privy is a client SDK, so the gate runs on the client: while Privy is resolving
 * we show a localized loading state; once resolved, an unauthenticated user on a
 * PROTECTED route is redirected to the signup destination (/perfil).
 *
 * EXCEPTION — the signup route itself: `/perfil` lives inside this guarded group
 * but IS the login destination (it renders the Privy login CTA for unauthed
 * users). Guarding it would loop (redirect /perfil → /perfil) and hide its own
 * login UI behind the bare "signin required" message. So the guard lets the
 * signup route render its children and defers to PerfilClient's auth handling.
 *
 * Server routes (e.g. /api/profile) independently re-verify the Bearer token via
 * `lib/auth` — this guard is UX, not the security boundary.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('app')

  // `usePathname` (next-intl) is locale-stripped, so this is `/perfil` for both
  // locales. The signup route shows its own login UI while unauthenticated.
  const isSignupRoute = pathname === SIGNUP_HREF

  useEffect(() => {
    if (ready && !authenticated && !isSignupRoute) {
      // Send unauthed users on a protected route to the localized signup entry.
      router.replace('/perfil')
    }
  }, [ready, authenticated, isSignupRoute, router])

  if (!ready) {
    return <Pending>{t('auth.loading')}</Pending>
  }

  if (!authenticated && !isSignupRoute) {
    // Redirect is in flight; show the re-auth message rather than flashing content.
    return <Pending>{t('auth.signinRequired')}</Pending>
  }

  return <>{children}</>
}

/** Styled transient state (loading / redirecting) — padded like the page main. */
function Pending({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[var(--wrap)] px-7 py-14">
      <p
        role="status"
        aria-live="polite"
        className="font-mono text-xs uppercase tracking-[0.1em] text-muted-2"
      >
        {children}
      </p>
    </div>
  )
}
