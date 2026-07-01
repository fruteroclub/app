'use client'

import { type ReactNode } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

/**
 * Convex client for the authed (app) group.
 *
 * club-app shares the (our-owned) Convex backend — the schema + functions in
 * `convex/`. Auth uses the existing app's pattern: the Privy DID is passed as a
 * plain arg to each query/mutation (no Convex auth adapter, no wagmi — Hard rule
 * #4), so this provider just supplies the ConvexReactClient; components read
 * `usePrivy().user.id` and pass it through.
 *
 * Guarded: until `NEXT_PUBLIC_CONVEX_URL` is set (by `npx convex dev`), render
 * children unwrapped so the app doesn't crash at import — the authed data hooks
 * surface the missing-config state, never a blank screen.
 */
const url = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = url ? new ConvexReactClient(url) : null

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) return <>{children}</>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
