/**
 * E2E credential gate (T8).
 *
 * The server-rendered marketing surface (landing, /enterprise, i18n, a11y, and
 * the contact-form *validation* path) runs against a built app with NO secrets.
 *
 * The flows that mutate real state — full signup (Privy login → Convex profile)
 * and a real lead insert — need live Privy + Convex config.
 * Those specs call `test.skip(!HAS_AUTH, ...)` / `test.skip(!HAS_CONVEX, ...)` so the
 * suite is green on a credential-free machine and *expands* automatically once
 * the operator provisions the envs. This is a visible skip, not a silent pass.
 */
export const HAS_AUTH = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

export const HAS_CONVEX = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);
