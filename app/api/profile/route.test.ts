import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for /api/profile (T4) — the SIGNUP route branches.
 *
 * `lib/auth` and `lib/db` are fully mocked: no network, no Privy creds, no
 * Postgres. We assert the status-code contract the plan's SIGNUP flow + failure
 * table require:
 *   401 bad/missing token · 400 invalid body · 201 created · 200 exists/updated
 *   409 duplicate handle (DB unique violation) · 502 DB down
 */

// --- hoisted shared state (safe to reference inside vi.mock factories) --------
const { requirePrivyDid, PrivyAuthError, PrivyConfigError, dbState } =
  vi.hoisted(() => {
    class PrivyAuthError extends Error {}
    class PrivyConfigError extends Error {}
    return {
      requirePrivyDid: vi.fn(),
      PrivyAuthError,
      PrivyConfigError,
      dbState: {
        selectResult: [] as unknown[],
        insertResult: [] as unknown[],
        updateResult: [] as unknown[],
        selectThrows: undefined as unknown,
        insertThrows: undefined as unknown,
      },
    }
  })

// --- auth mock ---------------------------------------------------------------
vi.mock('@/lib/auth', () => ({
  requirePrivyDid,
  PrivyAuthError,
  PrivyConfigError,
}))

// --- db mock -----------------------------------------------------------------
// A tiny chainable query-builder stub. Each method returns `this`; the terminal
// (`limit` / `returning`) resolves to whatever the current test queued.
vi.mock('@/lib/db', () => {
  function makeSelect() {
    const chain = {
      from: () => chain,
      where: () => chain,
      limit: async () => {
        if (dbState.selectThrows) throw dbState.selectThrows
        return dbState.selectResult
      },
    }
    return chain
  }
  function makeInsert() {
    const chain = {
      values: () => chain,
      returning: async () => {
        if (dbState.insertThrows) throw dbState.insertThrows
        return dbState.insertResult
      },
    }
    return chain
  }
  function makeUpdate() {
    const chain = {
      set: () => chain,
      where: () => chain,
      returning: async () => dbState.updateResult,
    }
    return chain
  }
  return {
    db: {
      select: () => makeSelect(),
      insert: () => makeInsert(),
      update: () => makeUpdate(),
    },
    profiles: { privyDid: 'privy_did' },
  }
})

import { GET, POST } from './route'

function postReq(body: unknown, auth = 'Bearer good.token') {
  return new Request('http://localhost/api/profile', {
    method: 'POST',
    headers: { authorization: auth, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  handle: 'andres_frutero',
  displayName: 'Andrés Frutero',
  role: 'Full-Stack Builder',
  location: 'CDMX, MX',
  bio: 'Construye cosas.',
  links: { github: 'andresf' },
  locale: 'es',
}

const ROW = {
  id: 'uuid-1',
  privyDid: 'did:privy:abc',
  handle: 'andres_frutero',
  displayName: 'Andrés Frutero',
  role: 'Full-Stack Builder',
  location: 'CDMX, MX',
  bio: 'Construye cosas.',
  links: { github: 'andresf' },
  locale: 'es',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
}

beforeEach(() => {
  requirePrivyDid.mockReset()
  requirePrivyDid.mockResolvedValue('did:privy:abc')
  dbState.selectResult = []
  dbState.insertResult = [ROW]
  dbState.updateResult = [ROW]
  dbState.selectThrows = undefined
  dbState.insertThrows = undefined
})

describe('POST /api/profile — auth', () => {
  it('401 when the Bearer token is invalid/missing', async () => {
    requirePrivyDid.mockRejectedValueOnce(new PrivyAuthError('bad token'))
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('UNAUTHORIZED')
  })

  it('500 when Privy is misconfigured on the server', async () => {
    requirePrivyDid.mockRejectedValueOnce(new PrivyConfigError('no creds'))
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/profile — validation', () => {
  it('400 on an invalid handle (fails the format regex)', async () => {
    const res = await POST(postReq({ ...VALID_BODY, handle: 'no' }) as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error.code).toBe('VALIDATION_ERROR')
    expect(json.error.details.fieldErrors.handle).toBeTruthy()
  })

  it('400 when displayName is empty', async () => {
    const res = await POST(
      postReq({ ...VALID_BODY, displayName: '' }) as never,
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/profile — persistence', () => {
  it('201 creates a new profile when none exists', async () => {
    dbState.selectResult = [] // no existing row
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.profile.handle).toBe('andres_frutero')
  })

  it('200 updates in place when the profile already exists', async () => {
    dbState.selectResult = [ROW] // existing row → update path
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.profile.id).toBe('uuid-1')
  })

  it('409 when the handle is taken (DB unique violation 23505)', async () => {
    dbState.selectResult = []
    dbState.insertThrows = { code: '23505', constraint_name: 'profiles_handle_key' }
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.error.code).toBe('CONFLICT')
  })

  it('502 when the database is down', async () => {
    dbState.selectThrows = new Error('ECONNREFUSED')
    const res = await POST(postReq(VALID_BODY) as never)
    expect(res.status).toBe(502)
  })
})

describe('GET /api/profile', () => {
  it('401 when unauthenticated', async () => {
    requirePrivyDid.mockRejectedValueOnce(new PrivyAuthError('bad'))
    const req = new Request('http://localhost/api/profile')
    const res = await GET(req as never)
    expect(res.status).toBe(401)
  })

  it('404 when the caller has no profile', async () => {
    dbState.selectResult = []
    const req = new Request('http://localhost/api/profile', {
      headers: { authorization: 'Bearer good.token' },
    })
    const res = await GET(req as never)
    expect(res.status).toBe(404)
  })

  it('200 returns the profile when it exists', async () => {
    dbState.selectResult = [ROW]
    const req = new Request('http://localhost/api/profile', {
      headers: { authorization: 'Bearer good.token' },
    })
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.profile.handle).toBe('andres_frutero')
  })
})
