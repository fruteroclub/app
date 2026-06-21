import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for lib/auth — Privy server token verification (mocked).
 *
 * The Privy server SDK is fully mocked: no network, no real credentials. We
 * assert the seam contracts the routes depend on (T4 /api/profile):
 *   - valid token       → resolves privy_did (claims.userId)
 *   - invalid/expired   → PrivyAuthError (route → 401, re-auth)
 *   - missing config    → PrivyConfigError (route → 500, server problem)
 *   - header parsing     → Bearer extraction, malformed header rejected
 */

const verifyAuthToken = vi.fn()

vi.mock('@privy-io/server-auth', () => ({
  PrivyClient: vi.fn().mockImplementation(() => ({
    verifyAuthToken,
  })),
}))

// Import AFTER the mock is registered.
import {
  verifyPrivyToken,
  requirePrivyDid,
  PrivyAuthError,
  PrivyConfigError,
} from './auth'

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  vi.resetModules()
  verifyAuthToken.mockReset()
  process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'test-app-id'
  process.env.PRIVY_APP_SECRET = 'test-secret'
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('verifyPrivyToken', () => {
  it('resolves verified claims for a valid token', async () => {
    verifyAuthToken.mockResolvedValueOnce({
      userId: 'did:privy:abc123',
      appId: 'test-app-id',
      issuer: 'privy.io',
      issuedAt: 1,
      expiration: 2,
      sessionId: 's1',
    })
    const claims = await verifyPrivyToken('good.jwt.token')
    expect(claims.userId).toBe('did:privy:abc123')
    expect(verifyAuthToken).toHaveBeenCalledWith('good.jwt.token')
  })

  it('throws PrivyAuthError on an invalid/expired token', async () => {
    verifyAuthToken.mockRejectedValueOnce(new Error('jwt expired'))
    await expect(verifyPrivyToken('bad.jwt')).rejects.toBeInstanceOf(
      PrivyAuthError,
    )
  })

  it('throws PrivyAuthError on an empty token (no SDK call)', async () => {
    await expect(verifyPrivyToken('   ')).rejects.toBeInstanceOf(PrivyAuthError)
    expect(verifyAuthToken).not.toHaveBeenCalled()
  })
})

describe('requirePrivyDid', () => {
  it('extracts the Bearer token and returns the privy_did', async () => {
    verifyAuthToken.mockResolvedValueOnce({
      userId: 'did:privy:xyz',
      appId: 'test-app-id',
      issuer: 'privy.io',
      issuedAt: 1,
      expiration: 2,
      sessionId: 's1',
    })
    const did = await requirePrivyDid('Bearer good.jwt.token')
    expect(did).toBe('did:privy:xyz')
    expect(verifyAuthToken).toHaveBeenCalledWith('good.jwt.token')
  })

  it('rejects a missing Authorization header', async () => {
    await expect(requirePrivyDid(null)).rejects.toBeInstanceOf(PrivyAuthError)
    expect(verifyAuthToken).not.toHaveBeenCalled()
  })

  it('rejects a malformed (non-Bearer) header', async () => {
    await expect(requirePrivyDid('Token abc')).rejects.toBeInstanceOf(
      PrivyAuthError,
    )
  })
})

describe('config errors', () => {
  it('throws PrivyConfigError when credentials are absent', async () => {
    delete process.env.NEXT_PUBLIC_PRIVY_APP_ID
    delete process.env.PRIVY_APP_SECRET
    await expect(verifyPrivyToken('any.token')).rejects.toBeInstanceOf(
      PrivyConfigError,
    )
  })
})
