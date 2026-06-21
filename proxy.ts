import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing, defaultLocale } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

/**
 * Locale proxy (Next 16 `proxy.ts` convention — formerly `middleware.ts`).
 * (D-locale, LOCKED — `as-needed`):
 * - `frutero.club/` and `frutero.club/<path>` serve Spanish with NO prefix (clean apex).
 * - `frutero.club/en/...` serves English.
 * - `frutero.club/es/...` is the default-locale prefix. With `as-needed`, next-intl
 *   already 307-redirects the bare `/es` apex to `/`; we additionally strip the
 *   `/es` prefix from deeper paths and 308-redirect to the bare canonical so we
 *   never serve duplicate content at both `/es/x` and `/x`.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl

  // Canonicalize any `/es` or `/es/...` to the bare (prefix-less) Spanish URL.
  if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
    const stripped = pathname.slice(`/${defaultLocale}`.length) || '/'
    const url = request.nextUrl.clone()
    url.pathname = stripped
    url.search = search
    return NextResponse.redirect(url, 308)
  }

  return intlMiddleware(request)
}

export const config = {
  // Match all paths except API routes, Next internals, files with extensions,
  // and the EXTENSIONLESS metadata file-convention routes (opengraph-image /
  // twitter-image). The latter live at the ROOT (no locale segment), so letting
  // the locale proxy touch them rewrites `/opengraph-image` → a non-existent
  // localized path and 404s — which silently broke every social-share card.
  matcher: ['/((?!api|_next|_vercel|opengraph-image|twitter-image|.*\\..*).*)'],
}
