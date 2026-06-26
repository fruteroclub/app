import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sessions Functions
 *
 * Program sessions management.
 */

/**
 * List public sessions (upcoming)
 */
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_session_date")
      .filter((q) => q.gte(q.field("sessionDate"), now))
      .take(args.limit ?? 20);
    return { sessions };
  },
});

/**
 * List all sessions (admin)
 */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return { sessions };
  },
});

/**
 * Get sessions by program
 */
export const getByProgram = query({
  args: { programId: v.id("programs") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
    return { sessions };
  },
});

/**
 * Get session by ID
 */
export const getById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

/**
 * Create session
 */
export const create = mutation({
  args: {
    programId: v.optional(v.id("programs")),
    title: v.string(),
    description: v.optional(v.string()),
    sessionDate: v.number(),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    isVirtual: v.boolean(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("sessions", args);
    return await ctx.db.get(sessionId);
  },
});

/**
 * Update session
 */
export const update = mutation({
  args: {
    sessionId: v.id("sessions"),
    programId: v.optional(v.id("programs")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    sessionDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    isVirtual: v.optional(v.boolean()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(sessionId, cleanUpdates);
    return await ctx.db.get(sessionId);
  },
});

/**
 * Delete session
 */
export const remove = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});
