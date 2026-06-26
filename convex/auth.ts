import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Authentication Functions
 *
 * Handle user creation, login, and profile updates.
 * Integrates with Privy authentication on the frontend.
 */

/**
 * Get or create user during login
 *
 * Called after Privy authentication completes on client-side.
 * - If user exists: Returns existing user + profile
 * - If user doesn't exist: Creates new user, returns with null profile
 */
export const getOrCreateUser = mutation({
  args: {
    privyDid: v.string(),
    email: v.optional(v.string()),
    appWallet: v.optional(v.string()),
    extWallet: v.optional(v.string()),
    primaryAuthMethod: v.union(
      v.literal("email"),
      v.literal("wallet"),
      v.literal("social")
    ),
    loginMethod: v.optional(v.string()), // github, google, email, etc.
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (existingUser) {
      // User exists - get profile and return
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q) => q.eq("userId", existingUser._id))
        .unique();

      return {
        user: existingUser,
        profile,
        isNewUser: false,
      };
    }

    // User doesn't exist - create new
    const emailSuffix = args.loginMethod
      ? `${args.loginMethod}.incomplete.user`
      : "incomplete.user";
    const tempEmail =
      args.email || `${args.privyDid.replace("did:privy:", "")}@${emailSuffix}`;
    const tempUsername = `user_${args.privyDid.slice(-12)}`;
    const tempDisplayName = args.loginMethod
      ? `${args.loginMethod.charAt(0).toUpperCase() + args.loginMethod.slice(1)} User`
      : "New User";

    const userId = await ctx.db.insert("users", {
      privyDid: args.privyDid,
      email: tempEmail,
      username: tempUsername,
      displayName: tempDisplayName,
      appWallet: args.appWallet,
      extWallet: args.extWallet,
      primaryAuthMethod: args.primaryAuthMethod,
      role: "member",
      accountStatus: "incomplete",
      lastLoginAt: Date.now(),
    });

    // Create basic profile to prevent "profile not found" errors
    // User will complete full profile during onboarding
    const profileId = await ctx.db.insert("profiles", {
      userId,
      profileVisibility: "public",
      availabilityStatus: "available",
      learningTracks: [],
      profileViews: 0,
      projectsCount: 0,
    });

    const newUser = await ctx.db.get(userId);
    const newProfile = await ctx.db.get(profileId);

    return {
      user: newUser,
      profile: newProfile,
      isNewUser: true,
    };
  },
});

/**
 * Get current user by Privy DID
 */
export const getCurrentUser = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    return { user, profile };
  },
});

/**
 * Update current user profile
 */
export const updateCurrentUser = mutation({
  args: {
    privyDid: v.string(),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { privyDid, ...updates } = args;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check username uniqueness if being changed
    if (updates.username && updates.username !== user.username) {
      const existingUsername = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", updates.username))
        .unique();

      if (existingUsername) {
        throw new Error("Username already taken");
      }
    }

    // Check email uniqueness if being changed
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", updates.email))
        .unique();

      if (existingEmail) {
        throw new Error("Email already in use");
      }
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, string> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    // Update user
    await ctx.db.patch(user._id, cleanUpdates);

    // Get updated user with profile
    const updatedUser = await ctx.db.get(user._id);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    return { user: updatedUser, profile };
  },
});

/**
 * Update user data
 */
export const updateUser = mutation({
  args: {
    privyDid: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

/**
 * Check if username is available
 */
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    return { available: !existing };
  },
});

/**
 * Update last login timestamp
 */
export const updateLastLogin = mutation({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { lastLoginAt: Date.now() });
    }
  },
});

/**
 * Delete user (for testing/cleanup)
 */
export const deleteUser = mutation({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      return { deleted: false };
    }

    // Delete profile if exists
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
    
    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // Delete applications if exist
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    
    for (const app of applications) {
      await ctx.db.delete(app._id);
    }

    // Delete user
    await ctx.db.delete(user._id);

    return { deleted: true };
  },
});

/**
 * Create missing profile for existing user (admin cleanup)
 */
export const createMissingProfile = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if profile already exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();
    
    if (existing) {
      return { created: false, message: "Profile already exists" };
    }

    // Create basic profile
    await ctx.db.insert("profiles", {
      userId: args.userId,
      profileVisibility: "public",
      availabilityStatus: "available",
      learningTracks: [],
      profileViews: 0,
      projectsCount: 0,
    });

    return { created: true };
  },
});
