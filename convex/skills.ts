import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================
// QUERIES
// ============================================================

/**
 * List all skills, optionally filtered by category
 */
export const list = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("frontend"),
        v.literal("backend"),
        v.literal("blockchain"),
        v.literal("ai"),
        v.literal("devops"),
        v.literal("design"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("skills")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    return await ctx.db.query("skills").collect();
  },
});

/**
 * Get a skill by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Get skills for a user with endorsement counts
 */
export const getUserSkills = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const userSkills = await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with skill details
    const enriched = await Promise.all(
      userSkills.map(async (us) => {
        const skill = await ctx.db.get(us.skillId);
        return {
          ...us,
          skill,
        };
      })
    );

    // Sort by endorsement count (descending)
    return enriched.sort((a, b) => b.endorsementCount - a.endorsementCount);
  },
});

/**
 * Get skills for a user by username (public)
 */
export const getUserSkillsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return [];

    const userSkills = await ctx.db
      .query("userSkills")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const enriched = await Promise.all(
      userSkills.map(async (us) => {
        const skill = await ctx.db.get(us.skillId);
        return {
          ...us,
          skill,
        };
      })
    );

    return enriched.sort((a, b) => b.endorsementCount - a.endorsementCount);
  },
});

/**
 * Get endorsements for a user skill
 */
export const getEndorsements = query({
  args: { userSkillId: v.id("userSkills") },
  handler: async (ctx, args) => {
    const endorsements = await ctx.db
      .query("endorsements")
      .withIndex("by_user_skill", (q) => q.eq("userSkillId", args.userSkillId))
      .collect();

    // Enrich with endorser details
    const enriched = await Promise.all(
      endorsements.map(async (e) => {
        const endorser = await ctx.db.get(e.endorserId);
        return {
          ...e,
          endorser: endorser
            ? {
                _id: endorser._id,
                username: endorser.username,
                displayName: endorser.displayName,
                avatarUrl: endorser.avatarUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Check if current user has endorsed a specific user skill
 */
export const hasEndorsed = query({
  args: {
    endorserId: v.id("users"),
    userSkillId: v.id("userSkills"),
  },
  handler: async (ctx, args) => {
    const endorsement = await ctx.db
      .query("endorsements")
      .withIndex("by_endorser_user_skill", (q) =>
        q.eq("endorserId", args.endorserId).eq("userSkillId", args.userSkillId)
      )
      .first();

    return !!endorsement;
  },
});

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Add a skill to a user's profile
 */
export const addUserSkill = mutation({
  args: {
    userId: v.id("users"),
    skillId: v.id("skills"),
    level: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  handler: async (ctx, args) => {
    // Check if already has this skill
    const existing = await ctx.db
      .query("userSkills")
      .withIndex("by_user_skill", (q) =>
        q.eq("userId", args.userId).eq("skillId", args.skillId)
      )
      .first();

    if (existing) {
      throw new Error("User already has this skill");
    }

    return await ctx.db.insert("userSkills", {
      userId: args.userId,
      skillId: args.skillId,
      level: args.level,
      endorsementCount: 0,
    });
  },
});

/**
 * Update a user skill's level
 */
export const updateUserSkillLevel = mutation({
  args: {
    userSkillId: v.id("userSkills"),
    level: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userSkillId, { level: args.level });
  },
});

/**
 * Remove a skill from a user's profile
 */
export const removeUserSkill = mutation({
  args: { userSkillId: v.id("userSkills") },
  handler: async (ctx, args) => {
    // Delete all endorsements for this user skill
    const endorsements = await ctx.db
      .query("endorsements")
      .withIndex("by_user_skill", (q) => q.eq("userSkillId", args.userSkillId))
      .collect();

    for (const e of endorsements) {
      await ctx.db.delete(e._id);
    }

    // Delete the user skill
    await ctx.db.delete(args.userSkillId);
  },
});

/**
 * Endorse a user's skill
 */
export const endorse = mutation({
  args: {
    endorserId: v.id("users"),
    userSkillId: v.id("userSkills"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user skill to find the endorsee
    const userSkill = await ctx.db.get(args.userSkillId);
    if (!userSkill) {
      throw new Error("User skill not found");
    }

    // Can't endorse yourself
    if (userSkill.userId === args.endorserId) {
      throw new Error("Cannot endorse your own skill");
    }

    // Check if already endorsed
    const existing = await ctx.db
      .query("endorsements")
      .withIndex("by_endorser_user_skill", (q) =>
        q.eq("endorserId", args.endorserId).eq("userSkillId", args.userSkillId)
      )
      .first();

    if (existing) {
      throw new Error("Already endorsed this skill");
    }

    // Validate message length
    if (args.message && args.message.length > 140) {
      throw new Error("Message must be 140 characters or less");
    }

    // Create endorsement
    const endorsementId = await ctx.db.insert("endorsements", {
      endorserId: args.endorserId,
      endorseeId: userSkill.userId,
      userSkillId: args.userSkillId,
      message: args.message,
    });

    // Update endorsement count
    await ctx.db.patch(args.userSkillId, {
      endorsementCount: userSkill.endorsementCount + 1,
    });

    return endorsementId;
  },
});

/**
 * Remove an endorsement
 */
export const removeEndorsement = mutation({
  args: {
    endorserId: v.id("users"),
    userSkillId: v.id("userSkills"),
  },
  handler: async (ctx, args) => {
    const endorsement = await ctx.db
      .query("endorsements")
      .withIndex("by_endorser_user_skill", (q) =>
        q.eq("endorserId", args.endorserId).eq("userSkillId", args.userSkillId)
      )
      .first();

    if (!endorsement) {
      throw new Error("Endorsement not found");
    }

    // Delete endorsement
    await ctx.db.delete(endorsement._id);

    // Update endorsement count
    const userSkill = await ctx.db.get(args.userSkillId);
    if (userSkill) {
      await ctx.db.patch(args.userSkillId, {
        endorsementCount: Math.max(0, userSkill.endorsementCount - 1),
      });
    }
  },
});

// ============================================================
// ADMIN MUTATIONS
// ============================================================

/**
 * Create a new skill (admin only)
 */
export const createSkill = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    category: v.union(
      v.literal("frontend"),
      v.literal("backend"),
      v.literal("blockchain"),
      v.literal("ai"),
      v.literal("devops"),
      v.literal("design"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Skill with this slug already exists");
    }

    return await ctx.db.insert("skills", {
      name: args.name,
      slug: args.slug,
      category: args.category,
      description: args.description,
    });
  },
});

/**
 * Get or create a custom skill (for users to add skills not in preset list)
 */
export const getOrCreateCustomSkill = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length < 2 || name.length > 50) {
      throw new Error("Skill name must be 2-50 characters");
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if exists by slug
    const existing = await ctx.db
      .query("skills")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existing) {
      return existing._id;
    }

    // Check if exists by name (case-insensitive)
    const byName = await ctx.db
      .query("skills")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (byName) {
      return byName._id;
    }

    // Create new skill in "other" category
    return await ctx.db.insert("skills", {
      name,
      slug,
      category: "other",
    });
  },
});

/**
 * Seed initial skills (run once)
 */
export const seedSkills = mutation({
  args: {},
  handler: async (ctx) => {
    const skillsData = [
      // Frontend
      { name: "React", slug: "react", category: "frontend" as const },
      { name: "Next.js", slug: "nextjs", category: "frontend" as const },
      { name: "TypeScript", slug: "typescript", category: "frontend" as const },
      { name: "Tailwind CSS", slug: "tailwindcss", category: "frontend" as const },
      { name: "Vue.js", slug: "vuejs", category: "frontend" as const },
      
      // Backend
      { name: "Node.js", slug: "nodejs", category: "backend" as const },
      { name: "Python", slug: "python", category: "backend" as const },
      { name: "Go", slug: "go", category: "backend" as const },
      { name: "Rust", slug: "rust", category: "backend" as const },
      { name: "PostgreSQL", slug: "postgresql", category: "backend" as const },
      
      // Blockchain
      { name: "Solidity", slug: "solidity", category: "blockchain" as const },
      { name: "Ethereum", slug: "ethereum", category: "blockchain" as const },
      { name: "Web3.js", slug: "web3js", category: "blockchain" as const },
      { name: "Foundry", slug: "foundry", category: "blockchain" as const },
      { name: "Smart Contracts", slug: "smart-contracts", category: "blockchain" as const },
      
      // AI
      { name: "Machine Learning", slug: "machine-learning", category: "ai" as const },
      { name: "LLMs", slug: "llms", category: "ai" as const },
      { name: "PyTorch", slug: "pytorch", category: "ai" as const },
      { name: "LangChain", slug: "langchain", category: "ai" as const },
      { name: "OpenAI API", slug: "openai-api", category: "ai" as const },
      
      // DevOps
      { name: "Docker", slug: "docker", category: "devops" as const },
      { name: "Kubernetes", slug: "kubernetes", category: "devops" as const },
      { name: "AWS", slug: "aws", category: "devops" as const },
      { name: "CI/CD", slug: "ci-cd", category: "devops" as const },
      { name: "Linux", slug: "linux", category: "devops" as const },
      
      // Design
      { name: "Figma", slug: "figma", category: "design" as const },
      { name: "UI/UX Design", slug: "ui-ux-design", category: "design" as const },
      { name: "Product Design", slug: "product-design", category: "design" as const },
    ];

    let created = 0;
    for (const skill of skillsData) {
      const existing = await ctx.db
        .query("skills")
        .withIndex("by_slug", (q) => q.eq("slug", skill.slug))
        .first();

      if (!existing) {
        await ctx.db.insert("skills", skill);
        created++;
      }
    }

    return { created, total: skillsData.length };
  },
});
