import { z } from 'zod'

import { locales } from '@/i18n/routing'

/**
 * Contact / lead input validation (T6).
 *
 * Mirrors the DB CHECK constraints in `lib/db/schema.ts` (`leads` table) so the
 * zod 400 fires BEFORE the insert (good inline field errors) while the DB stays
 * the backstop:
 *   - name    1–120 chars
 *   - email   coarse `x@y.z` shape (DB also enforces a regex)
 *   - message 1–2000 chars
 *
 * Spam defense (D-leads): the real defense is the HONEYPOT — a hidden field
 * (`company_website`) that real users never fill. If it carries any value we
 * treat the submission as a bot. zod rejects a non-empty honeypot here; the
 * route maps that to a silent-success 200 (so the bot learns nothing) but never
 * writes a lead. Rate-limit is best-effort on top.
 *
 * `source` is server-clamped to the known enum and `locale` to a known locale so
 * a tampered body can't write garbage into the `leads` row.
 */

/** The honeypot field name. Hidden in the form; must arrive empty. */
export const HONEYPOT_FIELD = 'company_website'

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : undefined))

/**
 * The accepted POST /api/contact body. The honeypot is validated separately in
 * the route (it must be absent/empty) so we can branch to the "pretend success"
 * path instead of leaking a 400 that tells a bot it was caught.
 */
export const contactInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(120, 'El nombre es demasiado largo.'),
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .max(254, 'El correo es demasiado largo.')
    .email('Correo inválido.'),
  org: optionalTrimmed(160),
  message: z
    .string()
    .trim()
    .min(1, 'Cuéntanos en qué te ayudamos.')
    .max(2000, 'El mensaje no puede superar 2000 caracteres.'),
  // Where the lead originated. Server-clamped; defaults to enterprise.
  source: z.enum(['enterprise', 'landing']).optional(),
  locale: z.enum(locales).optional(),
})

export type ContactInput = z.infer<typeof contactInputSchema>
