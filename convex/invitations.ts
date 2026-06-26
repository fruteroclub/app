import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Invitation Functions
 * 
 * Allow users to invite friends who can skip the application process.
 */

// Generate random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new invitation
 */
export const create = mutation({
  args: {
    inviterPrivyDid: v.string(),
  },
  handler: async (ctx, args) => {
    // Get inviter
    const inviter = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.inviterPrivyDid))
      .unique();

    if (!inviter) {
      throw new Error("User not found");
    }

    if (inviter.accountStatus !== "active") {
      throw new Error("Only active users can send invitations");
    }

    // Check invitation limits (2 for members, 5 for admins)
    const existingInvites = await ctx.db
      .query("invitations")
      .withIndex("by_inviter", (q) => q.eq("inviterUserId", inviter._id))
      .collect();

    const activeInvites = existingInvites.filter(
      (i) => i.status === "pending" || i.status === "redeemed"
    );

    const limit = inviter.role === "admin" ? 100 : 2;
    if (activeInvites.length >= limit) {
      throw new Error(`Has alcanzado el límite de ${limit} invitaciones`);
    }

    // Generate unique code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("invitations")
        .withIndex("by_code", (q) => q.eq("inviteCode", inviteCode))
        .unique();
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create invitation (expires in 7 days)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const invitationId = await ctx.db.insert("invitations", {
      inviterUserId: inviter._id,
      inviteCode,
      status: "pending",
      expiresAt,
    });

    return {
      invitationId,
      inviteCode,
      expiresAt,
    };
  },
});

/**
 * Get my invitations
 */
export const getMyInvitations = query({
  args: {
    privyDid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      return { invitations: [], limit: 0, used: 0 };
    }

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_inviter", (q) => q.eq("inviterUserId", user._id))
      .collect();

    // Get redeemer info for redeemed invitations
    const invitationsWithRedeemer = await Promise.all(
      invitations.map(async (inv) => {
        let redeemer = null;
        if (inv.redeemerUserId) {
          redeemer = await ctx.db.get(inv.redeemerUserId);
        }
        return {
          ...inv,
          redeemer: redeemer
            ? {
                username: redeemer.username,
                displayName: redeemer.displayName,
                avatarUrl: redeemer.avatarUrl,
              }
            : null,
        };
      })
    );

    const limit = user.role === "admin" ? 100 : 2;
    const used = invitations.filter(
      (i) => i.status === "pending" || i.status === "redeemed"
    ).length;

    return {
      invitations: invitationsWithRedeemer,
      limit,
      used,
    };
  },
});

/**
 * Validate invitation code
 */
export const validate = query({
  args: {
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .unique();

    if (!invitation) {
      return { valid: false, error: "Código de invitación no válido" };
    }

    if (invitation.status === "redeemed") {
      return { valid: false, error: "Esta invitación ya fue usada" };
    }

    if (invitation.status === "expired" || invitation.expiresAt < Date.now()) {
      return { valid: false, error: "Esta invitación ha expirado" };
    }

    // Get inviter info
    const inviter = await ctx.db.get(invitation.inviterUserId);

    return {
      valid: true,
      inviter: inviter
        ? {
            username: inviter.username,
            displayName: inviter.displayName,
          }
        : null,
    };
  },
});

/**
 * Redeem invitation (called during onboarding)
 */
export const redeem = mutation({
  args: {
    inviteCode: v.string(),
    redeemerPrivyDid: v.string(),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_code", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .unique();

    if (!invitation) {
      throw new Error("Código de invitación no válido");
    }

    if (invitation.status !== "pending") {
      throw new Error("Esta invitación ya no está disponible");
    }

    if (invitation.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("Esta invitación ha expirado");
    }

    // Get redeemer
    const redeemer = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.redeemerPrivyDid))
      .unique();

    if (!redeemer) {
      throw new Error("Usuario no encontrado");
    }

    // Get inviter info
    const inviter = await ctx.db.get(invitation.inviterUserId);

    // Mark invitation as redeemed
    await ctx.db.patch(invitation._id, {
      status: "redeemed",
      redeemerUserId: redeemer._id,
      redeemedAt: Date.now(),
    });

    // Auto-approve the user (skip application review) and save who invited them
    await ctx.db.patch(redeemer._id, {
      accountStatus: "active",
      invitedByUserId: invitation.inviterUserId,
    });

    // Also approve pending application so it doesn't show in admin queue
    const application = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", redeemer._id))
      .unique();
    if (application && application.status === "pending") {
      await ctx.db.patch(application._id, {
        status: "approved",
        reviewedAt: Date.now(),
        reviewNotes: "Auto-approved via invitation code",
      });
    }

    return {
      success: true,
      inviterUsername: inviter?.username,
    };
  },
});

/**
 * Delete/cancel invitation
 */
export const remove = mutation({
  args: {
    invitationId: v.id("invitations"),
    privyDid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Only inviter or admin can delete
    if (invitation.inviterUserId !== user._id && user.role !== "admin") {
      throw new Error("No autorizado");
    }

    // Can only delete pending invitations
    if (invitation.status !== "pending") {
      throw new Error("Solo puedes eliminar invitaciones pendientes");
    }

    await ctx.db.delete(args.invitationId);

    return { success: true };
  },
});
