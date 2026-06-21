/**
 * /api/contact — lead capture for the /enterprise page (T6).
 *
 * Flow (plan CONTACT):
 *   POST /api/contact → zod + honeypot + rate-limit(IP)
 *     → insert into `leads` (system of record) → Resend email (best-effort)
 *       ├─ insert ok, email fails → 200 (lead saved) + log alert
 *       ├─ invalid body          → 400 field errors
 *       ├─ rate-limited          → 429 (Retry-After)
 *       ├─ honeypot tripped      → 200 (pretend success — bot learns nothing)
 *       └─ DB down               → 502 + fallback email address shown to the user
 *
 * D-leads (LOCKED): the DB row is the system of record; email is best-effort
 * (email NOT the system of record). The HONEYPOT is the real spam defense;
 * rate-limit is best-effort (per-instance in serverless).
 *
 * No silent failures (Hard rule #6): every branch returns an explicit envelope +
 * status; an email outage degrades to a logged alert, never a lost lead or a 500.
 */
import { NextRequest } from 'next/server'

import { db, leads } from '@/lib/db'
import {
  HONEYPOT_FIELD,
  contactInputSchema,
} from '@/lib/validators/contact'
import { sendLeadEmail, getFallbackEmail } from '@/lib/email'
import {
  CONTACT_RATE_LIMIT,
  clientIpFromHeaders,
  rateLimit,
} from '@/lib/rate-limit'
import {
  API_ERROR_CODES,
  apiError,
  apiSuccess,
  apiValidationError,
} from '@/lib/api/response'

// Writes to Postgres + sends email → always dynamic (never statically cached).
export const dynamic = 'force-dynamic'

/** Stable shape returned to the client on success (no PII echoed back). */
function ok(message: string, status = 200) {
  return apiSuccess({ received: true }, { message, status })
}

export async function POST(req: NextRequest) {
  // 1) Rate-limit FIRST (cheap, IP-keyed, best-effort). 429 before we parse.
  const ip = clientIpFromHeaders(req.headers)
  const rl = rateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT)
  if (!rl.allowed) {
    return apiError(
      'Demasiados envíos. Intenta de nuevo en unos minutos.',
      {
        code: API_ERROR_CODES.RATE_LIMITED,
        status: 429,
        details: { retryAfterSeconds: rl.retryAfterSeconds },
      },
    )
  }

  // 2) Parse body (malformed JSON → 400, not 500).
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return apiError('Cuerpo de la petición inválido.', {
      code: API_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    })
  }

  // 3) Honeypot — the real spam defense. A bot fills the hidden field; a human
  //    never sees it. If present + non-empty, pretend success (200) so the bot
  //    learns nothing, and DO NOT write a lead.
  const honeypotValue =
    typeof raw === 'object' && raw !== null
      ? (raw as Record<string, unknown>)[HONEYPOT_FIELD]
      : undefined
  if (typeof honeypotValue === 'string' && honeypotValue.trim().length > 0) {
    return ok('¡Gracias! Te contactaremos pronto.')
  }

  // 4) Validate (zod 400 with field errors before we touch the DB).
  const parsed = contactInputSchema.safeParse(raw)
  if (!parsed.success) {
    return apiValidationError(parsed.error)
  }
  const input = parsed.data

  // 5) Persist — the DB row is the system of record.
  let inserted: { id: string } | undefined
  try {
    const [row] = await db
      .insert(leads)
      .values({
        name: input.name,
        email: input.email,
        org: input.org ?? null,
        message: input.message,
        // Server-clamped (zod already constrained the enum); default enterprise.
        source: input.source ?? 'enterprise',
        locale: input.locale ?? 'es',
      })
      .returning({ id: leads.id })
    inserted = row
  } catch {
    // DB down / unreachable. The lead is NOT saved → surface a clear 502 with a
    // fallback email address so the user isn't stranded (no silent failure).
    const fallback = getFallbackEmail()
    return apiError(
      fallback
        ? `No pudimos guardar tu mensaje. Escríbenos directo a ${fallback}.`
        : 'No pudimos guardar tu mensaje. Intenta de nuevo en un momento.',
      {
        code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
        status: 502,
        details: fallback ? { fallbackEmail: fallback } : undefined,
      },
    )
  }

  // 6) Notify via Resend — BEST-EFFORT. The lead is already saved, so an email
  //    failure must NOT fail the request. Log an alert and return 200.
  const emailResult = await sendLeadEmail({
    name: input.name,
    email: input.email,
    org: input.org,
    message: input.message,
    source: input.source ?? 'enterprise',
    locale: input.locale ?? 'es',
  })
  if (!emailResult.sent) {
    // Alert log — the lead is safe in the DB; ops can replay from there.
    console.error(
      `[contact] lead ${inserted?.id ?? '?'} saved but notification email ` +
        `was not sent (${emailResult.reason})` +
        ('error' in emailResult && emailResult.error
          ? `: ${emailResult.error}`
          : ''),
    )
  }

  return ok('¡Gracias! Te contactaremos pronto.', 201)
}
