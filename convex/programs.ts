import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Programs Functions
 *
 * Training programs management.
 */

/**
 * List active programs
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    return { programs };
  },
});

/**
 * Get program by ID
 */
export const getById = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.programId);
  },
});

/**
 * Get program dashboard data
 */
export const getDashboard = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) return null;

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    return {
      program,
      sessions,
      enrollmentCount: 0, // TODO: Add enrollments table
    };
  },
});

/**
 * Create program
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("archived")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const programId = await ctx.db.insert("programs", {
      ...args,
      isActive: args.status === "active",
    });
    return await ctx.db.get(programId);
  },
});

/**
 * Update program
 */
export const update = mutation({
  args: {
    programId: v.id("programs"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { programId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    if (cleanUpdates.status) {
      cleanUpdates.isActive = cleanUpdates.status === "active";
    }

    await ctx.db.patch(programId, cleanUpdates);
    return await ctx.db.get(programId);
  },
});

/**
 * Delete program
 */
export const remove = mutation({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.programId);
  },
});
