import type { FunctionReturnType } from 'convex/server'
import type { User } from '@privy-io/react-auth'

import { api } from '@/convex/_generated/api'

/**
 * The club-app member view-model — a flat shape the UI reads, mapped from the
 * Convex {user, profile} pair. Keeps the components decoupled from the raw Convex
 * field names (e.g. `region` ← `profiles.country`).
 */

export const MEMBER_ROLES = ['creativo', 'negocio', 'tecnologia'] as const
export type MemberRole = (typeof MEMBER_ROLES)[number]

export const PREFERRED_COLORS = ['magenta', 'violet', 'amber', 'green'] as const
export type PreferredColor = (typeof PREFERRED_COLORS)[number]

/** The {user, profile} | null shape `clubApp.getProfile` returns. */
export type GetProfileResult = FunctionReturnType<typeof api.clubApp.getProfile>

export interface MemberProfile {
  handle: string
  displayName: string
  firstName: string | null
  lastName: string | null
  role: MemberRole | null
  city: string | null
  region: string | null // ← profiles.country
  favoriteFruit: string | null
  preferredColor: PreferredColor | null
  testimony: string | null
  links: { github?: string; website?: string }
  memberSince: number
}

/** Map the Convex pair to the flat view-model (null when not onboarded). */
export function toMember(data: GetProfileResult): MemberProfile | null {
  if (!data?.user) return null
  const { user, profile } = data
  return {
    handle: user.username ?? '',
    displayName: user.displayName ?? '',
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    role: (profile?.role as MemberRole | undefined) ?? null,
    city: profile?.city ?? null,
    region: profile?.country ?? null,
    favoriteFruit: profile?.favoriteFruit ?? null,
    preferredColor: (profile?.preferredColor as PreferredColor | undefined) ?? null,
    testimony: profile?.testimony ?? null,
    links: {
      ...(profile?.githubUrl ? { github: profile.githubUrl } : {}),
      ...(profile?.websiteUrl ? { website: profile.websiteUrl } : {}),
    },
    memberSince: user._creationTime,
  }
}

/**
 * Pull the two wallet addresses out of the Privy user: the embedded (Privy)
 * wallet → appWallet, the user's own (external) wallet → userWallet.
 */
export function pickWallets(user: User | null | undefined): {
  appWallet?: string
  userWallet?: string
} {
  let appWallet: string | undefined
  let userWallet: string | undefined
  for (const account of user?.linkedAccounts ?? []) {
    if (account.type !== 'wallet') continue
    if (account.walletClientType === 'privy') appWallet ??= account.address
    else userWallet ??= account.address
  }
  if (!appWallet && user?.wallet?.address) appWallet = user.wallet.address
  return { appWallet, userWallet }
}

/**
 * Derive a public handle from the full name: strip accents, lowercase, non-alnum
 * → hyphen, 3–30 chars. Falls back to `builder` for empty/short slugs.
 */
export function slugifyHandle(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
    .replace(/-+$/g, '')
  return slug.length >= 3 ? slug : 'builder'
}
