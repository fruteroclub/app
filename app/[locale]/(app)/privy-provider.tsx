'use client'

import { type ReactNode } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'

/**
 * Privy provider for the authed (app) group ONLY.
 *
 * Hard rule #4 (no onchain): this deliberately OMITS wagmi/viem/chains/contracts.
 * D-signup: Privy auth (email/social) with an embedded wallet created silently so
 * "Crea tu perfil" yields a real, verifiable identity with no web3 UI surfaced.
 *
 * Config patterns (NOT product code) from `code/frutero-current-app`'s
 * privy-provider, stripped of the WagmiProvider / onchain-config / chains.
 */
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? ''

export default function AppPrivyProvider({
  children,
}: {
  children: ReactNode
}) {
  // If Privy isn't configured (no app id), render children unwrapped rather than
  // crashing the whole authed tree — the auth guard + route handlers surface the
  // real, user-visible auth failure. No silent success: an unconfigured app can
  // never produce a verified session, so the guard will redirect.
  if (!PRIVY_APP_ID) {
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Embedded wallet created silently for all users (D-signup) — no UI.
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
        },
        appearance: {
          // Lead with email/social; no wallet-first prompt on the trust surface.
          showWalletLoginFirst: false,
        },
        loginMethods: ['email', 'google', 'github'],
      }}
    >
      {children}
    </PrivyProvider>
  )
}
