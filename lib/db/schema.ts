/**
 * Drizzle schema — off-chain identity foundation ("perfil v0.5").
 *
 * Source of truth: docs/plans/landing-implementation-plan.md "Data model".
 * Config patterns mirrored from `code/frutero-current-app` (no product code copied):
 *  - migration-based workflow (db:generate → db:migrate); NEVER db:push
 *  - CHECK constraints with INLINED patterns (Drizzle migrations reject variable refs)
 *  - shared timestamp helpers; metadata JSONB default `'{}'`
 *
 * SCOPE GUARD: onchain fields (token_id, level, score) are deliberately absent —
 * the product plan layers them on top of this foundation later. Do not add them here.
 */
import { sql } from 'drizzle-orm'
import {
  check,
  customType,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * Case-insensitive text. Postgres `citext` gives us a case-insensitive UNIQUE on
 * `handle` at the database layer (the real race-safe dedupe — app checks are not
 * enough). Requires `CREATE EXTENSION citext`, emitted in the first migration.
 */
const citext = customType<{ data: string }>({
  dataType() {
    return 'citext'
  },
})

/** Locale captured at signup. Mirrors next-intl `localePrefix: 'as-needed'`. */
export const localeEnum = pgEnum('locale', ['es', 'en'])

/** Where a lead originated. */
export const leadSourceEnum = pgEnum('lead_source', ['enterprise', 'landing'])

/**
 * A member's preferred accent — a personalization picked at onboarding, drawn
 * from the canon palette (DESIGN.md "Canonical palette"): magenta = primary,
 * violet = `--purple` secondary, amber = `--orange` warning, green = accent.
 * Drives their avatar tone + (later) their player-card accent.
 */
export const preferredColorEnum = pgEnum('preferred_color', [
  'magenta',
  'violet',
  'amber',
  'green',
])

/**
 * profiles — the off-chain "perfil". One row per Privy identity.
 * `privy_did` is the Privy server-verified subject (AuthTokenClaims.userId).
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Privy DID (e.g. `did:privy:...`). Unique → idempotent upsert by identity.
    privyDid: text('privy_did').notNull(),
    // Public handle. citext UNIQUE = case-insensitive dedupe at the DB layer.
    handle: citext('handle').notNull(),
    displayName: text('display_name').notNull(),
    role: text('role'),
    // `location` is the legacy single field; the onboarding now captures city +
    // region separately. Kept nullable for back-compat with early rows.
    location: text('location'),
    city: text('city'),
    region: text('region'),
    bio: text('bio'),
    // Stage-1 onboarding extras (Frutero culture + personalization + the
    // "testimony" bounty). All optional — the basics are name + handle.
    favoriteFruit: text('favorite_fruit'),
    preferredColor: preferredColorEnum('preferred_color'),
    testimony: text('testimony'),
    // Social / external links as a typed JSON object (no CMS).
    links: jsonb('links').notNull().default(sql`'{}'::jsonb`),
    locale: localeEnum('locale').notNull().default('es'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('profiles_privy_did_key').on(table.privyDid),
    uniqueIndex('profiles_handle_key').on(table.handle),
    // Handle format: 3-30 chars, lowercase-insensitive alnum + underscore/hyphen.
    // INLINED pattern (never a variable ref — Drizzle migration requirement).
    check(
      'profiles_handle_format',
      sql`${table.handle} ~ '^[A-Za-z0-9_-]{3,30}$'`,
    ),
    check(
      'profiles_display_name_len',
      sql`char_length(${table.displayName}) BETWEEN 1 AND 80`,
    ),
    check('profiles_bio_len', sql`${table.bio} IS NULL OR char_length(${table.bio}) <= 280`),
    check(
      'profiles_testimony_len',
      sql`${table.testimony} IS NULL OR char_length(${table.testimony}) <= 280`,
    ),
  ],
)

/**
 * leads — contact-form captures. D-leads: persist to DB AND email via Resend;
 * the DB row is the system of record (email is best-effort). Honeypot is the
 * real spam defense — that lives in the /api/contact route (T6), not the schema.
 */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    org: text('org'),
    message: text('message').notNull(),
    source: leadSourceEnum('source').notNull().default('enterprise'),
    locale: localeEnum('locale').notNull().default('es'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('leads_created_at_idx').on(table.createdAt),
    // Coarse email shape — full validation is zod in the route (T6).
    check(
      'leads_email_format',
      // Doubled backslash so a literal `\.` (escaped dot) reaches the SQL — a
      // single `\.` is collapsed to `.` by the JS template literal.
      sql`${table.email} ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'`,
    ),
    check('leads_name_len', sql`char_length(${table.name}) BETWEEN 1 AND 120`),
    check(
      'leads_message_len',
      sql`char_length(${table.message}) BETWEEN 1 AND 2000`,
    ),
  ],
)

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
