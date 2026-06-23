import type { MetadataRoute } from 'next'
import { locales } from '@/i18n/routing'
import { localizedUrl, localeToBcp47 } from '@/lib/seo'
import { getAllArticles } from '@/lib/content/articles'

/**
 * Sitemap (T5/T7).
 *
 * Lists the public, indexable marketing routes ONLY — the authed `(app)` surface
 * (`/perfil`, `/perfil/edit`) and the `/api/*` handlers are deliberately absent
 * (they are noindex / non-content, and robots.ts disallows them).
 *
 * Each entry carries `alternates.languages` (hreflang) so Google sees the ES/EN
 * pair as one localized document, with the bare-apex ES URL as the indexable
 * canonical for each (D-locale `as-needed`). `/es/...` is never emitted.
 *
 * The news section (`/noticias` + every article, both locales) is read from the
 * SAME `getAllArticles` source as the routes. Content-repo CI guarantees both
 * locales per slug, so every article emits a full ES/EN hreflang pair. On a
 * GITHUB_TOKEN failure `getAllArticles` THROWS → the sitemap build FAILS rather
 * than emitting a partial sitemap (DEC-7).
 */

// Prerender at build (like the article routes): the content reader uses a
// `no-store` fetch, which would otherwise make the sitemap dynamic (runtime token
// + a GitHub round-trip per request). force-static reads the corpus once at build.
export const dynamic = 'force-static'

/** Locale-less marketing route paths + their relative priority. */
const ROUTES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/enterprise', priority: 0.8 },
]

function hreflang(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const l of locales) {
    languages[localeToBcp47[l].replace('_', '-')] = localizedUrl(l, path)
  }
  return languages
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = ROUTES.map(({ path, priority }) => ({
    url: localizedUrl('es', path),
    lastModified,
    changeFrequency: 'weekly',
    priority,
    alternates: { languages: hreflang(path) },
  }))

  const articles = await getAllArticles('es')

  const newsIndex: MetadataRoute.Sitemap[number] = {
    url: localizedUrl('es', '/noticias'),
    lastModified,
    changeFrequency: 'daily',
    priority: 0.7,
    alternates: { languages: hreflang('/noticias') },
  }

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => {
    const path = `/noticias/${a.meta.slug}`
    return {
      url: localizedUrl('es', path),
      lastModified: new Date(`${a.meta.date}T00:00:00Z`),
      changeFrequency: 'monthly',
      priority: 0.6,
      alternates: { languages: hreflang(path) },
    }
  })

  return [...staticEntries, newsIndex, ...articleEntries]
}
