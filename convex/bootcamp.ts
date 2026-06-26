import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Bootcamp LMS - Queries and Mutations
 * 
 * Handles bootcamp programs, enrollments, sessions, and deliverables.
 */

// ============================================================
// HELPER: Generate unique code
// ============================================================
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, I, 1
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================
// PROGRAMS - Queries
// ============================================================

export const listPrograms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bootcampPrograms")
      .filter((q) => q.neq(q.field("status"), "archived"))
      .collect();
  },
});

export const getProgramBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bootcampPrograms")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const getProgramWithSessions = query({
  args: { programId: v.id("bootcampPrograms") },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) return null;

    const sessions = await ctx.db
      .query("bootcampSessions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    return {
      ...program,
      sessions: sessions.sort((a, b) => a.sessionNumber - b.sessionNumber),
    };
  },
});

// ============================================================
// PROGRAMS - Mutations (Admin)
// ============================================================

export const createProgram = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    sessionsCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Check slug is unique
    const existing = await ctx.db
      .query("bootcampPrograms")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    
    if (existing) {
      throw new Error("Program with this slug already exists");
    }

    return await ctx.db.insert("bootcampPrograms", {
      ...args,
      status: "draft",
    });
  },
});

export const createSession = mutation({
  args: {
    programId: v.id("bootcampPrograms"),
    sessionNumber: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    deliverableTitle: v.string(),
    deliverableDescription: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    contentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bootcampSessions", args);
  },
});

export const updateProgramStatus = mutation({
  args: {
    programId: v.id("bootcampPrograms"),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.programId, { status: args.status });
  },
});

// ============================================================
// ENROLLMENTS - Queries
// ============================================================

export const getEnrollmentByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!enrollment) return null;

    const program = await ctx.db.get(enrollment.programId);
    return { enrollment, program };
  },
});

export const getMyEnrollments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get program details for each enrollment
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const program = await ctx.db.get(enrollment.programId);
        return { enrollment, program };
      })
    );

    return result.filter((r) => r.program !== null);
  },
});

/** List all active/completed participants (for directory badges) */
export const listActiveParticipants = query({
  args: {},
  handler: async (ctx) => {
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    const result = await Promise.all(
      enrollments
        .filter((e) => e.userId)
        .map(async (e) => {
          const program = await ctx.db.get(e.programId);
          return {
            userId: e.userId!,
            programName: program?.name ?? "Bootcamp",
            programSlug: program?.slug ?? "",
            progress: e.progress,
            status: e.status,
            sessionsCompleted: e.sessionsCompleted,
            sessionsCount: program?.sessionsCount ?? 5,
          };
        })
    );
    return result;
  },
});

export const getEnrollmentWithDetails = query({
  args: { 
    programSlug: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get program
    const program = await ctx.db
      .query("bootcampPrograms")
      .withIndex("by_slug", (q) => q.eq("slug", args.programSlug))
      .unique();

    if (!program) return null;

    // Get enrollment
    const enrollment = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("programId"), program._id))
      .unique();

    if (!enrollment) return null;

    // Get sessions
    const sessions = await ctx.db
      .query("bootcampSessions")
      .withIndex("by_program", (q) => q.eq("programId", program._id))
      .collect();

    // Get deliverables
    const deliverables = await ctx.db
      .query("bootcampDeliverables")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
      .collect();

    return {
      program,
      enrollment,
      sessions: sessions.sort((a, b) => a.sessionNumber - b.sessionNumber),
      deliverables,
    };
  },
});

export const listEnrollmentsByProgram = query({
  args: { programId: v.id("bootcampPrograms") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    // Get user details for linked enrollments
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        let user = null;
        if (enrollment.userId) {
          user = await ctx.db.get(enrollment.userId);
        }
        return { enrollment, user };
      })
    );

    return result;
  },
});

// ============================================================
// ENROLLMENTS - Mutations
// ============================================================

/** Admin utility: reset an enrollment so the code can be reused */
export const resetEnrollment = mutation({
  args: { enrollmentId: v.id("bootcampEnrollments") },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");
    await ctx.db.patch(args.enrollmentId, {
      userId: undefined,
      status: "pending",
      joinedAt: undefined,
      progress: 0,
      sessionsCompleted: 0,
    });
    return { code: enrollment.code, reset: true };
  },
});

/** Admin utility: delete an enrollment */
export const deleteEnrollment = mutation({
  args: { enrollmentId: v.id("bootcampEnrollments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.enrollmentId);
    return { deleted: true };
  },
});

export const createEnrollment = mutation({
  args: {
    email: v.string(),
    programId: v.id("bootcampPrograms"),
  },
  handler: async (ctx, args) => {
    // Check if email already enrolled in this program
    const existing = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) => q.eq(q.field("programId"), args.programId))
      .unique();

    if (existing) {
      throw new Error("Email already enrolled in this program");
    }

    // Generate unique code
    let code = generateCode();
    let codeExists = true;
    while (codeExists) {
      const existingCode = await ctx.db
        .query("bootcampEnrollments")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
      if (!existingCode) {
        codeExists = false;
      } else {
        code = generateCode();
      }
    }

    return await ctx.db.insert("bootcampEnrollments", {
      code,
      email: args.email.toLowerCase(),
      programId: args.programId,
      status: "pending",
      progress: 0,
      sessionsCompleted: 0,
      createdAt: Date.now(),
    });
  },
});

export const createEnrollmentsBulk = mutation({
  args: {
    emails: v.array(v.string()),
    programId: v.id("bootcampPrograms"),
  },
  handler: async (ctx, args) => {
    const results: { email: string; code: string; status: "created" | "exists" }[] = [];

    for (const email of args.emails) {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Check if already enrolled
      const existing = await ctx.db
        .query("bootcampEnrollments")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .filter((q) => q.eq(q.field("programId"), args.programId))
        .unique();

      if (existing) {
        results.push({ email: normalizedEmail, code: existing.code, status: "exists" });
        continue;
      }

      // Generate unique code
      let code = generateCode();
      let codeExists = true;
      while (codeExists) {
        const existingCode = await ctx.db
          .query("bootcampEnrollments")
          .withIndex("by_code", (q) => q.eq("code", code))
          .unique();
        if (!existingCode) {
          codeExists = false;
        } else {
          code = generateCode();
        }
      }

      await ctx.db.insert("bootcampEnrollments", {
        code,
        email: normalizedEmail,
        programId: args.programId,
        status: "pending",
        progress: 0,
        sessionsCompleted: 0,
        createdAt: Date.now(),
      });

      results.push({ email: normalizedEmail, code, status: "created" });
    }

    return results;
  },
});

export const joinWithCode = mutation({
  args: {
    code: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!enrollment) {
      throw new Error("Invalid code");
    }

    if (enrollment.userId) {
      if (enrollment.userId === args.userId) {
        // Already linked to this user — ensure auto-approve in case they joined before this feature
        const existingUser = await ctx.db.get(args.userId);
        if (existingUser && existingUser.accountStatus !== "active") {
          await ctx.db.patch(args.userId, { accountStatus: "active" });
        }
        // Also approve pending application so it doesn't show in admin queue
        const existingApp = await ctx.db
          .query("applications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .unique();
        if (existingApp && existingApp.status === "pending") {
          await ctx.db.patch(existingApp._id, {
            status: "approved",
            reviewedAt: Date.now(),
            reviewNotes: "Auto-approved via bootcamp code",
          });
        }
        return { enrollment, alreadyLinked: true };
      }
      throw new Error("This code has already been used");
    }

    // Check if user already enrolled in this program
    const existingEnrollment = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("programId"), enrollment.programId))
      .unique();

    if (existingEnrollment) {
      throw new Error("You are already enrolled in this program");
    }

    // Link user to enrollment
    await ctx.db.patch(enrollment._id, {
      userId: args.userId,
      status: "active",
      joinedAt: Date.now(),
    });

    // Auto-approve the user (skip application review) — same as referral invitation flow
    const user = await ctx.db.get(args.userId);
    if (user && user.accountStatus !== "active") {
      await ctx.db.patch(args.userId, {
        accountStatus: "active",
      });
    }

    // Also approve pending application so it doesn't show in admin queue
    const application = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (application && application.status === "pending") {
      await ctx.db.patch(application._id, {
        status: "approved",
        reviewedAt: Date.now(),
        reviewNotes: "Auto-approved via bootcamp code",
      });
    }

    return { enrollment: { ...enrollment, userId: args.userId }, alreadyLinked: false };
  },
});

// ============================================================
// DELIVERABLES - Queries
// ============================================================

export const getDeliverable = query({
  args: {
    enrollmentId: v.id("bootcampEnrollments"),
    sessionNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const deliverables = await ctx.db
      .query("bootcampDeliverables")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .filter((q) => q.eq(q.field("sessionNumber"), args.sessionNumber))
      .collect();

    // Return most recent if multiple
    return deliverables.sort((a, b) => b.submittedAt - a.submittedAt)[0] || null;
  },
});

export const listDeliverablesByProgram = query({
  args: { 
    programId: v.id("bootcampPrograms"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("bootcampDeliverables")
      .withIndex("by_program", (q) => q.eq("programId", args.programId));

    const deliverables = await q.collect();

    // Filter by status if provided
    const filtered = args.status
      ? deliverables.filter((d) => d.status === args.status)
      : deliverables;

    // Get user and enrollment details
    const result = await Promise.all(
      filtered.map(async (deliverable) => {
        const user = await ctx.db.get(deliverable.userId);
        const enrollment = await ctx.db.get(deliverable.enrollmentId);
        return { deliverable, user, enrollment };
      })
    );

    return result;
  },
});

// ============================================================
// DELIVERABLES - Mutations
// ============================================================

export const submitDeliverable = mutation({
  args: {
    enrollmentId: v.id("bootcampEnrollments"),
    sessionNumber: v.number(),
    projectUrl: v.string(),
    repositoryUrl: v.optional(v.string()),
    screenshotUrls: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }
    if (!enrollment.userId) {
      throw new Error("Enrollment not linked to user");
    }

    // Check if already submitted for this session
    const existing = await ctx.db
      .query("bootcampDeliverables")
      .withIndex("by_enrollment", (q) => q.eq("enrollmentId", args.enrollmentId))
      .filter((q) => q.eq(q.field("sessionNumber"), args.sessionNumber))
      .collect();

    // If exists and approved, don't allow resubmission
    const approved = existing.find((d) => d.status === "approved");
    if (approved) {
      throw new Error("Deliverable already approved");
    }

    // If there's an existing submission (submitted or needs_revision), update it instead of creating a duplicate
    const existingSubmission = existing.find(
      (d) => d.status === "submitted" || d.status === "needs_revision"
    );
    if (existingSubmission) {
      await ctx.db.patch(existingSubmission._id, {
        projectUrl: args.projectUrl,
        repositoryUrl: args.repositoryUrl,
        screenshotUrls: args.screenshotUrls,
        notes: args.notes,
        status: "submitted",
        submittedAt: Date.now(),
        // Reset review fields on resubmission
        feedback: undefined,
        reviewedAt: undefined,
        reviewedByUserId: undefined,
        level: undefined,
      });
      return existingSubmission._id;
    }

    // No existing submission — create new
    const deliverableId = await ctx.db.insert("bootcampDeliverables", {
      enrollmentId: args.enrollmentId,
      userId: enrollment.userId,
      programId: enrollment.programId,
      sessionNumber: args.sessionNumber,
      projectUrl: args.projectUrl,
      repositoryUrl: args.repositoryUrl,
      screenshotUrls: args.screenshotUrls,
      notes: args.notes,
      status: "submitted",
      submittedAt: Date.now(),
    });

    return deliverableId;
  },
});

export const reviewDeliverable = mutation({
  args: {
    deliverableId: v.id("bootcampDeliverables"),
    status: v.union(
      v.literal("approved"),
      v.literal("needs_revision")
    ),
    level: v.optional(v.union(
      v.literal("core"),
      v.literal("complete"),
      v.literal("excellent"),
      v.literal("bonus")
    )),
    feedback: v.optional(v.string()),
    reviewedByUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const deliverable = await ctx.db.get(args.deliverableId);
    if (!deliverable) {
      throw new Error("Deliverable not found");
    }

    await ctx.db.patch(args.deliverableId, {
      status: args.status,
      level: args.level,
      feedback: args.feedback,
      reviewedByUserId: args.reviewedByUserId,
      reviewedAt: Date.now(),
    });

    // If approved, update enrollment progress
    if (args.status === "approved") {
      const enrollment = await ctx.db.get(deliverable.enrollmentId);
      if (enrollment) {
        // Count approved deliverables by unique session (prevents duplicate inflation)
        const approvedDeliverables = await ctx.db
          .query("bootcampDeliverables")
          .withIndex("by_enrollment", (q) => q.eq("enrollmentId", enrollment._id))
          .filter((q) => q.eq(q.field("status"), "approved"))
          .collect();

        // Get program to know total sessions
        const program = await ctx.db.get(enrollment.programId);
        const totalSessions = program?.sessionsCount || 5;

        const uniqueApprovedSessions = new Set(approvedDeliverables.map((d) => d.sessionNumber));
        const sessionsCompleted = uniqueApprovedSessions.size;
        const progress = Math.round((sessionsCompleted / totalSessions) * 100);

        await ctx.db.patch(enrollment._id, {
          sessionsCompleted,
          progress,
          ...(progress >= 100 ? { status: "completed", completedAt: Date.now() } : {}),
        });

        // Auto-assign POAP link on completion
        if (progress >= 100) {
          const availableLink = await ctx.db
            .query("bootcampPoapLinks")
            .withIndex("by_program", (q) => q.eq("programId", enrollment.programId))
            .filter((q) => q.eq(q.field("assignedTo"), undefined))
            .first();

          if (availableLink) {
            await ctx.db.patch(availableLink._id, {
              assignedTo: enrollment._id,
            });
            await ctx.db.patch(enrollment._id, {
              poapClaimLink: availableLink.mintLink,
            });
          }
        }
      }
    }

    return { success: true };
  },
});

// ============================================================
// USER BOOTCAMP STATUS - For profile/navbar
// ============================================================

export const getUserBootcampStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    if (enrollments.length === 0) {
      return { isParticipant: false, enrollments: [] };
    }

    // Get program details
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const program = await ctx.db.get(enrollment.programId);
        return { enrollment, program };
      })
    );

    return {
      isParticipant: true,
      enrollments: result.filter((r) => r.program !== null),
    };
  },
});

/**
 * Get bootcamp enrollments by username (for public profiles)
 */
export const getEnrollmentsByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // Get user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) return [];

    // Get active/completed enrollments
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    // Get program details
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const program = await ctx.db.get(enrollment.programId);
        return { enrollment, program };
      })
    );

    return result.filter((r) => r.program !== null);
  },
});

// ============================================================
// CLEANUP - Admin functions

/**
 * Delete a deliverable (admin cleanup)
 */
export const deleteDeliverable = mutation({
  args: { deliverableId: v.id("bootcampDeliverables") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.deliverableId);
    return { deleted: true };
  },
});

/**
 * Reset enrollment progress (admin cleanup)
 */
export const resetEnrollmentProgress = mutation({
  args: { enrollmentId: v.id("bootcampEnrollments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, {
      progress: 0,
      sessionsCompleted: 0,
    });
    return { reset: true };
  },
});

// ============================================================
// API KEYS - Admin management
// ============================================================

/**
 * Assign API key to enrollment (admin only)
 */
export const assignApiKey = mutation({
  args: {
    enrollmentId: v.id("bootcampEnrollments"),
    anthropicApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, {
      anthropicApiKey: args.anthropicApiKey,
    });
    return { success: true };
  },
});

/**
 * Bulk assign API keys to enrollments (admin only)
 * Accepts array of { email, apiKey }
 */
export const assignApiKeysBulk = mutation({
  args: {
    programId: v.id("bootcampPrograms"),
    assignments: v.array(
      v.object({
        email: v.string(),
        apiKey: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const assignment of args.assignments) {
      const enrollment = await ctx.db
        .query("bootcampEnrollments")
        .withIndex("by_email", (q) => q.eq("email", assignment.email.toLowerCase()))
        .filter((q) => q.eq(q.field("programId"), args.programId))
        .unique();
      
      if (enrollment) {
        await ctx.db.patch(enrollment._id, {
          anthropicApiKey: assignment.apiKey,
        });
        results.push({ email: assignment.email, status: "assigned" });
      } else {
        results.push({ email: assignment.email, status: "not_found" });
      }
    }
    
    return { results };
  },
});

/**
 * Get user's API keys for their enrollments
 */
export const getMyApiKeys = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("bootcampEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.neq(q.field("anthropicApiKey"), undefined))
      .collect();
    
    const keys = [];
    for (const enrollment of enrollments) {
      const program = await ctx.db.get(enrollment.programId);
      if (enrollment.anthropicApiKey) {
        keys.push({
          provider: "anthropic",
          key: enrollment.anthropicApiKey,
          programName: program?.name || "Unknown",
          programId: enrollment.programId,
        });
      }
    }
    
    return keys;
  },
});

/**
 * Remove API key from enrollment (admin only)
 */
export const removeApiKey = mutation({
  args: { enrollmentId: v.id("bootcampEnrollments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, {
      anthropicApiKey: undefined,
    });
    return { success: true };
  },
});

// Admin: Update enrollment API key
export const updateEnrollmentApiKey = mutation({
  args: {
    enrollmentId: v.id("bootcampEnrollments"),
    anthropicApiKey: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.enrollmentId, {
      anthropicApiKey: args.anthropicApiKey,
    });
    return { success: true };
  },
});

// ============================================================
// POAP CERTIFICATES
// ============================================================

/**
 * Admin: Bulk upload POAP mint links for a program
 */
export const uploadPoapLinks = mutation({
  args: {
    callerPrivyDid: v.string(),
    programId: v.id("bootcampPrograms"),
    links: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    const results = { created: 0, duplicate: 0 };

    for (const link of args.links) {
      const trimmed = link.trim();
      if (!trimmed) continue;

      // Check for duplicate
      const existing = await ctx.db
        .query("bootcampPoapLinks")
        .withIndex("by_program", (q) => q.eq("programId", args.programId))
        .filter((q) => q.eq(q.field("mintLink"), trimmed))
        .first();

      if (existing) {
        results.duplicate++;
        continue;
      }

      await ctx.db.insert("bootcampPoapLinks", {
        programId: args.programId,
        mintLink: trimmed,
        createdAt: Date.now(),
      });
      results.created++;
    }

    return results;
  },
});

/**
 * Admin: Get POAP link stats for a program
 */
export const getPoapStats = query({
  args: {
    callerPrivyDid: v.string(),
    programId: v.id("bootcampPrograms"),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      return { total: 0, assigned: 0, available: 0 };
    }

    const allLinks = await ctx.db
      .query("bootcampPoapLinks")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    const total = allLinks.length;
    const assigned = allLinks.filter((l) => l.assignedTo !== undefined).length;
    const available = total - assigned;

    return { total, assigned, available };
  },
});

/**
 * Student: Mark POAP as claimed (validates caller owns the enrollment)
 */
export const markPoapClaimed = mutation({
  args: {
    enrollmentId: v.id("bootcampEnrollments"),
    callerUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.userId !== args.callerUserId) throw new Error("Unauthorized");
    if (!enrollment.poapClaimLink) throw new Error("No POAP link assigned");

    await ctx.db.patch(args.enrollmentId, {
      poapClaimedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Admin: Manually assign POAP link to an enrollment (for retroactive cases)
 */
export const assignPoapLink = mutation({
  args: {
    callerPrivyDid: v.string(),
    enrollmentId: v.id("bootcampEnrollments"),
    programId: v.id("bootcampPrograms"),
  },
  handler: async (ctx, args) => {
    const caller = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.callerPrivyDid))
      .unique();
    if (!caller || caller.role !== "admin") {
      throw new Error("Unauthorized: admin access required");
    }

    const availableLink = await ctx.db
      .query("bootcampPoapLinks")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .filter((q) => q.eq(q.field("assignedTo"), undefined))
      .first();

    if (!availableLink) {
      return { assigned: false, reason: "No hay links POAP disponibles" };
    }

    await ctx.db.patch(availableLink._id, {
      assignedTo: args.enrollmentId,
    });
    await ctx.db.patch(args.enrollmentId, {
      poapClaimLink: availableLink.mintLink,
    });

    return { assigned: true, link: availableLink.mintLink };
  },
});
