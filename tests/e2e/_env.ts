/**
 * E2E credential gate (T8).
 *
 * The server-rendered marketing surface (landing, /enterprise, i18n, a11y, and
 * the contact-form *validation* path) runs against a built app with NO secrets.
 *
 * The flows that mutate real state — full signup (Privy login → profile insert)
 * and a real lead insert+email — need live Privy + DATABASE_URL + Resend creds.
 * Those specs call `test.skip(!HAS_AUTH, ...)` / `test.skip(!HAS_DB, ...)` so the
 * suite is green on a credential-free machine and *expands* automatically once
 * the operator provisions the envs. This is a visible skip, not a silent pass.
 */
export const HAS_AUTH = Boolean(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID && process.env.PRIVY_APP_SECRET,
)

export const HAS_DB = Boolean(process.env.DATABASE_URL)

export const HAS_RESEND = Boolean(process.env.RESEND_API_KEY)
