import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * club-app Convex schema — MINIMUM viable surface.
 *
 * Only what's needed to create + read a member's ACCOUNT (`users`) and app
 * PROFILE (`profiles`). The rest of the external contributor's backend (bounties,
 * leaderboard, bootcamp, studio, events, skills, …) is intentionally NOT brought
 * over yet — add tables back when those features land in club-app.
 *
 * OUR schema is the source of truth; we reuse the external field names where they
 * fit and extend with our own first-class fields. All additions are optional, so
 * the contributor's `convex export` imports as a subset (the wallet rename
 * `extWallet`→`userWallet` is the one field that needs a transform at import time).
 */
export default defineSchema({
  // ============================================================
  // USERS — the member's account (identity, auth, wallets)
  // ============================================================
  users: defineTable({
    // Privy Authentication
    privyDid: v.string(), // Unique identifier from Privy
    email: v.optional(v.string()),

    // Profile Identifiers
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    // first + last name are FIRST-CLASS (the canonical name) — distinct from
    // displayName (a separate public label). displayName may mirror "first last"
    // but is never the source.
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Wallets (account-level)
    appWallet: v.optional(v.string()), // Privy embedded wallet
    userWallet: v.optional(v.string()), // the user's own / external wallet (e.g. MetaMask)

    // Authentication
    primaryAuthMethod: v.union(
      v.literal("email"),
      v.literal("wallet"),
      v.literal("social")
    ),

    // Authorization
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),

    // Account Status
    accountStatus: v.union(
      v.literal("incomplete"), // Authenticated but onboarding not completed
      v.literal("pending"), // Onboarding complete, waiting for approval
      v.literal("active"), // Approved and active
      v.literal("suspended"), // Temporarily disabled
      v.literal("banned") // Permanently disabled
    ),

    // Timestamps (Unix milliseconds)
    lastLoginAt: v.number(),
    deletedAt: v.optional(v.number()), // Soft delete

    // Referral
    invitedByUserId: v.optional(v.id("users")), // Who invited this user

    // Metadata
    privyMetadata: v.optional(v.any()), // Privy SDK data
    metadata: v.optional(v.any()), // Business logic data
  })
    .index("by_privy_did", ["privyDid"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_account_status", ["accountStatus"]),

  // ============================================================
  // PROFILES — the member's app profile (extended info)
  // ============================================================
  profiles: defineTable({
    userId: v.id("users"), // Foreign key to users table

    // Location
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),

    // Social Links (URLs)
    githubUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    telegramHandle: v.optional(v.string()),
    websiteUrl: v.optional(v.string()), // club-app: personal site / portfolio

    // Social Usernames (for onboarding form)
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),

    // Learning & Interests
    learningTracks: v.array(
      v.union(v.literal("ai"), v.literal("crypto"), v.literal("privacy"))
    ),

    // Privacy Settings
    profileVisibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("private")
    ),

    // Status
    availabilityStatus: v.union(
      v.literal("available"),
      v.literal("open_to_offers"),
      v.literal("unavailable")
    ),

    // Stats
    projectsCount: v.optional(v.number()),
    completedBounties: v.optional(v.number()),
    totalEarningsUsd: v.optional(v.number()),
    profileViews: v.number(),

    // club-app fields (first-class, our schema).
    // `profiles.role` = the member's role (creativo/negocio/tecnologia); distinct
    // from `users.role` (authz: member/moderator/admin) on the other table.
    role: v.optional(
      v.union(
        v.literal("creativo"),
        v.literal("negocio"),
        v.literal("tecnologia")
      )
    ),
    favoriteFruit: v.optional(v.string()),
    preferredColor: v.optional(
      v.union(
        v.literal("magenta"),
        v.literal("violet"),
        v.literal("amber"),
        v.literal("green")
      )
    ),
    testimony: v.optional(v.string()),

    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_user_id", ["userId"])
    .index("by_visibility", ["profileVisibility"]),
});
