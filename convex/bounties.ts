import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

// ============================================================
// QUERIES
// ============================================================

/**
 * List bounties with optional filters
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("claimed"),
        v.literal("in_review"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let bounties;

    // Filter by status using index
    if (args.status) {
      bounties = await ctx.db
        .query("bounties")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      bounties = await ctx.db.query("bounties").collect();
    }

    // Filter by difficulty in memory (Convex doesn't support multiple index filters)
    let filtered = bounties;
    if (args.difficulty) {
      filtered = bounties.filter((b) => b.difficulty === args.difficulty);
    }

    // Sort by creation time (newest first)
    filtered.sort((a, b) => b._creationTime - a._creationTime);

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Enrich with creator info
    const enriched = await Promise.all(
      filtered.map(async (bounty) => {
        const creator = await ctx.db.get(bounty.createdByUserId) as Doc<"users"> | null;
        return {
          ...bounty,
          creator: creator
            ? {
                _id: creator._id,
                username: creator.username,
                displayName: creator.displayName,
                avatarUrl: creator.avatarUrl,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get open bounties for public listing
 */
export const listOpen = query({
  args: {
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const bounties = await ctx.db
      .query("bounties")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    let filtered = bounties;
    if (args.difficulty) {
      filtered = bounties.filter((b) => b.difficulty === args.difficulty);
    }

    // Sort by reward amount (highest first)
    filtered.sort((a, b) => b.rewardAmount - a.rewardAmount);

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

/**
 * Get a single bounty by ID
 */
export const get = query({
  args: { bountyId: v.id("bounties") },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) return null;

    const creator = await ctx.db.get(bounty.createdByUserId);

    // Get claims
    const claims = await ctx.db
      .query("bountyClaims")
      .withIndex("by_bounty", (q) => q.eq("bountyId", args.bountyId))
      .collect();

    // Enrich claims with user info
    const enrichedClaims = await Promise.all(
      claims.map(async (claim) => {
        const user = await ctx.db.get(claim.userId);
        return {
          ...claim,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return {
      ...bounty,
      creator: creator
        ? {
            _id: creator._id,
            username: creator.username,
            displayName: creator.displayName,
          }
        : null,
      claims: enrichedClaims,
    };
  },
});

/**
 * Get bounties claimed by a user
 */
export const getMyBounties = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("bountyClaims")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Enrich with bounty info
    const enriched = await Promise.all(
      claims.map(async (claim) => {
        const bounty = await ctx.db.get(claim.bountyId);
        return {
          ...claim,
          bounty,
        };
      })
    );

    // Sort by claimed date (newest first)
    enriched.sort((a, b) => b.claimedAt - a.claimedAt);

    return enriched;
  },
});

/**
 * Check if user has already claimed a bounty
 */
export const hasUserClaimed = query({
  args: {
    bountyId: v.id("bounties"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db
      .query("bountyClaims")
      .withIndex("by_bounty_user", (q) =>
        q.eq("bountyId", args.bountyId).eq("userId", args.userId)
      )
      .first();

    return claim;
  },
});

// ============================================================
// USER MUTATIONS
// ============================================================

/**
 * Claim a bounty
 */
export const claim = mutation({
  args: {
    bountyId: v.id("bounties"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const bounty = await ctx.db.get(args.bountyId);
    if (!bounty) {
      throw new Error("Bounty not found");
    }

    if (bounty.status !== "open") {
      throw new Error("Bounty is not available for claiming");
    }

    // Check if user already has an active claim
    const existingClaim = await ctx.db
      .query("bountyClaims")
      .withIndex("by_bounty_user", (q) =>
        q.eq("bountyId", args.bountyId).eq("userId", args.userId)
      )
      .first();

    if (existingClaim && existingClaim.status === "active") {
      throw new Error("You have already claimed this bounty");
    }

    // Check max claims
    const maxClaims = bounty.maxClaims || 1;
    if (bounty.currentClaimsCount >= maxClaims) {
      throw new Error("Maximum claims reached for this bounty");
    }

    // Calculate expiry (default 7 days)
    const deadlineDays = bounty.deadlineDays || 7;
    const expiresAt = Date.now() + deadlineDays * 24 * 60 * 60 * 1000;

    // Create claim
    const claimId = await ctx.db.insert("bountyClaims", {
      bountyId: args.bountyId,
      userId: args.userId,
      status: "active",
      claimedAt: Date.now(),
      expiresAt,
    });

    // Update bounty
    await ctx.db.patch(args.bountyId, {
      currentClaimsCount: bounty.currentClaimsCount + 1,
      status: bounty.currentClaimsCount + 1 >= maxClaims ? "claimed" : "open",
    });

    return claimId;
  },
});

/**
 * Submit work for a bounty claim
 */
export const submit = mutation({
  args: {
    claimId: v.id("bountyClaims"),
    submissionUrl: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "active") {
      throw new Error("Claim is not active");
    }

    // Check if claim has expired
    if (Date.now() > claim.expiresAt) {
      await ctx.db.patch(args.claimId, { status: "expired" });
      throw new Error("Claim has expired");
    }

    // Count previous attempts
    const previousSubmissions = await ctx.db
      .query("bountySubmissions")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .collect();

    const attemptNumber = previousSubmissions.length + 1;

    // Create submission
    const submissionId = await ctx.db.insert("bountySubmissions", {
      claimId: args.claimId,
      bountyId: claim.bountyId,
      userId: claim.userId,
      submissionUrl: args.submissionUrl,
      notes: args.notes,
      status: "pending",
      attemptNumber,
    });

    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "submitted",
      submittedAt: Date.now(),
    });

    // Update bounty status
    await ctx.db.patch(claim.bountyId, {
      status: "in_review",
    });

    return submissionId;
  },
});

/**
 * Abandon a claim
 */
export const abandonClaim = mutation({
  args: { claimId: v.id("bountyClaims") },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    if (claim.status !== "active") {
      throw new Error("Can only abandon active claims");
    }

    // Update claim
    await ctx.db.patch(args.claimId, { status: "abandoned" });

    // Update bounty
    const bounty = await ctx.db.get(claim.bountyId);
    if (bounty) {
      await ctx.db.patch(claim.bountyId, {
        currentClaimsCount: Math.max(0, bounty.currentClaimsCount - 1),
        status: "open",
      });
    }
  },
});

// ============================================================
// ADMIN MUTATIONS
// ============================================================

/**
 * Create a new bounty (admin only)
 */
export const create = mutation({
  args: {
    callerPrivyDid: v.string(),
    title: v.string(),
    description: v.string(),
    requirements: v.optional(v.string()),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    techStack: v.array(v.string()),
    category: v.optional(v.string()),
    rewardAmount: v.number(),
    rewardCurrency: v.string(),
    deadlineDays: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    maxClaims: v.optional(v.number()),
    resourceUrl: v.optional(v.string()),
    createdByUserId: v.id("users"),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("open"))
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

    return await ctx.db.insert("bounties", {
      title: args.title,
      description: args.description,
      requirements: args.requirements,
      difficulty: args.difficulty,
      techStack: args.techStack,
      category: args.category,
      rewardAmount: args.rewardAmount,
      rewardCurrency: args.rewardCurrency,
      deadlineDays: args.deadlineDays,
      expiresAt: args.expiresAt,
      maxClaims: args.maxClaims,
      resourceUrl: args.resourceUrl,
      createdByUserId: args.createdByUserId,
      status: args.status || "draft",
      currentClaimsCount: 0,
    });
  },
});

/**
 * Update a bounty (admin only)
 */
export const update = mutation({
  args: {
    callerPrivyDid: v.string(),
    bountyId: v.id("bounties"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    requirements: v.optional(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    techStack: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    rewardAmount: v.optional(v.number()),
    rewardCurrency: v.optional(v.string()),
    deadlineDays: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    maxClaims: v.optional(v.number()),
    resourceUrl: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("cancelled")
      )
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

    const { bountyId, callerPrivyDid: _, ...updates } = args;

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(bountyId, patch);
  },
});

/**
 * Review a submission (admin only)
 */
export const reviewSubmission = mutation({
  args: {
    callerPrivyDid: v.string(),
    submissionId: v.id("bountySubmissions"),
    reviewerUserId: v.id("users"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("revision_requested")
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }
    if (caller._id !== args.reviewerUserId) {
      throw new Error("Unauthorized: reviewer must match authenticated user");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Update submission
    await ctx.db.patch(args.submissionId, {
      status: args.status,
      reviewedByUserId: args.reviewerUserId,
      reviewNotes: args.reviewNotes,
      reviewedAt: Date.now(),
    });

    // Update claim
    const claim = await ctx.db.get(submission.claimId);
    if (claim) {
      if (args.status === "approved") {
        await ctx.db.patch(submission.claimId, {
          status: "approved",
          reviewedAt: Date.now(),
        });

        // Get bounty for reward amount
        const bounty = await ctx.db.get(submission.bountyId);
        
        // Update bounty status
        await ctx.db.patch(submission.bountyId, {
          status: "completed",
        });

        // Update user's completed bounties count and earnings
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user_id", (q) => q.eq("userId", submission.userId))
          .first();

        if (profile && bounty) {
          // Convert reward to USD (for simplicity, assume 1:1 for USD/USDC)
          const rewardInUsd = bounty.rewardCurrency === "ETH" 
            ? bounty.rewardAmount * 2500 // Rough ETH price
            : bounty.rewardAmount;
          
          await ctx.db.patch(profile._id, {
            completedBounties: (profile.completedBounties || 0) + 1,
            totalEarningsUsd: (profile.totalEarningsUsd || 0) + rewardInUsd,
          });
        }
      } else if (args.status === "rejected") {
        await ctx.db.patch(submission.claimId, {
          status: "rejected",
          reviewedAt: Date.now(),
        });

        // Reopen bounty
        const bounty = await ctx.db.get(submission.bountyId);
        if (bounty) {
          await ctx.db.patch(submission.bountyId, {
            status: "open",
            currentClaimsCount: Math.max(0, bounty.currentClaimsCount - 1),
          });
        }
      } else if (args.status === "revision_requested") {
        // Allow resubmission
        await ctx.db.patch(submission.claimId, {
          status: "active",
        });

        await ctx.db.patch(submission.bountyId, {
          status: "claimed",
        });
      }
    }

    return args.submissionId;
  },
});

/**
 * Get all submissions for review (admin)
 */
export const listSubmissions = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("revision_requested")
      )
    ),
  },
  handler: async (ctx, args) => {
    let submissions;
    if (args.status) {
      submissions = await ctx.db
        .query("bountySubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      submissions = await ctx.db.query("bountySubmissions").collect();
    }

    // Enrich with bounty and user info
    const enriched = await Promise.all(
      submissions.map(async (sub) => {
        const bounty = await ctx.db.get(sub.bountyId) as Doc<"bounties"> | null;
        const user = await ctx.db.get(sub.userId) as Doc<"users"> | null;
        return {
          ...sub,
          bounty: bounty
            ? {
                _id: bounty._id,
                title: bounty.title,
                rewardAmount: bounty.rewardAmount,
                rewardCurrency: bounty.rewardCurrency,
              }
            : null,
          user: user
            ? {
                _id: user._id,
                username: user.username,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    // Sort by creation time (newest first)
    enriched.sort((a, b) => b._creationTime - a._creationTime);

    return enriched;
  },
});

/**
 * Get bounty stats (admin dashboard)
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const allBounties = await ctx.db.query("bounties").collect();
    const allClaims = await ctx.db.query("bountyClaims").collect();
    const allSubmissions = await ctx.db.query("bountySubmissions").collect();

    const openBounties = allBounties.filter((b) => b.status === "open").length;
    const claimedBounties = allBounties.filter((b) => b.status === "claimed").length;
    const completedBounties = allBounties.filter((b) => b.status === "completed").length;
    const pendingReviews = allSubmissions.filter((s) => s.status === "pending").length;

    const totalPaidOut = allBounties
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.rewardAmount, 0);

    return {
      openBounties,
      claimedBounties,
      completedBounties,
      pendingReviews,
      totalBounties: allBounties.length,
      totalClaims: allClaims.length,
      totalSubmissions: allSubmissions.length,
      totalPaidOut,
    };
  },
});

/**
 * Delete all bounties (admin cleanup)
 */
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all submissions
    const submissions = await ctx.db.query("bountySubmissions").collect();
    for (const s of submissions) {
      await ctx.db.delete(s._id);
    }
    
    // Delete all claims
    const claims = await ctx.db.query("bountyClaims").collect();
    for (const c of claims) {
      await ctx.db.delete(c._id);
    }
    
    // Delete all bounties
    const bounties = await ctx.db.query("bounties").collect();
    for (const b of bounties) {
      await ctx.db.delete(b._id);
    }
    
    return { deleted: bounties.length };
  },
});
