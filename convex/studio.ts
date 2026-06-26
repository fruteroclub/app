import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Studio - Frutero's v0 clone for bootcamp students
 * Each student gets ONE deploy slot
 * 
 * Flow:
 * 1. Student chats with Frutero agent
 * 2. Agent creates project, runs bun dev, creates tunnel
 * 3. Agent sends tunnel URL to student
 * 4. Student sees preview in iframe
 * 5. Student deploys when ready (saves URL permanently)
 */

// Get user's deployed project
export const getDeployedProject = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("studioProjects")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    return project;
  },
});

// Get project by slug (for public preview)
export const getProjectBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("studioProjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    return project;
  },
});

// Deploy project - saves the preview URL permanently
export const deployProject = mutation({
  args: {
    userId: v.id("users"),
    previewUrl: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already has a project (only 1 allowed)
    const existingProject = await ctx.db
      .query("studioProjects")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProject) {
      // User already deployed - don't allow another
      throw new Error("Ya tienes un proyecto desplegado. Solo se permite un deploy.");
    }

    // Create new project with unique slug
    const slug = generateSlug(args.userId);
    
    const projectId = await ctx.db.insert("studioProjects", {
      userId: args.userId,
      previewUrl: args.previewUrl,
      title: args.title,
      slug,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { 
      id: projectId, 
      slug,
    };
  },
});

// Save current preview URL (before deploy)
export const savePreviewUrl = mutation({
  args: {
    userId: v.id("users"),
    previewUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Get or create session state
    const existing = await ctx.db
      .query("studioSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        currentPreviewUrl: args.previewUrl,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("studioSessions", {
        userId: args.userId,
        currentPreviewUrl: args.previewUrl,
        agentSessionId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get current session state
export const getSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("studioSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    return session;
  },
});

// Update agent session ID
export const updateAgentSession = mutation({
  args: {
    userId: v.id("users"),
    agentSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studioSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        agentSessionId: args.agentSessionId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("studioSessions", {
        userId: args.userId,
        currentPreviewUrl: null,
        agentSessionId: args.agentSessionId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Save chat history
export const saveChatHistory = mutation({
  args: {
    userId: v.id("users"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studioChatHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        messages: args.messages,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("studioChatHistory", {
        userId: args.userId,
        messages: args.messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Get chat history
export const getChatHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("studioChatHistory")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    return history?.messages || [];
  },
});

// Helper to generate unique slug
function generateSlug(userId: string): string {
  const adjectives = ["cool", "fast", "bright", "swift", "bold", "fresh", "smart", "slick", "epic", "mega"];
  const nouns = ["app", "site", "page", "view", "dash", "hub", "space", "zone", "lab", "forge"];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = userId.slice(-6).toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return `${adj}-${noun}-${suffix}`;
}
