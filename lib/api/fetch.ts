/**
 * Client fetch wrapper for the standardized API envelope.
 *
 * Pattern mirrored from `code/frutero-current-app`'s `lib/api/fetch.ts` (config
 * pattern only). Unwraps `{ success, data }` and throws a structured `ApiError`
 * (carrying `status`, `code`, `details`) on failure so callers branch cleanly:
 *   409 → inline "ese handle ya existe"   401 → re-auth   400 → field errors.
 *
 * No silent failure: a non-2xx or a malformed body always throws — never returns
 * a half-parsed value.
 */
import type { ApiResponse } from './response'

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    opts: { status: number; code?: string; details?: unknown },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.code = opts.code
    this.details = opts.details
  }
}

export async function apiFetch<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init)

  let body: ApiResponse<T> | undefined
  try {
    body = (await res.json()) as ApiResponse<T>
  } catch {
    // Body wasn't JSON (e.g. an upstream 502 HTML page). Surface the status.
    throw new ApiError(
      `Unexpected non-JSON response (${res.status}).`,
      { status: res.status },
    )
  }

  if (!res.ok || !body || body.success === false) {
    const err =
      body && body.success === false
        ? body.error
        : { message: `Request failed (${res.status}).` }
    throw new ApiError(err.message, {
      status: res.status,
      code: 'code' in err ? err.code : undefined,
      details: 'details' in err ? err.details : undefined,
    })
  }

  return body.data
}
