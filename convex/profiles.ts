import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Profile Functions
 *
 * Handle extended user profile data.
 */

/**
 * List public profiles for directory
 */
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get public profiles
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_visibility", (q) => q.eq("profileVisibility", "public"))
      .take(args.limit ?? 50);

    // Get associated users and bootcamp completion status
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        
        // Check if user has completed any bootcamp
        let bootcampCompleted = false;
        if (user) {
          const completedEnrollment = await ctx.db
            .query("bootcampEnrollments")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .first();
          bootcampCompleted = !!completedEnrollment;
        }
        
        return {
          ...profile,
          bootcampCompleted,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                accountStatus: user.accountStatus,
              }
            : null,
        };
      })
    );

    // Filter out profiles where user is not active
    const activeProfiles = profilesWithUsers.filter(
      (p) => p.user && p.user.accountStatus === "active"
    );

    return { profiles: activeProfiles };
  },
});

/**
 * Create or update profile for a user
 */
export const upsert = mutation({
  args: {
    privyDid: v.string(),
    city: v.string(),
    country: v.string(),
    countryCode: v.string(),
    learningTrack: v.union(
      v.literal("ai"),
      v.literal("crypto"),
      v.literal("privacy")
    ),
    availabilityStatus: v.union(
      v.literal("available"),
      v.literal("open_to_offers"),
      v.literal("unavailable")
    ),
    socialLinks: v.optional(
      v.object({
        github: v.optional(v.string()),
        twitter: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        telegram: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Get user by privyDid
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check if profile exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    const profileData = {
      userId: user._id,
      city: args.city,
      country: args.country,
      countryCode: args.countryCode,
      learningTracks: [args.learningTrack],
      availabilityStatus: args.availabilityStatus,
      githubUrl: args.socialLinks?.github,
      twitterUrl: args.socialLinks?.twitter,
      linkedinUrl: args.socialLinks?.linkedin,
      telegramHandle: args.socialLinks?.telegram,
      profileVisibility: "public" as const,
      projectsCount: 0,
      profileViews: 0,
    };

    if (existingProfile) {
      // Update existing profile
      await ctx.db.patch(existingProfile._id, profileData);
      return await ctx.db.get(existingProfile._id);
    } else {
      // Create new profile
      const profileId = await ctx.db.insert("profiles", profileData);
      return await ctx.db.get(profileId);
    }
  },
});

/**
 * Get profile by user ID
 */
export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

/**
 * Get profile by username
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    // Get inviter info if user was invited
    let invitedBy = null;
    if (user.invitedByUserId) {
      const inviter = await ctx.db.get(user.invitedByUserId);
      if (inviter) {
        invitedBy = {
          username: inviter.username,
          displayName: inviter.displayName,
        };
      }
    }

    return { user, profile, invitedBy };
  },
});

/**
 * Update profile stats (for admin/system use)
 */
export const updateStats = mutation({
  args: {
    profileId: v.id("profiles"),
    projectsCount: v.optional(v.number()),
    completedBounties: v.optional(v.number()), // For Epic 3
    totalEarningsUsd: v.optional(v.number()), // For Epic 3
    profileViews: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(profileId, cleanUpdates);
    return await ctx.db.get(profileId);
  },
});

/**
 * Update profile
 */
export const update = mutation({
  args: {
    profileId: v.id("profiles"),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    learningTracks: v.optional(
      v.array(v.union(v.literal("ai"), v.literal("crypto"), v.literal("privacy")))
    ),
    availabilityStatus: v.optional(
      v.union(
        v.literal("available"),
        v.literal("open_to_offers"),
        v.literal("unavailable")
      )
    ),
    githubUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    telegramHandle: v.optional(v.string()),
    profileVisibility: v.optional(
      v.union(v.literal("public"), v.literal("members"), v.literal("private"))
    ),
  },
  handler: async (ctx, args) => {
    const { profileId, ...updates } = args;

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(profileId, cleanUpdates);
    return await ctx.db.get(profileId);
  },
});
