import { z } from 'zod'

import { locales } from '@/i18n/routing'

/**
 * Profile ("perfil") input validation.
 *
 * Mirrors the DB CHECK constraints in `lib/db/schema.ts` so the zod 400 fires
 * BEFORE the insert (good UX message) while the DB stays the race-safe backstop:
 *   - handle      ~ '^[A-Za-z0-9_-]{3,30}$'  (citext UNIQUE at the DB layer)
 *   - displayName 1–80 chars
 *   - bio         ≤ 280 chars
 *
 * `links` is a small typed object of social usernames/URLs (no CMS). Empty
 * strings are dropped so we never persist `{ github: "" }`.
 */

/** Handle: 3–30 chars, alnum + underscore/hyphen. Matches the schema CHECK. */
const handleSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z0-9_-]{3,30}$/,
    'El handle debe tener 3–30 caracteres (letras, números, _ o -).',
  )

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined))

/** Social links — usernames/URLs only, all optional, empties dropped. */
const linksSchema = z
  .object({
    github: optionalTrimmed(80),
    twitter: optionalTrimmed(80),
    linkedin: optionalTrimmed(200),
    website: z
      .string()
      .trim()
      .url('URL inválida.')
      .max(200)
      .optional()
      .or(z.literal(''))
      .transform((v) => (v ? v : undefined)),
  })
  .partial()
  .default({})

/**
 * The accepted POST /api/profile body. `locale` is captured at signup; it is
 * server-clamped to a known locale so a tampered body can't write garbage.
 */
/** The four canon-palette accents a member can pick at onboarding. */
export const PREFERRED_COLORS = ['magenta', 'violet', 'amber', 'green'] as const

export const profileInputSchema = z.object({
  handle: handleSchema,
  displayName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(80, 'El nombre es demasiado largo.'),
  // First + last name — the onboarding collects these; the client composes them
  // into `displayName` and derives the `handle`. Optional here so the server
  // contract stays back-compatible (displayName remains the required field).
  firstName: optionalTrimmed(60),
  lastName: optionalTrimmed(60),
  role: optionalTrimmed(120),
  // `location` stays accepted for back-compat; the onboarding sends city + region.
  location: optionalTrimmed(120),
  city: optionalTrimmed(120),
  region: optionalTrimmed(120),
  favoriteFruit: optionalTrimmed(60),
  preferredColor: z.enum(PREFERRED_COLORS).optional(),
  // The onboarding "testimony" bounty — same 280-char ceiling as bio.
  testimony: z
    .string()
    .trim()
    .max(280, 'El testimonio no puede superar 280 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  bio: z
    .string()
    .trim()
    .max(280, 'La bio no puede superar 280 caracteres.')
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined)),
  links: linksSchema,
  locale: z.enum(locales).optional(),
})

export type ProfileInput = z.infer<typeof profileInputSchema>
