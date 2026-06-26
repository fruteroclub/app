import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * club-app surface over the shared Convex backend.
 *
 * OUR schema is the source of truth: the club-app fields are FIRST-CLASS columns
 * (users.firstName/lastName; profiles.role/favoriteFruit/preferredColor/
 * websiteUrl/testimony) — added to schema.ts, not stuffed in a metadata bag. We
 * reuse the external contributor's fields where they fit (users.displayName/
 * username; profiles.city/country/githubUrl) and extend with ours. All additions
 * are optional, so importing their `convex export` stays compatible (a superset).
 *
 * `displayName`, `firstName`, and `lastName` are THREE distinct fields — first +
 * last are the canonical name; displayName mirrors "first last" for the external
 * app's display surfaces but is never the source.
 *
 * Auth matches the rest of the backend: the Privy DID is a plain arg (no ctx.auth).
 */

const PREFERRED_COLOR = v.union(
  v.literal('magenta'),
  v.literal('violet'),
  v.literal('amber'),
  v.literal('green'),
)
/** The member's role (distinct from users.role authz). */
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
    appWallet: v.optional(v.string()), // Privy embedded wallet
    userWallet: v.optional(v.string()), // the user's own / external wallet
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
    // displayName mirrors "first last" for the external app's display surfaces;
    // firstName/lastName remain the canonical, first-class name fields.
    const displayName = [args.firstName, args.lastName].filter(Boolean).join(' ')

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
        firstName: args.firstName,
        lastName: args.lastName || undefined,
        ...(args.email ? { email: args.email } : {}),
        ...(args.appWallet ? { appWallet: args.appWallet } : {}),
        ...(args.userWallet ? { userWallet: args.userWallet } : {}),
        // v1.0 = "complete = member" (no approval queue).
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
        firstName: args.firstName,
        lastName: args.lastName || undefined,
        appWallet: args.appWallet,
        userWallet: args.userWallet,
        primaryAuthMethod: 'email',
        role: 'member',
        accountStatus: 'active',
        lastLoginAt: Date.now(),
      })
    }

    const profileFields = {
      city: args.city,
      country: args.country,
      githubUrl: args.github || undefined,
      websiteUrl: args.website || undefined,
      role: args.role,
      favoriteFruit: args.favoriteFruit,
      preferredColor: args.preferredColor,
      testimony: args.testimony || undefined,
    }

    const profile = await ctx.db
      .query('profiles')
      .withIndex('by_user_id', (q) => q.eq('userId', userId))
      .unique()

    if (profile) {
      await ctx.db.patch(profile._id, profileFields)
    } else {
      await ctx.db.insert('profiles', {
        userId,
        profileVisibility: 'public',
        availabilityStatus: 'available',
        learningTracks: [],
        profileViews: 0,
        projectsCount: 0,
        ...profileFields,
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

    const value = args.value.trim() || undefined
    const patch =
      args.field === 'github'
        ? { githubUrl: value }
        : args.field === 'website'
          ? { websiteUrl: value }
          : { testimony: value }
    await ctx.db.patch(profile._id, patch)

    const updated = await ctx.db.get(profile._id)
    return { user, profile: updated }
  },
})
