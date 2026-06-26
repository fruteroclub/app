import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Projects Functions
 * 
 * Portfolio projects management for members.
 */

/**
 * Get project by ID
 */
export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const owner = await ctx.db.get(project.ownerId);
    return {
      ...project,
      owner: owner ? {
        _id: owner._id,
        username: owner.username,
        displayName: owner.displayName,
        avatarUrl: owner.avatarUrl,
      } : null,
    };
  },
});

/**
 * Get projects by user ID
 */
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    // Sort by creation time (newest first)
    return {
      projects: projects.sort((a, b) => b._creationTime - a._creationTime),
    };
  },
});

/**
 * Get public projects by username (for public profile)
 */
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return { projects: [] };
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    // Only return public projects, sorted by newest
    const publicProjects = projects
      .filter((p) => p.isPublic && p.status !== "draft")
      .sort((a, b) => b._creationTime - a._creationTime);

    return { projects: publicProjects };
  },
});

/**
 * Get my projects (via privyDid)
 */
export const getMyProjects = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      return { projects: [] };
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    return {
      projects: projects.sort((a, b) => b._creationTime - a._creationTime),
    };
  },
});

/**
 * List public projects (for explore/discover)
 */
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .collect();

    // Filter public and active/completed only
    const publicProjects = projects
      .filter((p) => p.isPublic && (p.status === "active" || p.status === "completed"))
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit ?? 50);

    // Get owner info
    const projectsWithOwners = await Promise.all(
      publicProjects.map(async (project) => {
        const owner = await ctx.db.get(project.ownerId);
        return {
          ...project,
          owner: owner ? {
            _id: owner._id,
            username: owner.username,
            displayName: owner.displayName,
            avatarUrl: owner.avatarUrl,
          } : null,
        };
      })
    );

    return { projects: projectsWithOwners };
  },
});

/**
 * Create project
 */
export const create = mutation({
  args: {
    privyDid: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    thumbnailUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      ownerId: user._id,
      githubUrl: args.githubUrl,
      demoUrl: args.demoUrl,
      videoUrl: args.videoUrl,
      techStack: args.techStack ?? [],
      thumbnailUrl: args.thumbnailUrl,
      imageUrls: args.imageUrls ?? [],
      status: args.status ?? "active",
      isPublic: args.isPublic ?? true,
    });

    // Update project count in profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
    
    if (profile) {
      await ctx.db.patch(profile._id, {
        projectsCount: (profile.projectsCount || 0) + 1,
      });
    }

    return await ctx.db.get(projectId);
  },
});

/**
 * Update project
 */
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    privyDid: v.string(), // For authorization
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    techStack: v.optional(v.array(v.string())),
    thumbnailUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    )),
    isPublic: v.optional(v.boolean()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { projectId, privyDid, ...updates } = args;

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized to edit this project");
    }

    // Filter undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(projectId, cleanUpdates);
    return await ctx.db.get(projectId);
  },
});

/**
 * Delete project
 */
export const remove = mutation({
  args: {
    projectId: v.id("projects"),
    privyDid: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== user._id) {
      throw new Error("Not authorized to delete this project");
    }

    // Get project owner before deleting
    const ownerId = project.ownerId;
    
    await ctx.db.delete(args.projectId);

    // Update project count in profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", ownerId))
      .unique();
    
    if (profile && profile.projectsCount && profile.projectsCount > 0) {
      await ctx.db.patch(profile._id, {
        projectsCount: profile.projectsCount - 1,
      });
    }

    return { success: true };
  },
});
