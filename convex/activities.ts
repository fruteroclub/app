import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Activities Functions
 *
 * Community activities with public access.
 */

/**
 * List public activities (active only)
 */
export const listPublic = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const status = args.status || "active";

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_status", (q) =>
        q.eq("status", status as "draft" | "active" | "completed" | "archived")
      )
      .take(args.limit ?? 50);

    return { activities };
  },
});

/**
 * List all activities
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .take(args.limit ?? 100);
    return { activities };
  },
});

/**
 * Get activity by ID
 */
export const getById = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

/**
 * Create activity (admin only)
 */
export const create = mutation({
  args: {
    callerPrivyDid: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    activityType: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    rewardPulpaAmount: v.number(),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    instructions: v.optional(v.string()),
    totalAvailableSlots: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    const { callerPrivyDid: _, ...data } = args;
    const activityId = await ctx.db.insert("activities", {
      ...data,
      status: data.status ?? "draft",
      currentSubmissionsCount: 0,
    });
    return await ctx.db.get(activityId);
  },
});

/**
 * Update activity (admin only)
 */
export const update = mutation({
  args: {
    callerPrivyDid: v.string(),
    activityId: v.id("activities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    activityType: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    rewardPulpaAmount: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    instructions: v.optional(v.string()),
    totalAvailableSlots: v.optional(v.number()),
    currentSubmissionsCount: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    const { activityId, callerPrivyDid: _, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(activityId, cleanUpdates);
    return await ctx.db.get(activityId);
  },
});

/**
 * Delete activity (admin only)
 */
export const remove = mutation({
  args: {
    callerPrivyDid: v.string(),
    activityId: v.id("activities"),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    await ctx.db.delete(args.activityId);
  },
});
