import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * robots.txt (T7).
 *
 * Public marketing is crawlable; the authed app surface and the API are not:
 *  - `/api/`          — route handlers, never content.
 *  - `/perfil`        — the authed signup/profile surface (also noindex via the
 *                       (app) layout metadata); keep it out of the index.
 *  - `/_next/`        — build assets.
 *
 * Points crawlers at the sitemap. Host is the bare-apex ES canonical (D-locale).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/perfil', '/en/perfil', '/_next/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
