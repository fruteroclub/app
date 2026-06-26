import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Poktapok Database Schema (Convex)
 * 
 * Fresh implementation - no migration from Neon.
 * Users and events will be created new in Convex.
 */

export default defineSchema({
  // ============================================================
  // USERS - Core identity and authentication
  // ============================================================
  users: defineTable({
    // Privy Authentication
    privyDid: v.string(), // Unique identifier from Privy
    email: v.optional(v.string()),

    // Profile Identifiers
    username: v.optional(v.string()),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Wallets
    extWallet: v.optional(v.string()), // External wallet (MetaMask, etc.)
    appWallet: v.optional(v.string()), // Privy embedded wallet

    // Authentication
    primaryAuthMethod: v.union(
      v.literal("email"),
      v.literal("wallet"),
      v.literal("social")
    ),

    // Authorization
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("admin")),

    // Account Status
    accountStatus: v.union(
      v.literal("incomplete"), // Authenticated but onboarding not completed
      v.literal("pending"), // Onboarding complete, waiting for approval
      v.literal("active"), // Approved and active
      v.literal("suspended"), // Temporarily disabled
      v.literal("banned") // Permanently disabled
    ),

    // Timestamps (Unix milliseconds)
    lastLoginAt: v.number(),
    deletedAt: v.optional(v.number()), // Soft delete

    // Referral
    invitedByUserId: v.optional(v.id("users")), // Who invited this user

    // Metadata
    privyMetadata: v.optional(v.any()), // Privy SDK data
    metadata: v.optional(v.any()), // Business logic data
  })
    .index("by_privy_did", ["privyDid"])
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_account_status", ["accountStatus"]),

  // ============================================================
  // PROFILES - Extended user information
  // ============================================================
  profiles: defineTable({
    userId: v.id("users"), // Foreign key to users table

    // Location
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),

    // Social Links (URLs)
    githubUrl: v.optional(v.string()),
    twitterUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    telegramHandle: v.optional(v.string()),

    // Social Usernames (for onboarding form)
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),

    // Learning & Interests
    learningTracks: v.array(
      v.union(v.literal("ai"), v.literal("crypto"), v.literal("privacy"))
    ),

    // Privacy Settings
    profileVisibility: v.union(
      v.literal("public"),
      v.literal("members"),
      v.literal("private")
    ),

    // Status
    availabilityStatus: v.union(
      v.literal("available"),
      v.literal("open_to_offers"),
      v.literal("unavailable")
    ),

    // Stats
    projectsCount: v.optional(v.number()), // Portfolio projects (Epic 2)
    completedBounties: v.optional(v.number()), // Bounties completed (Epic 3 - future)
    totalEarningsUsd: v.optional(v.number()), // Earnings from bounties (Epic 3 - future)
    profileViews: v.number(),

    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_user_id", ["userId"])
    .index("by_visibility", ["profileVisibility"]),

  // ============================================================
  // EVENTS - Community events with Luma integration
  // ============================================================
  events: defineTable({
    // Core Info
    title: v.string(),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()), // URL from lumacdn.com

    // Luma Integration
    lumaUrl: v.string(), // Original lu.ma URL (e.g., https://lu.ma/qq2u3tf6)
    lumaEventId: v.optional(v.string()), // e.g., evt-JkQd9kh99THTWSF
    lumaSlug: v.optional(v.string()), // e.g., qq2u3tf6

    // Event Details
    eventType: v.union(
      v.literal("in-person"),
      v.literal("virtual"),
      v.literal("hybrid")
    ),
    startDate: v.number(), // Unix milliseconds
    endDate: v.optional(v.number()),
    timezone: v.string(), // IANA timezone (e.g., "America/Mexico_City")

    // Location
    location: v.optional(v.string()), // Full address
    locationDetails: v.optional(v.string()), // Additional notes
    locationUrl: v.optional(v.string()), // Google Maps or venue link
    coordinates: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
      })
    ),

    // Organizers
    hosts: v.array(
      v.object({
        name: v.string(),
        avatarUrl: v.optional(v.string()),
        handle: v.optional(v.string()),
      })
    ),
    calendar: v.optional(v.string()), // e.g., "fruteroclub"

    // Status
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("past"),
      v.literal("cancelled")
    ),
    isPublished: v.boolean(),
    isFeatured: v.boolean(),

    // Registration
    registrationCount: v.number(),
    maxCapacity: v.optional(v.number()),
    registrationType: v.union(
      v.literal("free"),
      v.literal("paid"),
      v.literal("approval")
    ),

    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_luma_slug", ["lumaSlug"])
    .index("by_start_date", ["startDate"])
    .index("by_status", ["status"])
    .index("by_published", ["isPublished"])
    .index("by_calendar", ["calendar"]),

  // ============================================================
  // PROGRAMS - Training programs
  // ============================================================
  programs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived")
    ),
    isActive: v.optional(v.boolean()), // For quick filtering
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
  })
    .index("by_status", ["status"])
    .index("by_active", ["isActive"]),

  // ============================================================
  // SESSIONS - Program sessions
  // ============================================================
  sessions: defineTable({
    programId: v.optional(v.id("programs")),
    title: v.string(),
    description: v.optional(v.string()),
    sessionDate: v.number(),
    duration: v.optional(v.number()), // Minutes
    location: v.optional(v.string()),
    isVirtual: v.boolean(),
    metadata: v.optional(v.any()),
  })
    .index("by_program", ["programId"])
    .index("by_session_date", ["sessionDate"]),

  // ============================================================
  // ACTIVITIES - Community activities
  // ============================================================
  activities: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    activityType: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    rewardPulpaAmount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    instructions: v.optional(v.string()),
    totalAvailableSlots: v.optional(v.number()),
    currentSubmissionsCount: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_type", ["activityType"])
    .index("by_status", ["status"]),

  // ============================================================
  // PROJECTS - Member portfolio projects
  // ============================================================
  projects: defineTable({
    // Basic info
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    
    // Links
    githubUrl: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()), // YouTube embed
    
    // Tech stack (array of strings)
    techStack: v.optional(v.array(v.string())),
    
    // Images
    thumbnailUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    
    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    
    // Visibility
    isPublic: v.boolean(),
    
    // Dates
    completedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  // ============================================================
  // SKILLS - Skill taxonomy
  // ============================================================
  skills: defineTable({
    name: v.string(),
    slug: v.string(), // URL-safe identifier
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
    metadata: v.optional(v.any()),
  })
    .index("by_category", ["category"])
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  // ============================================================
  // USER_SKILLS - Skills assigned to users with proficiency level
  // ============================================================
  userSkills: defineTable({
    userId: v.id("users"),
    skillId: v.id("skills"),
    level: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    endorsementCount: v.number(), // Denormalized count for sorting
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_skill", ["skillId"])
    .index("by_user_skill", ["userId", "skillId"]),

  // ============================================================
  // ENDORSEMENTS - Peer skill endorsements
  // ============================================================
  endorsements: defineTable({
    endorserId: v.id("users"), // Who is endorsing
    endorseeId: v.id("users"), // Who is being endorsed
    userSkillId: v.id("userSkills"), // The specific user-skill being endorsed
    message: v.optional(v.string()), // Optional message (max 140 chars)
    metadata: v.optional(v.any()),
  })
    .index("by_endorser", ["endorserId"])
    .index("by_endorsee", ["endorseeId"])
    .index("by_user_skill", ["userSkillId"])
    .index("by_endorser_user_skill", ["endorserId", "userSkillId"]),

  // ============================================================
  // APPLICATIONS - Onboarding queue
  // ============================================================
  applications: defineTable({
    userId: v.id("users"),
    programId: v.optional(v.id("programs")),
    goal: v.optional(v.string()), // User's goal (max 280 chars)
    motivationText: v.optional(v.string()), // Why they want to join (max 500 chars)
    githubUsername: v.optional(v.string()),
    twitterUsername: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedByUserId: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ============================================================
  // INVITATIONS - Referral system
  // ============================================================
  invitations: defineTable({
    inviterUserId: v.id("users"),
    redeemerUserId: v.optional(v.id("users")),
    inviteCode: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("redeemed"),
      v.literal("expired")
    ),
    redeemedAt: v.optional(v.number()),
    expiresAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_inviter", ["inviterUserId"])
    .index("by_code", ["inviteCode"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOUNTIES - Bounty listings (Epic 3)
  // ============================================================
  bounties: defineTable({
    // Basic info
    title: v.string(),
    description: v.string(),
    requirements: v.optional(v.string()), // Detailed requirements/acceptance criteria
    
    // Categorization
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    techStack: v.array(v.string()), // Skills/technologies required
    category: v.optional(v.string()), // e.g., "frontend", "smart-contract", "design"
    
    // Reward
    rewardAmount: v.number(), // Amount in USD (or smallest unit)
    rewardCurrency: v.string(), // "USD", "USDC", "ETH", etc.
    
    // Timing
    deadlineDays: v.optional(v.number()), // Days to complete after claiming
    expiresAt: v.optional(v.number()), // When bounty expires (Unix ms)
    
    // Status
    status: v.union(
      v.literal("draft"), // Not yet published
      v.literal("open"), // Available for claiming
      v.literal("claimed"), // Someone is working on it
      v.literal("in_review"), // Submission received, pending review
      v.literal("completed"), // Approved and paid
      v.literal("cancelled") // Cancelled by admin
    ),
    
    // Limits
    maxClaims: v.optional(v.number()), // Max concurrent claims (default 1)
    currentClaimsCount: v.number(),
    
    // Creator
    createdByUserId: v.id("users"),
    
    // Links
    resourceUrl: v.optional(v.string()), // Figma, GitHub issue, etc.
    
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_status", ["status"])
    .index("by_difficulty", ["difficulty"])
    .index("by_creator", ["createdByUserId"]),

  // ============================================================
  // BOUNTY_CLAIMS - Track who claimed bounties
  // ============================================================
  bountyClaims: defineTable({
    bountyId: v.id("bounties"),
    userId: v.id("users"),
    
    // Status
    status: v.union(
      v.literal("active"), // Currently working
      v.literal("submitted"), // Submitted for review
      v.literal("approved"), // Approved by admin
      v.literal("rejected"), // Rejected by admin
      v.literal("expired"), // Time ran out
      v.literal("abandoned") // User gave up
    ),
    
    // Timing
    claimedAt: v.number(),
    expiresAt: v.number(), // When claim expires
    submittedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_bounty", ["bountyId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_bounty_user", ["bountyId", "userId"]),

  // ============================================================
  // BOUNTY_SUBMISSIONS - Submissions for bounty claims
  // ============================================================
  bountySubmissions: defineTable({
    claimId: v.id("bountyClaims"),
    bountyId: v.id("bounties"),
    userId: v.id("users"),
    
    // Submission content
    submissionUrl: v.string(), // GitHub PR, deployed URL, etc.
    notes: v.optional(v.string()), // Additional notes from submitter
    
    // Review
    status: v.union(
      v.literal("pending"), // Awaiting review
      v.literal("approved"), // Approved
      v.literal("rejected"), // Rejected
      v.literal("revision_requested") // Needs changes
    ),
    reviewedByUserId: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()), // Feedback from reviewer
    reviewedAt: v.optional(v.number()),
    
    // Attempt tracking (for revision requests)
    attemptNumber: v.number(), // 1, 2, 3...
    
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_claim", ["claimId"])
    .index("by_bounty", ["bountyId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOUNTY_PAYMENTS - Payment records (Epic 4 prep)
  // ============================================================
  bountyPayments: defineTable({
    submissionId: v.id("bountySubmissions"),
    bountyId: v.id("bounties"),
    userId: v.id("users"),
    
    // Payment details
    amount: v.number(),
    currency: v.string(),
    
    // Transaction info
    status: v.union(
      v.literal("pending"), // Payment initiated
      v.literal("processing"), // Transaction in progress
      v.literal("completed"), // Successfully paid
      v.literal("failed") // Payment failed
    ),
    txHash: v.optional(v.string()), // Blockchain transaction hash
    chain: v.optional(v.string()), // "ethereum", "base", "monad", etc.
    
    // Timing
    initiatedAt: v.number(),
    completedAt: v.optional(v.number()),
    
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_submission", ["submissionId"])
    .index("by_bounty", ["bountyId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOOTCAMP_PROGRAMS - Bootcamp cohorts
  // ============================================================
  bootcampPrograms: defineTable({
    name: v.string(), // "VibeCoding Bootcamp 1"
    slug: v.string(), // "vibecoding-c1"
    description: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    maxParticipants: v.optional(v.number()),
    sessionsCount: v.number(), // 5
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOOTCAMP_SESSIONS - Sessions within a bootcamp
  // ============================================================
  bootcampSessions: defineTable({
    programId: v.id("bootcampPrograms"),
    sessionNumber: v.number(), // 1-5
    title: v.string(), // "Nace tu Regenmon"
    description: v.optional(v.string()),
    deliverableTitle: v.string(), // "Regenmon Estático Desplegado"
    deliverableDescription: v.optional(v.string()),
    scheduledDate: v.optional(v.number()),
    contentUrl: v.optional(v.string()), // Link to bootcamp.frutero.club docs
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_program", ["programId"])
    .index("by_program_number", ["programId", "sessionNumber"]),

  // ============================================================
  // BOOTCAMP_ENROLLMENTS - User enrollments in bootcamps
  // ============================================================
  bootcampEnrollments: defineTable({
    code: v.string(), // ABC123 - unique join code
    email: v.string(), // Email from registration (Tally, manual, etc.)
    userId: v.optional(v.id("users")), // Linked when user joins with code
    programId: v.id("bootcampPrograms"),
    status: v.union(
      v.literal("pending"), // Code sent, waiting for user to join
      v.literal("active"), // User has joined and linked account
      v.literal("completed"), // Finished bootcamp
      v.literal("dropped") // Abandoned
    ),
    progress: v.number(), // 0-100 percentage
    sessionsCompleted: v.number(), // 0-5
    // Timing
    createdAt: v.number(), // When enrollment was created
    joinedAt: v.optional(v.number()), // When user linked account
    completedAt: v.optional(v.number()),
    // Metadata
    tallyResponseId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    // API Keys - assigned by admin
    anthropicApiKey: v.optional(v.string()),
    // POAP Certificate
    poapClaimLink: v.optional(v.string()), // Assigned mint link from poap.xyz
    poapClaimedAt: v.optional(v.number()), // When student clicked claim
  })
    .index("by_code", ["code"])
    .index("by_email", ["email"])
    .index("by_user", ["userId"])
    .index("by_program", ["programId"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOOTCAMP_DELIVERABLES - Submitted deliverables
  // ============================================================
  bootcampDeliverables: defineTable({
    enrollmentId: v.id("bootcampEnrollments"),
    userId: v.id("users"),
    programId: v.id("bootcampPrograms"),
    sessionNumber: v.number(), // 1-5
    // Submission content
    projectUrl: v.string(), // Deployed URL
    repositoryUrl: v.optional(v.string()), // GitHub repo
    screenshotUrls: v.optional(v.array(v.string())), // Optional screenshots (external links)
    notes: v.optional(v.string()), // Notes from student
    // Grading
    level: v.optional(v.union(
      v.literal("core"), // 🟢 Nivel 1
      v.literal("complete"), // 🟡 Nivel 2
      v.literal("excellent"), // 🔵 Nivel 3
      v.literal("bonus") // 🟣 Nivel 4
    )),
    status: v.union(
      v.literal("submitted"), // Awaiting review
      v.literal("approved"), // Approved
      v.literal("needs_revision") // Needs changes
    ),
    // Review
    reviewedByUserId: v.optional(v.id("users")),
    feedback: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    // Timing
    submittedAt: v.number(),
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_enrollment", ["enrollmentId"])
    .index("by_user", ["userId"])
    .index("by_program", ["programId"])
    .index("by_session", ["programId", "sessionNumber"])
    .index("by_status", ["status"]),

  // ============================================================
  // BOOTCAMP_POAP_LINKS - Pool of POAP mint links per program
  // ============================================================
  bootcampPoapLinks: defineTable({
    programId: v.id("bootcampPrograms"),
    mintLink: v.string(), // https://poap.xyz/mint/XXXXXX
    assignedTo: v.optional(v.id("bootcampEnrollments")),
    createdAt: v.number(),
  })
    .index("by_program", ["programId"]),

  // ============================================================
  // STUDIO_PROJECTS - v0 clone deployed projects (1 per student)
  // ============================================================
  studioProjects: defineTable({
    userId: v.id("users"), // Reference to users table
    previewUrl: v.string(), // The tunnel/deployed URL
    title: v.string(),
    slug: v.string(), // Unique URL slug for our preview page
    status: v.union(
      v.literal("active"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Metadata
    metadata: v.optional(v.any()),
  })
    .index("by_user_id", ["userId"])
    .index("by_slug", ["slug"]),

  // ============================================================
  // STUDIO_SESSIONS - Active studio sessions with agent
  // ============================================================
  studioSessions: defineTable({
    userId: v.id("users"),
    agentSessionId: v.optional(v.union(v.string(), v.null())), // OpenClaw session ID
    currentPreviewUrl: v.optional(v.union(v.string(), v.null())), // Current preview URL before deploy
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  // ============================================================
  // STUDIO_CHAT_HISTORY - Chat history for studio sessions
  // ============================================================
  studioChatHistory: defineTable({
    userId: v.id("users"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        timestamp: v.number(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"]),
});
