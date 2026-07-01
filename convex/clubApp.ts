import { internal } from "./_generated/api";
import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * club-app surface over the shared Convex backend.
 *
 * OUR schema is the source of truth: the club-app fields are FIRST-CLASS columns
 * (users.firstName/lastName; profiles.role/favoriteFruit/preferredColor/
 * websiteUrl/testimony) — added to schema.ts, not stuffed in a metadata bag. We
 * reuse the external contributor's fields where they fit (users.displayName/
 * username; profiles.city/country/githubUrl) and extend with ours. All additions
 * are optional, so importing their `convex export` stays compatible (a superset).
 *
 * `displayName`, `firstName`, and `lastName` are THREE distinct fields — first +
 * last are the canonical name; displayName mirrors "first last" for the external
 * app's display surfaces but is never the source.
 *
 * Auth matches the rest of the backend: the Privy DID is a plain arg (no ctx.auth).
 */

const PREFERRED_COLOR = v.union(
  v.literal("magenta"),
  v.literal("violet"),
  v.literal("amber"),
  v.literal("green"),
);
/** The member's role (distinct from users.role authz). */
const ROLE = v.union(
  v.literal("creativo"),
  v.literal("negocio"),
  v.literal("tecnologia"),
);
const LEAD_SOURCE = v.union(v.literal("enterprise"), v.literal("landing"));
const LOCALE = v.union(v.literal("es"), v.literal("en"));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_EMAILS_API = "https://api.resend.com/emails";
const DEFAULT_LEAD_NOTIFICATION_EMAIL = "hola@frutero.club";
const LAUNCH_EVENTS_COUNT = 100;
const LAUNCH_OPPORTUNITIES_COUNT = 5;

interface LeadEmailArgs {
  leadId: string;
  name: string;
  email: string;
  org?: string;
  message: string;
  source: "enterprise" | "landing";
  locale: "es" | "en";
}

interface ResendEmailInput {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}

function optionalTrimmed(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function hasText(value?: string): boolean {
  return Boolean(value?.trim());
}

function displayNameForUser(user: {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  username?: string;
}): string | undefined {
  return (
    optionalTrimmed(
      [user.firstName, user.lastName].filter(Boolean).join(" "),
    ) ??
    optionalTrimmed(user.displayName) ??
    optionalTrimmed(user.username)
  );
}

function hasLaunchReadyProfile(
  user: { firstName?: string; displayName?: string },
  profile: { role?: unknown; city?: string; country?: string },
): boolean {
  return (
    (hasText(user.firstName) || hasText(user.displayName)) &&
    Boolean(profile.role) &&
    hasText(profile.city) &&
    hasText(profile.country)
  );
}

/** Current member's user + profile (or null if they haven't onboarded). */
export const getProfile = query({
  args: { privyDid: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();
    if (!user) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
    return { user, profile };
  },
});

/** Public launch counters for the landing proof strip. */
export const getLaunchStats = query({
  args: {},
  handler: async (ctx) => {
    const activeUsers = await ctx.db
      .query("users")
      .withIndex("by_account_status", (q) => q.eq("accountStatus", "active"))
      .collect();

    let activeBuilders = 0;
    let projects = 0;

    for (const user of activeUsers) {
      if (user.deletedAt) continue;

      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user_id", (q) => q.eq("userId", user._id))
        .unique();
      if (!profile) continue;

      if (hasLaunchReadyProfile(user, profile)) {
        activeBuilders += 1;
      }

      // Launch v1: one GitHub project link per member profile.
      if (hasText(profile.githubUrl)) {
        projects += 1;
      }
    }

    return {
      activeBuilders,
      projects,
      events: LAUNCH_EVENTS_COUNT,
      opportunities: LAUNCH_OPPORTUNITIES_COUNT,
    };
  },
});

/** Randomized public member testimonials for the landing player-card deck. */
export const getRandomTestimonials = query({
  args: {
    seed: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 6), 1), 6);
    const profiles = await ctx.db.query("profiles").collect();
    const testimonials = [];

    for (const profile of profiles) {
      if (profile.profileVisibility !== "public") continue;

      const testimony = optionalTrimmed(profile.testimony);
      if (!testimony) continue;

      const user = await ctx.db.get(profile.userId);
      if (!user || user.deletedAt || user.accountStatus !== "active") continue;

      const name = displayNameForUser(user);
      if (!name) continue;

      testimonials.push({
        id: profile._id,
        userId: user._id,
        username: user.username,
        name,
        avatarUrl: user.avatarUrl,
        role: profile.role,
        city: profile.city,
        country: profile.country,
        githubUrl: profile.githubUrl,
        websiteUrl: profile.websiteUrl,
        preferredColor: profile.preferredColor,
        testimony,
      });
    }

    return testimonials
      .sort((a, b) => {
        const rankA = seededRank(args.seed, a.id);
        const rankB = seededRank(args.seed, b.id);
        return rankA - rankB || a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  },
});

function seededRank(seed: string, id: string): number {
  let hash = 2166136261;
  const input = `${seed}:${id}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Create or update the member's identity profile (the Stage-1 onboarding). */
export const saveProfile = mutation({
  args: {
    privyDid: v.string(),
    email: v.optional(v.string()),
    appWallet: v.optional(v.string()), // Privy embedded wallet
    userWallet: v.optional(v.string()), // the user's own / external wallet
    username: v.string(), // the name-derived handle
    firstName: v.string(),
    lastName: v.optional(v.string()),
    role: ROLE,
    city: v.string(),
    country: v.string(),
    favoriteFruit: v.string(),
    preferredColor: PREFERRED_COLOR,
  },
  handler: async (ctx, args) => {
    // displayName mirrors "first last" for the external app's display surfaces;
    // firstName/lastName remain the canonical, first-class name fields.
    const displayName = [args.firstName, args.lastName]
      .filter(Boolean)
      .join(" ");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();

    let userId;
    if (existing) {
      userId = existing._id;
      await ctx.db.patch(userId, {
        username: args.username,
        displayName,
        firstName: args.firstName,
        lastName: args.lastName || undefined,
        ...(args.email ? { email: args.email } : {}),
        ...(args.appWallet ? { appWallet: args.appWallet } : {}),
        ...(args.userWallet ? { userWallet: args.userWallet } : {}),
        // v1.0 = "complete = member" (no approval queue).
        accountStatus: "active",
        lastLoginAt: Date.now(),
      });
    } else {
      userId = await ctx.db.insert("users", {
        privyDid: args.privyDid,
        email:
          args.email ??
          `${args.privyDid.replace("did:privy:", "")}@incomplete.user`,
        username: args.username,
        displayName,
        firstName: args.firstName,
        lastName: args.lastName || undefined,
        appWallet: args.appWallet,
        userWallet: args.userWallet,
        primaryAuthMethod: "email",
        role: "member",
        accountStatus: "active",
        lastLoginAt: Date.now(),
      });
    }

    // Identity only — testimony / github / website are dashboard bounties
    // (saveBounty), so saving identity never touches them.
    const profileFields = {
      city: args.city,
      country: args.country,
      role: args.role,
      favoriteFruit: args.favoriteFruit,
      preferredColor: args.preferredColor,
    };

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, profileFields);
    } else {
      await ctx.db.insert("profiles", {
        userId,
        profileVisibility: "public",
        availabilityStatus: "available",
        learningTracks: [],
        profileViews: 0,
        projectsCount: 0,
        ...profileFields,
      });
    }

    const user = await ctx.db.get(userId);
    const finalProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .unique();
    return { user, profile: finalProfile };
  },
});

/** Fulfill one welcome bounty (testimony / github / website) on the dashboard. */
export const saveBounty = mutation({
  args: {
    privyDid: v.string(),
    field: v.union(
      v.literal("testimony"),
      v.literal("github"),
      v.literal("website"),
    ),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_privy_did", (q) => q.eq("privyDid", args.privyDid))
      .unique();
    if (!user) throw new Error("User not found");
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const value = args.value.trim() || undefined;
    const patch =
      args.field === "github"
        ? { githubUrl: value }
        : args.field === "website"
          ? { websiteUrl: value }
          : { testimony: value };
    await ctx.db.patch(profile._id, patch);

    const updated = await ctx.db.get(profile._id);
    return { user, profile: updated };
  },
});

/** Capture an enterprise/landing lead directly in Convex. */
export const submitLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    org: v.optional(v.string()),
    message: v.string(),
    source: LEAD_SOURCE,
    locale: LOCALE,
    companyWebsite: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Honeypot: bots get a pretend success, but no lead is persisted.
    if (args.companyWebsite?.trim()) return { received: true };

    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const org = optionalTrimmed(args.org);
    const message = args.message.trim();

    if (!name || name.length > 120) throw new Error("Invalid lead name");
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      throw new Error("Invalid lead email");
    }
    if (org && org.length > 160) throw new Error("Invalid lead organization");
    if (!message || message.length > 2000) {
      throw new Error("Invalid lead message");
    }

    const leadId = await ctx.db.insert("leads", {
      name,
      email,
      org,
      message,
      source: args.source,
      locale: args.locale,
      status: "new",
    });

    await ctx.scheduler.runAfter(0, internal.clubApp.notifyLead, {
      leadId,
      name,
      email,
      org,
      message,
      source: args.source,
      locale: args.locale,
    });

    return { received: true };
  },
});

/** Best-effort outbound notification + lead confirmation for new leads. */
export const notifyLead = internalAction({
  args: {
    leadId: v.id("leads"),
    name: v.string(),
    email: v.string(),
    org: v.optional(v.string()),
    message: v.string(),
    source: LEAD_SOURCE,
    locale: LOCALE,
  },
  handler: async (_ctx, args) => {
    const apiKey = optionalTrimmed(process.env.RESEND_API_KEY);
    const from = optionalTrimmed(process.env.RESEND_FROM);
    const notificationTo =
      optionalTrimmed(process.env.CONTACT_FALLBACK_EMAIL) ??
      DEFAULT_LEAD_NOTIFICATION_EMAIL;

    if (!apiKey || !from) {
      console.warn("[lead notification] Resend env missing; skipped", {
        leadId: args.leadId,
      });
      return { sent: false, reason: "missing_config" };
    }

    const notification = await sendResendEmail(apiKey, from, {
      to: notificationTo,
      replyTo: args.email,
      subject:
        args.source === "enterprise"
          ? "Nuevo lead de empresas"
          : "Nuevo lead de Frutero Club",
      text: formatLeadNotification(args),
    });

    if (!notification.sent) {
      console.warn("[lead notification] Resend notification failed", {
        leadId: args.leadId,
        result: notification,
      });
    }

    const confirmation = await sendResendEmail(apiKey, from, {
      to: args.email,
      replyTo: notificationTo,
      subject:
        args.locale === "en"
          ? "We received your message - Frutero Club"
          : "Recibimos tu mensaje - Frutero Club",
      text: formatLeadConfirmation(args, notificationTo),
    });

    if (!confirmation.sent) {
      console.warn("[lead notification] Resend confirmation failed", {
        leadId: args.leadId,
        result: confirmation,
      });
    }

    return {
      sent: notification.sent || confirmation.sent,
      notification,
      confirmation,
    };
  },
});

async function sendResendEmail(
  apiKey: string,
  from: string,
  email: ResendEmailInput,
): Promise<
  | { sent: true }
  | {
      sent: false;
      reason: "resend_error" | "network_error";
      status?: number;
      body?: string;
      error?: string;
    }
> {
  try {
    const response = await fetch(RESEND_EMAILS_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email.to,
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
    });

    if (!response.ok) {
      return {
        sent: false,
        reason: "resend_error",
        status: response.status,
        body: await response.text(),
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: "network_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function formatLeadNotification(args: LeadEmailArgs): string {
  return [
    "Nuevo lead en Frutero Club",
    "",
    `Lead ID: ${args.leadId}`,
    `Fuente: ${args.source}`,
    `Locale: ${args.locale}`,
    `Nombre: ${args.name}`,
    `Correo: ${args.email}`,
    `Organizacion: ${args.org ?? "-"}`,
    "",
    "Mensaje:",
    args.message,
  ].join("\n");
}

function formatLeadConfirmation(
  args: LeadEmailArgs,
  replyTo: string,
): string {
  if (args.locale === "en") {
    return [
      `Hi ${args.name},`,
      "",
      "We received your message for Frutero Club. We'll reply soon.",
      "",
      "Summary:",
      `Organization: ${args.org ?? "-"}`,
      "",
      "Message:",
      args.message,
      "",
      `You can reply to this email or write to ${replyTo}.`,
      "",
      "Frutero Club",
    ].join("\n");
  }

  return [
    `Hola ${args.name},`,
    "",
    "Recibimos tu mensaje para Frutero Club. Te responderemos pronto.",
    "",
    "Resumen:",
    `Organizacion: ${args.org ?? "-"}`,
    "",
    "Mensaje:",
    args.message,
    "",
    `Puedes responder este correo o escribir a ${replyTo}.`,
    "",
    "Frutero Club",
  ].join("\n");
}
