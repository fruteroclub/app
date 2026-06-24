/**
 * /api/profile — the authed "perfil" endpoint (T4).
 *
 * GET  → load the caller's profile (Bearer-verified). 200 with profile or 404.
 * POST → create-or-update the caller's profile, keyed by their Privy DID.
 *
 * Flow (plan SIGNUP):
 *   POST /api/profile (Bearer)
 *     lib/auth verifies token → privy_did
 *       ├─ no profile      → insert (handle uniqueness) → 201
 *       ├─ profile exists  → update in place (idempotent upsert) → 200
 *       ├─ handle taken     → 409 (inline "ese handle ya existe")
 *       ├─ token invalid    → 401 (re-auth)
 *       ├─ invalid body     → 400 field errors
 *       └─ Privy misconfig / DB down → 500 / 502 (no silent failure)
 *
 * Race-safety: the citext UNIQUE on `handle` + UNIQUE on `privy_did` are the real
 * backstop. The "exists?" read is an optimization for the happy path; concurrent
 * inserts are caught by the Postgres unique violation (SQLSTATE 23505) and mapped
 * to 409 (handle) / 200 (same identity raced its own create).
 */
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'

import { db, profiles, type Profile } from '@/lib/db'
import {
  PrivyAuthError,
  PrivyConfigError,
  requirePrivyDid,
} from '@/lib/auth'
import { profileInputSchema } from '@/lib/validators/profile'
import {
  API_ERROR_CODES,
  apiError,
  apiErrors,
  apiSuccess,
  apiValidationError,
} from '@/lib/api/response'

// Authed + DB-backed → always dynamic (never statically cached).
export const dynamic = 'force-dynamic'

/** Postgres unique-violation SQLSTATE. postgres.js surfaces it as `error.code`. */
const PG_UNIQUE_VIOLATION = '23505'

/** Type guard for a postgres.js error carrying a SQLSTATE `code`. */
function isPgError(
  error: unknown,
): error is { code: string; constraint_name?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  )
}

/** Shape the row we expose to the client (drop nothing sensitive — it's theirs). */
function serialize(profile: Profile) {
  return {
    id: profile.id,
    handle: profile.handle,
    displayName: profile.displayName,
    role: profile.role,
    location: profile.location,
    city: profile.city,
    region: profile.region,
    favoriteFruit: profile.favoriteFruit,
    preferredColor: profile.preferredColor,
    testimony: profile.testimony,
    bio: profile.bio,
    links: profile.links,
    locale: profile.locale,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

/**
 * Resolve the caller's Privy DID or throw a tagged error. Centralizes the
 * 401 (re-auth) vs 500 (server misconfig) distinction for both handlers.
 */
async function requireCaller(req: NextRequest): Promise<string> {
  return requirePrivyDid(req.headers.get('authorization'))
}

export async function GET(req: NextRequest) {
  let privyDid: string
  try {
    privyDid = await requireCaller(req)
  } catch (error) {
    if (error instanceof PrivyConfigError) {
      return apiErrors.internal('Auth is not configured on the server.')
    }
    // PrivyAuthError or anything else from verification → re-auth.
    return apiErrors.unauthorized('Vuelve a iniciar sesión.')
  }

  try {
    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.privyDid, privyDid))
      .limit(1)

    if (!existing) {
      return apiErrors.notFound('Perfil')
    }
    return apiSuccess({ profile: serialize(existing) })
  } catch {
    // DB down / unreachable — surface a clear 502, never a silent empty.
    return apiError('No pudimos cargar tu perfil. Intenta de nuevo.', {
      code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
      status: 502,
    })
  }
}

export async function POST(req: NextRequest) {
  // 1) Auth.
  let privyDid: string
  try {
    privyDid = await requireCaller(req)
  } catch (error) {
    if (error instanceof PrivyConfigError) {
      return apiErrors.internal('Auth is not configured on the server.')
    }
    if (error instanceof PrivyAuthError) {
      return apiErrors.unauthorized('Vuelve a iniciar sesión.')
    }
    return apiErrors.unauthorized('Vuelve a iniciar sesión.')
  }

  // 2) Parse body (malformed JSON → 400, not a 500).
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return apiError('Cuerpo de la petición inválido.', {
      code: API_ERROR_CODES.VALIDATION_ERROR,
      status: 400,
    })
  }

  // 3) Validate (zod 400 with field errors before we touch the DB).
  const parsed = profileInputSchema.safeParse(raw)
  if (!parsed.success) {
    return apiValidationError(parsed.error)
  }
  const input = parsed.data

  // 4) Persist — upsert by identity (privy_did), enforce handle uniqueness.
  try {
    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.privyDid, privyDid))
      .limit(1)

    if (existing) {
      // Idempotent update. If they changed handle to one owned by SOMEONE ELSE,
      // the citext UNIQUE throws 23505 → 409 below.
      const [updated] = await db
        .update(profiles)
        .set({
          handle: input.handle,
          displayName: input.displayName,
          role: input.role ?? null,
          location: input.location ?? null,
          city: input.city ?? null,
          region: input.region ?? null,
          favoriteFruit: input.favoriteFruit ?? null,
          preferredColor: input.preferredColor ?? null,
          testimony: input.testimony ?? null,
          bio: input.bio ?? null,
          links: input.links ?? {},
          ...(input.locale ? { locale: input.locale } : {}),
          updatedAt: new Date(),
        })
        .where(eq(profiles.privyDid, privyDid))
        .returning()

      return apiSuccess(
        { profile: serialize(updated) },
        { message: 'Perfil actualizado.' },
      )
    }

    const [created] = await db
      .insert(profiles)
      .values({
        privyDid,
        handle: input.handle,
        displayName: input.displayName,
        role: input.role ?? null,
        location: input.location ?? null,
        city: input.city ?? null,
        region: input.region ?? null,
        favoriteFruit: input.favoriteFruit ?? null,
        preferredColor: input.preferredColor ?? null,
        testimony: input.testimony ?? null,
        bio: input.bio ?? null,
        links: input.links ?? {},
        locale: input.locale ?? 'es',
      })
      .returning()

    return apiSuccess(
      { profile: serialize(created) },
      { message: 'Perfil creado.', status: 201 },
    )
  } catch (error) {
    if (isPgError(error) && error.code === PG_UNIQUE_VIOLATION) {
      // Which unique blew up? privy_did racing its own create → load it (200);
      // anything else (the handle) → 409 with the inline message.
      const constraint = error.constraint_name ?? ''
      if (constraint.includes('privy_did')) {
        try {
          const [row] = await db
            .select()
            .from(profiles)
            .where(eq(profiles.privyDid, privyDid))
            .limit(1)
          if (row) {
            return apiSuccess({ profile: serialize(row) })
          }
        } catch {
          // fall through to the generic conflict below
        }
      }
      return apiErrors.conflict('Ese handle ya existe.')
    }

    if (error instanceof PrivyConfigError) {
      return apiErrors.internal('Auth is not configured on the server.')
    }

    // DB down / unexpected — explicit 502, never a silent failure.
    return apiError('No pudimos guardar tu perfil. Intenta de nuevo.', {
      code: API_ERROR_CODES.SERVICE_UNAVAILABLE,
      status: 502,
    })
  }
}
