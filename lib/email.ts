/**
 * Lead notification email via Resend (T6).
 *
 * D-leads (LOCKED): the contact form persists a row in `leads` (system of record)
 * AND sends a notification email. **Email is best-effort, NOT the system of
 * record** — if Resend is down or unconfigured the lead is already saved, so the
 * route returns 200 and only logs an alert. This module therefore returns a
 * RESULT object instead of throwing, so the route can decide (it never lets an
 * email failure surface as a lost lead).
 *
 * Config: `RESEND_API_KEY` (auth), `RESEND_FROM` (verified sender),
 * `CONTACT_FALLBACK_EMAIL` (where lead notifications go AND the address shown to
 * the user if the DB itself is down). Missing config → `{ sent: false,
 * reason: 'unconfigured' }`, never a throw.
 */
import { Resend } from 'resend'

export interface LeadEmailInput {
  name: string
  email: string
  org?: string
  message: string
  source: 'enterprise' | 'landing'
  locale: 'es' | 'en'
}

export type SendLeadEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'unconfigured' | 'error'; error?: string }

/** The address shown to a user as a fallback when the DB write itself fails. */
export function getFallbackEmail(): string | undefined {
  return process.env.CONTACT_FALLBACK_EMAIL || undefined
}

let cachedClient: Resend | undefined

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  if (!cachedClient) cachedClient = new Resend(apiKey)
  return cachedClient
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Send the internal lead-notification email. Best-effort: returns a result and
 * never throws, so a Resend outage can't turn a saved lead into a 500.
 */
export async function sendLeadEmail(
  lead: LeadEmailInput,
): Promise<SendLeadEmailResult> {
  const client = getResendClient()
  const from = process.env.RESEND_FROM
  const to = process.env.CONTACT_FALLBACK_EMAIL

  if (!client || !from || !to) {
    // Not configured — the lead is already in the DB, so this is non-fatal.
    return { sent: false, reason: 'unconfigured' }
  }

  const subject = `Nuevo lead (${lead.source}) — ${lead.name}`
  const lines = [
    `Nombre: ${lead.name}`,
    `Correo: ${lead.email}`,
    lead.org ? `Organización: ${lead.org}` : undefined,
    `Origen: ${lead.source}`,
    `Idioma: ${lead.locale}`,
    '',
    'Mensaje:',
    lead.message,
  ].filter(Boolean) as string[]

  const html = `<div style="font-family:ui-monospace,monospace;font-size:14px;line-height:1.5">
${lines.map((l) => `<p style="margin:0 0 6px">${escapeHtml(l)}</p>`).join('\n')}
</div>`

  try {
    const { data, error } = await client.emails.send({
      from,
      to,
      // So a one-click reply goes to the lead, not the no-reply sender.
      replyTo: lead.email,
      subject,
      text: lines.join('\n'),
      html,
    })
    if (error) {
      return { sent: false, reason: 'error', error: error.message }
    }
    return { sent: true, id: data?.id ?? null }
  } catch (error) {
    return {
      sent: false,
      reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown email error',
    }
  }
}
