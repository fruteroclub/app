import { defineRouting } from 'next-intl/routing'

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'es'

export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
}

/**
 * Routing config (D-locale, LOCKED):
 * - `localePrefix: 'as-needed'` → `frutero.club/` = Spanish (clean apex, no prefix),
 *   `frutero.club/en` = English. `/es/...` canonicalizes to bare ES (handled in proxy).
 * - `localeDetection: false` → the bare apex `/` ALWAYS serves Spanish, regardless of
 *   the visitor's `Accept-Language`. Without this, an English-browser visitor is
 *   redirected `/` → `/en`, which breaks the locked "clean ES apex, no redirect"
 *   intent. ES is the canonical first delivery; English is opt-in at `/en`.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: false,
})
