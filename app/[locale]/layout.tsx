import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from '@/i18n/routing'
import { baseFontVariables } from '@/lib/fonts'
import { SITE_URL, SITE_NAME, localeToBcp47, siteJsonLd, OG_IMAGE } from '@/lib/seo'
import { Analytics } from '@/components/analytics/Analytics'
import { CtaTracker } from '@/components/analytics/CtaTracker'
import { JsonLd } from '@/components/seo/JsonLd'
import '@/styles/globals.css'

/**
 * Browser-chrome color for the default (paper) register — matches `--paper` in
 * styles/globals.css and the OG card background.
 */
export const viewport: Viewport = {
  themeColor: '#f9f5ef',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * Locale-level base metadata (T7). Sets `metadataBase` so every route's relative
 * canonical/OG resolves to the production origin, a localized default
 * title+description, and the OG `siteName`/`locale`. Per-route files override
 * title/description/alternates via `lib/seo.buildMetadata`; the file-convention
 * `opengraph-image.tsx` supplies the single OG image automatically.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const safeLocale: Locale = hasLocale(routing.locales, locale)
    ? (locale as Locale)
    : routing.defaultLocale
  const t = await getTranslations({ locale: safeLocale, namespace: 'landing' })
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t('meta.title'),
      template: `%s · ${SITE_NAME}`,
    },
    description: t('meta.description'),
    applicationName: SITE_NAME,
    manifest: '/manifest.webmanifest',
    // app/favicon.ico is auto-detected; the PNG + apple-touch icons live in
    // /public/favicon and must be wired explicitly (Next only auto-detects
    // icons placed in the app/ dir).
    icons: {
      icon: [
        { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: '/favicon/apple-touch-icon.png',
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: localeToBcp47[safeLocale],
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'landing' })

  return (
    <html lang={locale} data-mode="paper" className={baseFontVariables}>
      <body>
        <JsonLd data={siteJsonLd(locale as Locale, t('meta.description'))} />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <CtaTracker />
        <Analytics />
      </body>
    </html>
  )
}
