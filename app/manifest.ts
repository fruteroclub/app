import type { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'
import { defaultLocale } from '@/i18n/routing'
import { SITE_NAME, localeToBcp47 } from '@/lib/seo'

/**
 * Web app manifest. Served at `/manifest.webmanifest` (referenced from the
 * locale layout's metadata). Copy is sourced from the default-locale (ES)
 * messages so name/description stay in sync with the page meta; icons point at
 * the maskable PNGs in /public/favicon. Theme/background match the paper
 * register (--paper) and the OG card.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({ locale: defaultLocale, namespace: 'landing' })
  return {
    name: SITE_NAME,
    short_name: 'Frutero',
    description: t('meta.description'),
    start_url: '/',
    display: 'standalone',
    lang: localeToBcp47[defaultLocale].replace('_', '-'),
    background_color: '#f9f5ef',
    theme_color: '#f9f5ef',
    icons: [
      {
        src: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
