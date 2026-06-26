import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * User Queries and Mutations
 */

// ============================================================
// QUERIES
// ============================================================

/**
 * List all active users (not soft-deleted)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get user by Privy DID
 */
export const getByPrivyDid = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();
  },
});

/**
 * Get user by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

/**
 * Get user by username
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

/**
 * List users by role
 */
export const listByRole = query({
  args: {
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .collect();
  },
});

/**
 * Get user with profile
 */
export const getWithProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .unique();

    return { ...user, profile };
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Create a new user (called from Privy auth)
 */
export const create = mutation({
  args: {
    privyDid: v.string(),
    email: v.optional(v.string()),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    primaryAuthMethod: v.union(
      v.literal("email"),
      v.literal("wallet"),
      v.literal("social")
    ),
    extWallet: v.optional(v.string()),
    appWallet: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (existing) {
      throw new Error("User already exists");
    }

    // Create user
    const userId = await ctx.db.insert("users", {
      privyDid: args.privyDid,
      email: args.email,
      username: args.username,
      displayName: args.displayName,
      primaryAuthMethod: args.primaryAuthMethod,
      extWallet: args.extWallet,
      appWallet: args.appWallet,
      role: "member", // Default role
      accountStatus: "incomplete", // Start as incomplete
      lastLoginAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user profile
 */
export const update = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;

    await ctx.db.patch(userId, updates);

    return { success: true };
  },
});

/**
 * Update user avatar by privyDid
 */
export const updateAvatar = mutation({
  args: {
    privyDid: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, { avatarUrl: args.avatarUrl ?? undefined });

    return { success: true, avatarUrl: args.avatarUrl };
  },
});

/**
 * Update user role (admin only)
 */
export const updateRole = mutation({
  args: {
    callerPrivyDid: v.string(),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    await ctx.db.patch(args.userId, { role: args.role });

    return { success: true };
  },
});

/**
 * Update account status (admin only)
 */
export const updateStatus = mutation({
  args: {
    callerPrivyDid: v.string(),
    userId: v.id("users"),
    accountStatus: v.union(
      v.literal("incomplete"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned")
    ),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    await ctx.db.patch(args.userId, { accountStatus: args.accountStatus });

    return { success: true };
  },
});

/**
 * Update last login timestamp
 */
export const updateLastLogin = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastLoginAt: Date.now() });

    return { success: true };
  },
});

/**
 * Generate a URL for uploading an avatar to Convex Storage
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const url = await ctx.storage.generateUploadUrl();
      return url;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Storage generateUploadUrl failed:", msg);
      throw new Error(`Storage error: ${msg}`);
    }
  },
});

/**
 * Save avatar from Convex Storage to user record
 */
export const saveAvatar = mutation({
  args: {
    privyDid: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) throw new Error("User not found");

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) throw new Error("Storage file not found");

    await ctx.db.patch(user._id, { avatarUrl: url });

    return { success: true, avatarUrl: url };
  },
});

/**
 * Soft delete user
 */
export const softDelete = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { deletedAt: Date.now() });

    return { success: true };
  },
});
