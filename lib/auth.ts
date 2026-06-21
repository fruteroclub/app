/**
 * Server-side auth — Privy access-token verification.
 *
 * The client (Privy React SDK) obtains an access token after login and sends it
 * as `Authorization: Bearer <token>`. Here we verify it with the Privy server
 * SDK and resolve the caller's `privy_did` (AuthTokenClaims.userId), which keys
 * the `profiles` table.
 *
 * Flow (per plan SIGNUP): POST /api/profile (Bearer) → verifyPrivyToken →
 *   ├─ valid   → claims.userId == privy_did
 *   └─ invalid/expired/misconfigured → throw → route maps to 401 → re-auth.
 *
 * Config patterns from `code/frutero-current-app` (no product code copied):
 *   NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET. `@privy-io/server-auth` is in
 *   next.config `serverExternalPackages` so it bundles correctly.
 *
 * No silent failures: missing config throws a `PrivyConfigError` (distinct from a
 * bad token) so the route can surface a 500 (server problem) vs 401 (re-auth).
 */
import { PrivyClient, type AuthTokenClaims } from '@privy-io/server-auth'

/** Thrown when Privy server credentials are absent (operator/env problem). */
export class PrivyConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrivyConfigError'
  }
}

/** Thrown when a token is present but fails verification (re-auth → 401). */
export class PrivyAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrivyAuthError'
  }
}

let cachedClient: PrivyClient | undefined

/** Lazily build the Privy server client; throws PrivyConfigError if unconfigured. */
export function getPrivyClient(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  // Re-validate config on every call (env can be absent at runtime even if a
  // client was built earlier). Cheap, and avoids a stale "configured" cache.
  if (!appId || !appSecret) {
    throw new PrivyConfigError(
      'Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET.',
    )
  }
  if (cachedClient) return cachedClient
  cachedClient = new PrivyClient(appId, appSecret)
  return cachedClient
}

/**
 * Verify a raw Privy access token (JWT). Returns the full verified claims.
 * Throws `PrivyAuthError` on any verification failure, `PrivyConfigError` if the
 * server is missing credentials.
 */
export async function verifyPrivyToken(
  token: string,
): Promise<AuthTokenClaims> {
  if (!token || token.trim().length === 0) {
    throw new PrivyAuthError('Missing access token.')
  }
  const client = getPrivyClient()
  try {
    return await client.verifyAuthToken(token)
  } catch (error) {
    // Re-throw config errors untouched; everything else is an auth failure.
    if (error instanceof PrivyConfigError) throw error
    throw new PrivyAuthError(
      error instanceof Error ? error.message : 'Invalid or expired token.',
    )
  }
}

/**
 * Extract a Bearer token from an `Authorization` header value and verify it.
 * Returns the caller's `privy_did`. Throws `PrivyAuthError` if no/invalid token.
 *
 * Usage in a route handler:
 *   const privyDid = await requirePrivyDid(req.headers.get('authorization'))
 */
export async function requirePrivyDid(
  authorizationHeader: string | null | undefined,
): Promise<string> {
  const header = authorizationHeader ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  if (!match) {
    throw new PrivyAuthError('Missing or malformed Authorization header.')
  }
  const claims = await verifyPrivyToken(match[1])
  return claims.userId
}
