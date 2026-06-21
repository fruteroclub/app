import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/routing'
import { localizedUrl, localeToBcp47 } from '@/lib/seo'

/**
 * Sitemap (T7).
 *
 * Lists the public, indexable marketing routes ONLY — the authed `(app)` surface
 * (`/perfil`, `/perfil/edit`) and the `/api/*` handlers are deliberately absent
 * (they are noindex / non-content, and robots.ts disallows them).
 *
 * Each entry carries `alternates.languages` (hreflang) so Google sees the ES/EN
 * pair as one localized document, with the bare-apex ES URL as the indexable
 * canonical for each (D-locale `as-needed`). `/es/...` is never emitted.
 */

/** Locale-less marketing route paths + their relative priority. */
const ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/enterprise', priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.map(({ path, priority }) => {
    const languages: Record<string, string> = {}
    for (const l of locales) {
      languages[localeToBcp47[l].replace('_', '-')] = localizedUrl(l, path)
    }
    return {
      url: localizedUrl('es', path),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority,
      alternates: { languages },
    }
  })
}
