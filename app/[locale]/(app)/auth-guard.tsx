'use client'

import { type ReactNode } from 'react'
import { useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'

/**
 * Client auth guard for the authed (app) group.
 *
 * Privy is a client SDK, so the gate runs on the client: while Privy is resolving
 * we show a localized loading state; once resolved, an unauthenticated user is
 * redirected to the localized signup destination. No silent failure — the user
 * always sees either content, a loading state, or a redirect.
 *
 * Server routes (e.g. /api/profile) independently re-verify the Bearer token via
 * `lib/auth` — this guard is UX, not the security boundary.
 */
export default function AuthGuard({ children }: { children: ReactNode }) {
  const { ready, authenticated } = usePrivy()
  const router = useRouter()
  const t = useTranslations('app')

  useEffect(() => {
    if (ready && !authenticated) {
      // Send unauthed users to the localized signup entry. `/perfil` is the
      // signup destination (T4) and itself triggers the Privy login modal.
      router.replace('/perfil')
    }
  }, [ready, authenticated, router])

  if (!ready) {
    return (
      <div role="status" aria-live="polite" className="auth-guard-pending">
        {t('auth.loading')}
      </div>
    )
  }

  if (!authenticated) {
    // Redirect is in flight; show the re-auth message rather than flashing content.
    return (
      <div role="status" aria-live="polite" className="auth-guard-pending">
        {t('auth.signinRequired')}
      </div>
    )
  }

  return <>{children}</>
}
