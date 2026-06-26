import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Application Functions
 *
 * Handle onboarding applications for new users.
 */

/**
 * Submit onboarding application
 *
 * Requirements:
 * - User must exist
 * - User must be in 'incomplete' status
 * - Goal must be 1-280 characters
 * - Motivation must be 1-500 characters
 */
export const submit = mutation({
  args: {
    privyDid: v.string(),
    programId: v.optional(v.string()), // We'll look up the program
    goal: v.string(),
    motivationText: v.string(),
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user by privyDid
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Allow submission from "incomplete" users (normal flow) and "active" users
    // (auto-approved via bootcamp code or invitation who still need to complete onboarding)
    if (user.accountStatus !== "incomplete" && user.accountStatus !== "active") {
      throw new Error("User has already submitted an application");
    }

    // Validate goal length
    if (args.goal.length < 1 || args.goal.length > 280) {
      throw new Error("Goal must be 1-280 characters");
    }

    // Validate motivation length
    if (args.motivationText.length < 1 || args.motivationText.length > 500) {
      throw new Error("Motivation must be 1-500 characters");
    }

    const alreadyActive = user.accountStatus === "active";

    // Check for existing application
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    let applicationId;
    if (existingApplication) {
      // Update existing application (e.g. auto-created by bootcamp/invitation flow)
      await ctx.db.patch(existingApplication._id, {
        goal: args.goal,
        motivationText: args.motivationText,
        githubUsername: args.githubUsername,
        twitterUsername: args.twitterUsername,
        ...(alreadyActive ? { status: "approved" } : {}),
      });
      applicationId = existingApplication._id;
    } else {
      // Create new application
      applicationId = await ctx.db.insert("applications", {
        userId: user._id,
        goal: args.goal,
        motivationText: args.motivationText,
        githubUsername: args.githubUsername,
        twitterUsername: args.twitterUsername,
        status: alreadyActive ? "approved" : "pending",
      });
    }

    // Only change accountStatus for non-active users (don't downgrade active → pending)
    if (!alreadyActive) {
      await ctx.db.patch(user._id, {
        accountStatus: "pending",
      });
    }

    // Update or create profile with social accounts
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();

    const profileData = {
      userId: user._id,
      githubUsername: args.githubUsername,
      twitterUsername: args.twitterUsername,
      linkedinUrl: args.linkedinUrl,
      telegramUsername: args.telegramUsername,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
    } else {
      await ctx.db.insert("profiles", {
        ...profileData,
        learningTracks: [],
        profileVisibility: "public",
        availabilityStatus: "available",
        projectsCount: 0,
        profileViews: 0,
      });
    }

    const application = await ctx.db.get(applicationId);

    return { application };
  },
});

/**
 * Get application by user
 */
export const getByUser = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      return null;
    }

    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

/**
 * List pending applications (for admin)
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Get user info for each application
    const pendingUsers = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        const profile = user
          ? await ctx.db
              .query("profiles")
              .withIndex("by_user_id", (q) => q.eq("userId", user._id))
              .unique()
          : null;
        return { ...app, user, profile };
      })
    );

    return { pendingUsers };
  },
});

/**
 * List all applications (for admin)
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    let applications;

    if (args.status) {
      applications = await ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      applications = await ctx.db.query("applications").collect();
    }

    // Get user info for each application
    const applicationsWithUsers = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        return { ...app, user };
      })
    );

    return applicationsWithUsers;
  },
});

/**
 * Approve application (admin only)
 */
export const approve = mutation({
  args: {
    applicationId: v.id("applications"),
    reviewerPrivyDid: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get reviewer
    const reviewer = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.reviewerPrivyDid))
      .unique();

    if (!reviewer || reviewer.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Get application
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Update application
    await ctx.db.patch(args.applicationId, {
      status: "approved",
      reviewedByUserId: reviewer._id,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });

    // Update user status to active
    await ctx.db.patch(application.userId, {
      accountStatus: "active",
    });

    return { success: true };
  },
});

/**
 * Reject application (admin only)
 */
export const reject = mutation({
  args: {
    applicationId: v.id("applications"),
    reviewerPrivyDid: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get reviewer
    const reviewer = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.reviewerPrivyDid))
      .unique();

    if (!reviewer || reviewer.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // Get application
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Update application
    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewedByUserId: reviewer._id,
      reviewedAt: Date.now(),
      reviewNotes: args.reviewNotes,
    });

    // Update user status to rejected (or keep pending?)
    // For now, we'll update to 'suspended' to indicate rejection
    await ctx.db.patch(application.userId, {
      accountStatus: "suspended",
    });

    return { success: true };
  },
});
