import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * club-app surface over the shared Convex backend.
 *
 * The redesigned member app (club-app) reads/writes the same `users` + `profiles`
 * tables the live app uses, but its onboarding collects a few fields the base
 * schema doesn't have (first/last name, a discipline role, favorite fruit, a
 * preferred color, a written testimony, a website). For v1.0 those live in the
 * existing `profiles.metadata` bag (`v.any()`) — NO schema change — so importing
 * the contributor's snapshot stays compatible. Promote to real columns later.
 *
 * Auth pattern matches the rest of the backend: the Privy DID is a plain arg
 * (no ctx.auth), passed from `usePrivy().user.id` on the client.
 */

const PREFERRED_COLOR = v.union(
  v.literal('magenta'),
  v.literal('violet'),
  v.literal('amber'),
  v.literal('green'),
)
const ROLE = v.union(
  v.literal('creativo'),
  v.literal('negocio'),
  v.literal('tecnologia'),
)

/** Current member's user + profile (or null if they haven't onboarded). */
export const getProfile = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_privy_did', (q) => q.eq('privyDid', args.privyDid))
      .unique()
    if (!user) return null
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .unique()
    return { user, profile }
  },
})

/** Create or update the member's identity profile (the Stage-1 onboarding). */
export const saveProfile = mutation({
  args: {
    privyDid: v.string(),
    email: v.optional(v.string()),
    username: v.string(), // the name-derived handle
    firstName: v.string(),
    lastName: v.optional(v.string()),
    role: ROLE,
    city: v.string(),
    country: v.string(),
    favoriteFruit: v.string(),
    preferredColor: PREFERRED_COLOR,
    testimony: v.optional(v.string()),
    github: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const displayName = [args.firstName, args.lastName].filter(Boolean).join(' ')

    // Find or create the user, marking them active (v1.0 = "complete = member",
    // no approval queue; the live app's pending→active flow is not adopted here).
    const existing = await ctx.db
      .query('users')
      .withIndex('by_privy_did', (q) => q.eq('privyDid', args.privyDid))
      .unique()

    let userId
    if (existing) {
      userId = existing._id
      await ctx.db.patch(userId, {
        username: args.username,
        displayName,
        ...(args.email ? { email: args.email } : {}),
        accountStatus: 'active',
        lastLoginAt: Date.now(),
      })
    } else {
      userId = await ctx.db.insert('users', {
        privyDid: args.privyDid,
        email:
          args.email ??
          `${args.privyDid.replace('did:privy:', '')}@incomplete.user`,
        username: args.username,
        displayName,
        primaryAuthMethod: 'email',
        role: 'member',
        accountStatus: 'active',
        lastLoginAt: Date.now(),
      })
    }

    // club-app extras live in metadata for v1.0 (no schema change).
    const metadata = {
      firstName: args.firstName,
      lastName: args.lastName ?? null,
      role: args.role,
      favoriteFruit: args.favoriteFruit,
      preferredColor: args.preferredColor,
      testimony: args.testimony ?? null,
      website: args.website ?? null,
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique()

    if (profile) {
      await ctx.db.patch(profile._id, {
        city: args.city,
        country: args.country,
        githubUrl: args.github,
        metadata: { ...(profile.metadata ?? {}), ...metadata },
      })
    } else {
      await ctx.db.insert('profiles', {
        userId,
        city: args.city,
        country: args.country,
        githubUrl: args.github,
        profileVisibility: 'public',
        availabilityStatus: 'available',
        learningTracks: [],
        profileViews: 0,
        projectsCount: 0,
        metadata,
      })
    }

    const user = await ctx.db.get(userId)
    const finalProfile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique()
    return { user, profile: finalProfile }
  },
})

/** Fulfill one welcome bounty (testimony / github / website) on the dashboard. */
export const saveBounty = mutation({
  args: {
    privyDid: v.string(),
    field: v.union(
      v.literal('testimony'),
      v.literal('github'),
      v.literal('website'),
    ),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_privy_did', (q) => q.eq('privyDid', args.privyDid))
      .unique()
    if (!user) throw new Error('User not found')
    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', user._id))
      .unique()
    if (!profile) throw new Error('Profile not found')

    const value = args.value.trim()
    if (args.field === 'github') {
      await ctx.db.patch(profile._id, { githubUrl: value || undefined })
    } else {
      await ctx.db.patch(profile._id, {
        metadata: { ...(profile.metadata ?? {}), [args.field]: value || null },
      })
    }
    const updated = await ctx.db.get(profile._id)
    return { user, profile: updated }
  },
})
