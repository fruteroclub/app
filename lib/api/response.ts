/**
 * Standardized API envelope — discriminated-union success/error responses.
 *
 * Pattern mirrored from `code/frutero-current-app`'s `lib/api/response.ts`
 * (CONFIG pattern only, no product code copied). Self-contained here: the
 * reference imports its shapes from a `@/types/api-response` module; this
 * greenfield app inlines the union + codes so there is one import surface.
 *
 * Success: `{ success: true, data, message?, meta? }`
 * Error:   `{ success: false, error: { message, code?, details? } }`
 *
 * No silent failures: every route returns one of these shapes with an explicit
 * status. Validation errors carry the flattened zod issues so the client can
 * render inline field errors (the "ese handle ya existe" / 400 field paths).
 */
import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/** Machine-readable error codes the client can branch on. */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
  meta?: Record<string, unknown>
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: ApiErrorCode | string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

/** Build a standardized success response. */
export function apiSuccess<T>(
  data: T,
  options?: {
    message?: string
    meta?: Record<string, unknown>
    status?: number
  },
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(options?.message ? { message: options.message } : {}),
      ...(options?.meta ? { meta: options.meta } : {}),
    },
    { status: options?.status ?? 200 },
  )
}

/** Build a standardized error response. */
export function apiError(
  message: string,
  options?: {
    code?: ApiErrorCode | string
    details?: unknown
    status?: number
  },
): NextResponse<ApiErrorResponse> {
  const error: ApiErrorResponse['error'] = { message }
  if (options?.code) error.code = options.code
  if (options?.details !== undefined) error.details = options.details
  return NextResponse.json(
    { success: false as const, error },
    { status: options?.status ?? 500 },
  )
}

/** Build a 400 from a zod parse failure, carrying flattened field issues. */
export function apiValidationError(
  zodError: ZodError,
): NextResponse<ApiErrorResponse> {
  return apiError('Validation failed', {
    code: API_ERROR_CODES.VALIDATION_ERROR,
    // `flatten()` gives `{ formErrors, fieldErrors }` — easy inline rendering.
    details: zodError.flatten(),
    status: 400,
  })
}

/** Common error shortcuts. */
export const apiErrors = {
  /** 401 — token missing/invalid → re-auth. */
  unauthorized: (message = 'Unauthorized') =>
    apiError(message, { code: API_ERROR_CODES.UNAUTHORIZED, status: 401 }),
  /** 404 — resource not found. */
  notFound: (resource = 'Resource') =>
    apiError(`${resource} not found`, {
      code: API_ERROR_CODES.NOT_FOUND,
      status: 404,
    }),
  /** 409 — duplicate (e.g. handle taken). */
  conflict: (message: string) =>
    apiError(message, { code: API_ERROR_CODES.CONFLICT, status: 409 }),
  /** 500 — server-side failure (e.g. Privy misconfigured). */
  internal: (message = 'Internal server error') =>
    apiError(message, { code: API_ERROR_CODES.INTERNAL_ERROR, status: 500 }),
}
