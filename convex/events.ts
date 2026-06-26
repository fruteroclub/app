import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Event Queries and Mutations
 */

// ============================================================
// QUERIES
// ============================================================

/**
 * List events with optional status filter
 */
export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let events;

    if (args.status === "upcoming") {
      events = await ctx.db
        .query("events")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .filter((q) => q.gte(q.field("startDate"), now))
        .order("asc")
        .take(args.limit ?? 50);
    } else if (args.status === "past") {
      events = await ctx.db
        .query("events")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .filter((q) => q.lt(q.field("startDate"), now))
        .order("desc")
        .take(args.limit ?? 50);
    } else if (args.status === "live") {
      events = await ctx.db
        .query("events")
        .withIndex("by_status", (q) => q.eq("status", "live"))
        .take(args.limit ?? 50);
    } else {
      events = await ctx.db
        .query("events")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .order("desc")
        .take(args.limit ?? 50);
    }

    return { events };
  },
});

/**
 * List all published events
 */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc")
      .collect();
  },
});

/**
 * List upcoming published events
 */
export const listUpcoming = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    return await ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .filter((q) => q.gte(q.field("startDate"), now))
      .order("asc")
      .collect();
  },
});

/**
 * List featured events
 */
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .filter((q) => q.eq(q.field("isFeatured"), true))
      .collect();
  },
});

/**
 * Get event by Luma slug
 */
export const getByLumaSlug = query({
  args: { lumaSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_luma_slug", (q) => q.eq("lumaSlug", args.lumaSlug))
      .unique();
  },
});

/**
 * Get event by ID
 */
export const get = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

/**
 * List events by calendar
 */
export const listByCalendar = query({
  args: { calendar: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("events")
      .withIndex("by_calendar", (q) => q.eq("calendar", args.calendar))
      .collect();
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Create a new event (from Luma sync or manual)
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    lumaUrl: v.string(),
    lumaEventId: v.optional(v.string()),
    lumaSlug: v.optional(v.string()),
    eventType: v.union(
      v.literal("in-person"),
      v.literal("virtual"),
      v.literal("hybrid")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    timezone: v.string(),
    location: v.optional(v.string()),
    locationDetails: v.optional(v.string()),
    locationUrl: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    hosts: v.array(
      v.object({
        name: v.string(),
        avatarUrl: v.optional(v.string()),
        handle: v.optional(v.string()),
      })
    ),
    calendar: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if event already exists (by Luma slug)
    if (args.lumaSlug) {
      const existing = await ctx.db
        .query("events")
        .withIndex("by_luma_slug", (q) => q.eq("lumaSlug", args.lumaSlug))
        .unique();

      if (existing) {
        throw new Error("Event already exists");
      }
    }

    // Determine status based on dates
    const now = Date.now();
    let status: "upcoming" | "live" | "past" | "cancelled" = "upcoming";
    
    if (args.startDate <= now && (!args.endDate || args.endDate >= now)) {
      status = "live";
    } else if (args.endDate && args.endDate < now) {
      status = "past";
    }

    // Create event
    const eventId = await ctx.db.insert("events", {
      ...args,
      status,
      isPublished: args.isPublished ?? false,
      isFeatured: args.isFeatured ?? false,
      registrationCount: 0,
      registrationType: "free",
    });

    return eventId;
  },
});

/**
 * Update an existing event
 */
export const update = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { eventId, ...updates } = args;

    await ctx.db.patch(eventId, updates);

    return { success: true };
  },
});

/**
 * Delete an event
 */
export const remove = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

/**
 * Upsert event (create or update from Luma sync)
 */
export const upsert = mutation({
  args: {
    lumaSlug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    lumaUrl: v.string(),
    lumaEventId: v.optional(v.string()),
    eventType: v.union(
      v.literal("in-person"),
      v.literal("virtual"),
      v.literal("hybrid")
    ),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    timezone: v.string(),
    location: v.optional(v.string()),
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),
    hosts: v.array(
      v.object({
        name: v.string(),
        avatarUrl: v.optional(v.string()),
        handle: v.optional(v.string()),
      })
    ),
    calendar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if event exists
    const existing = await ctx.db
      .query("events")
      .withIndex("by_luma_slug", (q) => q.eq("lumaSlug", args.lumaSlug))
      .unique();

    // Determine status
    const now = Date.now();
    let status: "upcoming" | "live" | "past" | "cancelled" = "upcoming";
    
    if (args.startDate <= now && (!args.endDate || args.endDate >= now)) {
      status = "live";
    } else if (args.endDate && args.endDate < now) {
      status = "past";
    }

    if (existing) {
      // Update existing event
      await ctx.db.patch(existing._id, {
        title: args.title,
        description: args.description,
        coverImage: args.coverImage,
        startDate: args.startDate,
        endDate: args.endDate,
        location: args.location,
        coordinates: args.coordinates,
        hosts: args.hosts,
        status,
      });

      return { eventId: existing._id, action: "updated" };
    } else {
      // Create new event
      const eventId = await ctx.db.insert("events", {
        ...args,
        status,
        isPublished: true, // Auto-publish synced events
        isFeatured: false,
        registrationCount: 0,
        registrationType: "free",
      });

      return { eventId, action: "created" };
    }
  },
});
